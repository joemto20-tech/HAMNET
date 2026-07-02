const { contextBridge, ipcRenderer } = require("electron");

contextBridge.exposeInMainWorld("hamAPI", {
    getRadd: () => ipcRenderer.invoke("get-radd"),
    getSession: () => ipcRenderer.invoke("get-session"),
    openNvmpLogin: () => ipcRenderer.invoke("open-nvmp-login"),
    closeApp: () => ipcRenderer.invoke("close-app"),
    getCharacter: () => ipcRenderer.invoke("get-character"),
    getGroups: () => ipcRenderer.invoke("get-groups"),
    getGroupList: () => ipcRenderer.invoke("get-grouplist"),
    getGroupDetail: (id) => ipcRenderer.invoke("get-group-detail", id),
    moveWindowBy: (x, y) => ipcRenderer.invoke("move-window-by", { x, y })
});
