// progressive.js - Fixed with checkbox persistence and smart date handling

let selectedWorkout = null;
let selectedDay = null;
let progressionSettings = {};

document.addEventListener('DOMContentLoaded', function() {
    console.log('Progressive Overload page loaded');
    
    // Set up event listeners
    document.getElementById('backButton').addEventListener('click', () => {
        window.location.href = 'index.html';
    });
    
    document.getElementById('backToStep1')?.addEventListener('click', () => showStep(1));
    document.getElementById('backToStep2')?.addEventListener('click', () => showStep(2));
    document.getElementById('saveProgressionBtn')?.addEventListener('click', saveProgressionPlan);
    document.getElementById('managePhotosBtn')?.addEventListener('click', openPhotosModal);
    document.getElementById('closePhotosModal')?.addEventListener('click', closePhotosModal);
    
    // Load data
    loadActivePlans();
    loadWorkoutPlans();
});

async function loadActivePlans() {
    try {
        let plans = [];
        
        if (window.fitnessAppAPI && window.fitnessAppAPI.readProgressionPlans) {
            plans = await window.fitnessAppAPI.readProgressionPlans();
        } else {
            const saved = localStorage.getItem('progressionPlans');
            plans = saved ? JSON.parse(saved) : [];
        }
        
        displayActivePlans(plans);
    } catch (error) {
        console.error('Error loading active plans:', error);
    }
}

function displayActivePlans(plans) {
    const container = document.getElementById('activePlans');
    
    if (!plans || plans.length === 0) {
        container.innerHTML = '<p class="no-data">No active progression plans. Create one below.</p>';
        return;
    }
    
    container.innerHTML = '';
    
    plans.forEach(plan => {
        const planCard = document.createElement('div');
        planCard.className = 'progression-plan-card';
        planCard.style.cssText = 'background: #3d3d3d; padding: 15px; border-radius: 8px; margin-bottom: 15px;';
        
        const enabledExercises = Object.entries(plan.exercises).filter(([_, ex]) => ex.enabled);
        
        planCard.innerHTML = `
            <h4>${plan.workoutName} - ${plan.dayName}</h4>
            <p><strong>Start Date:</strong> ${new Date(plan.startDate).toLocaleDateString()}</p>
            <p><strong>Active Exercises:</strong> ${enabledExercises.length}</p>
            <div style="margin-top: 10px;">
                ${enabledExercises.map(([name, ex]) => `
                    <div style="padding: 5px 0; border-bottom: 1px solid #555;">
                        <strong>${name}:</strong> ${ex.variable} increases by ${ex.increaseAmount} every ${ex.intervalWeeks} weeks
                        (Current: ${ex.currentValue})
                    </div>
                `).join('')}
            </div>
            <button class="action-btn btn-secondary" style="margin-top: 10px;" onclick="deletePlan('${plan.id}')">Delete Plan</button>
        `;
        
        container.appendChild(planCard);
    });
}

async function deletePlan(planId) {
    if (!confirm('Delete this progression plan?')) return;
    
    try {
        let plans = [];
        
        if (window.fitnessAppAPI && window.fitnessAppAPI.readProgressionPlans) {
            plans = await window.fitnessAppAPI.readProgressionPlans();
        } else {
            const saved = localStorage.getItem('progressionPlans');
            plans = saved ? JSON.parse(saved) : [];
        }
        
        plans = plans.filter(p => p.id !== planId);
        
        if (window.fitnessAppAPI && window.fitnessAppAPI.saveProgressionPlans) {
            await window.fitnessAppAPI.saveProgressionPlans(plans);
        } else {
            localStorage.setItem('progressionPlans', JSON.stringify(plans));
        }
        
        showNotification('Progression plan deleted');
        loadActivePlans();
        
    } catch (error) {
        console.error('Error deleting plan:', error);
        showNotification('Error deleting plan', 'error');
    }
}

async function loadWorkoutPlans() {
    try {
        let workoutPlans = [];
        
        if (window.fitnessAppAPI && window.fitnessAppAPI.readWorkoutPlans) {
            workoutPlans = await window.fitnessAppAPI.readWorkoutPlans();
        } else {
            const saved = localStorage.getItem('workoutPlans');
            workoutPlans = saved ? JSON.parse(saved) : [];
        }
        
        displayWorkoutPlans(workoutPlans);
    } catch (error) {
        console.error('Error loading workout plans:', error);
    }
}

function displayWorkoutPlans(plans) {
    const container = document.getElementById('workoutList');
    
    if (!plans || plans.length === 0) {
        container.innerHTML = '<p class="no-data">No workout plans found. Create one in Workout Builder first.</p>';
        return;
    }
    
    container.innerHTML = '';
    
    plans.forEach(plan => {
        const card = document.createElement('div');
        card.className = 'workout-card';
        card.style.cssText = 'background: #3d3d3d; padding: 15px; border-radius: 8px; margin-bottom: 10px; cursor: pointer;';
        card.innerHTML = `
            <h4>${plan.name}</h4>
            <p>Created: ${new Date(plan.createdAt).toLocaleDateString()}</p>
        `;
        card.onclick = () => selectWorkout(plan);
        container.appendChild(card);
    });
}

