$ErrorActionPreference = 'Stop'
$projectRoot = Split-Path -Parent $PSScriptRoot
$mysqlPath = Join-Path $projectRoot 'mysql'
$apiPath = Join-Path $projectRoot 'apps\api'

function Find-MySqlClient {
    $command = Get-Command mysql.exe -ErrorAction SilentlyContinue
    if ($command) { return $command.Source }
    $candidates = @(
        'C:\Program Files\MySQL\MySQL Server 8.4\bin\mysql.exe',
        'C:\Program Files\MySQL\MySQL Server 8.0\bin\mysql.exe',
        'C:\xampp\mysql\bin\mysql.exe'
    )
    return $candidates | Where-Object { Test-Path -LiteralPath $_ } | Select-Object -First 1
}

Write-Host '=== AndesGo: configuración de MySQL ===' -ForegroundColor Cyan
$mysqlExe = Find-MySqlClient
if (-not $mysqlExe) {
    throw 'No se encontró mysql.exe. Instale MySQL Server 8 o agregue su carpeta bin al PATH.'
}
Write-Host "Cliente detectado: $mysqlExe" -ForegroundColor Green
Write-Host 'ATENCIÓN: este paso elimina y recrea únicamente la base demostrativa booking_demo.' -ForegroundColor Yellow
$confirmation = Read-Host 'Escriba RECREAR para continuar'
if ($confirmation -ne 'RECREAR') { Write-Host 'Operación cancelada. No se modificó MySQL.' -ForegroundColor Yellow; exit 0 }

$securePassword = Read-Host 'Contraseña del usuario root de MySQL' -AsSecureString
$passwordPointer = [Runtime.InteropServices.Marshal]::SecureStringToBSTR($securePassword)
try {
    $plainPassword = [Runtime.InteropServices.Marshal]::PtrToStringBSTR($passwordPointer)
    $env:MYSQL_PWD = $plainPassword
    $baseScript = (Resolve-Path -LiteralPath (Join-Path $mysqlPath '00_RECREAR_BASE.sql')).Path.Replace('\', '/')
    $schemaScript = (Resolve-Path -LiteralPath (Join-Path $mysqlPath '001_schema.sql')).Path.Replace('\', '/')
    $seedScript = (Resolve-Path -LiteralPath (Join-Path $mysqlPath '002_seed.sql')).Path.Replace('\', '/')
    $finalProductScript = (Resolve-Path -LiteralPath (Join-Path $mysqlPath '003_final_product.sql')).Path.Replace('\', '/')

    & $mysqlExe --protocol=tcp --host=127.0.0.1 --port=3306 --user=root --default-character-set=utf8mb4 --execute="source $baseScript"
    if ($LASTEXITCODE -ne 0) { throw 'No se pudo crear la base. Revise la contraseña root y que MySQL esté iniciado.' }
    & $mysqlExe --protocol=tcp --host=127.0.0.1 --port=3306 --user=root --database=booking_demo --default-character-set=utf8mb4 --execute="source $schemaScript"
    if ($LASTEXITCODE -ne 0) { throw 'Falló la creación de tablas.' }
    & $mysqlExe --protocol=tcp --host=127.0.0.1 --port=3306 --user=root --database=booking_demo --default-character-set=utf8mb4 --execute="source $seedScript"
    if ($LASTEXITCODE -ne 0) { throw 'Falló la carga del catálogo inicial.' }
    & $mysqlExe --protocol=tcp --host=127.0.0.1 --port=3306 --user=root --database=booking_demo --default-character-set=utf8mb4 --execute="source $finalProductScript"
    if ($LASTEXITCODE -ne 0) { throw 'Falló la actualización final de tablas y políticas.' }
} finally {
    Remove-Item Env:MYSQL_PWD -ErrorAction SilentlyContinue
    if ($passwordPointer -ne [IntPtr]::Zero) { [Runtime.InteropServices.Marshal]::ZeroFreeBSTR($passwordPointer) }
    $plainPassword = $null
}

Write-Host 'Cargando usuarios, reservas y estadísticas sintéticas...' -ForegroundColor Yellow
$env:DB_HOST = '127.0.0.1'; $env:DB_PORT = '3306'; $env:DB_USER = 'booking_app'; $env:DB_PASSWORD = 'AndesGo2026!'; $env:DB_NAME = 'booking_demo'
Push-Location $apiPath
try {
    & npm.cmd run seed-demo
    if ($LASTEXITCODE -ne 0) { throw 'Falló la carga de datos demostrativos.' }
} finally {
    Pop-Location
    'DB_HOST','DB_PORT','DB_USER','DB_PASSWORD','DB_NAME' | ForEach-Object { Remove-Item "Env:$_" -ErrorAction SilentlyContinue }
}

Write-Host 'MySQL configurado correctamente con 19 tablas y datos demostrativos.' -ForegroundColor Green
Write-Host 'Siguiente paso: ejecute 3_INICIAR_SISTEMA.bat.' -ForegroundColor Cyan
