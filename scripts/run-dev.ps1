Param(
    [switch]$StartDocker,
    [switch]$SkipInstalls,
    [switch]$SkipDesktop
)

$ErrorActionPreference = 'Stop'

$repoRoot = (Resolve-Path (Join-Path $PSScriptRoot '..')).Path
$apiDir = Join-Path $repoRoot 'services\api'
$gatewayDir = Join-Path $repoRoot 'services\gateway'
$overlayDir = Join-Path $repoRoot 'apps\overlay'
$desktopDir = Join-Path $repoRoot 'apps\desktop'
$venvPath = Join-Path $apiDir '.venv'
$venvScripts = Join-Path $venvPath 'Scripts'
$pythonExe = Join-Path $venvScripts 'python.exe'
$pipExe = Join-Path $venvScripts 'pip.exe'
$alembicExe = Join-Path $venvScripts 'alembic.exe'

function Ensure-Command {
    param(
        [Parameter(Mandatory)][string]$Name,
        [string]$InstallHint = ''
    )

    if (-not (Get-Command $Name -ErrorAction SilentlyContinue)) {
        if ($InstallHint) {
            throw "Command '$Name' not found. $InstallHint"
        }
        throw "Command '$Name' not found on PATH."
    }
}

function Read-DotEnv {
    param(
        [Parameter(Mandatory)][string]$Path
    )

    $result = @{}
    if (-not (Test-Path $Path)) {
        return $result
    }

    foreach ($line in Get-Content $Path) {
        $trimmed = $line.Trim()
        if (-not $trimmed -or $trimmed.StartsWith('#')) {
            continue
        }

        $pair = $trimmed.Split('=', 2)
        if ($pair.Count -eq 2) {
            $key = $pair[0].Trim()
            $value = $pair[1].Trim()
            $result[$key] = $value
        }
    }

    return $result
}

function Ensure-DockerDependencies {
    param(
        [switch]$StartCompose
    )

    $dockerCmd = Get-Command docker -ErrorAction SilentlyContinue
    if (-not $dockerCmd) {
        Write-Warning 'Docker CLI not found. Skipping container checks.'
        return
    }

    if ($StartCompose) {
        Write-Host 'Starting PostgreSQL and Redis via docker compose...'
        & docker compose -f (Join-Path $repoRoot 'docker-compose.yaml') up -d db redis | Out-Null
        return
    }

    $containers = @(& docker ps --format '{{.Names}}')
    $hasDb = $containers -match 'la-postgres|live-assistant-db'
    $hasRedis = $containers -match 'la-redis|live-assistant-redis'

    if (-not $hasDb) {
        Write-Warning 'PostgreSQL container is not running. Start it manually atau jalankan ulang dengan -StartDocker.'
    }
    if (-not $hasRedis) {
        Write-Warning 'Redis container is not running. Start it manually atau jalankan ulang dengan -StartDocker.'
    }
}

function Start-DevProcess {
    param(
        [Parameter(Mandatory)][string]$Name,
        [Parameter(Mandatory)][string]$WorkingDirectory,
        [Parameter(Mandatory)][string]$Command,
        [hashtable]$EnvVars
    )

    $scriptLines = @()
    $escapedDir = $WorkingDirectory.Replace("'", "''")
    $scriptLines += "Set-Location '$escapedDir'"

    if ($EnvVars) {
        foreach ($key in $EnvVars.Keys) {
            $raw = [string]$EnvVars[$key]
            $escaped = $raw.Replace("'", "''")
            $scriptLines += ('$env:{0} = ''{1}''' -f $key, $escaped)
        }
    }

    $scriptLines += $Command
    $joined = $scriptLines -join '; '

    Start-Process -FilePath 'powershell.exe' -ArgumentList '-NoExit', '-Command', $joined | Out-Null
    Write-Host "[ok] $Name is running in a new PowerShell window." -ForegroundColor Green
}

Write-Host '=== Live Assistant :: Dev Environment Bootstrap ===' -ForegroundColor Cyan

Ensure-Command -Name 'python' -InstallHint 'Install Python 3.11+ dari https://www.python.org/downloads/'
Ensure-Command -Name 'npm' -InstallHint 'Install Node.js 20 LTS dari https://nodejs.org/en/'
Ensure-DockerDependencies -StartCompose:$StartDocker

if (-not $SkipInstalls) {
    if (-not (Test-Path $venvPath)) {
        Write-Host 'Creating Python virtual environment (.venv)...'
        python -m venv $venvPath | Out-Null
    }

    Write-Host 'Installing FastAPI backend dependencies...'
    & $pythonExe -m pip install --upgrade pip | Out-Null
    & $pipExe install -r (Join-Path $apiDir 'requirements.txt') | Out-Null

    Write-Host 'Installing Gateway dependencies...'
    Push-Location $gatewayDir
    npm install | Out-Null
    Pop-Location

    Write-Host 'Installing Overlay dependencies...'
    Push-Location $overlayDir
    npm install | Out-Null
    Pop-Location

    if (-not $SkipDesktop) {
        Write-Host 'Installing Desktop app dependencies...'
        Push-Location $desktopDir
        npm install | Out-Null
        Pop-Location
    }
}

Write-Host 'Running database migrations (alembic upgrade head)...'
Push-Location $apiDir
& $alembicExe upgrade head
Pop-Location

$apiEnv = Read-DotEnv (Join-Path $apiDir '.env')
if (-not $apiEnv.ContainsKey('DATABASE_URL')) {
    $apiEnv['DATABASE_URL'] = 'postgresql+asyncpg://postgres:postgres@localhost:5432/live_assistant'
}
if (-not $apiEnv.ContainsKey('REDIS_URL')) {
    $apiEnv['REDIS_URL'] = 'redis://localhost:6379/0'
}

Start-DevProcess -Name 'FastAPI API' -WorkingDirectory $apiDir -Command '& .\.venv\Scripts\Activate.ps1; uvicorn app.main:app --reload --host 0.0.0.0 --port 8000' -EnvVars $apiEnv

$gatewayEnv = @{
    'PORT' = '3000'
    'REDIS_URL' = $apiEnv['REDIS_URL']
    'API_URL' = 'http://localhost:8000'
}
Start-DevProcess -Name 'Gateway' -WorkingDirectory $gatewayDir -Command 'npm run dev' -EnvVars $gatewayEnv

$overlayEnv = @{
    'PORT' = '5174'
}
Start-DevProcess -Name 'Overlay' -WorkingDirectory $overlayDir -Command 'npm run dev -- --host 0.0.0.0 --port 5174' -EnvVars $overlayEnv

if (-not $SkipDesktop) {
    Start-DevProcess -Name 'Desktop App' -WorkingDirectory $desktopDir -Command 'npm run dev' -EnvVars @{}
}

Write-Host 'All services started. Gunakan Ctrl+C di setiap jendela untuk stop.' -ForegroundColor Cyan
