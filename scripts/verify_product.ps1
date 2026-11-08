[CmdletBinding()]
param(
    [string]$ApiUrl = $(if ($env:BOOKING_API_URL) { $env:BOOKING_API_URL } else { 'http://127.0.0.1:3000/api' }),
    [string]$DemoPassword = $(if ($env:DEMO_PASSWORD) { $env:DEMO_PASSWORD } else { 'Demo1234!' }),
    [string]$AdminEmail = $(if ($env:DEMO_ADMIN_EMAIL) { $env:DEMO_ADMIN_EMAIL } else { 'admin@andesgo.demo' }),
    [string]$CustomerEmail = $(if ($env:DEMO_CUSTOMER_EMAIL) { $env:DEMO_CUSTOMER_EMAIL } else { 'cliente@andesgo.demo' }),
    [string]$SupportEmail = $(if ($env:DEMO_SUPPORT_EMAIL) { $env:DEMO_SUPPORT_EMAIL } else { 'soporte@andesgo.demo' }),
    [string]$ProviderEmail = $(if ($env:DEMO_PROVIDER_EMAIL) { $env:DEMO_PROVIDER_EMAIL } else { 'proveedor@andesgo.demo' })
)

$ErrorActionPreference = 'Stop'
$script:steps = [System.Collections.Generic.List[object]]::new()
$script:context = @{}
$startedAt = Get-Date

function Assert-That {
    param(
        [Parameter(Mandatory = $true)] [bool]$Condition,
        [Parameter(Mandatory = $true)] [string]$Message
    )
    if (-not $Condition) { throw "Aserción fallida: $Message" }
}

function Invoke-Api {
    param(
        [Parameter(Mandatory = $true)] [ValidateSet('GET', 'POST', 'PATCH', 'PUT', 'DELETE')] [string]$Method,
        [Parameter(Mandatory = $true)] [string]$Path,
        [string]$Token,
        [object]$Body
    )
    $headers = @{}
    if ($Token) { $headers.Authorization = "Bearer $Token" }
    $arguments = @{
        Uri = "$($ApiUrl.TrimEnd('/'))$Path"
        Method = $Method
        Headers = $headers
        TimeoutSec = 30
        UseBasicParsing = $true
    }
    if ($null -ne $Body) {
        $arguments.ContentType = 'application/json; charset=utf-8'
        $arguments.Body = $Body | ConvertTo-Json -Depth 12 -Compress
    }
    return Invoke-RestMethod @arguments
}

function Login-DemoUser {
    param([string]$Email, [string]$ExpectedRole)
    $response = Invoke-Api -Method POST -Path '/auth/login' -Body @{ email = $Email; password = $DemoPassword }
    Assert-That ([bool]$response.accessToken) "Login sin token para $Email"
    Assert-That ($response.user.role -eq $ExpectedRole) "Se esperaba rol $ExpectedRole para $Email y llegó $($response.user.role)"
    return $response
}

function Run-Step {
    param(
        [Parameter(Mandatory = $true)] [string]$Name,
        [Parameter(Mandatory = $true)] [scriptblock]$Action
    )
    $watch = [System.Diagnostics.Stopwatch]::StartNew()
    try {
        & $Action
        $watch.Stop()
        $script:steps.Add([ordered]@{ name = $Name; status = 'passed'; durationMs = $watch.ElapsedMilliseconds })
    }
    catch {
        $watch.Stop()
        $script:steps.Add([ordered]@{
            name = $Name
            status = 'failed'
            durationMs = $watch.ElapsedMilliseconds
            error = $_.Exception.Message
        })
        throw
    }
}

