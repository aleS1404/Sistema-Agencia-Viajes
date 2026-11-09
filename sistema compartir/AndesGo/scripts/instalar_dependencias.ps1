$ErrorActionPreference = 'Stop'
$projectRoot = Split-Path -Parent $PSScriptRoot
$apiPath = Join-Path $projectRoot 'apps\api'
$webPath = Join-Path $projectRoot 'apps\web'

Write-Host '=== AndesGo: instalación de dependencias ===' -ForegroundColor Cyan
if (-not (Get-Command node.exe -ErrorAction SilentlyContinue)) {
    throw 'No se encontró Node.js. Instale Node.js 22 o superior desde https://nodejs.org/'
}
if (-not (Get-Command npm.cmd -ErrorAction SilentlyContinue)) {
    throw 'No se encontró npm. Reinstale Node.js incluyendo npm.'
}

$nodeVersion = (& node.exe -p "process.versions.node").Trim()
$nodeMajor = [int]($nodeVersion.Split('.')[0])
if ($nodeMajor -lt 22) { throw "Se requiere Node.js 22 o superior. Versión detectada: $nodeVersion" }
Write-Host "Node.js $nodeVersion detectado." -ForegroundColor Green

Write-Host 'Instalando API...' -ForegroundColor Yellow
Push-Location $apiPath
try {
    & npm.cmd ci
    if ($LASTEXITCODE -ne 0) { throw 'Falló npm ci en la API.' }
    & npm.cmd run build
    if ($LASTEXITCODE -ne 0) { throw 'Falló la compilación de la API.' }
} finally { Pop-Location }

Write-Host 'Instalando aplicación web...' -ForegroundColor Yellow
Push-Location $webPath
try {
    & npm.cmd ci
    if ($LASTEXITCODE -ne 0) { throw 'Falló npm ci en la web.' }
    & npm.cmd run build
    if ($LASTEXITCODE -ne 0) { throw 'Falló la compilación web.' }
} finally { Pop-Location }

Write-Host 'Dependencias instaladas y proyecto compilado correctamente.' -ForegroundColor Green
Write-Host 'Siguiente paso: ejecute 2_CONFIGURAR_MYSQL.bat.' -ForegroundColor Cyan
