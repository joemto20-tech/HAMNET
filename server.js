const express = require("express");
const axios = require("axios");
const path = require("path");

const app = express();
const PORT = process.env.HAM_PORT || 3177;

const publicPath = path.join(__dirname, "public");
app.use(express.static(publicPath));

let cache = {
    groups: {},
    bases: [],
    updated: null
};

const headers = {
    "User-Agent": "Mozilla/5.0",
    "Accept": "application/json",
    "Referer": "https://nv-mp.com/radd/captures"
};

async function updateRadd() {
    try {
        console.log("Downloading NVMP data...");

        const groups = (await axios.get(
            "https://nv-mp.com/eden/api/groups.json",
            { headers }
        )).data;

        const bases = (await axios.get(
            "https://nv-mp.com/eden/api/bases.json",
            { headers }
        )).data;

        cache.groups = groups;
        cache.bases = bases;
        cache.updated = new Date().toLocaleString();

        console.log(`✓ Loaded ${Object.keys(groups).length} factions`);
        console.log(`✓ Loaded ${bases.length} bases`);
    } catch (err) {
        console.error("Update failed");
        if (err.response) {
            console.error(err.response.status);
            console.error(err.response.statusText);
        } else {
            console.error(err.message);
        }
    }
}

updateRadd();
setInterval(updateRadd, 25000);

app.get("/api/status", (req, res) => {
    res.json({
        online: true,
        updated: cache.updated,
        factions: Object.keys(cache.groups).length,
        bases: cache.bases.length
    });
});

app.get("/api/radd", (req, res) => {
    const factions = {};

    for (const id in cache.groups) {
        const g = cache.groups[id];

        factions[g.id] = {
            id: g.id,
            name: g.name,
            color: g.color,
            bases: 0,
            hq: null,
            locations: []
        };
    }

    for (const base of cache.bases) {
        const f = factions[base.faction_owner];
        if (!f) continue;

        f.bases++;

        f.locations.push({
            id: base.id,
            name: base.name,
            safe: base.safe_zone,
            locked: base.capture_locked,
            x: base.worldspace_x,
            y: base.worldspace_y
        });

        if (base.is_hq) f.hq = base.name;
    }

    res.json({
        updated: cache.updated,
        factions: Object.values(factions).sort((a, b) => b.bases - a.bases)
    });
});

app.listen(PORT, () => {
    console.log("");
    console.log("=================================");
    console.log(" HAM FIELD NETWORK ONLINE");
    console.log("=================================");
    console.log(`Server : http://localhost:${PORT}`);
    console.log(`Status : http://localhost:${PORT}/api/status`);
    console.log(`RADD   : http://localhost:${PORT}/api/radd`);
    console.log("=================================");
});