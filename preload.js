const { contextBridge, ipcRenderer } = require("electron");

contextBridge.exposeInMainWorld("weatherApp", {
  getAppVersion: () => ipcRenderer.invoke("get-app-version")
});
