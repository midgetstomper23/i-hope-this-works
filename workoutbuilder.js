// workoutbuilder.js - Workout Builder page functionality with dynamic current workout

// Navigation functions
function goBack() {
    // SIMPLE FIX: Always go directly to home
    window.location.href = 'index.html';
}

function showDayMaker() {
    window.location.href = 'daymaker.html';
}

function showWorkoutCreator() {
    window.location.href = 'workoutcreator.html';
}

// Function to update the current workout display
function updateCurrentWorkoutDisplay() {
    const planNameElement = document.getElementById('current-plan-name');
    const planDetailsElement = document.getElementById('current-plan-details');
    
    // Use the global currentWorkout variable
    if (window.currentWorkout && window.currentWorkout.name) {
        planNameElement.textContent = window.currentWorkout.name;
        const dayCount = getWorkoutDayCount(window.currentWorkout);
        const summary = getWorkoutDaysSummary(window.currentWorkout);
        planDetailsElement.textContent = dayCount > 0
            ? `${dayCount} workout days, ${summary}`
            : 'All days are rest days';
    } else {
        planNameElement.textContent = 'None';
        planDetailsElement.textContent = 'No workout plan selected';
    }
}

// Helper functions
function getWorkoutDayCount(workoutPlan) {
    if (!workoutPlan || !workoutPlan.schedule) return 0;
    return workoutPlan.schedule.filter(day => day && day.dayId).length;
}

function getWorkoutDaysSummary(workoutPlan) {
    if (!workoutPlan || !workoutPlan.schedule) return 'No days configured';
    
    const dayTypes = {};
    workoutPlan.schedule.forEach(day => {
        if (day && day.dayId) {
            const dayName = day.dayName || 'Workout';
            dayTypes[dayName] = (dayTypes[dayName] || 0) + 1;
        }
    });
    
    return Object.entries(dayTypes)
        .map(([name, count]) => `${count} ${name}`)
        .join(', ');
}

// Load current workout
async function loadCurrentWorkout() {
    try {
        console.log('Workout Builder: Loading current workout...');
        if (window.fitnessAppAPI && window.fitnessAppAPI.readCurrentWorkout) {
            window.currentWorkout = await window.fitnessAppAPI.readCurrentWorkout();
            console.log('Workout Builder: Loaded from API:', window.currentWorkout);
        } else {
            const saved = localStorage.getItem('currentWorkout');
            window.currentWorkout = saved ? JSON.parse(saved) : null;
            console.log('Workout Builder: Loaded from localStorage:', window.currentWorkout);
        }
        
        console.log('Workout Builder: Final current workout:', window.currentWorkout);
        updateCurrentWorkoutDisplay();
    } catch (error) {
        console.error('Error loading current workout:', error);
        window.currentWorkout = null;
        updateCurrentWorkoutDisplay();
    }
}

// Initialize the page
document.addEventListener('DOMContentLoaded', function() {
    console.log('Workout Builder page loaded');
    
    // Load current workout first
    loadCurrentWorkout();
    
    // Set up back button
    const backButton = document.getElementById('backButton');
    if (backButton) {
        backButton.addEventListener('click', goBack);
        console.log('Back button event listener added');
    } else {
        console.error('Back button not found!');
    }
    
    // Set up menu card clicks
    const dayMakerCard = document.getElementById('day-maker-card');
    if (dayMakerCard) {
        dayMakerCard.addEventListener('click', showDayMaker);
    }
    
    const workoutCreatorCard = document.getElementById('workout-creator-card');
    if (workoutCreatorCard) {
        workoutCreatorCard.addEventListener('click', showWorkoutCreator);
    }
    
    // Set up change workout button
    const changeWorkoutBtn = document.getElementById('change-workout-btn');
    if (changeWorkoutBtn) {
        changeWorkoutBtn.addEventListener('click', function() {
            window.location.href = 'currentworkout.html';
        });
    }
    
    // Make all nav items with href attributes clickable
    document.querySelectorAll('.nav-item[href]').forEach(item => {
        item.addEventListener('click', function(e) {
            e.preventDefault();
            window.location.href = this.getAttribute('href');
        });
    });
    
    // Update display when page gains focus
    window.addEventListener('focus', function() {
        loadCurrentWorkout();
    });
    
    // Update display when current workout changes
    window.addEventListener('currentWorkoutChanged', function() {
        loadCurrentWorkout();
    });
    
    // Add keyboard shortcut for back button (Esc key)
    document.addEventListener('keydown', function(e) {
        if (e.key === 'Escape') {
            goBack();
        }
    });
});