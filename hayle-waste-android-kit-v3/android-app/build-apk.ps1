$ErrorActionPreference = "Stop"

function Fail($message) {
  Write-Host ""
  Write-Host "ERROR: $message" -ForegroundColor Red
  Write-Host ""
  exit 1
}

function Write-Utf8NoBom([string]$Path, [string]$Text) {
  $fullPath = [System.IO.Path]::GetFullPath($Path)
  $encoding = New-Object System.Text.UTF8Encoding($false)
  [System.IO.File]::WriteAllText($fullPath, $Text, $encoding)
}

Write-Host ""
Write-Host "====================================================" -ForegroundColor Yellow
Write-Host "  Hayle Waste Counter - Android APK Builder V3" -ForegroundColor Yellow
Write-Host "====================================================" -ForegroundColor Yellow
Write-Host ""

Set-Location $PSScriptRoot

if (-not (Get-Command node -ErrorAction SilentlyContinue)) { Fail "Node.js is not installed." }
if (-not (Get-Command npm -ErrorAction SilentlyContinue)) { Fail "npm is not installed." }

$jdk21 = $null
$adoptiumRoot = Join-Path $env:ProgramFiles "Eclipse Adoptium"
if (Test-Path $adoptiumRoot) {
  $jdk21 = Get-ChildItem $adoptiumRoot -Directory -ErrorAction SilentlyContinue |
    Where-Object { $_.Name -like 'jdk-21*-hotspot' } |
    Sort-Object Name -Descending |
    Select-Object -First 1
}
if ($jdk21) {
  $env:JAVA_HOME = $jdk21.FullName
  $env:Path = "$($jdk21.FullName)\bin;$env:Path"
  Write-Host "Using Java 21: $($jdk21.FullName)" -ForegroundColor Green
} elseif (-not (Get-Command java -ErrorAction SilentlyContinue)) {
  Fail "Java 21 was not found. Install it with: winget install EclipseAdoptium.Temurin.21.JDK"
}

# java -version writes its normal version text to STDERR. Windows PowerShell can
# turn that into a terminating NativeCommandError when ErrorActionPreference is
# Stop, so run it through cmd.exe and merge STDERR there first.
$javaVersionText = (& cmd.exe /d /c "java -version 2>&1" | Out-String)
if ($LASTEXITCODE -ne 0) { Fail "Java could not be started." }
if ($javaVersionText -notmatch 'version "(?<major>\d+)') { Fail "Could not determine the Java version." }
$javaMajor = [int]$Matches['major']
if ($javaMajor -gt 24) {
  Fail "Java $javaMajor is active. Install Java 21 with: winget install EclipseAdoptium.Temurin.21.JDK"
}
Write-Host "Java version OK: $javaMajor" -ForegroundColor Green

if (-not $env:ANDROID_HOME) {
  if ($env:ANDROID_SDK_ROOT) {
    $env:ANDROID_HOME = $env:ANDROID_SDK_ROOT
  } elseif (Test-Path "$env:LOCALAPPDATA\Android\Sdk") {
    $env:ANDROID_HOME = "$env:LOCALAPPDATA\Android\Sdk"
  }
}
if (-not $env:ANDROID_HOME -or -not (Test-Path $env:ANDROID_HOME)) {
  Fail "Android SDK not found. Open Android Studio > More Actions > SDK Manager and install an Android SDK."
}
$env:ANDROID_SDK_ROOT = $env:ANDROID_HOME

Write-Host "[1/7] Installing Android build packages..." -ForegroundColor Cyan
npm install

Write-Host "[2/7] Creating Android project..." -ForegroundColor Cyan
if (-not (Test-Path ".\android")) { npx cap add android }

Write-Host "[3/7] Syncing app configuration..." -ForegroundColor Cyan
npx cap sync android

