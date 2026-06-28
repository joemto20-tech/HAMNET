const { app, BrowserWindow, ipcMain, session } = require("electron");
const path = require("path");

// Start HAM local server.
require("./server.js");

// Allow audio playback + microphone access for the holotape recorder.
app.commandLine.appendSwitch("autoplay-policy", "no-user-gesture-required");

function installMediaPermissions() {
    session.defaultSession.setPermissionRequestHandler((webContents, permission, callback) => {
        if (permission === "media" || permission === "microphone") {
            callback(true);
            return;
        }

        callback(false);
    });

    session.defaultSession.setPermissionCheckHandler((webContents, permission) => {
        if (permission === "media" || permission === "microphone") return true;
        return false;
    });
}

// IPC bridge used by public/index.html.
// This fixes: No handler registered for 'get-radd'
ipcMain.handle("get-radd", async () => {
    const res = await fetch("http://localhost:3177/api/radd");

    if (!res.ok) {
        throw new Error(`HAM ATK server returned ${res.status}`);
    }

    return await res.json();
});

function createWindow() {
    installMediaPermissions();

    const win = new BrowserWindow({
        width: 1280,
        height: 800,
        autoHideMenuBar: true,
        backgroundColor: "#000000",
        webPreferences: {
            preload: path.join(__dirname, "preload.js"),
            contextIsolation: true,
            nodeIntegration: false,
            autoplayPolicy: "no-user-gesture-required"
        }
    });

    win.loadURL("http://localhost:3177");
}

app.whenReady().then(() => {
    setTimeout(createWindow, 1000);
});

app.on("window-all-closed", () => {
    app.quit();
});
