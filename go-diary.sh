#!/bin/bash

# 设置执行权限
sudo chmod +x /huo/go/go-diary/go-diary

# 写入服务配置文件
sudo tee /etc/systemd/system/go-diary.service > /dev/null <<EOF
[Unit]
Description=go-diary
After=network.target

[Service]
Type=simple
WorkingDirectory=/huo/go/go-diary/
ExecStart=/huo/go/go-diary/go-diary
Restart=always

[Install]
WantedBy=multi-user.target
EOF

# 重新加载 systemd 配置
sudo systemctl daemon-reload

# 启动服务
sudo systemctl start go-diary.service

# 设置为自动启动
sudo systemctl enable go-diary.service