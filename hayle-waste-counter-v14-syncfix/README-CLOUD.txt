HAYLE WASTE COUNTER V12 — SHARED CLOUD DATASTORE
=================================================

NO LOGIN
- There are no user accounts and no sign-in screen.
- Every device using this deployment shares the same Hayle datastore.
- The app remains offline-first: taps are saved locally immediately and uploaded when online.

WHAT SYNCS
- Current RAW/FULL counts
- Saved History
- Custom RAW/FULL item list
- Crew/shift note and notes

HOW IT WORKS
- Browser -> same-origin /api/store Vercel Function
- Vercel Function -> Upstash Redis using server-side environment variables
- Database credentials never appear in app.js or the browser.

SETUP ON VERCEL
1. Deploy this V12 folder to your existing haylewaster Vercel project.
2. In Vercel, open the haylewaster project.
3. Open Storage / Marketplace and connect an Upstash Redis database to haylewaster.
4. Make sure the project gets either:
   UPSTASH_REDIS_REST_URL + UPSTASH_REDIS_REST_TOKEN
   or
   KV_REST_API_URL + KV_REST_API_TOKEN
5. Redeploy the project after the environment variables are added.
6. Open the app. The top badge should change to “Cloud synced”.

IMPORTANT
There is intentionally no login. Anyone who can access the app URL can use the shared datastore through the app.
The database token itself stays server-side and is not exposed to the browser.

MULTI-DEVICE BEHAVIOUR
- Local edits are pushed automatically.
- When another device changes the shared data, this app checks for updates while visible.
- If a device has unsynced local taps, those are protected from being overwritten by a background pull.
- This is designed for normal crew use, not simultaneous high-frequency editing of the exact same sheet on many devices.

PWA
The service worker cache is V12 and /api/* is explicitly excluded from caching so cloud reads stay fresh.
