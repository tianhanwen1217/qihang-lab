$ErrorActionPreference = "Stop"

$release = "20260821-recruit-media-2"
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

function Assert-PrismaSchema {
  $schemaPath = Join-Path $repoRoot "backend\prisma\schema.prisma"
  $expected = "996cb0462a3b4f40b6b836cb6486d51015f472eaff3783a8c58da825140c8914"
  $actual = (Get-FileHash -Algorithm SHA256 -LiteralPath $schemaPath).Hash.ToLowerInvariant()
  if ($actual -ne $expected) {
    throw "Prisma schema differs from qihang-lab-custom:20260812-16; this hotfix cannot reuse its Prisma Client."
  }
}

function Assert-BuildIsFresh {
  param(
    [string[]]$SourcePaths,
    [string]$BuildPath,
    [string]$BuildName
  )

  if (-not (Test-Path -LiteralPath $BuildPath)) {
    throw "Missing $BuildName build output: $BuildPath"
  }
  $sourceFiles = foreach ($sourcePath in $SourcePaths) {
    if (Test-Path -LiteralPath $sourcePath -PathType Container) {
      Get-ChildItem -LiteralPath $sourcePath -Recurse -File
    } elseif (Test-Path -LiteralPath $sourcePath -PathType Leaf) {
      Get-Item -LiteralPath $sourcePath
    }
  }
  $latestSource = $sourceFiles |
    Sort-Object LastWriteTimeUtc -Descending |
    Select-Object -First 1
  $buildFiles = if (Test-Path -LiteralPath $BuildPath -PathType Container) {
    Get-ChildItem -LiteralPath $BuildPath -Recurse -File
  } else {
    Get-Item -LiteralPath $BuildPath
  }
  $latestBuild = $buildFiles |
    Sort-Object LastWriteTimeUtc -Descending |
    Select-Object -First 1
  if ($latestSource -and $latestSource.LastWriteTimeUtc -gt $latestBuild.LastWriteTimeUtc) {
    throw "$BuildName output is older than source file $($latestSource.FullName). Rebuild before packaging."
  }
}

Assert-ProtectedNpmFiles
Assert-PrismaSchema

if ((Test-Path -LiteralPath $stage) -or (Test-Path -LiteralPath $archive)) {
  throw "Release output already exists; refusing to overwrite it: $stage or $archive"
}

$frontendStandalone = Join-Path $repoRoot "frontend\.next\standalone"
$frontendBuildPath = Join-Path $repoRoot "frontend\.next"
$backendMain = Join-Path $repoRoot "backend\dist\src\main.js"
Assert-BuildIsFresh @(
  (Join-Path $repoRoot "frontend\src"),
  (Join-Path $repoRoot "frontend\public"),
  (Join-Path $repoRoot "frontend\next.config.js"),
  (Join-Path $repoRoot "frontend\package.json"),
  (Join-Path $repoRoot "frontend\package-lock.json")
) $frontendBuildPath "frontend"
Assert-BuildIsFresh @(
  (Join-Path $repoRoot "backend\src"),
  (Join-Path $repoRoot "backend\prisma"),
  (Join-Path $repoRoot "backend\package.json"),
  (Join-Path $repoRoot "backend\package-lock.json"),
  (Join-Path $repoRoot "backend\tsconfig.json")
) (Join-Path $repoRoot "backend\dist") "backend"
if (-not (Test-Path -LiteralPath (Join-Path $frontendStandalone "server.js"))) {
  throw "Missing frontend standalone build. Run npm run build in frontend first."
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
Copy-Item -LiteralPath (Join-Path $repoRoot "backend\tsconfig.json") -Destination $backendRuntime

Copy-Item -Recurse -LiteralPath (Join-Path $repoRoot "reverse-proxy") -Destination $runtime
$scriptsRuntime = New-Item -ItemType Directory -Path (Join-Path $runtime "scripts")
Copy-Item -Recurse -LiteralPath (Join-Path $repoRoot "scripts\docker") -Destination $scriptsRuntime

$metadata = New-Item -ItemType Directory -Path (Join-Path $stage "release-metadata")
$protectedFiles.GetEnumerator() |
  ForEach-Object { "$($_.Value)  $($_.Key)" } |
  Set-Content -LiteralPath (Join-Path $metadata "npm-files.sha256") -Encoding ascii
Set-Content -LiteralPath (Join-Path $metadata "base-image.txt") -Value "qihang-lab-custom:20260812-16" -Encoding ascii
Set-Content -LiteralPath (Join-Path $metadata "prisma-schema.sha256") -Value "996cb0462a3b4f40b6b836cb6486d51015f472eaff3783a8c58da825140c8914  backend/prisma/schema.prisma" -Encoding ascii

$deployRuntime = New-Item -ItemType Directory -Path (Join-Path $stage "deploy")
Copy-Item -Recurse -LiteralPath $PSScriptRoot -Destination $deployRuntime

tar -czf $archive -C $stage .
if ($LASTEXITCODE -ne 0) {
  throw "tar failed with exit code $LASTEXITCODE"
}

Assert-ProtectedNpmFiles
Assert-PrismaSchema

$hash = (Get-FileHash -Algorithm SHA256 -LiteralPath $archive).Hash.ToLowerInvariant()
$sizeMiB = [math]::Round((Get-Item -LiteralPath $archive).Length / 1MB, 2)
Write-Host "Archive: $archive"
Write-Host "Size MiB: $sizeMiB"
Write-Host "SHA256: $hash"
