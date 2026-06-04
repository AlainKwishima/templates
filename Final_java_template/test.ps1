$ErrorActionPreference = "Stop"
$baseUrl = "http://localhost:8080/api/v1"

Write-Host "1. Login as Admin..."
$loginBody = @{ email = "admin@example.com"; password = "admin123" } | ConvertTo-Json
$loginResponse = Invoke-RestMethod -Uri "$baseUrl/auth/login" -Method Post -Body $loginBody -ContentType "application/json"
$token = $loginResponse.data.token
Write-Host "Admin Token received: $token`n"

$headers = @{ Authorization = "Bearer $token" }

Write-Host "2. Register a new User..."
$registerBody = @{ firstName = "Test"; lastName = "User"; email = "testuser1@example.com"; password = "password123"; roleName = "USER" } | ConvertTo-Json
$registerResponse = Invoke-RestMethod -Uri "$baseUrl/auth/register" -Method Post -Body $registerBody -ContentType "application/json"
Write-Host "Register Response: $($registerResponse.success)`n"

Write-Host "3. Create a Department..."
$deptBody = @{ name = "Science"; description = "Science Department" } | ConvertTo-Json
$deptResponse = Invoke-RestMethod -Uri "$baseUrl/departments" -Method Post -Headers $headers -Body $deptBody -ContentType "application/json"
$deptId = $deptResponse.data.id
Write-Host "Created Department ID: $deptId`n"

Write-Host "4. Create a Resource..."
$resBody = @{ name = "Physics Book"; code = "PHY-101"; description = "Intro to Physics"; status = "AVAILABLE"; departmentId = $deptId } | ConvertTo-Json
$resResponse = Invoke-RestMethod -Uri "$baseUrl/resources" -Method Post -Headers $headers -Body $resBody -ContentType "application/json"
$resId = $resResponse.data.id
Write-Host "Created Resource ID: $resId`n"

Write-Host "5. Create a Transaction..."
$transBody = @{ userId = $registerResponse.data.user.id; resourceId = $resId } | ConvertTo-Json
$transResponse = Invoke-RestMethod -Uri "$baseUrl/transactions" -Method Post -Headers $headers -Body $transBody -ContentType "application/json"
$transId = $transResponse.data.id
Write-Host "Created Transaction ID: $transId`n"

Write-Host "6. Update Transaction Status (Triggers Email)..."
$updateTransResponse = Invoke-RestMethod -Uri "$baseUrl/transactions/$transId/status?status=ACTIVE" -Method Patch -Headers $headers -ContentType "application/json"
Write-Host "Updated Transaction Status to: $($updateTransResponse.data.status)`n"

Write-Host "7. Get Dashboard Summary..."
$dashResponse = Invoke-RestMethod -Uri "$baseUrl/dashboard" -Method Get -Headers $headers
Write-Host "Dashboard Summary: $($dashResponse.data | ConvertTo-Json)`n"

Write-Host "All tests passed successfully!"
