# QA Testing - Automated API Tests
# Date: December 3, 2025
# Purpose: Test all new API endpoints with authentication

Write-Host "`n╔════════════════════════════════════════════════════════════════╗" -ForegroundColor Cyan
Write-Host "║       QA TESTING - API ENDPOINTS VERIFICATION                  ║" -ForegroundColor Cyan
Write-Host "║       Branch: fix/current-project-features-20251203_195425     ║" -ForegroundColor Cyan
Write-Host "╚════════════════════════════════════════════════════════════════╝`n" -ForegroundColor Cyan

$baseUrl = "http://localhost:3001/api"
$testResults = @()
$tokens = @{
    admin = $null
    supervisor = $null
    user = $null
}

# Function to test API endpoint
function Test-ApiEndpoint {
    param(
        [string]$Name,
        [string]$Method,
        [string]$Endpoint,
        [hashtable]$Headers = @{"Content-Type" = "application/json"},
        [string]$Body = $null,
        [int]$ExpectedStatus = 200,
        [string]$Token = $null
    )
    
    Write-Host "`n━━━ Testing: $Name ━━━" -ForegroundColor Yellow
    Write-Host "Method: $Method $Endpoint"
    
    try {
        # Add authorization header if token provided
        if ($Token) {
            $Headers["Authorization"] = "Bearer $Token"
        }
        
        $params = @{
            Uri = "$baseUrl$Endpoint"
            Method = $Method
            Headers = $Headers
            UseBasicParsing = $true
        }
        
        if ($Body) {
            $params.Body = $Body
            Write-Host "Body: $Body" -ForegroundColor Gray
        }
        
        $response = Invoke-WebRequest @params -ErrorAction Stop
        
        if ($response.StatusCode -eq $ExpectedStatus) {
            Write-Host "✓ PASS - Status: $($response.StatusCode)" -ForegroundColor Green
            
            # Try to parse JSON response
            try {
                $jsonResponse = $response.Content | ConvertFrom-Json
                Write-Host "Response:" -ForegroundColor Gray
                Write-Host ($jsonResponse | ConvertTo-Json -Depth 2 -Compress) -ForegroundColor Gray
                
                return @{
                    Test = $Name
                    Status = "PASS"
                    StatusCode = $response.StatusCode
                    Message = "Success"
                    Data = $jsonResponse
                }
            } catch {
                Write-Host "Response: $($response.Content)" -ForegroundColor Gray
                
                return @{
                    Test = $Name
                    Status = "PASS"
                    StatusCode = $response.StatusCode
                    Message = "Success"
                }
            }
        } else {
            Write-Host "✗ FAIL - Expected: $ExpectedStatus, Got: $($response.StatusCode)" -ForegroundColor Red
            return @{
                Test = $Name
                Status = "FAIL"
                StatusCode = $response.StatusCode
                Message = "Unexpected status code"
            }
        }
        
    } catch {
        $statusCode = $null
        $errorBody = $null
        
        if ($_.Exception.Response) {
            $statusCode = $_.Exception.Response.StatusCode.value__
            try {
                $reader = [System.IO.StreamReader]::new($_.Exception.Response.GetResponseStream())
                $errorBody = $reader.ReadToEnd()
                $reader.Close()
            } catch {}
        }
        
        # Check if the failure matches expected status (for auth tests expecting 401)
        if ($statusCode -eq $ExpectedStatus) {
            Write-Host "✓ PASS - Got expected status: $ExpectedStatus" -ForegroundColor Green
            return @{
                Test = $Name
                Status = "PASS"
                StatusCode = $statusCode
                Message = "Expected unauthorized response"
            }
        }
        
        Write-Host "✗ FAIL - Error: $($_.Exception.Message)" -ForegroundColor Red
        Write-Host "Status Code: $statusCode" -ForegroundColor Red
        if ($errorBody) {
            Write-Host "Error Body: $errorBody" -ForegroundColor Red
        }
        
        return @{
            Test = $Name
            Status = "FAIL"
            StatusCode = $statusCode
            Message = $_.Exception.Message
        }
    }
}

