// current-workout.js - Current Workout page functionality

document.addEventListener('DOMContentLoaded', function() {
    console.log('Current Workout page loaded');
    
    const backButton = document.getElementById('backButton');
    
    // Navigation
    if (backButton) {
        backButton.addEventListener('click', function() {
            window.location.href = 'workoutbuilder.html';
        });
    }
    
    // Initialize the page
    loadWorkoutPlans();
    updateCurrentWorkoutDisplay();
});

async function loadWorkoutPlans() {
    try {
        let workoutPlans = [];
        
        if (window.fitnessAppAPI && window.fitnessAppAPI.readWorkoutPlans) {
            workoutPlans = await window.fitnessAppAPI.readWorkoutPlans();
        } else {
            // Fallback for development
            const saved = localStorage.getItem('workoutPlans');
            workoutPlans = saved ? JSON.parse(saved) : [];
        }
        
        displayWorkoutPlans(workoutPlans);
    } catch (error) {
        console.error('Error loading workout plans:', error);
        const workoutPlansContainer = document.getElementById('workout-plans-container');
        if (workoutPlansContainer) {
            workoutPlansContainer.innerHTML = '<p class="error">Error loading workout plans</p>';
        }
    }
}

function displayWorkoutPlans(workoutPlans) {
    const workoutPlansContainer = document.getElementById('workout-plans-container');
    if (!workoutPlansContainer) return;
    
    if (workoutPlans.length === 0) {
        workoutPlansContainer.innerHTML = '<p class="no-workouts">No workout plans found. Create one in the Workout Builder first.</p>';
        return;
    }
    
    workoutPlansContainer.innerHTML = '';
    
    workoutPlans.forEach(plan => {
        const workoutCard = document.createElement('div');
        workoutCard.className = 'workout-plan-card';
        workoutCard.innerHTML = `
            <div class="workout-plan-info">
                <h3>${plan.name}</h3>
                <p>${getWorkoutDayCount(plan)} workout days</p>
                <p class="workout-days">${getWorkoutDaysSummary(plan)}</p>
            </div>
            <button class="action-btn select-workout-btn" data-workout-id="${plan.id}">
                Select as Current
            </button>
        `;
        
        workoutPlansContainer.appendChild(workoutCard);
    });
    
    // Add event listeners to all select buttons
    document.querySelectorAll('.select-workout-btn').forEach(button => {
        button.addEventListener('click', function() {
            const workoutId = this.dataset.workoutId;
            const workoutPlan = workoutPlans.find(p => p.id === workoutId);
            if (workoutPlan) {
                setCurrentWorkout(workoutPlan);
            }
        });
    });
}

function getWorkoutDayCount(workoutPlan) {
    if (!workoutPlan.schedule) return 0;
    return workoutPlan.schedule.filter(day => day && day.dayId).length;
}

function getWorkoutDaysSummary(workoutPlan) {
    if (!workoutPlan.schedule) return 'No days configured';
    
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

async function setCurrentWorkout(workoutPlan) {
    if (window.currentWorkoutManager) {
        const success = await window.currentWorkoutManager.setCurrentWorkout(workoutPlan);
        if (success) {
            updateCurrentWorkoutDisplay();
            showNotification(`"${workoutPlan.name}" is now your current workout!`);
        } else {
            showNotification('Error setting current workout', 'error');
        }
    }
}

function updateCurrentWorkoutDisplay() {
    const display = document.getElementById('current-workout-display');
    if (!display) return;
    
    if (window.currentWorkoutManager && window.currentWorkoutManager.getCurrentWorkout()) {
        const currentWorkout = window.currentWorkoutManager.getCurrentWorkout();
        display.innerHTML = `
            <div class="current-workout-card">
                <div class="current-workout-info">
                    <h3>${currentWorkout.name}</h3>
                    <p>${getWorkoutDayCount(currentWorkout)} workout days</p>
                    <p class="workout-days">${getWorkoutDaysSummary(currentWorkout)}</p>
                </div>
                <button class="action-btn btn-secondary" id="clear-workout-btn">
                    Clear
                </button>
            </div>
        `;
        
        const clearBtn = document.getElementById('clear-workout-btn');
        if (clearBtn) {
            clearBtn.addEventListener('click', clearCurrentWorkout);
        }
    } else {
        display.innerHTML = '<p class="no-workout">No workout plan selected</p>';
    }
}

function clearCurrentWorkout() {
    if (window.currentWorkoutManager) {
        window.currentWorkoutManager.clearCurrentWorkout();
        updateCurrentWorkoutDisplay();
        showNotification('Current workout cleared');
    }
}

function showNotification(message, type = 'success') {
    // Simple notification implementation
    const notification = document.createElement('div');
    notification.className = `notification ${type}`;
    notification.textContent = message;
    notification.style.cssText = `
        position: fixed;
        top: 20px;
        right: 20px;
        padding: 15px;
        background: ${type === 'error' ? '#e74c3c' : '#2ecc71'};
        color: white;
        border-radius: 5px;
        z-index: 1000;
    `;
    
    document.body.appendChild(notification);
    
    setTimeout(() => {
        notification.remove();
    }, 3000);
}