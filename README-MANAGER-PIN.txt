HAYLE WASTE COUNTER V13 — MANAGER PIN

What changed
- Manager PIN protects destructive actions across all synced devices.
- Protected: Clear current, Start new sheet, delete History, remove waste items, restore default lists.
- No login/account required.
- On the first protected action, create a 4-digit manager PIN.
- The PIN verifier is stored server-side in the existing Upstash Redis datastore.
- The PIN itself is not stored in browser localStorage or sent back to clients.
- Change the PIN later from Settings (cog) > Manager PIN.

Important
- Manager PIN approval needs an internet connection because it is checked server-side.
- This PIN is designed to prevent accidental/unauthorised resets in a shared workplace tool. It is not a replacement for full user authentication if stronger access control is ever required.

Deploy
Replace the current project files with this folder, then run:
  npx vercel --prod

No new Vercel environment variables are required if the V12 shared datastore is already working.
