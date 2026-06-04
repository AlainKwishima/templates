$ErrorActionPreference = "Continue"
$baseUrl = "http://localhost:8080/api/v1"
$passed = 0
$failed = 0
$total = 0

function Test($name, $block) {
    $script:total++
    try {
        $result = & $block
        if ($result -eq $false) { throw "Assertion failed" }
        Write-Host "[PASS] $name" -ForegroundColor Green
        $script:passed++
    } catch {
        Write-Host "[FAIL] $name - $($_.Exception.Message)" -ForegroundColor Red
        $script:failed++
    }
}

Write-Host "`n========================================" -ForegroundColor Cyan
Write-Host " IMS COMPREHENSIVE TEST SUITE" -ForegroundColor Cyan
Write-Host "========================================`n" -ForegroundColor Cyan

# ============================================================
# 1. SECURITY / AUTHORIZATION TESTS
# ============================================================
Write-Host "--- 1. Security & Authorization ---" -ForegroundColor Yellow

Test "Unauthenticated GET /users returns 403" {
    try { Invoke-RestMethod -Uri "$baseUrl/users" -Method Get -ContentType "application/json"; return $false }
    catch { return $true }
}

Test "Unauthenticated GET /departments returns 403" {
    try { Invoke-RestMethod -Uri "$baseUrl/departments" -Method Get -ContentType "application/json"; return $false }
    catch { return $true }
}

Test "Unauthenticated GET /dashboard returns 403" {
    try { Invoke-RestMethod -Uri "$baseUrl/dashboard" -Method Get -ContentType "application/json"; return $false }
    catch { return $true }
}

Test "Invalid JWT token returns 403" {
    try {
        $h = @{ Authorization = "Bearer invalid.token.here" }
        Invoke-RestMethod -Uri "$baseUrl/users" -Method Get -Headers $h -ContentType "application/json"
        return $false
    } catch { return $true }
}

# ============================================================
# 2. AUTH FLOW TESTS
# ============================================================
Write-Host "`n--- 2. Authentication Flow ---" -ForegroundColor Yellow

$adminToken = $null
Test "Admin login returns valid token" {
    $body = @{ email = "admin@example.com"; password = "admin123" } | ConvertTo-Json
    $res = Invoke-RestMethod -Uri "$baseUrl/auth/login" -Method Post -Body $body -ContentType "application/json"
    $script:adminToken = $res.data.token
    return ($res.success -eq $true -and $res.data.token.Length -gt 10)
}

$adminHeaders = @{ Authorization = "Bearer $adminToken" }

Test "Login with wrong password returns error" {
    try {
        $body = @{ email = "admin@example.com"; password = "wrongpassword" } | ConvertTo-Json
        Invoke-RestMethod -Uri "$baseUrl/auth/login" -Method Post -Body $body -ContentType "application/json"
        return $false
    } catch { return $true }
}

Test "Login with non-existent user returns error" {
    try {
        $body = @{ email = "nonexistent@example.com"; password = "password123" } | ConvertTo-Json
        Invoke-RestMethod -Uri "$baseUrl/auth/login" -Method Post -Body $body -ContentType "application/json"
        return $false
    } catch { return $true }
}

$uniqueEmail = "testcomprehensive_$(Get-Random)@example.com"
$newUserToken = $null
Test "Register new user succeeds" {
    $body = @{ firstName = "Comp"; lastName = "Test"; email = $uniqueEmail; password = "password123"; roleName = "USER" } | ConvertTo-Json
    $res = Invoke-RestMethod -Uri "$baseUrl/auth/register" -Method Post -Body $body -ContentType "application/json"
    $script:newUserToken = $res.data.token
    return ($res.success -eq $true -and $res.data.user.email -eq $uniqueEmail)
}

Test "Register duplicate email returns error" {
    try {
        $body = @{ firstName = "Dup"; lastName = "User"; email = $uniqueEmail; password = "password123"; roleName = "USER" } | ConvertTo-Json
        Invoke-RestMethod -Uri "$baseUrl/auth/register" -Method Post -Body $body -ContentType "application/json"
        return $false
    } catch { return $true }
}

# ============================================================
# 3. CRUD TESTS - DEPARTMENTS
# ============================================================
Write-Host "`n--- 3. Department CRUD ---" -ForegroundColor Yellow

$newDeptName = "TestDept_$(Get-Random)"
$newDeptId = $null
Test "Create department succeeds" {
    $body = @{ name = $newDeptName; description = "Test department" } | ConvertTo-Json
    $res = Invoke-RestMethod -Uri "$baseUrl/departments" -Method Post -Headers $adminHeaders -Body $body -ContentType "application/json"
    $script:newDeptId = $res.data.id
    return ($res.success -eq $true -and $res.data.name -eq $newDeptName)
}

Test "Get all departments returns data" {
    $res = Invoke-RestMethod -Uri "$baseUrl/departments" -Method Get -Headers $adminHeaders
    return ($res.success -eq $true -and $res.data.Count -ge 1)
}

Test "Create duplicate department name returns error" {
    try {
        $body = @{ name = $newDeptName; description = "Duplicate" } | ConvertTo-Json
        Invoke-RestMethod -Uri "$baseUrl/departments" -Method Post -Headers $adminHeaders -Body $body -ContentType "application/json"
        return $false
    } catch { return $true }
}

