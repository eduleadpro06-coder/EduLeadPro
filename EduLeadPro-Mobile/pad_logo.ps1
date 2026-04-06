Add-Type -AssemblyName System.Drawing
$src = [System.Drawing.Image]::FromFile('e:\WorkSpaceEduLeadPro\EduLeadPro\EduLeadPro-Mobile\assets\logo.png')
$targetSize = 1536
$canvas = New-Object System.Drawing.Bitmap($targetSize, $targetSize)
$g = [System.Drawing.Graphics]::FromImage($canvas)
$g.Clear([System.Drawing.Color]::Transparent)
$padding = ($targetSize - $src.Width) / 2
$g.DrawImage($src, $padding, $padding, $src.Width, $src.Height)
$canvas.Save('e:\WorkSpaceEduLeadPro\EduLeadPro\EduLeadPro-Mobile\assets\splash.png', [System.Drawing.Imaging.ImageFormat]::Png)
$g.Dispose()
$canvas.Dispose()
$src.Dispose()
Write-Host 'Created splash.png with padding'
