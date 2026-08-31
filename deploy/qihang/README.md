# 起航实验室部署包

此目录用于把本项目部署到现有的 `/opt/qihang-lab`，不会创建新数据卷。

部署脚本会：

1. 保存原 Compose、Caddy 和应用配置。
2. 短暂停止应用，备份 `qihang_lab_data` 与 `qihang_lab_images`。
3. 为 2 GiB 内存服务器临时创建构建交换文件。
4. 构建带版本标签的自定义镜像。
5. 启动新容器并等待健康检查。
6. 健康检查失败时恢复原 Compose 配置。

在服务器解压整个项目后，从项目根目录执行：

```sh
sudo bash deploy/qihang/deploy.sh
```

备份保存在 `/opt/qihang-lab/backups/20260808-1`。
