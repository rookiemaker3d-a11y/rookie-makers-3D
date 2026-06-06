# Genera HTML autocontenido con imagenes embebidas (base64)
$dir = Split-Path -Parent $MyInvocation.MyCommand.Path
$htmlPath = Join-Path $dir "index.html"
$outPath = Join-Path $dir "Presentacion-de-Ventas-Rookie-Makers-3D.html"

if (-not (Test-Path $htmlPath)) {
    Write-Error "No se encontro index.html en $dir"
    exit 1
}

$html = [System.IO.File]::ReadAllText($htmlPath, [System.Text.Encoding]::UTF8)

# Corregir typo si existe
$html = $html.Replace('</motion>', '</div>')

# Lightbox: usar src embebido de la imagen del thumb
$html = [regex]::Replace(
    $html,
    'onclick="openLightbox\(''([^'']+)'',\s*''',
    'onclick="openLightbox(this.querySelector(''img'').src, '''
)

$pngFiles = Get-ChildItem -Path $dir -Filter "*.png" | Sort-Object Name
$count = 0
foreach ($file in $pngFiles) {
    $name = $file.Name
    $bytes = [System.IO.File]::ReadAllBytes($file.FullName)
    $b64 = [Convert]::ToBase64String($bytes)
    $dataUri = "data:image/png;base64,$b64"
    $escaped = [regex]::Escape($name)
    $before = $html.Length
    $html = [regex]::Replace($html, "src=""$escaped""", "src=""$dataUri""")
    if ($html.Length -ne $before) { $count++ }
    Write-Host ("  + {0} ({1:N0} KB)" -f $name, ($bytes.Length / 1KB))
}

[System.IO.File]::WriteAllText($outPath, $html, [System.Text.UTF8Encoding]::new($false))
$sizeMb = (Get-Item $outPath).Length / 1MB
Write-Host ""
Write-Host "Listo: $outPath"
Write-Host ("  Imagenes embebidas: {0}/{1}" -f $count, $pngFiles.Count)
Write-Host ("  Tamano: {0:N2} MB" -f $sizeMb)
Write-Host ""
Write-Host "Envia SOLO este archivo .html — las imagenes van dentro."
