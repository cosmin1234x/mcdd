# Hayle Waste Counter Android Kit V3

This is the Android wrapper for `https://haylewaster.vercel.app`.

V3 adds a native `AndroidPdf` bridge so **Download Paper** opens Android's real **Save File** dialog instead of relying on `blob:` downloads inside WebView. It also restores the native launch marker (`?native=1`) and keeps the cold-launch cache-busting URL.

## Build

Open PowerShell in `android-app` and run:

```powershell
powershell -ExecutionPolicy Bypass -File .\build-apk.ps1
```

The script prefers Temurin Java 21, creates/syncs the Capacitor Android project, sets Android `versionCode 4`, applies the Hayle icon when available, builds the debug APK, and writes:

`android-app\dist\Hayle-Waste-Counter.apk`

Build updates on the same Windows user/profile so the existing Android debug signing key is retained and the APK can update the currently installed app.

Normal website-only changes still do not require rebuilding the APK. Native Android changes do.