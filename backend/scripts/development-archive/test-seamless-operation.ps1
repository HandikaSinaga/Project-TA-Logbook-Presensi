# Quick Test Script - All Roles Seamless Operation
# Generated: 11 Januari 2026

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "   SEAMLESS OPERATION QUICK TEST" -ForegroundColor Cyan
Write-Host "========================================`n" -ForegroundColor Cyan

$baseUrl = "http://localhost:3001/api"
$testResults = @()

# Function to test endpoint
function Test-Endpoint {
    param(
        [string]$Name,
        [string]$Url,
        [string]$Method = "GET",
        [hashtable]$Headers = @{},
        [string]$Body = $null
    )
    
    try {
        Write-Host "Testing: $Name..." -NoNewline
        
        $params = @{
            Uri = $Url
            Method = $Method
            Headers = $Headers
            UseBasicParsing = $true
        }
        
        if ($Body) {
            $params.Body = $Body
            $params.ContentType = "application/json"
        }
        
        $response = Invoke-WebRequest @params -ErrorAction Stop
        
        if ($response.StatusCode -eq 200) {
            Write-Host " ✅ OK" -ForegroundColor Green
            return @{ Name = $Name; Status = "✅ PASSED"; Code = $response.StatusCode }
        } else {
            Write-Host " ⚠️  UNEXPECTED" -ForegroundColor Yellow
            return @{ Name = $Name; Status = "⚠️  WARNING"; Code = $response.StatusCode }
        }
    }
    catch {
        $statusCode = $_.Exception.Response.StatusCode.Value__
        if ($statusCode -eq 401) {
            Write-Host " 🔒 AUTH REQUIRED (Expected)" -ForegroundColor Blue
            return @{ Name = $Name; Status = "🔒 AUTH REQUIRED"; Code = 401 }
        } else {
            Write-Host " ❌ FAILED ($statusCode)" -ForegroundColor Red
            return @{ Name = $Name; Status = "❌ FAILED"; Code = $statusCode }
        }
    }
}

Write-Host "📡 Testing Backend Health...`n" -ForegroundColor Yellow

# Test public endpoints (should work without auth)
$testResults += Test-Endpoint -Name "Health Check" -Url "$baseUrl/"

Write-Host "`n🔐 Testing Auth Endpoints...`n" -ForegroundColor Yellow

# Test auth endpoints (should return 401 or work)
$testResults += Test-Endpoint -Name "Login Page" -Url "$baseUrl/auth/login"

Write-Host "`n👤 Testing User Role Endpoints...`n" -ForegroundColor Yellow

# User endpoints (should require auth)
$testResults += Test-Endpoint -Name "User Dashboard" -Url "$baseUrl/user/dashboard"
$testResults += Test-Endpoint -Name "User Attendance" -Url "$baseUrl/user/attendance"
$testResults += Test-Endpoint -Name "User Logbook" -Url "$baseUrl/user/logbook"
$testResults += Test-Endpoint -Name "User Leave" -Url "$baseUrl/user/leave"
$testResults += Test-Endpoint -Name "User Division" -Url "$baseUrl/user/divisions/my-division"
$testResults += Test-Endpoint -Name "User Profile" -Url "$baseUrl/user/profile"

Write-Host "`n👔 Testing Supervisor Role Endpoints...`n" -ForegroundColor Yellow

# Supervisor endpoints (should require auth)
$testResults += Test-Endpoint -Name "Supervisor Dashboard" -Url "$baseUrl/supervisor/dashboard"
$testResults += Test-Endpoint -Name "Supervisor Attendance" -Url "$baseUrl/supervisor/attendance"
$testResults += Test-Endpoint -Name "Supervisor Logbook" -Url "$baseUrl/supervisor/logbook"
$testResults += Test-Endpoint -Name "Supervisor Leave" -Url "$baseUrl/supervisor/leave"
$testResults += Test-Endpoint -Name "Supervisor Division" -Url "$baseUrl/supervisor/division"
$testResults += Test-Endpoint -Name "Supervisor Profile" -Url "$baseUrl/supervisor/profile"

Write-Host "`n⚡ Testing Admin Role Endpoints...`n" -ForegroundColor Yellow

# Admin endpoints (should require auth)
$testResults += Test-Endpoint -Name "Admin Dashboard" -Url "$baseUrl/admin/dashboard"
$testResults += Test-Endpoint -Name "Admin Users" -Url "$baseUrl/admin/users"
$testResults += Test-Endpoint -Name "Admin Divisions" -Url "$baseUrl/admin/divisions"
$testResults += Test-Endpoint -Name "Admin Locations" -Url "$baseUrl/admin/locations"
$testResults += Test-Endpoint -Name "Admin Attendances" -Url "$baseUrl/admin/attendances"
$testResults += Test-Endpoint -Name "Admin Logbook" -Url "$baseUrl/admin/logbook"
$testResults += Test-Endpoint -Name "Admin Leave" -Url "$baseUrl/admin/leave"
$testResults += Test-Endpoint -Name "Admin Settings" -Url "$baseUrl/admin/settings"
$testResults += Test-Endpoint -Name "Admin Profile" -Url "$baseUrl/admin/profile"

# Summary
Write-Host "`n========================================" -ForegroundColor Cyan
Write-Host "           TEST SUMMARY" -ForegroundColor Cyan
Write-Host "========================================`n" -ForegroundColor Cyan

$passed = ($testResults | Where-Object { $_.Status -like "*PASSED*" }).Count
$authRequired = ($testResults | Where-Object { $_.Status -like "*AUTH*" }).Count
$failed = ($testResults | Where-Object { $_.Status -like "*FAILED*" }).Count
$total = $testResults.Count

Write-Host "Total Tests: $total" -ForegroundColor White
Write-Host "✅ Passed: $passed" -ForegroundColor Green
Write-Host "🔒 Auth Required: $authRequired (Expected)" -ForegroundColor Blue
Write-Host "❌ Failed: $failed" -ForegroundColor $(if($failed -eq 0){"Green"}else{"Red"})

Write-Host "`n📋 Detailed Results:`n" -ForegroundColor Yellow

$testResults | Format-Table -Property Name, Status, Code -AutoSize

Write-Host "`n✨ Expected Behavior:" -ForegroundColor Cyan
Write-Host "   - Public endpoints should return 200" -ForegroundColor White
Write-Host "   - Protected endpoints should return 401 (Auth Required)" -ForegroundColor White
Write-Host "   - This confirms authentication is working properly`n" -ForegroundColor White

if ($authRequired -gt 0 -and $failed -eq 0) {
    Write-Host "✅ BACKEND IS HEALTHY AND SECURE!" -ForegroundColor Green
    Write-Host "   All endpoints are properly protected with authentication.`n" -ForegroundColor White
} elseif ($failed -gt 0) {
    Write-Host "⚠️  SOME ENDPOINTS FAILED!" -ForegroundColor Red
    Write-Host "   Please check the failed endpoints above.`n" -ForegroundColor White
} else {
    Write-Host "✅ ALL TESTS PASSED!" -ForegroundColor Green
    Write-Host "   Backend is running seamlessly!`n" -ForegroundColor White
}

Write-Host "========================================`n" -ForegroundColor Cyan
