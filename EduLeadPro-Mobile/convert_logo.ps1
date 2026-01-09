Add-Type -AssemblyName System.Drawing
$sourcePath = 'C:\Users\EAGLEYE\.gemini\antigravity\brain\13af405f-211e-4c11-bb44-527e10b6171a\edu_connect_grad_logo_1767909688794.png'
$destDir = 'e:\WorkSpaceEduLeadPro\EduLeadPro\EduLeadPro-Mobile\assets'

$sourceImg = [System.Drawing.Image]::FromFile($sourcePath)
$newBitmap = New-Object System.Drawing.Bitmap($sourceImg.Width, $sourceImg.Height)
$graphics = [System.Drawing.Graphics]::FromImage($newBitmap)
$graphics.DrawImage($sourceImg, 0, 0, $sourceImg.Width, $sourceImg.Height)

$newBitmap.Save("$destDir\logo.png", [System.Drawing.Imaging.ImageFormat]::Png)
$newBitmap.Save("$destDir\icon.png", [System.Drawing.Imaging.ImageFormat]::Png)
$newBitmap.Save("$destDir\adaptive-icon.png", [System.Drawing.Imaging.ImageFormat]::Png)
$newBitmap.Save("$destDir\splash-icon.png", [System.Drawing.Imaging.ImageFormat]::Png)

$graphics.Dispose()
$newBitmap.Dispose()
$sourceImg.Dispose()
Write-Host "✅ Asset conversion complete."
