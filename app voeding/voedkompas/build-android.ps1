param([string]$ToolRoot = (Join-Path $PSScriptRoot '..\.android-tools'))
$ErrorActionPreference = 'Stop'
$projectRoot = $PSScriptRoot
$javaRoot = (Get-ChildItem -LiteralPath (Join-Path $ToolRoot 'jdk') -Directory | Select-Object -First 1).FullName
$androidBuildTools = Join-Path $ToolRoot 'buildtools\android-15'
$androidJar = Join-Path $ToolRoot 'platform\android-35\android.jar'
$buildDir = Join-Path $projectRoot 'build\android'
$javaBin = Join-Path $javaRoot 'bin'
$signingDir = Join-Path $projectRoot '.signing'
New-Item -ItemType Directory -Force -Path $buildDir,(Join-Path $buildDir 'gen'),(Join-Path $buildDir 'classes'),(Join-Path $buildDir 'dex'),$signingDir,(Join-Path $projectRoot 'downloads'),(Join-Path $projectRoot 'android\res\drawable') | Out-Null
Copy-Item -LiteralPath (Join-Path $projectRoot 'dist\icon-192.png') -Destination (Join-Path $projectRoot 'android\res\drawable\icon.png')
function Assert-Command { if($LASTEXITCODE -ne 0){throw "Build step failed: $LASTEXITCODE"} }
& (Join-Path $androidBuildTools 'aapt.exe') package -f -M (Join-Path $projectRoot 'android\AndroidManifest.xml') -S (Join-Path $projectRoot 'android\res') -A (Join-Path $projectRoot 'dist') -I $androidJar -J (Join-Path $buildDir 'gen') -F (Join-Path $buildDir 'unsigned.apk')
Assert-Command
$javaSources = @(Get-ChildItem -LiteralPath (Join-Path $projectRoot 'android\src'),(Join-Path $buildDir 'gen') -Recurse -Filter '*.java' | Select-Object -ExpandProperty FullName)
& (Join-Path $javaBin 'javac.exe') -encoding UTF-8 --release 8 -classpath $androidJar -d (Join-Path $buildDir 'classes') @javaSources
Assert-Command
$classFiles = @(Get-ChildItem -LiteralPath (Join-Path $buildDir 'classes') -Recurse -Filter '*.class' | Select-Object -ExpandProperty FullName)
& (Join-Path $javaBin 'java.exe') -cp (Join-Path $androidBuildTools 'lib\d8.jar') com.android.tools.r8.D8 --lib $androidJar --min-api 26 --output (Join-Path $buildDir 'dex') @classFiles
Assert-Command
Push-Location (Join-Path $buildDir 'dex')
try { & (Join-Path $androidBuildTools 'aapt.exe') add (Join-Path $buildDir 'unsigned.apk') classes.dex; Assert-Command } finally { Pop-Location }
& (Join-Path $androidBuildTools 'zipalign.exe') -f -p 4 (Join-Path $buildDir 'unsigned.apk') (Join-Path $buildDir 'aligned.apk')
Assert-Command
$keyPath = Join-Path $signingDir 'voedkompas.keystore'
# Keep the personal signing key for updates. Never include it in a source ZIP.
if(!(Test-Path -LiteralPath $keyPath)) {
 & (Join-Path $javaBin 'keytool.exe') -genkeypair -keystore $keyPath -storepass 'voedkompas-personal-build' -keypass 'voedkompas-personal-build' -alias voedkompas -keyalg RSA -keysize 3072 -validity 10000 -dname 'CN=VoedKompas Personal App' -noprompt
 Assert-Command
}
$outputApk = Join-Path $projectRoot 'downloads\VoedKompas-1.0.apk'
& (Join-Path $javaBin 'java.exe') -jar (Join-Path $androidBuildTools 'lib\apksigner.jar') sign --ks $keyPath --ks-key-alias voedkompas --ks-pass 'pass:voedkompas-personal-build' --key-pass 'pass:voedkompas-personal-build' --out $outputApk (Join-Path $buildDir 'aligned.apk')
Assert-Command
& (Join-Path $javaBin 'java.exe') -jar (Join-Path $androidBuildTools 'lib\apksigner.jar') verify --verbose $outputApk
Assert-Command
& (Join-Path $androidBuildTools 'aapt.exe') dump badging $outputApk
Assert-Command
Get-FileHash -Algorithm SHA256 -LiteralPath $outputApk | Format-List
