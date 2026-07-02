NVMP Companion v13.3 - Recorder Broadcast Button

Adds:
- Recorder screen now has a "SEND RECORDING AS BROADCAST" button.
- Users can either:
  1. Use HAMNET AUDIO to upload an existing audio file, or
  2. Record in the Recording Device and send that recording as a broadcast.
- Broadcast requires verified NVMP login and verified active faction.
- Companion users receive HAMNET AUDIO alerts for new broadcasts.

Cloudflare:
- Keep the Worker code from v13.2 if already deployed.
- It already supports /audio.
- Keep bindings:
  DISCORD_WEBHOOK_URL
  PINGS_KV

Note:
- Keep recordings under about 950 KB while using KV storage.
