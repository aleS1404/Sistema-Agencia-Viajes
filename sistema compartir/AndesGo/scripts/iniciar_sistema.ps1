$ErrorActionPreference = 'Stop'
$projectRoot = Split-Path -Parent $PSScriptRoot
$apiPath = Join-Path $projectRoot 'apps\api'
$webPath = Join-Path $projectRoot 'apps\web'
$runtimePath = Join-Path $projectRoot '.runtime'
$logsPath = Join-Path $projectRoot 'logs'
New-Item -ItemType Directory -Path $runtimePath -Force | Out-Null
New-Item -ItemType Directory -Path $logsPath -Force | Out-Null

if (-not (Test-Path -LiteralPath (Join-Path $apiPath 'node_modules'))) { throw 'Faltan dependencias. Ejecute primero 1_INSTALAR_DEPENDENCIAS.bat.' }

function Start-AndesProcess($name, $executable, $workingDirectory, $arguments, $pidFile) {
    if (Test-Path -LiteralPath $pidFile) {
        $oldPid = [int](Get-Content -LiteralPath $pidFile -Raw)
        $oldProcess = Get-Process -Id $oldPid -ErrorAction SilentlyContinue
        if ($oldProcess -and $oldProcess.ProcessName -eq 'node') { Write-Host "$name ya está iniciado (PID $oldPid)." -ForegroundColor Yellow; return }
    }
    $stdout = Join-Path $logsPath ($name.ToLower() + '-salida.log')
    $stderr = Join-Path $logsPath ($name.ToLower() + '-error.log')
    $process = Start-Process -FilePath $executable -ArgumentList $arguments -WorkingDirectory $workingDirectory -WindowStyle Hidden -RedirectStandardOutput $stdout -RedirectStandardError $stderr -PassThru
    Set-Content -LiteralPath $pidFile -Value $process.Id
    Write-Host "$name iniciado (PID $($process.Id))." -ForegroundColor Green
}

Write-Host '=== AndesGo: iniciando sistema ===' -ForegroundColor Cyan
$nodeExe = (Get-Command node.exe -ErrorAction Stop).Source
$viteCli = 'node_modules\vite\bin\vite.js'
Start-AndesProcess 'API' $nodeExe $apiPath @('dist/main.js') (Join-Path $runtimePath 'api.pid')
Start-AndesProcess 'WEB' $nodeExe $webPath @($viteCli,'preview','--host','127.0.0.1','--port','5173') (Join-Path $runtimePath 'web.pid')

$ready = $false
for ($attempt = 1; $attempt -le 30; $attempt++) {
    try {
        $health = Invoke-RestMethod -Uri 'http://127.0.0.1:3000/api/health' -TimeoutSec 2
        if ($health.status -eq 'ok') { $ready = $true; break }
    } catch { Start-Sleep -Seconds 1 }
}
if (-not $ready) {
    Write-Host 'La API no respondió. Revise AndesGo\logs\api-error.log y confirme que MySQL está iniciado.' -ForegroundColor Red
    exit 1
}

Write-Host 'Sistema disponible en http://localhost:5173' -ForegroundColor Green
Write-Host 'Administrador: admin@andesgo.demo / Demo1234!' -ForegroundColor Cyan
Start-Process 'http://localhost:5173'