$sdkEscaped = $env:ANDROID_HOME.Replace('\','\\')
Set-Content -Encoding ASCII ".\android\local.properties" "sdk.dir=$sdkEscaped"

$gradlePath = ".\android\app\build.gradle"
if (Test-Path $gradlePath) {
  $gradleText = Get-Content $gradlePath -Raw
  $gradleText = $gradleText.TrimStart([char]0xFEFF)
  $gradleText = $gradleText -replace 'versionCode\s+\d+', 'versionCode 4'
  $gradleText = $gradleText -replace 'versionName\s+"[^"]+"', 'versionName "1.4"'
  Write-Utf8NoBom $gradlePath $gradleText
  Write-Host "Android versionCode set to 4 (upgrade-safe)." -ForegroundColor Green
}

$stringsPath = ".\android\app\src\main\res\values\strings.xml"
if (Test-Path $stringsPath) {
  $strings = Get-Content $stringsPath -Raw
  $strings = $strings.TrimStart([char]0xFEFF)
  $strings = $strings -replace '<string name="app_name">.*?</string>', '<string name="app_name">Hayle Waste Counter</string>'
  $strings = $strings -replace '<string name="title_activity_main">.*?</string>', '<string name="title_activity_main">Hayle Waste Counter</string>'
  Write-Utf8NoBom $stringsPath $strings
}

Write-Host "[4/7] Enabling automatic fresh launch + native PDF save..." -ForegroundColor Cyan
$mainActivity = ".\android\app\src\main\java\uk\co\hayle\wastecounter\MainActivity.java"
if (-not (Test-Path (Split-Path $mainActivity))) {
  New-Item -ItemType Directory -Force -Path (Split-Path $mainActivity) | Out-Null
}
$nativeTemplate = Join-Path $PSScriptRoot "native\MainActivity.java"
if (-not (Test-Path $nativeTemplate)) { Fail "native\MainActivity.java is missing." }
Copy-Item $nativeTemplate $mainActivity -Force

Write-Host "[5/7] Applying app icon..." -ForegroundColor Cyan
$iconSource = Join-Path $PSScriptRoot "resources\icon.png"
if (-not (Test-Path $iconSource)) {
  $repoIcon = Join-Path $PSScriptRoot "..\..\hayle-waste-counter-v14-syncfix\icons\icon-v11-512.png"
  if (Test-Path $repoIcon) { $iconSource = $repoIcon }
}
if (Test-Path $iconSource) {
  Add-Type -AssemblyName System.Drawing
  $source = [System.Drawing.Image]::FromFile($iconSource)
  $sizes = @{
    "mipmap-mdpi" = 48
    "mipmap-hdpi" = 72
    "mipmap-xhdpi" = 96
    "mipmap-xxhdpi" = 144
    "mipmap-xxxhdpi" = 192
  }
  foreach ($entry in $sizes.GetEnumerator()) {
    $folder = Join-Path $PSScriptRoot "android\app\src\main\res\$($entry.Key)"
    if (-not (Test-Path $folder)) { New-Item -ItemType Directory -Force -Path $folder | Out-Null }
    $bitmap = New-Object System.Drawing.Bitmap($entry.Value, $entry.Value)
    $graphics = [System.Drawing.Graphics]::FromImage($bitmap)
    $graphics.InterpolationMode = [System.Drawing.Drawing2D.InterpolationMode]::HighQualityBicubic
    $graphics.SmoothingMode = [System.Drawing.Drawing2D.SmoothingMode]::HighQuality
    $graphics.PixelOffsetMode = [System.Drawing.Drawing2D.PixelOffsetMode]::HighQuality
    $graphics.DrawImage($source, 0, 0, $entry.Value, $entry.Value)
    foreach ($fileName in @("ic_launcher.png", "ic_launcher_round.png", "ic_launcher_foreground.png")) {
      $bitmap.Save((Join-Path $folder $fileName), [System.Drawing.Imaging.ImageFormat]::Png)
    }
    $graphics.Dispose(); $bitmap.Dispose()
  }
  $source.Dispose()
}

Write-Host "[6/7] Building installable APK..." -ForegroundColor Cyan
Push-Location ".\android"
try {
  .\gradlew.bat --stop | Out-Null
  .\gradlew.bat assembleDebug
} finally {
  Pop-Location
}

$apk = Join-Path $PSScriptRoot "android\app\build\outputs\apk\debug\app-debug.apk"
if (-not (Test-Path $apk)) { Fail "Gradle finished but the APK was not found." }

Write-Host "[7/7] Staging APK..." -ForegroundColor Cyan
$outDir = Join-Path $PSScriptRoot "dist"
New-Item -ItemType Directory -Force -Path $outDir | Out-Null
$finalApk = Join-Path $outDir "Hayle-Waste-Counter.apk"
Copy-Item $apk $finalApk -Force

$downloadSiteRoot = Join-Path $PSScriptRoot "..\download-site"
$downloadSite = Join-Path $downloadSiteRoot "downloads"
if (Test-Path $downloadSiteRoot) {
  New-Item -ItemType Directory -Force -Path $downloadSite | Out-Null
  Copy-Item $finalApk (Join-Path $downloadSite "Hayle-Waste-Counter.apk") -Force
}

Write-Host ""
Write-Host "SUCCESS!" -ForegroundColor Green
Write-Host "APK: $finalApk" -ForegroundColor Green
Write-Host ""
