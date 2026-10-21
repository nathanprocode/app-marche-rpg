# Convertit une image .webp (format des images générées par ChatGPT) en .png, lisible par scripts/ink-sprite.js.
#   powershell -File scripts/webp-to-png.ps1 <entrée.webp> <sortie.png>
param([string]$InputPath, [string]$OutputPath)
Add-Type -AssemblyName PresentationCore
$stream = [System.IO.File]::OpenRead((Resolve-Path $InputPath))
try {
  $decoder = [System.Windows.Media.Imaging.BitmapDecoder]::Create($stream, [System.Windows.Media.Imaging.BitmapCreateOptions]::None, [System.Windows.Media.Imaging.BitmapCacheOption]::OnLoad)
  $encoder = New-Object System.Windows.Media.Imaging.PngBitmapEncoder
  $encoder.Frames.Add($decoder.Frames[0])
  $out = [System.IO.File]::Create($OutputPath)
  try { $encoder.Save($out) } finally { $out.Close() }
} finally { $stream.Close() }
