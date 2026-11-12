# ─────────────────────────────────────────────────────────────
#  REGEN × PRASA — Supabase backend setup script
#
#  Prerequisites:
#    1. Supabase CLI installed:  npm install -g supabase
#    2. Logged in:               supabase login
#    3. A Supabase project created in your dashboard
#
#  Usage:
#    .\scripts\setup-backend.ps1
#
#  This script will:
#    - Link your Supabase project to this workspace
#    - Push the SQL migrations (schema, RLS, seed data)
#    - Generate TypeScript types
#    - Print the project URL and keys for your .env.local
# ─────────────────────────────────────────────────────────────

param(
  [string]$ProjectRef = ""
)

$ErrorActionPreference = "Stop"
Set-Location $PSScriptRoot/..

Write-Host "`n=== REGEN × PRASA — Supabase Backend Setup ===" -ForegroundColor Cyan

# ── Step 1: Check login ──
Write-Host "`n[1/5] Checking Supabase CLI login..." -ForegroundColor Yellow
$projects = supabase projects list 2>&1
if ($LASTEXITCODE -ne 0) {
  Write-Host "  Not logged in. Opening browser..." -ForegroundColor Red
  supabase login
  $projects = supabase projects list 2>&1
  if ($LASTEXITCODE -ne 0) {
    Write-Host "  Login failed. Please run 'supabase login' manually and retry." -ForegroundColor Red
    exit 1
  }
}
Write-Host "  Logged in successfully." -ForegroundColor Green

# ── Step 2: Select project ──
Write-Host "`n[2/5] Selecting Supabase project..." -ForegroundColor Yellow

if ($ProjectRef -ne "") {
  supabase link --project-ref $ProjectRef 2>&1 | Out-Null
  Write-Host "  Linked to project: $ProjectRef" -ForegroundColor Green
} else {
  # List available projects
  $projectLines = $projects -split "`n" | Where-Object { $_ -match "regen|REGEN" -or $_ -match "^\s+\S+\s+\S+" }
  Write-Host "  Available projects:" -ForegroundColor White
  $projects -split "`n" | ForEach-Object { if ($_.Trim() -and $_ -notmatch "Name|---|Linked") { Write-Host "    $_" -ForegroundColor White } }

  $ProjectRef = Read-Host "`n  Enter the project reference ID (from the list above)"
  if (-not $ProjectRef) {
    Write-Host "  No project reference provided. Exiting." -ForegroundColor Red
    exit 1
  }
  supabase link --project-ref $ProjectRef 2>&1 | Out-Null
  Write-Host "  Linked to project: $ProjectRef" -ForegroundColor Green
}

# ── Step 3: Push migrations ──
Write-Host "`n[3/5] Pushing SQL migrations to Supabase..." -ForegroundColor Yellow
Write-Host "  - 0001_schema.sql (18 tables, indexes, triggers)" -ForegroundColor White
Write-Host "  - 0002_rls.sql    (row-level security, employee directory view)" -ForegroundColor White
Write-Host "  - 0003_seed.sql   (267 demonstration rows)" -ForegroundColor White

supabase db push --yes 2>&1
if ($LASTEXITCODE -ne 0) {
  Write-Host "  Migration push failed. Check the error above." -ForegroundColor Red
  exit 1
}
Write-Host "  Migrations applied successfully." -ForegroundColor Green

# ── Step 4: Generate TypeScript types ──
Write-Host "`n[4/5] Generating TypeScript types..." -ForegroundColor Yellow
supabase gen types --linked > src/lib/database.types.ts 2>&1
if ($LASTEXITCODE -eq 0) {
  Write-Host "  Types written to src/lib/database.types.ts" -ForegroundColor Green
} else {
  Write-Host "  Type generation skipped (non-critical)." -ForegroundColor Yellow
}

# ── Step 5: Print .env.local instructions ──
Write-Host "`n[5/5] Environment configuration" -ForegroundColor Yellow
Write-Host "`n  Add these values to your .env.local file:" -ForegroundColor White
Write-Host "  (Find them in: Supabase Dashboard → Project Settings → API)" -ForegroundColor Gray
Write-Host ""
Write-Host "  NEXT_PUBLIC_SUPABASE_URL=https://$ProjectRef.supabase.co" -ForegroundColor Cyan
Write-Host "  NEXT_PUBLIC_SUPABASE_ANON_KEY=<your anon/publishable key>" -ForegroundColor Cyan
Write-Host "  SUPABASE_SERVICE_ROLE_KEY=<your service role key>" -ForegroundColor Cyan
Write-Host "  AUTH_SECRET=$(node -e `"console.log(require('crypto').randomBytes(48).toString('hex'))`")" -ForegroundColor Cyan
Write-Host ""
Write-Host "  Then restart your dev server:  npm run dev" -ForegroundColor White
Write-Host "`n=== Setup complete ===" -ForegroundColor Green
