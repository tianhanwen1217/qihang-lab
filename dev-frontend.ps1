# Pingvin Share - 启动前端开发服务器
. D:\fnm\fnm-profile.ps1

Write-Host "🚀 启动 Pingvin Share 前端..."
Write-Host "   页面: http://localhost:3000" -ForegroundColor Green
Write-Host ""

cd d:\32\file_share\pingvin-share-main\frontend
npm run dev