# ============================================================
# 4. CRUD TESTS - RESOURCES
# ============================================================
Write-Host "`n--- 4. Resource CRUD ---" -ForegroundColor Yellow

$resCode = "TST-$(Get-Random -Minimum 100 -Maximum 999)"
$newResId = $null
Test "Create resource succeeds" {
    $body = @{ name = "Test Resource"; code = $resCode; description = "Test resource"; status = "AVAILABLE"; departmentId = $newDeptId } | ConvertTo-Json
    $res = Invoke-RestMethod -Uri "$baseUrl/resources" -Method Post -Headers $adminHeaders -Body $body -ContentType "application/json"
    $script:newResId = $res.data.id
    return ($res.success -eq $true -and $res.data.code -eq $resCode)
}

Test "Get all resources returns data" {
    $res = Invoke-RestMethod -Uri "$baseUrl/resources" -Method Get -Headers $adminHeaders
    return ($res.success -eq $true -and $res.data.Count -ge 1)
}

Test "Create resource with duplicate code returns error" {
    try {
        $body = @{ name = "Dup"; code = $resCode; description = "Dup"; status = "AVAILABLE"; departmentId = $newDeptId } | ConvertTo-Json
        Invoke-RestMethod -Uri "$baseUrl/resources" -Method Post -Headers $adminHeaders -Body $body -ContentType "application/json"
        return $false
    } catch { return $true }
}

# ============================================================
# 5. CRUD TESTS - TRANSACTIONS + STATUS LIFECYCLE
# ============================================================
Write-Host "`n--- 5. Transaction CRUD & Status Lifecycle ---" -ForegroundColor Yellow

# Get the user we registered earlier
$usersRes = Invoke-RestMethod -Uri "$baseUrl/users" -Method Get -Headers $adminHeaders
$testUserId = ($usersRes.data | Where-Object { $_.email -eq $uniqueEmail }).id

$newTxnId = $null
Test "Create transaction succeeds" {
    $body = @{ userId = $testUserId; resourceId = $newResId } | ConvertTo-Json
    $res = Invoke-RestMethod -Uri "$baseUrl/transactions" -Method Post -Headers $adminHeaders -Body $body -ContentType "application/json"
    $script:newTxnId = $res.data.id
    return ($res.success -eq $true -and $res.data.status -eq "PENDING")
}

Test "Get all transactions returns data" {
    $res = Invoke-RestMethod -Uri "$baseUrl/transactions" -Method Get -Headers $adminHeaders
    return ($res.success -eq $true -and $res.data.Count -ge 1)
}

Test "Update transaction PENDING -> ACTIVE succeeds" {
    $res = Invoke-RestMethod -Uri "$baseUrl/transactions/$newTxnId/status?status=ACTIVE" -Method Patch -Headers $adminHeaders -ContentType "application/json"
    return ($res.success -eq $true -and $res.data.status -eq "ACTIVE")
}

Test "Update transaction ACTIVE -> COMPLETED succeeds" {
    $res = Invoke-RestMethod -Uri "$baseUrl/transactions/$newTxnId/status?status=COMPLETED" -Method Patch -Headers $adminHeaders -ContentType "application/json"
    return ($res.success -eq $true -and $res.data.status -eq "COMPLETED")
}

# ============================================================
# 6. DASHBOARD
# ============================================================
Write-Host "`n--- 6. Dashboard ---" -ForegroundColor Yellow

Test "Dashboard returns valid summary" {
    $res = Invoke-RestMethod -Uri "$baseUrl/dashboard" -Method Get -Headers $adminHeaders
    return ($res.success -eq $true -and $res.data.totalUsers -ge 2 -and $res.data.totalResources -ge 1)
}

Test "Dashboard transactionsByStatus contains all keys" {
    $res = Invoke-RestMethod -Uri "$baseUrl/dashboard" -Method Get -Headers $adminHeaders
    $status = $res.data.transactionsByStatus
    return ($null -ne $status.PENDING -or $status.PENDING -eq 0) -and ($null -ne $status.ACTIVE -or $status.ACTIVE -eq 0) -and ($null -ne $status.COMPLETED -or $status.COMPLETED -eq 0) -and ($null -ne $status.CANCELLED -or $status.CANCELLED -eq 0)
}

# ============================================================
# 7. SWAGGER / OPENAPI
# ============================================================
Write-Host "`n--- 7. Swagger/OpenAPI ---" -ForegroundColor Yellow

Test "Swagger UI is accessible" {
    $res = Invoke-WebRequest -Uri "http://localhost:8080/swagger-ui.html" -UseBasicParsing
    return ($res.StatusCode -eq 200 -or $res.StatusCode -eq 302)
}

Test "OpenAPI JSON spec is accessible" {
    $res = Invoke-RestMethod -Uri "http://localhost:8080/v3/api-docs" -Method Get
    return ($null -ne $res.openapi -or $null -ne $res.info)
}

# ============================================================
# SUMMARY
# ============================================================
Write-Host "`n========================================" -ForegroundColor Cyan
Write-Host " TEST RESULTS: $passed/$total PASSED, $failed FAILED" -ForegroundColor $(if ($failed -eq 0) { "Green" } else { "Red" })
Write-Host "========================================`n" -ForegroundColor Cyan
