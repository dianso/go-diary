package main

import (
	"crypto/sha256"
	"embed"
	"encoding/hex"
	"fmt"
	"html/template"
	"io/fs"
	"io/ioutil"
	"log"
	"net/http"
	"os"
	"path/filepath"
	"strconv"
	"strings"
	"time"

	"github.com/gin-gonic/gin"
	"gopkg.in/yaml.v3"
)

//go:embed templates/*
var templatesFS embed.FS

//go:embed static/*
var staticFS embed.FS

// Config 配置结构体
type Config struct {
	Title  string `yaml:"title"`
	Server struct {
		Port int `yaml:"port"`
	} `yaml:"server"`
	Security struct {
		Password string `yaml:"password"`
	} `yaml:"security"`
	Storage struct {
		DiaryRoot string `yaml:"diary_root"`
	} `yaml:"storage"`
}

var config Config
var diaryRoot string

// 默认配置
var defaultConfig = Config{
	Title: "备胎日记本",
	Server: struct {
		Port int `yaml:"port"`
	}{
		Port: 25252,
	},
	Security: struct {
		Password string `yaml:"password"`
	}{
		Password: "123456",
	},
	Storage: struct {
		DiaryRoot string `yaml:"diary_root"`
	}{
		DiaryRoot: "diary",
	},
}

func createDefaultConfig() error {
	// 将默认配置转换为YAML格式
	data, err := yaml.Marshal(&defaultConfig)
	if err != nil {
		return fmt.Errorf("序列化默认配置失败: %v", err)
	}

	// 写入配置文件
	if err := ioutil.WriteFile("config.yaml", data, 0644); err != nil {
		return fmt.Errorf("写入配置文件失败: %v", err)
	}

	return nil
}

func loadConfig() error {
	// 检查配置文件是否存在
	if _, err := os.Stat("config.yaml"); os.IsNotExist(err) {
		fmt.Println("配置文件不存在，创建默认配置...")
		if err := createDefaultConfig(); err != nil {
			return err
		}
		fmt.Println("默认配置文件已创建")
	}

	// 读取配置文件
	data, err := ioutil.ReadFile("config.yaml")
	if err != nil {
		return fmt.Errorf("读取配置文件失败: %v", err)
	}

	// 解析配置
	if err := yaml.Unmarshal(data, &config); err != nil {
		return fmt.Errorf("解析配置文件失败: %v", err)
	}

	// 确保日记目录存在
	if err := os.MkdirAll(config.Storage.DiaryRoot, 0755); err != nil {
		return fmt.Errorf("创建日记目录失败: %v", err)
	}

	return nil
}

