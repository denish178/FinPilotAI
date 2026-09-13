Set-Location (Join-Path $PSScriptRoot "..")
docker compose config --quiet
if ($LASTEXITCODE -ne 0) { exit $LASTEXITCODE }
Write-Host "Starting FinPilot stack (http://localhost:8080) ..."
docker compose up --build -d
Write-Host "Done. API: http://localhost:5000 | App: http://localhost:8080"
