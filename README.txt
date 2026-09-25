HAYLE WASTE COUNTER V8 — INSTALLABLE PWA
=========================================

WHAT CHANGED
- Installable as an app on Android, iPhone/iPad, Windows and supported browsers.
- Works offline after the first successful load.
- Keeps RAW/FULL counts, saved sheets and settings in local browser storage.
- Full-screen standalone app mode when installed.
- Includes app icons, manifest and service worker.
- Existing waste counter/PDF behaviour is unchanged.

IMPORTANT
A PWA must be served over HTTPS (or localhost while developing). Opening index.html directly with file:// will still show the counter, but app installation and offline service-worker features will not activate.

EASIEST FREE DEPLOY
1. Upload this whole folder to Vercel, Netlify, GitHub Pages or another HTTPS static host.
2. Open the HTTPS link on the phone/tablet.
3. Android/Chrome/Edge: use the Install app button when it appears, or browser menu > Install app / Add to Home screen.
4. iPhone/iPad Safari: Share > Add to Home Screen.

FILES
- index.html
- styles.css
- app.js
- manifest.webmanifest
- service-worker.js
- icons/

DATA
Saved sheets are local to each device/browser. Clearing site data can remove them, so download important waste sheets as PDFs.

This is an unofficial internal helper and is not an official McDonald's application.