func main() {
	if err := loadConfig(); err != nil {
		log.Fatal(err)
	}

	// 获取当前工作目录
	workDir, err := os.Getwd()
	if err != nil {
		fmt.Printf("获取工作目录失败: %v\n", err)
		return
	}

	// 确保日记根目录存在
	diaryRoot = config.Storage.DiaryRoot
	if !filepath.IsAbs(diaryRoot) {
		diaryRoot = filepath.Join(workDir, diaryRoot)
	}
	if err := os.MkdirAll(diaryRoot, 0755); err != nil {
		fmt.Printf("创建日记根目录失败: %v\n", err)
		return
	}

	// 设置gin为发布模式
	gin.SetMode(gin.ReleaseMode)
	r := gin.Default()

	// 添加时间戳函数到模板
	r.SetFuncMap(template.FuncMap{
		"timestamp": func() string {
			return time.Now().Format("200601021504")
		},
	})

	// 加载嵌入的模板
	templ := template.Must(template.New("").Funcs(r.FuncMap).ParseFS(templatesFS, "templates/*.html"))
	r.SetHTMLTemplate(templ)

	// 提供静态文件服务
	staticSubFS, err := fs.Sub(staticFS, "static")
	if err != nil {
		log.Fatal(err)
	}
	r.StaticFS("/static", http.FS(staticSubFS))

	r.GET("/", func(c *gin.Context) {
		auth, _ := c.Cookie("auth")
		if auth == "true" {
			c.Redirect(http.StatusFound, "/calendar")
			return
		}
		c.HTML(http.StatusOK, "login.html", gin.H{
			"title": config.Title,
		})
	})

	r.POST("/login", func(c *gin.Context) {
		password := c.PostForm("password")
		if hashPassword(password) == hashPassword(config.Security.Password) {
			c.SetCookie("auth", "true", 3600*24*30, "/", "", false, true)
			c.Redirect(http.StatusFound, "/calendar")
		} else {
			c.HTML(http.StatusOK, "login.html", gin.H{
				"title": config.Title,
				"error": "密码错误",
			})
		}
	})

	authorized := r.Group("/")
	authorized.Use(authMiddleware())
	{
		authorized.GET("/calendar", func(c *gin.Context) {
			c.HTML(http.StatusOK, "calendar.html", gin.H{
				"title": config.Title,
			})
		})

		authorized.GET("/diary/:date", func(c *gin.Context) {
			date := c.Param("date")
			if !isValidDate(date) {
				c.String(http.StatusBadRequest, "无效的日期格式")
				return
			}

			formattedDate, numericDate := formatDate(date)
			year := numericDate[:4]
			monthNum := numericDate[4:6]
			monthInt, _ := strconv.Atoi(monthNum)
			monthStr := fmt.Sprintf("%s年%d月", year, monthInt)
			fileName := numericDate + ".txt"
			yearDir := filepath.Join(diaryRoot, year)
			filePath := filepath.Join(yearDir, fileName)

			content := ""
			if data, err := ioutil.ReadFile(filePath); err == nil {
				content = string(data)
			}

			c.HTML(http.StatusOK, "diary.html", gin.H{
				"title":   config.Title,
				"date":    formattedDate,
				"month":   monthStr,
				"content": content,
			})
		})

		authorized.POST("/diary/:date", func(c *gin.Context) {
			date := c.Param("date")
			if !isValidDate(date) {
				c.JSON(http.StatusBadRequest, gin.H{
					"error": "无效的日期格式",
				})
				return
			}

			_, numericDate := formatDate(date)
			content := c.PostForm("content")
			year := numericDate[:4]
			fileName := numericDate + ".txt"
			yearDir := filepath.Join(diaryRoot, year)

			// 确保目录存在
			if err := os.MkdirAll(yearDir, 0755); err != nil {
				fmt.Printf("创建目录失败: %v\n", err)
				c.JSON(http.StatusInternalServerError, gin.H{
					"error": "创建目录失败",
				})
				return
			}

			// 保存文件
			filePath := filepath.Join(yearDir, fileName)
			if err := ioutil.WriteFile(filePath, []byte(content), 0644); err != nil {
				fmt.Printf("保存文件失败: %v\n", err)
				c.JSON(http.StatusInternalServerError, gin.H{
					"error": "保存失败",
				})
				return
			}

			c.JSON(http.StatusOK, gin.H{
				"message": "保存成功",
			})
		})

		authorized.GET("/api/diary-dates", func(c *gin.Context) {
			var dates []string

			// 遍历diary目录下的所有年份目录
			years, err := ioutil.ReadDir(diaryRoot)
			if err != nil {
				fmt.Printf("读取diary目录失败: %v\n", err)
				c.JSON(http.StatusOK, dates)
				return
			}

			for _, year := range years {
				if year.IsDir() {
					yearPath := filepath.Join(diaryRoot, year.Name())
					files, err := ioutil.ReadDir(yearPath)
					if err != nil {
						continue
					}

					for _, file := range files {
						if !file.IsDir() && strings.HasSuffix(file.Name(), ".txt") {
							date := strings.TrimSuffix(file.Name(), ".txt")
							if len(date) == 8 {
								dates = append(dates, date)
							}
						}
					}
				}
			}

			c.JSON(http.StatusOK, dates)
		})
	}

	fmt.Printf("启动服务器，监听端口 %d\n", config.Server.Port)
	r.Run(fmt.Sprintf(":%d", config.Server.Port))
}

func authMiddleware() gin.HandlerFunc {
	return func(c *gin.Context) {
		auth, _ := c.Cookie("auth")
		if auth != "true" {
			c.Redirect(http.StatusFound, "/")
			c.Abort()
			return
		}
		c.Next()
	}
}

func hashPassword(password string) string {
	hash := sha256.Sum256([]byte(password))
	return hex.EncodeToString(hash[:])
}

func isValidDate(date string) bool {
	formattedDate, _ := formatDate(date)
	if formattedDate == "" {
		return false
	}
	_, err := time.Parse("2006-01-02", formattedDate)
	return err == nil
}

func formatDate(date string) (string, string) {
	if len(date) == 8 {
		year := date[:4]
		month := date[4:6]
		day := date[6:]
		if _, err := time.Parse("20060102", date); err != nil {
			return "", ""
		}
		return year + "-" + month + "-" + day, date
	} else if len(date) == 10 {
		if date[4] != '-' || date[7] != '-' {
			return "", ""
		}
		year := date[:4]
		month := date[5:7]
		day := date[8:]
		numericDate := year + month + day
		if _, err := time.Parse("2006-01-02", date); err != nil {
			return "", ""
		}
		return date, numericDate
	}
	return "", ""
}
