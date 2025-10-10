// progressive.js - Updated with arrow navigation system

let selectedWorkout = null;
let selectedDay = null;
let progressionSettings = {};
let editingPlan = null;
let activePlans = [];
let currentPlanIndex = 0;

document.addEventListener('DOMContentLoaded', function() {
    console.log('Progressive Overload page loaded');
    
    // Set up event listeners
    document.getElementById('backButton').addEventListener('click', () => {
        window.location.href = 'index.html';
    });
    
    document.getElementById('backToStep1')?.addEventListener('click', () => showStep(1));
    document.getElementById('backToStep2')?.addEventListener('click', () => showStep(2));
    document.getElementById('saveProgressionBtn')?.addEventListener('click', saveProgressionPlan);
    document.getElementById('photosHeaderBtn').addEventListener('click', openPhotosModal);
    document.getElementById('closePhotosModal')?.addEventListener('click', closePhotosModal);
    document.getElementById('closeEditModal')?.addEventListener('click', closeEditModal);
    
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
    const navigation = document.getElementById('plansNavigation');
    
    activePlans = plans;
    
    if (!plans || plans.length === 0) {
        container.innerHTML = '<p class="no-data">No active progression plans. Create one below.</p>';
        navigation.style.display = 'none';
        return;
    }
    
    // Show navigation if we have multiple plans
    if (plans.length > 1) {
        navigation.style.display = 'flex';
        document.getElementById('totalPlans').textContent = plans.length;
        
        // Add event listeners for navigation
        document.getElementById('prevPlan').addEventListener('click', showPreviousPlan);
        document.getElementById('nextPlan').addEventListener('click', showNextPlan);
    } else {
        navigation.style.display = 'none';
    }
    
    // Reset to first plan
    currentPlanIndex = 0;
    showCurrentPlan();
}

function showCurrentPlan() {
    const container = document.getElementById('activePlans');
    const plan = activePlans[currentPlanIndex];
    
    if (!plan) return;
    
    // Update navigation counter
    document.getElementById('currentPlanIndex').textContent = currentPlanIndex + 1;
    
    const enabledExercises = Object.entries(plan.exercises).filter(([_, ex]) => ex.enabled);
    
    container.innerHTML = `
        <div class="progression-plan-card active">
            <div class="plan-header">
                <h4>${plan.workoutName} - ${plan.dayName}</h4>
                <p class="plan-meta"><strong>Start Date:</strong> ${new Date(plan.startDate).toLocaleDateString()}</p>
                <p class="plan-meta"><strong>Active Exercises:</strong> ${enabledExercises.length}</p>
            </div>
            
            <div class="exercise-progression-list">
                ${enabledExercises.map(([name, ex]) => `
                    <div class="exercise-progression-item">
                        <div class="exercise-name">${name}</div>
                        <div class="exercise-details">
                            ${ex.variable} increases by ${ex.increaseAmount} every ${ex.intervalWeeks} weeks
                            <br><strong>Current:</strong> ${ex.currentValue} ${getVariableUnit(ex.variable)}
                            ${ex.nextIncreaseDate ? `<br><strong>Next Increase:</strong> ${new Date(ex.nextIncreaseDate).toLocaleDateString()}` : ''}
                        </div>
                    </div>
                `).join('')}
            </div>
            
            <div class="plan-actions">
                <button class="action-btn btn-secondary" onclick="editPlan('${plan.id}')">Edit Plan</button>
                <button class="action-btn btn-danger" onclick="deletePlan('${plan.id}')">Delete Plan</button>
            </div>
        </div>
    `;
}

function showPreviousPlan() {
    if (activePlans.length <= 1) return;
    
    currentPlanIndex = currentPlanIndex > 0 ? currentPlanIndex - 1 : activePlans.length - 1;
    showCurrentPlan();
}

function showNextPlan() {
    if (activePlans.length <= 1) return;
    
    currentPlanIndex = currentPlanIndex < activePlans.length - 1 ? currentPlanIndex + 1 : 0;
    showCurrentPlan();
}

async function editPlan(planId) {
    try {
        let plans = [];
        
        if (window.fitnessAppAPI && window.fitnessAppAPI.readProgressionPlans) {
            plans = await window.fitnessAppAPI.readProgressionPlans();
        } else {
            const saved = localStorage.getItem('progressionPlans');
            plans = saved ? JSON.parse(saved) : [];
        }
        
        editingPlan = plans.find(p => p.id === planId);
        
        if (!editingPlan) {
            showNotification('Plan not found', 'error');
            return;
        }
        
        displayEditModal(editingPlan);
        
    } catch (error) {
        console.error('Error loading plan for editing:', error);
        showNotification('Error loading plan', 'error');
    }
}

function displayEditModal(plan) {
    const container = document.getElementById('editPlanContent');
    container.innerHTML = '';
    
    const exercises = Object.entries(plan.exercises);
    
    exercises.forEach(([name, ex]) => {
        const exerciseCard = document.createElement('div');
        exerciseCard.className = 'exercise-config';
        
        exerciseCard.innerHTML = `
            <div class="exercise-header">
                <h4>${name}</h4>
                <label class="toggle-label">
                    <input type="checkbox" class="enable-progression" data-exercise="${name}" ${ex.enabled ? 'checked' : ''}>
                    Enable Progression
                </label>
            </div>
            
            <div class="progression-settings" style="display: ${ex.enabled ? 'block' : 'none'}">
                <p><strong>Current Value:</strong> ${ex.currentValue} ${getVariableUnit(ex.variable)}</p>
                
                <div class="form-group">
                    <label>Variable to Increase:</label>
                    <select class="progression-variable" data-exercise="${name}">
                        <option value="weight" ${ex.variable === 'weight' ? 'selected' : ''}>Weight</option>
                        <option value="reps" ${ex.variable === 'reps' ? 'selected' : ''}>Reps</option>
                        <option value="sets" ${ex.variable === 'sets' ? 'selected' : ''}>Sets</option>
                        <option value="rest" ${ex.variable === 'rest' ? 'selected' : ''}>Rest Time</option>
                    </select>
                </div>
                
                <div class="form-group">
                    <label>Increase Amount:</label>
                    <input type="number" min="0.5" step="0.5" value="${ex.increaseAmount}" 
                           class="increase-amount" data-exercise="${name}">
                </div>
                
                <div class="form-group">
                    <label>Increase Interval (weeks):</label>
                    <input type="number" min="1" value="${ex.intervalWeeks}" 
                           class="interval-weeks" data-exercise="${name}">
                </div>
            </div>
        `;
        
        container.appendChild(exerciseCard);
        
        // Add toggle functionality
        const checkbox = exerciseCard.querySelector('.enable-progression');
        const settings = exerciseCard.querySelector('.progression-settings');
        
        checkbox.addEventListener('change', function() {
            settings.style.display = this.checked ? 'block' : 'none';
        });
    });
    
    // Add save button
    const saveButton = document.createElement('button');
    saveButton.className = 'action-btn';
    saveButton.textContent = 'Save Changes';
    saveButton.onclick = () => saveEditedPlan(plan.id);
    
    container.appendChild(saveButton);
    
    // Show modal
    document.getElementById('editPlanModal').style.display = 'flex';
}

async function saveEditedPlan(planId) {
    try {
        let plans = [];
        
        if (window.fitnessAppAPI && window.fitnessAppAPI.readProgressionPlans) {
            plans = await window.fitnessAppAPI.readProgressionPlans();
        } else {
            const saved = localStorage.getItem('progressionPlans');
            plans = saved ? JSON.parse(saved) : [];
        }
        
        const planIndex = plans.findIndex(p => p.id === planId);
        if (planIndex === -1) {
            showNotification('Plan not found', 'error');
            return;
        }
        
        // Update exercises configuration
        const updatedExercises = {};
        
        document.querySelectorAll('#editPlanContent .exercise-config').forEach(config => {
            const checkbox = config.querySelector('.enable-progression');
            const exerciseName = checkbox.dataset.exercise;
            
            if (checkbox.checked) {
                const variable = config.querySelector('.progression-variable').value;
                const increaseAmount = parseFloat(config.querySelector('.increase-amount').value);
                const intervalWeeks = parseInt(config.querySelector('.interval-weeks').value);
                
                // Keep existing current value and dates
                const existingExercise = plans[planIndex].exercises[exerciseName];
                
                updatedExercises[exerciseName] = {
                    ...existingExercise,
                    variable: variable,
                    increaseAmount: increaseAmount,
                    intervalWeeks: intervalWeeks,
                    enabled: true
                };
            } else {
                // Disable the exercise but keep the data
                updatedExercises[exerciseName] = {
                    ...plans[planIndex].exercises[exerciseName],
                    enabled: false
                };
            }
        });
        
        if (Object.keys(updatedExercises).filter(([_, ex]) => ex.enabled).length === 0) {
            showNotification('Please enable at least one exercise', 'error');
            return;
        }
        
        // Update the plan
        plans[planIndex].exercises = updatedExercises;
        plans[planIndex].updatedAt = new Date().toISOString();
        
        // Save
        if (window.fitnessAppAPI && window.fitnessAppAPI.saveProgressionPlans) {
            await window.fitnessAppAPI.saveProgressionPlans(plans);
        } else {
            localStorage.setItem('progressionPlans', JSON.stringify(plans));
        }
        
        showNotification('Progression plan updated!', 'success');
        closeEditModal();
        loadActivePlans();
        
    } catch (error) {
        console.error('Error saving edited plan:', error);
        showNotification('Error updating plan', 'error');
    }
}

function closeEditModal() {
    document.getElementById('editPlanModal').style.display = 'none';
    editingPlan = null;
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
        card.innerHTML = `
            <div class="day-card-content">
                <span class="day-icon">${day.icon || '🏋️'}</span>
                <div class="day-info">
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
        
        const exerciseId = `exercise-${index}`;
        
        exerciseCard.innerHTML = `
            <div class="exercise-header">
                <h4>${exercise.name}</h4>
                <label class="toggle-label">
                    <input type="checkbox" class="enable-progression" data-exercise="${exercise.name}" id="${exerciseId}">
                    Enable Progression
                </label>
            </div>
            
            <div class="progression-settings" id="settings-${exerciseId}">
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
        
        // Hide settings initially
        settings.style.display = 'none';
        
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
    
    // Initialize the photos system
    if (typeof window.loadCurrentFolder === 'function') {
        window.loadCurrentFolder();
    }
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

// Make functions globally available
window.deletePlan = deletePlan;
window.editPlan = editPlan;