const { contextBridge, ipcRenderer } = require("electron");

contextBridge.exposeInMainWorld("hamAPI", {
    getRadd: () => ipcRenderer.invoke("get-radd")
});
