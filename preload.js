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
  readCurrentWorkout: () => ipcRenderer.invoke('read-current-workout'),
  
  // Progression plan functions (for Progressive Overload)
  saveProgressionPlans: (data) => ipcRenderer.invoke('save-progression-plans', data),
  readProgressionPlans: () => ipcRenderer.invoke('read-progression-plans'),
  
  // Calendar data functions (for Calendar integration)
  saveCalendarData: (data) => ipcRenderer.invoke('save-calendar-data', data),
  readCalendarData: () => ipcRenderer.invoke('read-calendar-data'),

  // Analytics: workout history
  readWorkoutHistory: () => ipcRenderer.invoke('read-workout-history'),
  saveWorkoutHistory: (data) => ipcRenderer.invoke('save-workout-history', data)
});