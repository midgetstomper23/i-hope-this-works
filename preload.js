const { contextBridge, ipcRenderer } = require('electron');

// Expose protected methods to the renderer process with a unique namespace
contextBridge.exposeInMainWorld('fitnessAppAPI', {
  // Workout data functions (for Day Maker)
  saveWorkoutData: (data) => ipcRenderer.invoke('save-workout-data', data),
  readWorkoutData: () => ipcRenderer.invoke('read-workout-data'),
  
  // Workout plan functions (for Workout Creator)
  saveWorkoutPlans: (data) => ipcRenderer.invoke('save-workout-plans', data),
  readWorkoutPlans: () => ipcRenderer.invoke('read-workout-plans'),
  saveCurrentWorkout: (data) => ipcRenderer.invoke('save-current-workout', data),
  readCurrentWorkout: () => ipcRenderer.invoke('read-current-workout')
});