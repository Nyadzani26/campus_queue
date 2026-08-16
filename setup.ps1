# ═══════════════════════════════════════════════════════════════════════════════
# SPU SmartQueue — One-Command Local Setup Script
# Run this from the project root:  .\setup.ps1
# ═══════════════════════════════════════════════════════════════════════════════
#
# NOTE: Due to the long path of this project folder, the virtual environment
# is placed at C:\spu_venv to avoid Windows 260-character path limit issues.
# If you need a different location, change $VenvPath below.

$VenvPath = "C:\spu_venv"
$PythonExe = "$VenvPath\Scripts\python.exe"
$PipExe    = "$VenvPath\Scripts\pip.exe"

Write-Host ""
Write-Host "  SPU SmartQueue — Local Setup" -ForegroundColor Cyan
Write-Host "  =============================" -ForegroundColor Cyan
Write-Host ""

# ─── Step 1: Create virtual environment ──────────────────────────────────────
if (-Not (Test-Path $VenvPath)) {
    Write-Host "  [1/5] Creating virtual environment at $VenvPath ..." -ForegroundColor Yellow
    python -m venv $VenvPath
    if ($LASTEXITCODE -ne 0) { Write-Host "  ERROR: Failed to create venv." -ForegroundColor Red; exit 1 }
} else {
    Write-Host "  [1/5] Virtual environment already exists at $VenvPath" -ForegroundColor Green
}

# ─── Step 2: Install dependencies ────────────────────────────────────────────
Write-Host "  [2/5] Installing dependencies ..." -ForegroundColor Yellow
& $PipExe install -r requirements.txt --quiet
if ($LASTEXITCODE -ne 0) { Write-Host "  ERROR: pip install failed." -ForegroundColor Red; exit 1 }
Write-Host "  [2/5] Dependencies installed." -ForegroundColor Green

# ─── Step 3: Check .env ───────────────────────────────────────────────────────
if (-Not (Test-Path ".env")) {
    Write-Host ""
    Write-Host "  [3/5] No .env file found. Creating one with a generated secret key..." -ForegroundColor Yellow
    $secretKey = & $PythonExe -c "from django.core.management.utils import get_random_secret_key; print(get_random_secret_key())"
    @"
# SPU SmartQueue - Local Development Environment
# Do NOT commit this file.
DJANGO_SECRET_KEY=$secretKey
DEBUG=True
ALLOWED_HOSTS=localhost,127.0.0.1
"@ | Set-Content -Path ".env" -Encoding UTF8
    Write-Host "  [3/5] .env created." -ForegroundColor Green
} else {
    Write-Host "  [3/5] .env already exists." -ForegroundColor Green
}

# ─── Step 4: Run migrations ───────────────────────────────────────────────────
Write-Host "  [4/5] Running database migrations ..." -ForegroundColor Yellow
& $PythonExe manage.py migrate
if ($LASTEXITCODE -ne 0) { Write-Host "  ERROR: migrate failed." -ForegroundColor Red; exit 1 }
Write-Host "  [4/5] Migrations applied." -ForegroundColor Green

# ─── Step 5: Seed departments ─────────────────────────────────────────────────
Write-Host "  [5/5] Setting up departments ..." -ForegroundColor Yellow
& $PythonExe manage.py init_db
Write-Host "  [5/5] Departments ready." -ForegroundColor Green

# ─── Done ────────────────────────────────────────────────────────────────────
Write-Host ""
Write-Host "  Setup complete!" -ForegroundColor Green
Write-Host ""
Write-Host "  Next steps:" -ForegroundColor Cyan
Write-Host "    1. Create your admin account:"
Write-Host "       $PythonExe manage.py createsuperuser" -ForegroundColor White
Write-Host ""
Write-Host "    2. Start the development server:"
Write-Host "       $PythonExe manage.py runserver" -ForegroundColor White
Write-Host ""
Write-Host "    3. Open your browser:"
Write-Host "       http://localhost:8000" -ForegroundColor White
Write-Host ""
