$ErrorActionPreference = "Stop"

$release = "20260813-1"
$repoRoot = (Resolve-Path (Join-Path $PSScriptRoot "..\..")).Path
$workspaceRoot = Split-Path $repoRoot -Parent
$stage = Join-Path $workspaceRoot "qihang-lab-runtime-$release"
$archive = "$stage.tar.gz"

$protectedFiles = [ordered]@{
  "frontend/package.json"      = "0255ab1b8082531036b046772a25ac24bd990cc2285256dbf2ab3e386cdf9266"
  "frontend/package-lock.json" = "237858115c8743735823ed07b2a4d139b5171a022322d95c429998d7dc802858"
  "backend/package.json"       = "f0a7563c437e1f1867233b7e94ffc1c7576bcaae72202f87f0705acdc59b6272"
  "backend/package-lock.json"  = "f49e0f2de8a36fbb32f574ee11f8cb490ada87c17239bb828bb9cbabad04ae74"
}

function Assert-ProtectedNpmFiles {
  foreach ($entry in $protectedFiles.GetEnumerator()) {
    $path = Join-Path $repoRoot $entry.Key
    $actual = (Get-FileHash -Algorithm SHA256 -LiteralPath $path).Hash.ToLowerInvariant()
    if ($actual -ne $entry.Value) {
      throw "Protected npm file changed: $($entry.Key) (expected $($entry.Value), got $actual)"
    }
  }
}

Assert-ProtectedNpmFiles

if ((Test-Path -LiteralPath $stage) -or (Test-Path -LiteralPath $archive)) {
  throw "Release output already exists; refusing to overwrite it. Bump `$release before packaging again."
}

$frontendStandalone = Join-Path $repoRoot "frontend\.next\standalone"
$backendMain = Join-Path $repoRoot "backend\dist\src\main.js"
if (-not (Test-Path -LiteralPath (Join-Path $frontendStandalone "server.js"))) {
  throw "Missing frontend production build. Run npm run build in frontend first."
}
if (-not (Test-Path -LiteralPath $backendMain)) {
  throw "Missing backend production build. Run npm run build in backend first."
}

New-Item -ItemType Directory -Path $stage | Out-Null
$runtime = New-Item -ItemType Directory -Path (Join-Path $stage "runtime")
$frontendRuntime = New-Item -ItemType Directory -Path (Join-Path $runtime "frontend")
$backendRuntime = New-Item -ItemType Directory -Path (Join-Path $runtime "backend")

Copy-Item -Recurse -LiteralPath (Join-Path $frontendStandalone ".next") -Destination $frontendRuntime
Copy-Item -Recurse -LiteralPath (Join-Path $repoRoot "frontend\.next\static") -Destination (Join-Path $frontendRuntime ".next\static")
Copy-Item -Recurse -LiteralPath (Join-Path $repoRoot "frontend\public") -Destination $frontendRuntime
Copy-Item -LiteralPath (Join-Path $frontendStandalone "server.js") -Destination $frontendRuntime
Copy-Item -LiteralPath (Join-Path $frontendStandalone "package.json") -Destination $frontendRuntime
Copy-Item -LiteralPath (Join-Path $frontendStandalone ".env") -Destination $frontendRuntime
if (Test-Path -LiteralPath (Join-Path $frontendStandalone "src")) {
  Copy-Item -Recurse -LiteralPath (Join-Path $frontendStandalone "src") -Destination $frontendRuntime
}
$momentLocaleRuntime = New-Item -ItemType Directory -Path (Join-Path $frontendRuntime "vendor\moment\locale") -Force
Copy-Item -LiteralPath (Join-Path $repoRoot "frontend\node_modules\moment\locale\zh-cn.js") -Destination $momentLocaleRuntime

Copy-Item -Recurse -LiteralPath (Join-Path $repoRoot "backend\dist") -Destination $backendRuntime
Copy-Item -Recurse -LiteralPath (Join-Path $repoRoot "backend\prisma") -Destination $backendRuntime
Copy-Item -LiteralPath (Join-Path $repoRoot "backend\package.json") -Destination $backendRuntime
Copy-Item -LiteralPath (Join-Path $repoRoot "backend\package-lock.json") -Destination $backendRuntime
Copy-Item -LiteralPath (Join-Path $repoRoot "backend\tsconfig.json") -Destination $backendRuntime

Copy-Item -Recurse -LiteralPath (Join-Path $repoRoot "reverse-proxy") -Destination $runtime
$scriptsRuntime = New-Item -ItemType Directory -Path (Join-Path $runtime "scripts")
Copy-Item -Recurse -LiteralPath (Join-Path $repoRoot "scripts\docker") -Destination $scriptsRuntime

$deployRuntime = New-Item -ItemType Directory -Path (Join-Path $stage "deploy")
Copy-Item -Recurse -LiteralPath $PSScriptRoot -Destination $deployRuntime

tar -czf $archive -C $stage .
if ($LASTEXITCODE -ne 0) {
  throw "tar failed with exit code $LASTEXITCODE"
}

Assert-ProtectedNpmFiles

$hash = (Get-FileHash -Algorithm SHA256 -LiteralPath $archive).Hash.ToLowerInvariant()
$sizeMiB = [math]::Round((Get-Item -LiteralPath $archive).Length / 1MB, 2)
Write-Host "Archive: $archive"
Write-Host "Size MiB: $sizeMiB"
Write-Host "SHA256: $hash"
