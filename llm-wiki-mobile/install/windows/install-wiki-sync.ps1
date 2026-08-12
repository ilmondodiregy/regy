# Registra il sync del wiki come attivita' pianificata su Windows.
#
#   powershell -ExecutionPolicy Bypass -File install-wiki-sync.ps1 -WikiDir C:\Users\tu\wiki
#
# Richiede Git for Windows (che porta con se' bash) e Python 3.

param(
  [Parameter(Mandatory = $true)][string]$WikiDir,
  [int]$IntervalMinutes = 5,
  [string]$TaskName = "WikiSync"
)

$ErrorActionPreference = "Stop"

if (-not (Test-Path (Join-Path $WikiDir ".git"))) {
  throw "$WikiDir non e' un repository git"
}

$bash = "$env:ProgramFiles\Git\bin\bash.exe"
if (-not (Test-Path $bash)) {
  throw "bash.exe non trovato. Installa Git for Windows: https://git-scm.com/download/win"
}

$script = (Join-Path $WikiDir "bin/wiki-sync.sh") -replace '\\', '/'

$action = New-ScheduledTaskAction -Execute $bash -Argument "-lc `"WIKI_DIR='$($WikiDir -replace '\\','/')' '$script'`""

# Due trigger: uno periodico e uno al logon. Quello al logon serve a coprire
# il caso centrale di questa architettura — il PC e' stato spento mentre dal
# telefono si continuava a scrivere, e alla riaccensione il wiki locale e'
# indietro.
$repeat = New-ScheduledTaskTrigger -Once -At (Get-Date) `
  -RepetitionInterval (New-TimeSpan -Minutes $IntervalMinutes)
$logon = New-ScheduledTaskTrigger -AtLogOn

$settings = New-ScheduledTaskSettingsSet `
  -AllowStartIfOnBatteries `
  -DontStopIfGoingOnBatteries `
  -StartWhenAvailable `
  -ExecutionTimeLimit (New-TimeSpan -Minutes 10) `
  -MultipleInstances IgnoreNew

Register-ScheduledTask -TaskName $TaskName -Action $action `
  -Trigger @($repeat, $logon) -Settings $settings -Force | Out-Null

Write-Host "Attivita' '$TaskName' registrata (ogni $IntervalMinutes minuti e al logon)."
Write-Host "Log: $WikiDir\.git\wiki-sync.log"
Write-Host "Prova subito con: Start-ScheduledTask -TaskName $TaskName"
