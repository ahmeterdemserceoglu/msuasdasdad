# List API Routes Script for MSU Mülakat

$ApiPath = Join-Path $PSScriptRoot "..\app\api"

Write-Host "`n📋 API Routes in MSU Mülakat Project" -ForegroundColor Cyan
Write-Host "=====================================" -ForegroundColor Cyan

# Function to scan routes recursively
function Get-ApiRoutes {
    param($Path, $Prefix = "")
    
    $items = Get-ChildItem -Path $Path -Directory
    
    foreach ($item in $items) {
        $routeFile = Join-Path $item.FullName "route.ts"
        $currentRoute = if ($Prefix) { "$Prefix/$($item.Name)" } else { $item.Name }
        
        if (Test-Path $routeFile) {
            Write-Host "`n🔸 /$currentRoute" -ForegroundColor Yellow
            
            # Read the route file to find exported methods
            $content = Get-Content $routeFile -Raw
            $methods = @()
            
            if ($content -match "export\s+async\s+function\s+GET") { $methods += "GET" }
            if ($content -match "export\s+async\s+function\s+POST") { $methods += "POST" }
            if ($content -match "export\s+async\s+function\s+PUT") { $methods += "PUT" }
            if ($content -match "export\s+async\s+function\s+DELETE") { $methods += "DELETE" }
            if ($content -match "export\s+async\s+function\s+PATCH") { $methods += "PATCH" }
            
            Write-Host "   Methods: $($methods -join ', ')" -ForegroundColor Green
            Write-Host "   File: $routeFile" -ForegroundColor DarkGray
            
            # Check for auth
            if ($content -match "verifyAuth|getAuth|auth") {
                Write-Host "   🔐 Auth: Required" -ForegroundColor Magenta
            }
            
            # Check for validation
            if ($content -match "z\.object|zod|validation") {
                Write-Host "   ✔️  Validation: Enabled" -ForegroundColor Blue
            }
        }
        
        # Check for subdirectories
        Get-ApiRoutes -Path $item.FullName -Prefix $currentRoute
    }
}

# Start scanning
Get-ApiRoutes -Path $ApiPath

Write-Host "`n=====================================`n" -ForegroundColor Cyan
