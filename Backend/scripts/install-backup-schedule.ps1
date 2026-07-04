# Har kuni 00:00 da PostgreSQL backup (API dan mustaqil).
# Administrator sifatida ishga tushiring.

$ErrorActionPreference = "Stop"
$ProjectRoot = Split-Path -Parent $PSScriptRoot
$TaskName = "TTSA-Backend-DB-Backup"
$BinPath = Join-Path $ProjectRoot "bin\backup-db.exe"

Set-Location $ProjectRoot
Write-Host "backup-db binary yigilmoqda..."
go build -o $BinPath ./cmd/backup-db
if (-not (Test-Path $BinPath)) {
    throw "backup-db.exe yaratilmadi"
}

$Existing = Get-ScheduledTask -TaskName $TaskName -ErrorAction SilentlyContinue
if ($Existing) {
    Unregister-ScheduledTask -TaskName $TaskName -Confirm:$false
    Write-Host "Eski vazifa ochirildi: $TaskName"
}

$Action = New-ScheduledTaskAction `
    -Execute $BinPath `
    -WorkingDirectory $ProjectRoot

$Trigger = New-ScheduledTaskTrigger -Daily -At "00:00"

$Settings = New-ScheduledTaskSettingsSet `
    -AllowStartIfOnBatteries `
    -DontStopIfGoingOnBatteries `
    -StartWhenAvailable `
    -ExecutionTimeLimit (New-TimeSpan -Hours 3)

Register-ScheduledTask `
    -TaskName $TaskName `
    -Action $Action `
    -Trigger $Trigger `
    -Settings $Settings `
    -Description "TTSA Backend PostgreSQL kunlik backup 00:00 API ga tasir qilmaydi" `
    -RunLevel Highest | Out-Null

Write-Host "Reja ornating: $TaskName - har kuni 00:00"
Write-Host "Backup papkasi: $ProjectRoot\backups"
Write-Host "Sinov uchun: go run ./cmd/backup-db"
