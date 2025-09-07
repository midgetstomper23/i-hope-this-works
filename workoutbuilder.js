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
    if (window.currentWorkout) {
        planNameElement.textContent = window.currentWorkout.name;
        planDetailsElement.textContent = `${getWorkoutDayCount(window.currentWorkout)} workout days, ${getWorkoutDaysSummary(window.currentWorkout)}`;
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

// Initialize the page
document.addEventListener('DOMContentLoaded', function() {
    console.log('Workout Builder page loaded');
    
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
    
    // Initialize current workout display
    updateCurrentWorkoutDisplay();
    
    // Update display when page gains focus
    window.addEventListener('focus', function() {
        updateCurrentWorkoutDisplay();
    });
    
    // Update display when current workout changes
    window.addEventListener('currentWorkoutChanged', function() {
        updateCurrentWorkoutDisplay();
    });
    
    // Add keyboard shortcut for back button (Esc key)
    document.addEventListener('keydown', function(e) {
        if (e.key === 'Escape') {
            goBack();
        }
    });
});