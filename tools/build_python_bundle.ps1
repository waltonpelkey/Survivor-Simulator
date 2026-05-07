param(
    [string]$OutputPath = "web/generated/python_sources.generated.js"
)

$ErrorActionPreference = "Stop"

$projectRoot = Split-Path -Parent $PSScriptRoot
$bundle = New-Object "System.Collections.Generic.SortedDictionary[string,string]"

$sourcePaths = @("SurvivorSimulator.py") + @(
    Get-ChildItem -Path (Join-Path $projectRoot "survivor_sim") -Filter "*.py" -Recurse |
        Sort-Object FullName |
        ForEach-Object {
            $relative = Resolve-Path -LiteralPath $_.FullName -Relative
            $relative.TrimStart(".\").Replace("\", "/")
        }
)

foreach ($relativePath in $sourcePaths) {
    $fullPath = Join-Path $projectRoot $relativePath
    $bundle[$relativePath.Replace("\", "/")] = [string](Get-Content -LiteralPath $fullPath -Raw)
}

$json = ConvertTo-Json -InputObject $bundle -Depth 4 -Compress
$outputFullPath = Join-Path $projectRoot $OutputPath
$outputDir = Split-Path -Parent $outputFullPath
New-Item -ItemType Directory -Force -Path $outputDir | Out-Null
Set-Content -LiteralPath $outputFullPath -Value "window.SURVIVOR_PYTHON_SOURCES = $json;" -Encoding UTF8