function selectWorkout(plan) {
    selectedWorkout = plan;
    loadDaysForWorkout(plan);
    showStep(2);
}

async function loadDaysForWorkout(workout) {
    try {
        let workoutDays = [];
        
        if (window.fitnessAppAPI && window.fitnessAppAPI.readWorkoutData) {
            workoutDays = await window.fitnessAppAPI.readWorkoutData();
        } else {
            const saved = localStorage.getItem('workoutData');
            workoutDays = saved ? JSON.parse(saved) : [];
        }
        
        // Get unique days from schedule
        const uniqueDays = {};
        workout.schedule.forEach(day => {
            if (day && day.dayId) {
                const dayData = workoutDays.find(d => d.id === day.dayId);
                if (dayData) {
                    uniqueDays[day.dayId] = dayData;
                }
            }
        });
        
        displayDays(Object.values(uniqueDays));
        
    } catch (error) {
        console.error('Error loading days:', error);
    }
}

function displayDays(days) {
    const container = document.getElementById('dayList');
    
    if (!days || days.length === 0) {
        container.innerHTML = '<p class="no-data">No workout days found in this plan.</p>';
        return;
    }
    
    container.innerHTML = '';
    
    days.forEach(day => {
        const card = document.createElement('div');
        card.className = 'day-card';
        card.style.cssText = 'background: #3d3d3d; padding: 15px; border-radius: 8px; margin-bottom: 10px; cursor: pointer;';
        card.innerHTML = `
            <div style="display: flex; align-items: center; gap: 10px;">
                <span style="font-size: 2rem;">${day.icon || '🏋️'}</span>
                <div>
                    <h4>${day.name}</h4>
                    <p>${day.exercises.length} exercises</p>
                </div>
            </div>
        `;
        card.onclick = () => selectDay(day);
        container.appendChild(card);
    });
}

function selectDay(day) {
    selectedDay = day;
    displayExerciseConfiguration(day.exercises);
    
    // Show workout start date
    document.getElementById('workoutStartDate').textContent = 
        new Date(selectedWorkout.createdAt).toLocaleDateString();
    
    showStep(3);
}

function displayExerciseConfiguration(exercises) {
    const container = document.getElementById('exercisesConfig');
    container.innerHTML = '';
    
    exercises.forEach((exercise, index) => {
        const exerciseCard = document.createElement('div');
        exerciseCard.className = 'exercise-config';
        exerciseCard.style.cssText = 'background: #3d3d3d; padding: 15px; border-radius: 8px; margin-bottom: 15px;';
        
        const exerciseId = `exercise-${index}`;
        
        exerciseCard.innerHTML = `
            <div class="exercise-header" style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 10px;">
                <h4>${exercise.name}</h4>
                <label class="toggle-label" style="cursor: pointer;">
                    <input type="checkbox" class="enable-progression" data-exercise="${exercise.name}" id="${exerciseId}">
                    Enable Progression
                </label>
            </div>
            
            <div class="progression-settings" id="settings-${exerciseId}" style="display: none;">
                <p><strong>Starting Value:</strong> ${exercise.weight} ${getVariableUnit('weight')}</p>
                
                <div class="form-group">
                    <label>Variable to Increase:</label>
                    <select class="progression-variable" data-exercise="${exercise.name}">
                        <option value="weight">Weight</option>
                        <option value="reps">Reps</option>
                        <option value="sets">Sets</option>
                        <option value="rest">Rest Time</option>
                    </select>
                </div>
                
                <div class="form-group">
                    <label>Increase Amount:</label>
                    <input type="number" min="0.5" step="0.5" value="5" 
                           class="increase-amount" data-exercise="${exercise.name}">
                </div>
                
                <div class="form-group">
                    <label>Increase Interval (weeks):</label>
                    <input type="number" min="1" value="2" 
                           class="interval-weeks" data-exercise="${exercise.name}">
                </div>
            </div>
        `;
        
        container.appendChild(exerciseCard);
        
        // Add toggle functionality
        const checkbox = exerciseCard.querySelector(`#${exerciseId}`);
        const settings = exerciseCard.querySelector(`#settings-${exerciseId}`);
        
        checkbox.addEventListener('change', function() {
            settings.style.display = this.checked ? 'block' : 'none';
            // Save state
            saveCheckboxState(exercise.name, this.checked);
        });
        
        // Restore checkbox state
        const savedState = getCheckboxState(exercise.name);
        if (savedState) {
            checkbox.checked = true;
            settings.style.display = 'block';
        }
    });
}

function saveCheckboxState(exerciseName, checked) {
    const key = `progression-${selectedWorkout.id}-${selectedDay.id}-${exerciseName}`;
    localStorage.setItem(key, checked ? 'true' : 'false');
}

