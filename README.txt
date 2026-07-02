NVMP Companion v11.8

Adds:
- Discord/form -> app map pings.
- App polls https://nvmp-live-pings.joemto20.workers.dev/pings and shows active pings on the Map.
- Worker includes a simple hosted form at:
  https://nvmp-live-pings.joemto20.workers.dev/submit

Cloudflare extra setup:
1. Keep DISCORD_WEBHOOK_URL secret.
2. Create a KV namespace named something like NVMP_PINGS.
3. Bind it to the Worker as:
   PINGS_KV
4. Replace Worker code with cloudflare-worker-copy-paste.js.
5. Save and Deploy.

For Discord:
Pin this link in your ping channel:
https://nvmp-live-pings.joemto20.workers.dev/submit
