$ErrorActionPreference = 'Stop'
$projectRoot = Split-Path -Parent $PSScriptRoot
$runtimePath = Join-Path $projectRoot '.runtime'
Write-Host '=== AndesGo: deteniendo sistema ===' -ForegroundColor Cyan

foreach ($name in @('api','web')) {
    $pidFile = Join-Path $runtimePath "$name.pid"
    if (-not (Test-Path -LiteralPath $pidFile)) { Write-Host "$name no tiene PID registrado."; continue }
    $processId = [int](Get-Content -LiteralPath $pidFile -Raw)
    $process = Get-Process -Id $processId -ErrorAction SilentlyContinue
    if ($process -and $process.ProcessName -eq 'node') {
        Stop-Process -Id $processId -Force
        Write-Host "$name detenido (PID $processId)." -ForegroundColor Green
    } else { Write-Host "$name ya estaba detenido." }
    Remove-Item -LiteralPath $pidFile -Force -ErrorAction SilentlyContinue
}
