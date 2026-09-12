# Startup and sync update

The web changes are in this folder. The Android wrapper and download website are in
`C:\Users\blida\Downloads\hayle-waste-android-kit-v2-autorefresh`.

The download website is now published at https://haylewaste-download.vercel.app
(production deployment `dpl_7S9NuRkQd4pqr6kxMi7Smy9jjUS3`). The live page was checked:
both Android and iPhone buttons render, Safari installation instructions appear,
and the updated Android APK returns HTTP 200 with the expected 4,485,702 bytes.
The main counter v17 is published at https://haylewaster.vercel.app
(production deployment `dpl_8SHKzK9Fv3W8s9FFHDyenVSC5JWQ`, 12 September 2026).
It includes the yellow-and-white interface, Home/Graphics/History navigation,
7/30-day waste comparisons and searchable saved sheets. Repeated saves update
the active sheet instead of duplicating its daily totals. Existing Redis
environment variables were preserved. All 56 automated tests pass; live HTML,
assets and the read-only cloud API return successful responses. Test fixtures
return 404 in production. All test mutations used an isolated local datastore.

## Changed web files

- `app.js`: fixes fresh-install initialization (default items previously called the
  save function before its sync guards existed). One sync at a time has a shared
  10-second deadline covering GET, POST, and response bodies, with abort and cleanup.
  Failures show `Cloud unavailable · local safe`. Reconnect/resume is debounced;
  failures retry after 15, 30, then at most every 60 seconds. Edits made during a
  request remain pending. A fresh empty device adopts cloud data without uploading
  its defaults. First-sync merges preserve unrelated counts/notes and remap item
  IDs consistently in counts/history. PIN requests also have a bounded timeout.
- `service-worker.js`: cache `hayle-waste-v16`, fresh network HTML/scripts/styles,
  five-second deadline including stalled bodies, offline fallback independent of
  native launch queries, obsolete Hayle cache removal, `skipWaiting`, and
  `clients.claim`. API requests bypass caching.
- `index.html`: versioned script/style references, safe initial cloud status, and
  update-loader registration. Existing design, item labels and PDF markup remain.
- `pwa-update.js` (new): service worker version handshake; at most one automatic
  reload per new version per session, no first-install reload, and throttled
  update checks on reconnect/resume and while visible.
- `tests/cloud-sync.test.cjs` (new): real application code in a local browser
  harness, covering fresh startup, strict API replies, timeouts, retries,
  concurrency, local data preservation, first-sync merges and PIN requests.
- `tests/service-worker.test.cjs` (new): cache/update policy, stalled headers and
  bodies, native-query offline fallback and once-only reload guards.
- `tests/api-store.test.cjs` (new): real API handler with local Redis doubles,
  including GET/POST/OPTIONS, CORS and PIN setup/verification/change.
- `README-SYNC-UPDATE.md` (new): this change and validation record.

`api/store.js` already had GET/POST/OPTIONS CORS handling and server-only Redis
credentials; it was preserved. No login system, Redis migration or PDF redesign
was introduced. The existing shared-snapshot datastore conflict model remains;
this change does not introduce a new multi-device merge protocol.

## Changed Android files

Paths below are relative to the Android kit directory above.

- `android-app/native/MainActivity.java`: keeps the production origin in the
  Capacitor server URL and sets `/?native=1&v=<timestamp>` as the first start path.
  Activity recreation reuses that path. Storage and service worker caches remain.
- `android-app/android/app/src/main/java/uk/co/hayle/wastecounter/MainActivity.java`:
  synchronized generated copy of that activity.
- `android-app/build-apk.ps1`: discovers Java 21 under Eclipse Adoptium without a
  fixed patch number, sorts versions numerically, verifies `java -version`, builds
  `assembleDebug`, creates delivery directories and verifies both APK copies.
- `android-app/android/app/build.gradle`: versionCode increased from 2 to 3.
- `android-app/README.txt` and `README-FIRST.txt`: updated launch/build guidance.

The stable package is `uk.co.hayle.wastecounter`, and the name remains
`Hayle Waste Counter`. The debug signing certificate matches the previous APK.
Retain that signing identity for future upgrades.

Built APK copies:

- `android-app/android/app/build/outputs/apk/debug/app-debug.apk`
- `android-app/dist/Hayle-Waste-Counter.apk`
- `download-site/downloads/Hayle-Waste-Counter.apk`

All copies are 4,485,702 bytes with SHA256:
`E0D0406E063F81BE5697AABA8A019015E85E9BC466BC9D241696A71BF8DB8D11`.

## Changed download website files

- `download-site/index.html`: preserves the Android APK download and adds an
  `Install on iPhone / iOS` button linking to the live counter, with Safari
  Share / Add to Home Screen instructions. Updates mobile platform labels and
  adds matching button styling and keyboard focus treatment.
- `download-site/README.txt`: documents both Android APK delivery and the iPhone
  Home Screen installation flow.

The iPhone button installs the existing PWA through Safari; it does not offer an
Android APK or claim an App Store/IPA download. Both platform buttons point at
their existing destinations.

## Validation

Run `node --test tests/*.test.cjs` from the web directory. All 39 tests passed.
The actual PowerShell APK build completed with automatically discovered Java 21.
APK manifest, signing certificate and all copy hashes were checked.
The download page also passed desktop and 390-pixel mobile browser checks with
no horizontal overflow or console/page errors. Its Android link was enabled
and returned HTTP 200 for the APK; the iPhone link and installation instructions
were verified without opening or writing to the live counter.

| Requested case | Verification |
| --- | --- |
| Fresh online install | Empty-storage startup test passes; browser renders and reaches Cloud synced with a local API fixture. Native first-navigation URL and APK manifest inspected. |
| Open after a web update | Versioned assets, network-first navigation and throttled worker update checks tested. |
| Offline opening | Browser successfully reopened a new native-query URL with its local server stopped, retained its count, and displayed Cloud unavailable · local safe when offline. |
| Reconnect | Automated offline-to-online tests synchronize retained edits without concurrent requests. |
| Server failure or stalled request | Header/body/invalid-response tests settle by 10 seconds; browser hung-request check leaves Syncing; retries back off. |
| Worker update | First installation does not reload; a genuine worker release reloads once; same release is suppressed after reload. |
| Existing counts/history | Failed requests and first-sync merges preserve data; edits during GET/POST and canonical item IDs are covered. |

Browser tests used an isolated local API fixture. A read-only production GET
returned HTTP 200 and `ok: true`; production POST/PIN writes were not used.
No phone or Android emulator was connected, so real-device installation and
WebView lifecycle checks remain to be performed. A remote-only wrapper needs one
successful online load to cache the app before it can reopen offline.

For later web releases, increment the cache version and the asset queries in
`index.html`/`service-worker.js` together.
