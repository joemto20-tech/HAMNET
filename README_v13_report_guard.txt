NVMP Companion v13.0 - Report Permission Guard

Change:
- Live reports/map reports can only be sent when the user has verified NVMP login AND an active verified faction/group.
- Operator name, rank, faction, and group ID stay locked to NVMP data.
- Users only choose map point, alert type, and message.
- If login/faction verification is missing, the report button is locked.

Replace your project with this ZIP or copy public/app.js into your existing project.

Build:
npm install
npm start

Package:
npm run dist
