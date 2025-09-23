const { contextBridge } = require('electron');

contextBridge.exposeInMainWorld('desktopApp', {
  version: '0.1.0',
});