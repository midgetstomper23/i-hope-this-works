const { app, BrowserWindow, ipcMain } = require('electron');
const path = require('path');
const fs = require('fs');

let win;

function createWindow() {
  win = new BrowserWindow({
    width: 1000,
    height: 800,
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
      preload: path.join(__dirname, 'preload.js')
    }
  });

  win.loadFile('index.html');
  
  // Open DevTools for development (remove in production)
  win.webContents.openDevTools();
}

// Handle reading workout data
ipcMain.handle('read-workout-data', async () => {
  try {
    const dataPath = path.join(__dirname, 'workout-data.json');
    if (fs.existsSync(dataPath)) {
      const data = fs.readFileSync(dataPath, 'utf8');
      return JSON.parse(data);
    }
    return []; // Return empty array if no file exists
  } catch (error) {
    console.error('Error reading workout data:', error);
    return [];
  }
});

// Handle saving workout data
ipcMain.handle('save-workout-data', async (event, data) => {
  try {
    const dataPath = path.join(__dirname, 'workout-data.json');
    fs.writeFileSync(dataPath, JSON.stringify(data, null, 2));
    return { success: true };
  } catch (error) {
    console.error('Error saving workout data:', error);
    return { success: false, error: error.message };
  }
});

// Handle reading workout plans
ipcMain.handle('read-workout-plans', async () => {
  try {
    const dataPath = path.join(__dirname, 'workout-plans.json');
    if (fs.existsSync(dataPath)) {
      const data = fs.readFileSync(dataPath, 'utf8');
      return JSON.parse(data);
    }
    return []; // Return empty array if no file exists
  } catch (error) {
    console.error('Error reading workout plans:', error);
    return [];
  }
});

// Handle saving workout plans
ipcMain.handle('save-workout-plans', async (event, data) => {
  try {
    const dataPath = path.join(__dirname, 'workout-plans.json');
    fs.writeFileSync(dataPath, JSON.stringify(data, null, 2));
    return { success: true };
  } catch (error) {
    console.error('Error saving workout plans:', error);
    return { success: false, error: error.message };
  }
});

// Handle saving current workout plan
ipcMain.handle('save-current-workout', async (event, data) => {
  try {
    const dataPath = path.join(__dirname, 'current-workout.json');
    fs.writeFileSync(dataPath, JSON.stringify(data, null, 2));
    return { success: true };
  } catch (error) {
    console.error('Error saving current workout:', error);
    return { success: false, error: error.message };
  }
});

// Handle reading current workout plan
ipcMain.handle('read-current-workout', async () => {
  try {
    const dataPath = path.join(__dirname, 'current-workout.json');
    if (fs.existsSync(dataPath)) {
      const data = fs.readFileSync(dataPath, 'utf8');
      return JSON.parse(data);
    }
    return null; // Return null if no current workout
  } catch (error) {
    console.error('Error reading current workout:', error);
    return null;
  }
});

app.whenReady().then(createWindow);

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

app.on('activate', () => {
  if (BrowserWindow.getAllWindows().length === 0) {
    createWindow();
  }
});