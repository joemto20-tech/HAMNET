NVMP Companion v13.1 - HAMNET Audio Broadcast

Adds:
- HAMNET AUDIO module.
- Verified NVMP users with active faction can upload a small audio file as a broadcast.
- Companion apps poll HAMNET /audio and show an alert when new audio is received.
- Latest audio broadcasts appear in the HAMNET AUDIO module with an audio player.
- Audio broadcast posts a Discord alert through the existing webhook relay.

Cloudflare:
- Replace Worker code with cloudflare-worker-copy-paste.js.
- Keep existing bindings:
  DISCORD_WEBHOOK_URL secret
  PINGS_KV KV binding

Important:
- This simple free-tier relay stores audio in KV as a base64 data URL.
- Keep files under about 950 KB.
- Later we can upgrade to Cloudflare R2 for larger radio files.

Build:
npm install
npm start
npm run dist