# Function to authenticate and get token
function Get-AuthToken {
    param(
        [string]$Email,
        [string]$Password,
        [string]$Role
    )
    
    Write-Host "`n━━━ Authenticating as $Role ($Email) ━━━" -ForegroundColor Cyan
    
    try {
        $loginBody = @{
            email = $Email
            password = $Password
            remember = $false
        } | ConvertTo-Json
        
        $response = Invoke-RestMethod `
            -Uri "$baseUrl/login" `
            -Method POST `
            -Headers @{"Content-Type" = "application/json"} `
            -Body $loginBody `
            -ErrorAction Stop
        
        if ($response.success -and $response.token) {
            Write-Host "✓ Authentication successful" -ForegroundColor Green
            return $response.token
        } else {
            Write-Host "✗ Authentication failed - No token received" -ForegroundColor Red
            Write-Host "Response: $($response | ConvertTo-Json)" -ForegroundColor Gray
            return $null
        }
    } catch {
        Write-Host "✗ Authentication error: $($_.Exception.Message)" -ForegroundColor Red
        return $null
    }
}


# ═══════════════════════════════════════════════════════════════
# AUTHENTICATION
# ═══════════════════════════════════════════════════════════════

Write-Host "`n┌─────────────────────────────────────────────────────────────┐" -ForegroundColor Magenta
Write-Host "│  AUTHENTICATION SETUP                                       │" -ForegroundColor Magenta
Write-Host "└─────────────────────────────────────────────────────────────┘" -ForegroundColor Magenta

# Get tokens for all roles
$tokens.admin = Get-AuthToken -Email "admin@example.com" -Password "password123" -Role "Admin"
$tokens.supervisor = Get-AuthToken -Email "supervisor@example.com" -Password "password123" -Role "Supervisor"
$tokens.user = Get-AuthToken -Email "john@example.com" -Password "password123" -Role "User"

# Check if authentication succeeded
if (-not $tokens.admin -or -not $tokens.supervisor -or -not $tokens.user) {
    Write-Host "`n✗ CRITICAL ERROR: Failed to authenticate one or more test users" -ForegroundColor Red
    Write-Host "Ensure backend server is running and test data is seeded" -ForegroundColor Yellow
    exit 1
}

Write-Host "`n✓ All test users authenticated successfully" -ForegroundColor Green

# ═══════════════════════════════════════════════════════════════
# TEST SUITE 1: Office Networks Endpoints (Admin)
# ═══════════════════════════════════════════════════════════════

Write-Host "`n┌─────────────────────────────────────────────────────────────┐" -ForegroundColor Magenta
Write-Host "│  TEST SUITE 1: Admin Office Networks CRUD                   │" -ForegroundColor Magenta
Write-Host "└─────────────────────────────────────────────────────────────┘" -ForegroundColor Magenta

# Test 1.1: Unauthorized access (no token)
$testResults += Test-ApiEndpoint `
    -Name "GET All Office Networks (No Auth)" `
    -Method "GET" `
    -Endpoint "/admin/office-networks" `
    -ExpectedStatus 401

# Test 1.2: Get All Office Networks (with auth)
$testResults += Test-ApiEndpoint `
    -Name "GET All Office Networks (Admin)" `
    -Method "GET" `
    -Endpoint "/admin/office-networks" `
    -Token $tokens.admin `
    -ExpectedStatus 200

# Test 1.3: Get Active Office Networks Only
$testResults += Test-ApiEndpoint `
    -Name "GET Active Office Networks (Admin)" `
    -Method "GET" `
    -Endpoint "/admin/office-networks/active" `
    -Token $tokens.admin `
    -ExpectedStatus 200

# Test 1.4: Create Office Network
$createBody = @{
    ssid = "QA_Test_Network_$(Get-Date -Format 'HHmmss')"
    description = "Automated QA Test Network"
    is_active = $true
} | ConvertTo-Json

$createResult = Test-ApiEndpoint `
    -Name "POST Create Office Network (Admin)" `
    -Method "POST" `
    -Endpoint "/admin/office-networks" `
    -Token $tokens.admin `
    -Body $createBody `
    -ExpectedStatus 201

$testResults += $createResult

# Store created network ID for update/delete tests
$createdNetworkId = $null
if ($createResult.Status -eq "PASS" -and $createResult.Data) {
    $createdNetworkId = $createResult.Data.data.id
    Write-Host "Created network ID: $createdNetworkId" -ForegroundColor Gray
}

# Test 1.5: Update Office Network
if ($createdNetworkId) {
    $updateBody = @{
        ssid = "QA_Test_Network_Updated"
        description = "Updated description"
        is_active = $false
    } | ConvertTo-Json
    
    $testResults += Test-ApiEndpoint `
        -Name "PUT Update Office Network (Admin)" `
        -Method "PUT" `
        -Endpoint "/admin/office-networks/$createdNetworkId" `
        -Token $tokens.admin `
        -Body $updateBody `
        -ExpectedStatus 200
}

# Test 1.6: Delete Office Network
if ($createdNetworkId) {
    $testResults += Test-ApiEndpoint `
        -Name "DELETE Office Network (Admin)" `
        -Method "DELETE" `
        -Endpoint "/admin/office-networks/$createdNetworkId" `
        -Token $tokens.admin `
        -ExpectedStatus 200
}

# ═══════════════════════════════════════════════════════════════
# TEST SUITE 2: Division Management Endpoints (Supervisor)
# ═══════════════════════════════════════════════════════════════

Write-Host "`n┌─────────────────────────────────────────────────────────────┐" -ForegroundColor Magenta
Write-Host "│  TEST SUITE 2: Supervisor Division Management               │" -ForegroundColor Magenta
Write-Host "└─────────────────────────────────────────────────────────────┘" -ForegroundColor Magenta

# Test 2.1: Unauthorized access
$testResults += Test-ApiEndpoint `
    -Name "GET Available Users (No Auth)" `
    -Method "GET" `
    -Endpoint "/supervisor/division/available-users" `
    -ExpectedStatus 401

# Test 2.2: Get Available Users (with supervisor auth)
$testResults += Test-ApiEndpoint `
    -Name "GET Available Users (Supervisor)" `
    -Method "GET" `
    -Endpoint "/supervisor/division/available-users" `
    -Token $tokens.supervisor `
    -ExpectedStatus 200

# Test 2.3: Get Supervisor's Division
$testResults += Test-ApiEndpoint `
    -Name "GET Supervisor Division" `
    -Method "GET" `
    -Endpoint "/supervisor/division" `
    -Token $tokens.supervisor `
    -ExpectedStatus 200

# Test 2.4: Get Division Members
$testResults += Test-ApiEndpoint `
    -Name "GET Division Members (Supervisor)" `
    -Method "GET" `
    -Endpoint "/supervisor/division/members" `
    -Token $tokens.supervisor `
    -ExpectedStatus 200

# Test 2.5: User role cannot access supervisor endpoints
$testResults += Test-ApiEndpoint `
    -Name "GET Supervisor Division (User Role - Should Fail)" `
    -Method "GET" `
    -Endpoint "/supervisor/division" `
    -Token $tokens.user `
    -ExpectedStatus 403

# ═══════════════════════════════════════════════════════════════
# TEST SUITE 3: User Division View
# ═══════════════════════════════════════════════════════════════

Write-Host "`n┌─────────────────────────────────────────────────────────────┐" -ForegroundColor Magenta
Write-Host "│  TEST SUITE 3: User Division View                           │" -ForegroundColor Magenta
Write-Host "└─────────────────────────────────────────────────────────────┘" -ForegroundColor Magenta

# Test 3.1: Unauthorized access
$testResults += Test-ApiEndpoint `
    -Name "GET User Division (No Auth)" `
    -Method "GET" `
    -Endpoint "/user/divisions/my-division" `
    -ExpectedStatus 401

# Test 3.2: Get User's Division (user role)
$testResults += Test-ApiEndpoint `
    -Name "GET My Division (User)" `
    -Method "GET" `
    -Endpoint "/user/divisions/my-division" `
    -Token $tokens.user `
    -ExpectedStatus 200

# Test 3.3: Get User's Division (supervisor can also access)
$testResults += Test-ApiEndpoint `
    -Name "GET My Division (Supervisor)" `
    -Method "GET" `
    -Endpoint "/user/divisions/my-division" `
    -Token $tokens.supervisor `
    -ExpectedStatus 200

# Test 3.4: Get User's Division (admin has no division - should return 404)
$testResults += Test-ApiEndpoint `
    -Name "GET My Division (Admin - No Division)" `
    -Method "GET" `
    -Endpoint "/user/divisions/my-division" `
    -Token $tokens.admin `
    -ExpectedStatus 404

# ═══════════════════════════════════════════════════════════════
# TEST SUITE 4: Database Verification
# ═══════════════════════════════════════════════════════════════

Write-Host "`n┌─────────────────────────────────────────────────────────────┐" -ForegroundColor Magenta
Write-Host "│  TEST SUITE 4: Database Schema Verification                 │" -ForegroundColor Magenta
Write-Host "└─────────────────────────────────────────────────────────────┘" -ForegroundColor Magenta

Write-Host "`n━━━ Testing: Database Migration Status ━━━" -ForegroundColor Yellow
try {
    # Use npx.cmd on Windows to run sequelize-cli
    $migrationStatus = npx.cmd sequelize-cli db:migrate:status 2>&1 | Out-String
    
    if ($migrationStatus -like "*20251203000010-create-office-networks.cjs*" -and $migrationStatus -like "*up*") {
        Write-Host "✓ PASS - office_networks migration executed" -ForegroundColor Green
        $testResults += @{
            Test = "Database Migration - office_networks"
            Status = "PASS"
            StatusCode = $null
            Message = "Migration executed successfully"
        }
    } else {
        Write-Host "✗ FAIL - office_networks migration not found or not executed" -ForegroundColor Red
        Write-Host "Migration Status:" -ForegroundColor Gray
        Write-Host $migrationStatus -ForegroundColor Gray
        $testResults += @{
            Test = "Database Migration - office_networks"
            Status = "FAIL"
            StatusCode = $null
            Message = "Migration not executed"
        }
    }
} catch {
    Write-Host "✗ FAIL - Error checking migration: $($_.Exception.Message)" -ForegroundColor Red
    $testResults += @{
        Test = "Database Migration - office_networks"
        Status = "FAIL"
        StatusCode = $null
        Message = $_.Exception.Message
    }
}

# ═══════════════════════════════════════════════════════════════
# TEST RESULTS SUMMARY
# ═══════════════════════════════════════════════════════════════

Write-Host "`n`n╔════════════════════════════════════════════════════════════════╗" -ForegroundColor Cyan
Write-Host "║                    TEST RESULTS SUMMARY                        ║" -ForegroundColor Cyan
Write-Host "╚════════════════════════════════════════════════════════════════╝`n" -ForegroundColor Cyan

$totalTests = $testResults.Count
$passedTests = ($testResults | Where-Object { $_.Status -eq "PASS" }).Count
$failedTests = ($testResults | Where-Object { $_.Status -eq "FAIL" }).Count
$successRate = if ($totalTests -gt 0) { [math]::Round(($passedTests/$totalTests)*100, 2) } else { 0 }

Write-Host "Total Tests: $totalTests" -ForegroundColor White
Write-Host "Passed: $passedTests" -ForegroundColor Green
Write-Host "Failed: $failedTests" -ForegroundColor Red
Write-Host "Success Rate: $successRate%" -ForegroundColor $(if ($successRate -eq 100) { "Green" } else { "Yellow" })

Write-Host "`nDetailed Results:" -ForegroundColor Yellow
Write-Host "─────────────────────────────────────────────────────────────────"

foreach ($result in $testResults) {
    $statusColor = if ($result.Status -eq "PASS") { "Green" } else { "Red" }
    $statusIcon = if ($result.Status -eq "PASS") { "✓" } else { "✗" }
    
    Write-Host "$statusIcon $($result.Test)" -ForegroundColor $statusColor
    Write-Host "  Status: $($result.Status)" -ForegroundColor $statusColor
    if ($result.StatusCode) {
        Write-Host "  HTTP Status: $($result.StatusCode)" -ForegroundColor Gray
    }
    Write-Host "  Message: $($result.Message)" -ForegroundColor Gray
    Write-Host ""
}

# Generate summary report
$timestamp = Get-Date -Format "yyyyMMdd_HHmmss"

# Ensure _temp_logs directory exists
$logsDir = "..\\_temp_logs"
if (-not (Test-Path $logsDir)) {
    New-Item -ItemType Directory -Path $logsDir -Force | Out-Null
}

$reportPath = "$logsDir\\qa-api-test-results-$timestamp.txt"

$report = @"
QA TESTING - API ENDPOINTS VERIFICATION
Date: $(Get-Date -Format "yyyy-MM-dd HH:mm:ss")
Branch: fix/current-project-features-20251203_195425

SUMMARY:
========
Total Tests: $totalTests
Passed: $passedTests
Failed: $failedTests
Success Rate: $successRate%

DETAILED RESULTS:
=================
$($testResults | ForEach-Object {
    "$($_.Status.PadRight(6)) - $($_.Test)"
    "         HTTP Status: $($_.StatusCode)"
    "         Message: $($_.Message)"
    ""
} | Out-String)

AUTHENTICATION:
===============
Admin Token: $(if ($tokens.admin) { "✓ Acquired" } else { "✗ Failed" })
Supervisor Token: $(if ($tokens.supervisor) { "✓ Acquired" } else { "✗ Failed" })
User Token: $(if ($tokens.user) { "✓ Acquired" } else { "✗ Failed" })

NOTES:
======
- All tests run with proper authentication
- Role-based access control verified
- Database migration status checked
- Full CRUD operations tested for office networks
"@

$report | Out-File -FilePath $reportPath -Encoding UTF8

Write-Host "`n═══════════════════════════════════════════════════════════════" -ForegroundColor Cyan
Write-Host "Test results saved to: $reportPath" -ForegroundColor Cyan
Write-Host "`nQA Testing Script Completed!`n" -ForegroundColor Green

# Exit with appropriate code
if ($failedTests -gt 0) {
    Write-Host "⚠ WARNING: $failedTests test(s) failed" -ForegroundColor Yellow
    exit 1
} else {
    Write-Host "✓ All tests passed successfully!" -ForegroundColor Green
    exit 0
}

