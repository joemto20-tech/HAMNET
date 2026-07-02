const { app, BrowserWindow, ipcMain, session } = require("electron");
const path = require("path");

require("./server.js");

app.commandLine.appendSwitch("autoplay-policy", "no-user-gesture-required");

let mainWindow = null;
let loginWindow = null;

function installMediaPermissions() {
    session.defaultSession.setPermissionRequestHandler((webContents, permission, callback) => {
        if (permission === "media" || permission === "microphone") return callback(true);
        callback(false);
    });

    session.defaultSession.setPermissionCheckHandler((webContents, permission) => {
        if (permission === "media" || permission === "microphone") return true;
        return false;
    });
}

ipcMain.handle("get-radd", async () => {
    const port = process.env.HAM_PORT || 3177;
    const res = await fetch(`http://localhost:${port}/api/radd`);
    if (!res.ok) throw new Error(`HAM ATK server returned ${res.status}`);
    return await res.json();
});




ipcMain.handle("get-group-detail", async (event, id) => {
    if (!id) throw new Error("Missing group id");

    const ses = session.defaultSession;
    const cookies = await ses.cookies.get({ domain: "nv-mp.com" });
    const cookieHeader = cookies.map(c => `${c.name}=${c.value}`).join("; ");

    const res = await fetch(`https://nv-mp.com/eden/api/group.json?id=${encodeURIComponent(id)}`, {
        headers: {
            "User-Agent": "Mozilla/5.0",
            "Accept": "application/json",
            "Referer": "https://nv-mp.com/",
            "Cookie": cookieHeader
        }
    });

    if (!res.ok) { console.log(`GROUP DETAIL SKIPPED ${id}: ${res.status}`); return null; }
    const data = await res.json();
    console.log("GROUP DETAIL SUMMARY", {
        id,
        name: data && data.name,
        leaders: data && data.leaders ? data.leaders.length : 0,
        officers: data && data.officers ? data.officers.length : 0,
        members: data && data.members ? data.members.length : 0,
        relationships: data && data.relationships_towards ? data.relationships_towards.length : 0
    });
    return data;
});

ipcMain.handle("get-grouplist", async () => {
    const ses = session.defaultSession;
    const cookies = await ses.cookies.get({ domain: "nv-mp.com" });
    const cookieHeader = cookies.map(c => `${c.name}=${c.value}`).join("; ");

    const res = await fetch("https://nv-mp.com/eden/api/grouplist.json", {
        headers: {
            "User-Agent": "Mozilla/5.0",
            "Accept": "application/json",
            "Referer": "https://nv-mp.com/",
            "Cookie": cookieHeader
        }
    });

    if (!res.ok) throw new Error(`NVMP grouplist returned ${res.status}`);
    return await res.json();
});

ipcMain.handle("get-groups", async () => {
    const ses = session.defaultSession;
    const cookies = await ses.cookies.get({ domain: "nv-mp.com" });
    const cookieHeader = cookies.map(c => `${c.name}=${c.value}`).join("; ");

    const res = await fetch("https://nv-mp.com/eden/api/groups.json", {
        headers: {
            "User-Agent": "Mozilla/5.0",
            "Accept": "application/json",
            "Referer": "https://nv-mp.com/",
            "Cookie": cookieHeader
        }
    });

    if (!res.ok) throw new Error(`NVMP groups returned ${res.status}`);
    return await res.json();
});

ipcMain.handle("get-session", async () => {
    const ses = session.defaultSession;
    const cookies = await ses.cookies.get({ domain: "nv-mp.com" });
    const cookieHeader = cookies.map(c => `${c.name}=${c.value}`).join("; ");

    const res = await fetch("https://nv-mp.com/eden/api/session.json", {
        headers: {
            "User-Agent": "Mozilla/5.0",
            "Accept": "application/json",
            "Referer": "https://nv-mp.com/",
            "Cookie": cookieHeader
        }
    });

    if (!res.ok) throw new Error(`NVMP session returned ${res.status}`);
    return await res.json();
});


ipcMain.handle("get-character", async () => {
    const ses = session.defaultSession;
    const cookies = await ses.cookies.get({ domain: "nv-mp.com" });
    const cookieHeader = cookies.map(c => `${c.name}=${c.value}`).join("; ");

    const res = await fetch("https://nv-mp.com/eden/api/character.json", {
        headers: {
            "User-Agent": "Mozilla/5.0",
            "Accept": "application/json",
            "Referer": "https://nv-mp.com/",
            "Cookie": cookieHeader
        }
    });

    if (!res.ok) throw new Error(`NVMP character returned ${res.status}`);
    return await res.json();
});


ipcMain.handle("close-app", async () => {
    app.quit();
    return { closing: true };
});

ipcMain.handle("move-window-by", async (event, delta) => {
    const win = BrowserWindow.fromWebContents(event.sender);
    if (!win || win.isDestroyed()) return { moved: false };

    const dx = Math.round(Number(delta && delta.x) || 0);
    const dy = Math.round(Number(delta && delta.y) || 0);
    if (!dx && !dy) return { moved: false };

    const [x, y] = win.getPosition();
    win.setPosition(x + dx, y + dy);
    return { moved: true };
});

ipcMain.handle("open-nvmp-login", async () => {
    return new Promise((resolve) => {
        if (loginWindow && !loginWindow.isDestroyed()) {
            loginWindow.focus();
            return resolve({ opened: true });
        }

        loginWindow = new BrowserWindow({
            width: 1050,
            height: 780,
            title: "NVMP Operator Login",
            autoHideMenuBar: true,
            backgroundColor: "#000000",
            parent: mainWindow || undefined,
            modal: false,
            webPreferences: {
                contextIsolation: true,
                nodeIntegration: false,
                autoplayPolicy: "no-user-gesture-required"
            }
        });

        loginWindow.loadURL("https://nv-mp.com/");

        loginWindow.on("closed", () => {
            loginWindow = null;
            resolve({ closed: true });
        });
    });
});

function createWindow() {
    installMediaPermissions();

    mainWindow = new BrowserWindow({
        width: 1280,
        height: 800,
        frame: false,
        autoHideMenuBar: true,
        backgroundColor: "#000000",
        webPreferences: {
            preload: path.join(__dirname, "preload.js"),
            contextIsolation: true,
            nodeIntegration: false,
            autoplayPolicy: "no-user-gesture-required"
        }
    });

    mainWindow.loadURL(`http://localhost:${process.env.HAM_PORT || 3177}`);
}

app.whenReady().then(() => setTimeout(createWindow, 1000));
app.on("window-all-closed", () => app.quit());