function getCheckboxState(exerciseName) {
    const key = `progression-${selectedWorkout.id}-${selectedDay.id}-${exerciseName}`;
    return localStorage.getItem(key) === 'true';
}

function getVariableUnit(variable) {
    const units = {
        'weight': 'lbs',
        'reps': 'reps',
        'sets': 'sets',
        'rest': 'seconds'
    };
    return units[variable] || '';
}

async function saveProgressionPlan() {
    // Collect enabled exercises
    const exercises = {};
    
    document.querySelectorAll('.exercise-config').forEach(config => {
        const checkbox = config.querySelector('.enable-progression');
        if (checkbox && checkbox.checked) {
            const exerciseName = checkbox.dataset.exercise;
            const variable = config.querySelector('.progression-variable').value;
            const increaseAmount = parseFloat(config.querySelector('.increase-amount').value);
            const intervalWeeks = parseInt(config.querySelector('.interval-weeks').value);
            
            // Get starting value from the exercise data
            const exerciseData = selectedDay.exercises.find(ex => ex.name === exerciseName);
            const startingValue = getStartingValue(exerciseData, variable);
            
            // Calculate next increase date from workout start date
            const startDate = new Date(selectedWorkout.createdAt);
            const nextIncreaseDate = new Date(startDate);
            nextIncreaseDate.setDate(nextIncreaseDate.getDate() + (intervalWeeks * 7));
            
            exercises[exerciseName] = {
                variable: variable,
                increaseAmount: increaseAmount,
                intervalWeeks: intervalWeeks,
                startingValue: startingValue,
                currentValue: startingValue,
                startDate: startDate.toISOString().split('T')[0],
                nextIncreaseDate: nextIncreaseDate.toISOString().split('T')[0],
                lastIncreased: null,
                enabled: true
            };
        }
    });
    
    if (Object.keys(exercises).length === 0) {
        showNotification('Please enable at least one exercise', 'error');
        return;
    }
    
    try {
        let existingPlans = [];
        
        if (window.fitnessAppAPI && window.fitnessAppAPI.readProgressionPlans) {
            existingPlans = await window.fitnessAppAPI.readProgressionPlans();
        } else {
            const saved = localStorage.getItem('progressionPlans');
            existingPlans = saved ? JSON.parse(saved) : [];
        }
        
        // Remove existing plan for this day if it exists
        const filteredPlans = existingPlans.filter(plan => 
            !(plan.workoutId === selectedWorkout.id && plan.dayId === selectedDay.id)
        );
        
        // Create new plan
        const progressionPlan = {
            id: `progression-${Date.now()}`,
            workoutId: selectedWorkout.id,
            workoutName: selectedWorkout.name,
            dayId: selectedDay.id,
            dayName: selectedDay.name,
            exercises: exercises,
            startDate: new Date(selectedWorkout.createdAt).toISOString().split('T')[0],
            createdAt: new Date().toISOString()
        };
        
        filteredPlans.push(progressionPlan);
        
        // Save
        if (window.fitnessAppAPI && window.fitnessAppAPI.saveProgressionPlans) {
            await window.fitnessAppAPI.saveProgressionPlans(filteredPlans);
        } else {
            localStorage.setItem('progressionPlans', JSON.stringify(filteredPlans));
        }
        
        showNotification('Progression plan saved!', 'success');
        
        // Clear checkbox states
        Object.keys(exercises).forEach(name => {
            const key = `progression-${selectedWorkout.id}-${selectedDay.id}-${name}`;
            localStorage.removeItem(key);
        });
        
        // Reset and reload
        showStep(1);
        loadActivePlans();
        
    } catch (error) {
        console.error('Error saving progression plan:', error);
        showNotification('Error saving progression plan', 'error');
    }
}

function getStartingValue(exercise, variable) {
    const values = {
        'weight': parseFloat(exercise.weight) || 0,
        'reps': parseInt(exercise.reps) || 0,
        'sets': parseInt(exercise.sets) || 0,
        'rest': parseInt(exercise.rest) || 0
    };
    return values[variable] || 0;
}

function showStep(stepNumber) {
    document.querySelectorAll('.setup-step').forEach(step => {
        step.style.display = 'none';
    });
    document.getElementById(`step${stepNumber}`).style.display = 'block';
}

function openPhotosModal() {
    document.getElementById('photosModal').style.display = 'flex';
}

function closePhotosModal() {
    document.getElementById('photosModal').style.display = 'none';
}

function showNotification(message, type = 'info') {
    const notification = document.createElement('div');
    notification.textContent = message;
    notification.style.cssText = `
        position: fixed; top: 20px; right: 20px; padding: 12px 20px;
        background: ${type === 'error' ? '#e74c3c' : type === 'success' ? '#2ecc71' : '#3498db'};
        color: white; border-radius: 5px; z-index: 10000;
    `;
    document.body.appendChild(notification);
    setTimeout(() => notification.remove(), 3000);
}

// Make deletePlan globally available
window.deletePlan = deletePlan;