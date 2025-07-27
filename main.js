console.log('I really hope this works');
console.log('main.js');

const electron = require("electron");
const app = electron.app;
const BrowserWindow = electron.BrowserWindow;
const path = require("path");

let win;

function createWindow() {
    win = new BrowserWindow({
        width: 1000,
        height: 800,
        webPreferences: {
            nodeIntegration: true,   // ✅ Enables Node.js in renderer.js
            contextIsolation: false  // ✅ Needed when using nodeIntegration
        }
    });

    // ✅ New, simpler way to load your HTML
    win.loadFile(path.join(__dirname, 'index.html'));

    win.on('closed', () => {
        win = null;
    });
}

// ✅ Updated to modern Electron app lifecycle
app.whenReady().then(createWindow);
