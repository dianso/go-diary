package main

import (
	"crypto/sha256"
	"encoding/hex"
	"fmt"
	"io/ioutil"
	"net/http"
	"os"
	"path/filepath"
	"strings"
	"time"

	"github.com/gin-gonic/gin"
	"gopkg.in/yaml.v3"
)

// Config 配置结构体
type Config struct {
	Title    string `yaml:"title"`
	Server   struct {
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

func loadConfig() error {
	// 读取配置文件
	data, err := ioutil.ReadFile("config.yaml")
	if err != nil {
		return fmt.Errorf("读取配置文件失败: %v", err)
	}

	// 解析配置文件
	if err := yaml.Unmarshal(data, &config); err != nil {
		return fmt.Errorf("解析配置文件失败: %v", err)
	}

	// 设置默认值
	if config.Server.Port == 0 {
		config.Server.Port = 8080
	}
	if config.Security.Password == "" {
		config.Security.Password = "123456"
	}
	if config.Storage.DiaryRoot == "" {
		config.Storage.DiaryRoot = "diary"
	}
	if config.Title == "" {
		config.Title = "我的日记本"
	}

	return nil
}

func main() {
	// 加载配置文件
	if err := loadConfig(); err != nil {
		fmt.Printf("加载配置文件失败: %v\n", err)
		os.Exit(1)
	}

	r := gin.Default()
	
	// 获取当前工作目录
	workDir, _ := os.Getwd()
	
	// 使用绝对路径加载模板
	r.LoadHTMLGlob(filepath.Join(workDir, "templates/*"))
	r.Static("/static", filepath.Join(workDir, "static"))

	// 确保diary根目录存在
	diaryRoot := config.Storage.DiaryRoot
	if !filepath.IsAbs(diaryRoot) {
		diaryRoot = filepath.Join(workDir, diaryRoot)
	}
	if err := os.MkdirAll(diaryRoot, 0755); err != nil {
		panic(err)
	}

	r.GET("/", func(c *gin.Context) {
		c.HTML(http.StatusOK, "login.html", gin.H{
			"title": config.Title,
		})
	})

	r.POST("/login", func(c *gin.Context) {
		inputPassword := c.PostForm("password")
		if inputPassword == config.Security.Password {
			c.SetCookie("auth", hashPassword(config.Security.Password), 3600, "/", "", false, true)
			c.Redirect(http.StatusFound, "/calendar")
		} else {
			c.HTML(http.StatusUnauthorized, "login.html", gin.H{
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

			dateObj, _ := time.Parse("2006-01-02", date)
			year := dateObj.Format("2006")
			month := dateObj.Format("2006年1月")
			fileName := dateObj.Format("20060102") + ".txt"
			yearDir := filepath.Join(diaryRoot, year)
			filePath := filepath.Join(yearDir, fileName)

			content := ""
			if data, err := ioutil.ReadFile(filePath); err == nil {
				content = string(data)
			} else {
				content = ""
			}

			c.HTML(http.StatusOK, "diary.html", gin.H{
				"title":   config.Title,
				"date":    date,
				"month":   month,
				"content": content,
			})
		})

		authorized.POST("/diary/:date", func(c *gin.Context) {
			date := c.Param("date")
			if !isValidDate(date) {
				c.String(http.StatusBadRequest, "无效的日期格式")
				return
			}

			content := c.PostForm("content")

			dateObj, _ := time.Parse("2006-01-02", date)
			year := dateObj.Format("2006")
			fileName := dateObj.Format("20060102") + ".txt"
			yearDir := filepath.Join(diaryRoot, year)

			// 创建年份目录
			if err := os.MkdirAll(yearDir, 0755); err != nil {
				c.String(http.StatusInternalServerError, "创建目录失败")
				return
			}

			// 保存文件
			filePath := filepath.Join(yearDir, fileName)
			if err := ioutil.WriteFile(filePath, []byte(content), 0644); err != nil {
				c.String(http.StatusInternalServerError, "保存失败")
				return
			}

			c.Redirect(http.StatusFound, "/calendar")
		})

		authorized.GET("/api/diary-dates", func(c *gin.Context) {
			var dates []string

			// 遍历diary目录下的所有年份目录
			years, err := ioutil.ReadDir(diaryRoot)
			if err != nil {
				fmt.Printf("读取diary目录失败: %v\n", err)
				c.JSON(http.StatusOK, dates) // 返回空数组
				return
			}

			for _, year := range years {
				if !year.IsDir() {
					continue
				}

				// 遍历年份目录下的所有.txt文件
				yearPath := filepath.Join(diaryRoot, year.Name())
				files, err := ioutil.ReadDir(yearPath)
				if err != nil {
					fmt.Printf("读取年份目录失败 %s: %v\n", year.Name(), err)
					continue
				}

				for _, file := range files {
					if !file.IsDir() && strings.HasSuffix(file.Name(), ".txt") {
						baseName := strings.TrimSuffix(file.Name(), ".txt")
						if len(baseName) == 8 {
							// 转换为YYYY-MM-DD格式
							date := baseName[:4] + "-" + baseName[4:6] + "-" + baseName[6:]
							dates = append(dates, date)
						}
					}
				}
			}

			c.JSON(http.StatusOK, dates)
		})
	}

	// 启动服务器
	addr := fmt.Sprintf(":%d", config.Server.Port)
	fmt.Printf("服务器启动在 http://localhost%s\n", addr)
	r.Run(addr)
}

func authMiddleware() gin.HandlerFunc {
	return func(c *gin.Context) {
		auth, _ := c.Cookie("auth")
		if auth != hashPassword(config.Security.Password) {
			c.Redirect(http.StatusFound, "/")
			c.Abort()
			return
		}
	}
}

func hashPassword(password string) string {
	hash := sha256.Sum256([]byte(password))
	return hex.EncodeToString(hash[:])
}

func isValidDate(date string) bool {
	_, err := time.Parse("2006-01-02", date)
	return err == nil
}