$fatalError = $null
try {
    Run-Step 'Health de la API' {
        $health = Invoke-Api -Method GET -Path '/health'
        Assert-That ($health.status -eq 'ok') 'La API no reportó status=ok'
        $script:context.health = $health.service
    }

    Run-Step 'Login de los cuatro roles' {
        $script:context.admin = Login-DemoUser -Email $AdminEmail -ExpectedRole 'ADMIN'
        $script:context.customer = Login-DemoUser -Email $CustomerEmail -ExpectedRole 'CUSTOMER'
        $script:context.support = Login-DemoUser -Email $SupportEmail -ExpectedRole 'SUPPORT'
        $script:context.provider = Login-DemoUser -Email $ProviderEmail -ExpectedRole 'PROVIDER'
    }

    Run-Step 'Catálogo y metadatos' {
        $metadata = Invoke-Api -Method GET -Path '/catalog/metadata'
        $servicesResponse = Invoke-Api -Method GET -Path '/catalog/services'
        $services = @($servicesResponse | ForEach-Object { $_ })
        Assert-That (@($metadata.destinations).Count -gt 0) 'No existen destinos'
        Assert-That (@($metadata.categories).Count -gt 0) 'No existen categorías'
        Assert-That ($services.Count -gt 0) 'No existen servicios disponibles'
        $script:context.metadata = $metadata
        $script:context.service = $services[0]
    }

    Run-Step 'Recomendaciones del cliente' {
        $recommendationsResponse = Invoke-Api -Method GET -Path '/recommendations' -Token $script:context.customer.accessToken
        $recommendations = @($recommendationsResponse | ForEach-Object { $_ })
        Assert-That ($recommendations.Count -gt 0) 'El recomendador no devolvió opciones'
        Assert-That ([bool]$recommendations[0].explanation) 'La recomendación no explica la coincidencia'
        $script:context.recommendationCount = $recommendations.Count
    }

    Run-Step 'Crear reserva e itinerario' {
        $serviceDate = (Get-Date).AddDays(14).ToString('yyyy-MM-dd')
        $booking = Invoke-Api -Method POST -Path '/bookings' -Token $script:context.customer.accessToken -Body @{
            items = @(@{ serviceId = [int]($script:context.service.id); quantity = 1; serviceDate = $serviceDate })
        }
        Assert-That ([int]($booking.id) -gt 0) 'La reserva no devolvió ID'
        Assert-That ([decimal]($booking.totalAmount) -gt 0) 'La reserva no tiene un total válido'
        $itinerary = Invoke-Api -Method GET -Path "/bookings/$($booking.id)/itinerary" -Token $script:context.customer.accessToken
        Assert-That (@($itinerary.items).Count -gt 0) 'El itinerario no contiene servicios'
        $script:context.booking = $booking
    }

    Run-Step 'Pago y verificación de transacción' {
        $payment = Invoke-Api -Method POST -Path "/bookings/$($script:context.booking.id)/payments" -Token $script:context.customer.accessToken -Body @{
            method = 'card_simulated'; result = 'approved'
        }
        Assert-That ($payment.status -eq 'approved') 'El pago simulado no fue aprobado'
        Assert-That ([bool]$payment.referenceCode) 'El pago no generó referencia'
        $script:context.payment = $payment
    }

    Run-Step 'Cancelación y aprobación de reembolso' {
        $cancellation = Invoke-Api -Method POST -Path "/bookings/$($script:context.booking.id)/cancellations" -Token $script:context.customer.accessToken -Body @{
            reason = 'Cancelación creada por la verificación automatizada del producto.'
        }
        Assert-That ($cancellation.status -eq 'requested') 'La cancelación no quedó solicitada'
        $resolved = Invoke-Api -Method PATCH -Path "/support/cancellations/$($cancellation.id)" -Token $script:context.support.accessToken -Body @{
            status = 'approved'; resolution = 'Cumple la política de demostración.'
        }
        Assert-That ($resolved.status -eq 'approved') 'Soporte no aprobó la cancelación'
        $refund = Invoke-Api -Method POST -Path "/support/cancellations/$($cancellation.id)/refunds" -Token $script:context.support.accessToken -Body @{
            amount = [decimal]($script:context.payment.amount)
        }
        Assert-That ($refund.status -eq 'approved') 'El reembolso no fue aprobado'
        Assert-That ([bool]$refund.referenceCode) 'El reembolso no generó referencia'
        $script:context.refund = $refund
    }

    Run-Step 'Registro y resolución de reclamo' {
        $complaint = Invoke-Api -Method POST -Path '/complaints' -Token $script:context.customer.accessToken -Body @{
            bookingId = [int]($script:context.booking.id)
            subject = 'Verificación automatizada'
            description = 'Reclamo sintético para comprobar el flujo completo de atención al cliente.'
        }
        Assert-That ($complaint.status -eq 'open') 'El reclamo no quedó abierto'
        $updated = Invoke-Api -Method PATCH -Path "/support/complaints/$($complaint.id)" -Token $script:context.support.accessToken -Body @{
            status = 'resolved'; resolution = 'Caso de demostración verificado y resuelto.'
        }
        Assert-That ($updated.status -eq 'resolved') 'El reclamo no quedó resuelto'
        $script:context.complaint = $updated
    }

    Run-Step 'Gestión de servicio por proveedor' {
        $profile = Invoke-Api -Method GET -Path '/auth/me' -Token $script:context.provider.accessToken
        Assert-That ([int]($profile.provider.id) -gt 0) 'La cuenta proveedor no está vinculada a providers'
        $code = 'E2E-' + (Get-Date -Format 'MMddHHmmss')
        $created = Invoke-Api -Method POST -Path '/services' -Token $script:context.provider.accessToken -Body @{
            providerId = [int]($profile.provider.id)
            destinationId = [int](@($script:context.metadata.destinations)[0].id)
            categoryId = [int](@($script:context.metadata.categories)[0].id)
            code = $code
            name = 'Servicio de verificación ' + $code
            description = 'Servicio sintético creado durante la prueba integral automatizada.'
            durationDays = 1
            priceBob = 100
            capacity = 2
            interestIds = @([int](@($script:context.metadata.interests)[0].id))
        }
        Assert-That ([int]($created.id) -gt 0) 'El proveedor no pudo crear el servicio'
        Assert-That ($created.status -eq 'draft') 'El servicio del proveedor debe quedar en borrador'
        $script:context.providerService = $created
    }

    Run-Step 'Reporte administrativo' {
        $report = Invoke-Api -Method GET -Path '/admin/reports' -Token $script:context.admin.accessToken
        Assert-That ([bool]$report.generatedAt) 'El reporte no tiene fecha de generación'
        Assert-That ($null -ne $report.bookings) 'El reporte no incluye reservas'
        $script:context.reportGeneratedAt = $report.generatedAt
    }

    Run-Step 'Denegación RBAC para cliente' {
        $headers = @{ Authorization = "Bearer $($script:context.customer.accessToken)" }
        $statusCode = 0
        try {
            Invoke-WebRequest -Uri "$($ApiUrl.TrimEnd('/'))/admin/users" -Method GET -Headers $headers -TimeoutSec 30 -UseBasicParsing | Out-Null
            $statusCode = 200
        }
        catch {
            if ($_.Exception.Response -and $_.Exception.Response.StatusCode) {
                $statusCode = [int]$_.Exception.Response.StatusCode
            }
            else { throw }
        }
        Assert-That ($statusCode -eq 403) "Se esperaba HTTP 403 y se recibió $statusCode"
    }
}
catch {
    $fatalError = $_.Exception.Message
}

$finishedAt = Get-Date
$passed = @($script:steps | Where-Object { $_.status -eq 'passed' }).Count
$failed = @($script:steps | Where-Object { $_.status -eq 'failed' }).Count
$summary = [ordered]@{
    ok = ($null -eq $fatalError -and $failed -eq 0)
    apiUrl = $ApiUrl
    startedAt = $startedAt.ToString('o')
    finishedAt = $finishedAt.ToString('o')
    durationMs = [int]($finishedAt - $startedAt).TotalMilliseconds
    passed = $passed
    failed = $failed
    error = $fatalError
    evidence = [ordered]@{
        healthService = $script:context.health
        recommendationCount = $script:context.recommendationCount
        bookingId = $script:context.booking.id
        paymentReference = $script:context.payment.referenceCode
        refundReference = $script:context.refund.referenceCode
        complaintId = $script:context.complaint.id
        providerServiceId = $script:context.providerService.id
        reportGeneratedAt = $script:context.reportGeneratedAt
    }
    steps = $script:steps
}

$summary | ConvertTo-Json -Depth 12
if (-not $summary.ok) { exit 1 }
exit 0
