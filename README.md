# 📝 Go-Diary

一个简洁优雅的个人日记应用，使用 Go 语言开发，100%代码由AI编写。

## ✨ 特色功能

- 📅 日历视图
  - 优雅的月历界面
  - 一目了然的日记记录状态
  - 快速导航到任意日期

- 🌓 深色/浅色主题
  - 自动保存主题偏好
  - 平滑的主题切换动画
  - 护眼配色方案

- 💾 自动保存
  - 实时保存编辑内容
  - 无需手动点击保存
  - 本地备份防止数据丢失

- 🚀 高性能
  - Go 语言开发
  - 快速的文件读写
  - 轻量级设计

- 🎨 现代化界面
  - 响应式设计
  - 简洁优雅的 UI
  - 流畅的交互体验

## 🌟 使用技巧

1. **快速导航**
   - 点击"今天"按钮快速返回当前日期
   - 使用年份下拉菜单快速跳转
   - 通过月份导航按钮前后切换

2. **日记编辑**
   - 支持自动保存
   - 文本框自动调整高度
   - 显示相对日期（今天、昨天等）

3. **主题切换**
   - 点击主题按钮切换深色/浅色模式
   - 主题设置会自动保存到本地
   - 下次访问自动应用上次的主题


## 🛠️ 技术栈

- 后端：Go
- 前端：HTML5 + CSS3 + JavaScript
- 存储：文本文件（.txt）
- UI 框架：Bootstrap

## 📦 安装

1. 克隆仓库
```bash
git clone https://github.com/yourusername/go-diary.git
cd go-diary
```

2. 安装依赖
```bash
go mod download
```

3. 运行程序
```bash
go run .
```

4. 打开浏览器访问
```
http://localhost:25252
```

## ⚙️ 配置说明

配置文件位于 `config.yaml`：

```json
title: "备胎日记本"
server:
  port: 25252
security:
  password: "123456"
storage:
  diary_root: "diary"
```


## 🤝 贡献指南

欢迎提交 Pull Request 或创建 Issue！

1. Fork 本仓库
2. 创建您的特性分支 (`git checkout -b feature/AmazingFeature`)
3. 提交您的更改 (`git commit -m 'Add some AmazingFeature'`)
4. 推送到分支 (`git push origin feature/AmazingFeature`)
5. 创建一个 Pull Request

## 📄 开源协议

本项目采用 MIT 协议 - 详见 [LICENSE](LICENSE) 文件

## 🙏 鸣谢

感谢所有贡献者对本项目的支持！
