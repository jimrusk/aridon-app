const { app, BrowserWindow, Menu, session, shell } = require('electron');

const APP_URL = (process.env.ARIDON_APP_URL || 'https://aridon-v02.vercel.app').replace(/\/$/, '');
const APP_ORIGIN = new URL(APP_URL).origin;

function isAridonUrl(value) {
  try { return new URL(value).origin === APP_ORIGIN; } catch { return false; }
}

function isSafeExternal(value) {
  try { return new URL(value).protocol === 'https:'; } catch { return false; }
}

function createWindow() {
  const win = new BrowserWindow({
    width: 1440,
    height: 960,
    minWidth: 980,
    minHeight: 700,
    backgroundColor: '#07101D',
    title: 'Aridon',
    show: false,
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
      sandbox: true,
      webSecurity: true,
      devTools: false,
    },
  });

  win.once('ready-to-show', () => win.show());

  win.webContents.setWindowOpenHandler(({ url }) => {
    if (isAridonUrl(url)) return { action: 'allow' };
    if (isSafeExternal(url)) void shell.openExternal(url);
    return { action: 'deny' };
  });

  win.webContents.on('will-navigate', (event, url) => {
    if (isAridonUrl(url)) return;
    event.preventDefault();
    if (isSafeExternal(url)) void shell.openExternal(url);
  });

  void win.loadURL(`${APP_URL}/customer/start?desktop=1`);
}

app.whenReady().then(() => {
  Menu.setApplicationMenu(null);

  session.defaultSession.setPermissionRequestHandler((webContents, permission, callback, details) => {
    const requestingUrl = details.requestingUrl || webContents.getURL();
    const mediaTypes = Array.isArray(details.mediaTypes) ? details.mediaTypes : [];
    const audioOnly = mediaTypes.length === 0 || mediaTypes.every((type) => type === 'audio');
    callback(Boolean(isAridonUrl(requestingUrl) && permission === 'media' && audioOnly));
  });

  createWindow();
  app.on('activate', () => { if (BrowserWindow.getAllWindows().length === 0) createWindow(); });
});

app.on('window-all-closed', () => { if (process.platform !== 'darwin') app.quit(); });
