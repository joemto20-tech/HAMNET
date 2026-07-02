NVMP Companion v13.2 - HAMNET AUDIO visible module

Fixes:
- HAMNET AUDIO now appears in the actual main menu.
- Route is wired to screen='hamnetAudio'.
- Back button returns to menu.
- Audio polling starts on boot.
- Cloudflare Worker supports GET/POST /audio.

Use:
1. Replace your project files with this ZIP.
2. In Cloudflare, replace Worker code with cloudflare-worker-copy-paste.js.
3. Keep bindings:
   DISCORD_WEBHOOK_URL
   PINGS_KV
4. Run npm start.

Audio limit:
- Keep audio under about 950 KB for now.
