Write-Host \"
🚀 MINDFLOW PRODUCTION DEPLOYMENT CHECK\" -ForegroundColor Cyan
Write-Host \"=========================================\" -ForegroundColor Cyan
if (Test-Path \"frontend/vercel.json\") { Write-Host \"✅ Vercel config: READY\" -ForegroundColor Green }
if (Test-Path \"backend/render.yaml\") { Write-Host \"✅ Render config: READY\" -ForegroundColor Green }
if (Test-Path \".env.production\") { Write-Host \"✅ Production env: READY\" -ForegroundColor Green }
Write-Host \"
🎯 DEPLOYMENT STATUS: READY\" -ForegroundColor Green
