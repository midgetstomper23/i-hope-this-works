// currentWorkoutManager.js - Global current workout system

class CurrentWorkoutManager {
    constructor() {
        this.currentWorkout = null;
        this.init();
    }

    async init() {
        // Load current workout from storage
        await this.loadCurrentWorkout();
        // Update all displays
        this.updateAllDisplays();
    }

    async loadCurrentWorkout() {
        try {
            if (window.fitnessAppAPI && window.fitnessAppAPI.readCurrentWorkout) {
                const workout = await window.fitnessAppAPI.readCurrentWorkout();
                this.currentWorkout = workout;
            } else {
                // Fallback to localStorage for development
                const saved = localStorage.getItem('currentWorkout');
                this.currentWorkout = saved ? JSON.parse(saved) : null;
            }
        } catch (error) {
            console.error('Error loading current workout:', error);
            this.currentWorkout = null;
        }
    }

    async setCurrentWorkout(workoutPlan) {
        this.currentWorkout = workoutPlan;
        
        try {
            if (window.fitnessAppAPI && window.fitnessAppAPI.saveCurrentWorkout) {
                await window.fitnessAppAPI.saveCurrentWorkout(workoutPlan);
            } else {
                // Fallback to localStorage for development
                localStorage.setItem('currentWorkout', JSON.stringify(workoutPlan));
            }
            
            // Update all displays across the app
            this.updateAllDisplays();
            return true;
        } catch (error) {
            console.error('Error saving current workout:', error);
            return false;
        }
    }

    getCurrentWorkout() {
        return this.currentWorkout;
    }

    clearCurrentWorkout() {
        this.currentWorkout = null;
        try {
            if (window.fitnessAppAPI && window.fitnessAppAPI.clearCurrentWorkout) {
                window.fitnessAppAPI.clearCurrentWorkout();
            } else {
                localStorage.removeItem('currentWorkout');
            }
            this.updateAllDisplays();
        } catch (error) {
            console.error('Error clearing current workout:', error);
        }
    }

    updateAllDisplays() {
        // Update workout builder display
        this.updateWorkoutBuilderDisplay();
        
        // Update home screen (if on home page)
        this.updateHomeScreenDisplay();
        
        // Update current workout page if it's open
        this.updateCurrentWorkoutPage();
    }

    updateWorkoutBuilderDisplay() {
        // This will be called from workoutbuilder.js
        if (typeof updateCurrentWorkoutDisplay === 'function') {
            updateCurrentWorkoutDisplay();
        }
    }

    updateHomeScreenDisplay() {
        // This will be called from your home screen JavaScript
        if (typeof updateHomeScreenWorkoutDays === 'function') {
            updateHomeScreenWorkoutDays(this.currentWorkout);
        }
    }

    updateCurrentWorkoutPage() {
        // This will be called from current-workout.js
        if (typeof updateCurrentWorkoutDisplay === 'function') {
            updateCurrentWorkoutDisplay();
        }
    }

    getWorkoutDayCount() {
        if (!this.currentWorkout || !this.currentWorkout.schedule) return 0;
        return this.currentWorkout.schedule.filter(day => day && day.dayId).length;
    }

    // Get today's workout type for home screen indicator
    getTodaysWorkout() {
        if (!this.currentWorkout || !this.currentWorkout.schedule) return null;
        
        const today = new Date();
        const dayOfWeek = today.getDay(); // 0 = Sunday, 1 = Monday, etc.
        // Adjust for your schedule format - this assumes schedule starts with Monday
        const scheduleIndex = dayOfWeek === 0 ? 6 : dayOfWeek - 1;
        
        return this.currentWorkout.schedule[scheduleIndex] || null;
    }
}

// Create global instance
window.currentWorkoutManager = new CurrentWorkoutManager();