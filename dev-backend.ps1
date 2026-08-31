# Pingvin Share - 启动后端开发服务器
. D:\fnm\fnm-profile.ps1

Write-Host "🚀 启动 Pingvin Share 后端..."
Write-Host "   API:  http://localhost:8080"
Write-Host "   API 文档: http://localhost:8080/api" -ForegroundColor Cyan
Write-Host ""

cd d:\32\file_share\pingvin-share-main\backend
npm run dev
