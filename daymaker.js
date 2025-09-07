// Day Maker functionality with file-based storage
console.log("Day Maker JS loaded");

// Initialize variables
let workoutDays = [];
let currentDayId = null;

// DOM Elements
const dayNameInput = document.getElementById('day-name');
const dayIconInput = document.getElementById('day-icon');
const exercisesContainer = document.getElementById('exercises-container');
const savedDaysList = document.getElementById('saved-days-list');
const backButton = document.getElementById('backButton');
const addExerciseBtn = document.getElementById('addExerciseBtn');
const saveDayBtn = document.getElementById('saveDayBtn');
const clearFormBtn = document.getElementById('clearFormBtn');
const iconGrid = document.getElementById('icon-grid');
const iconOptions = iconGrid.querySelectorAll('.icon-option');

function setupIconSelection() {
    const iconGrid = document.getElementById('icon-grid');
    const iconOptions = iconGrid.querySelectorAll('.icon-option');
    const dayIconInput = document.getElementById('day-icon');

    iconOptions.forEach(option => {
        option.addEventListener('click', () => {
            iconOptions.forEach(opt => opt.classList.remove('selected'));
            option.classList.add('selected');
            dayIconInput.value = option.dataset.icon;
        });
    });

    // Set default icon (last one)
    if (iconOptions.length > 0) {
        iconOptions[iconOptions.length - 1].classList.add('selected');
        dayIconInput.value = iconOptions[iconOptions.length - 1].dataset.icon;
    }
}


// Initialize application
async function initApp() {
    console.log("Initializing Day Maker...");
    
    try {
        // Load data from file
        workoutDays = await window.fitnessAppAPI.readWorkoutData();
        console.log("Workout days loaded:", workoutDays);
        
        // Set up icon selection
        setupIconSelection();
        
        // Add first exercise
        addExercise();
        
        // Load saved days
        renderSavedDays();
        
        // Set up event listeners
        setupEventListeners();
        
    } catch (error) {
        console.error("Error initializing app:", error);
        showNotification("Error loading workout data. Please check console for details.");
    }
}

// Set up icon selection
function setupIconSelection() {
    iconOptions.forEach(option => {
        option.addEventListener('click', () => {
            // Remove selected class from all options
            iconOptions.forEach(opt => opt.classList.remove('selected'));
            
            // Add selected class to clicked option
            option.classList.add('selected');
            
            // Set the hidden input value
            dayIconInput.value = option.dataset.icon;
        });
    });
    
    // Set default selected icon
    iconOptions[iconOptions.length - 1].classList.add('selected'); // Select Strength icon by default
}

// Set up event listeners
function setupEventListeners() {
    backButton.addEventListener('click', goBack);
    addExerciseBtn.addEventListener('click', addExercise);
    saveDayBtn.addEventListener('click', saveDay);
    clearFormBtn.addEventListener('click', clearForm);
}

// Navigation functions
function goBack() {
    window.history.back();
}

// Exercise management
function addExercise(exerciseData = null) {
    const exerciseCount = exercisesContainer.children.length + 1;
    
    const exerciseHTML = `
        <div class="exercise">
            <div class="exercise-header">
                <h4>Exercise #${exerciseCount}</h4>
                <button type="button" class="remove-exercise">Remove</button>
            </div>
            <div class="exercise-fields">
                <div class="form-group">
                    <label>Exercise Name</label>
                    <input type="text" placeholder="e.g., Bicep Curls" 
                           value="${exerciseData ? exerciseData.name : ''}">
                </div>
                <div class="form-group">
                    <label>Sets</label>
                    <input type="number" min="1" 
                           value="${exerciseData ? exerciseData.sets : '3'}">
                </div>
                <div class="form-group">
                    <label>Reps</label>
                    <input type="number" min="1" 
                           value="${exerciseData ? exerciseData.reps : '10'}">
                </div>
                <div class="form-group">
                    <label>Weight (lbs)</label>
                    <input type="number" min="0" placeholder="Enter weight" 
                           value="${exerciseData ? exerciseData.weight : ''}">
                </div>
                <div class="form-group">
                    <label>Rest Time (seconds)</label>
                    <input type="number" min="0" 
                           value="${exerciseData ? exerciseData.rest : '60'}">
                </div>
                <div class="form-group">
                    <label>Notes (optional)</label>
                    <input type="text" placeholder="Any special instructions" 
                           value="${exerciseData ? exerciseData.notes : ''}">
                </div>
            </div>
        </div>
    `;
    
    exercisesContainer.insertAdjacentHTML('beforeend', exerciseHTML);
    
    // Add event listener to remove button
    const newExercise = exercisesContainer.lastElementChild;
    const removeBtn = newExercise.querySelector('.remove-exercise');
    removeBtn.addEventListener('click', function() {
        this.closest('.exercise').remove();
        renumberExercises();
    });
}

// Renumber exercises after removal
function renumberExercises() {
    const exercises = document.querySelectorAll('.exercise');
    exercises.forEach((exercise, index) => {
        exercise.querySelector('h4').textContent = `Exercise #${index + 1}`;
    });
}

// Clear form
function clearForm() {
    dayNameInput.value = '';
    exercisesContainer.innerHTML = '';
    currentDayId = null;
    
    // Reset icon to default
    iconOptions.forEach(opt => opt.classList.remove('selected'));
    iconOptions[iconOptions.length - 1].classList.add('selected');
    dayIconInput.value = '🏋️';
    
    // Add one empty exercise
    addExercise();
}

// Save day
async function saveDay() {
    const dayName = dayNameInput.value.trim();
    const dayIcon = dayIconInput.value;
    
    if (!dayName) {
        showNotification("Please enter a name for your day");
        return;
    }
    
    // Collect exercise data
    const exercises = [];
    const exerciseElements = document.querySelectorAll('.exercise');
    
    exerciseElements.forEach(exercise => {
        const inputs = exercise.querySelectorAll('input');
        exercises.push({
            name: inputs[0].value,
            sets: inputs[1].value,
            reps: inputs[2].value,
            weight: inputs[3].value,
            rest: inputs[4].value,
            notes: inputs[5].value
        });
    });
    
    // Create or update day
    const dayId = currentDayId || 'day-' + Date.now();
    const workoutDay = {
        id: dayId,
        name: dayName,
        icon: dayIcon, // Store the selected icon
        exercises: exercises,
        createdAt: currentDayId ? workoutDays.find(d => d.id === currentDayId).createdAt : new Date().toISOString(),
        updatedAt: new Date().toISOString()
    };
    
    // Update or add to array
    if (currentDayId) {
        const index = workoutDays.findIndex(day => day.id === currentDayId);
        if (index !== -1) {
            workoutDays[index] = workoutDay;
        }
    } else {
        workoutDays.push(workoutDay);
    }
    
    // Save to file
    try {
        const result = await window.fitnessAppAPI.saveWorkoutData(workoutDays);
        
        if (result.success) {
            showNotification(`"${dayName}" saved successfully with ${exercises.length} exercises!`);
            clearForm();
            renderSavedDays();
        } else {
            showNotification("Error saving day: " + result.error);
        }
    } catch (error) {
        showNotification("Error saving day: " + error.message);
    }
}

// Render saved days
function renderSavedDays() {
    savedDaysList.innerHTML = '';
    
    if (workoutDays.length === 0) {
        savedDaysList.innerHTML = '<p>No saved days yet. Create your first day above!</p>';
        return;
    }
    
    workoutDays.forEach(day => {
        const exerciseSummary = day.exercises.map(ex => 
            `<div class="exercise-item">${ex.name}: ${ex.sets} sets × ${ex.reps} reps</div>`
        ).join('');
        
        const dayCardHTML = `
            <div class="day-card">
                <div class="day-card-header">
                    <span class="day-icon-preview">${day.icon || '🏋️'}</span>
                    <h3>${day.name}</h3>
                </div>
                <div class="exercise-list">${exerciseSummary}</div>
                <div class="day-actions">
                    <button class="action-btn edit-btn">Edit</button>
                    <button class="action-btn btn-secondary delete-btn">Delete</button>
                </div>
            </div>
        `;
        
        savedDaysList.insertAdjacentHTML('beforeend', dayCardHTML);
        
        // Add event listeners
        const dayCard = savedDaysList.lastElementChild;
        dayCard.querySelector('.edit-btn').addEventListener('click', () => loadDay(day.id));
        dayCard.querySelector('.delete-btn').addEventListener('click', () => deleteDay(day.id));
    });
}

// Load day for editing
function loadDay(dayId) {
    const day = workoutDays.find(d => d.id === dayId);
    if (!day) {
        showNotification("Day not found!");
        return;
    }
    
    currentDayId = dayId;
    dayNameInput.value = day.name;
    
    // Set the icon
    iconOptions.forEach(opt => {
        opt.classList.remove('selected');
        if (opt.dataset.icon === day.icon) {
            opt.classList.add('selected');
        }
    });
    dayIconInput.value = day.icon || '🏋️';
    
    // Clear existing exercises
    exercisesContainer.innerHTML = '';
    
    // Add exercises from saved day
    day.exercises.forEach(exercise => {
        addExercise(exercise);
    });
    
    document.querySelector('.day-form').scrollIntoView({ behavior: 'smooth' });
}

// Delete day
async function deleteDay(dayId) {
    if (confirm('Are you sure you want to delete this day?')) {
        workoutDays = workoutDays.filter(day => day.id !== dayId);
        
        try {
            const result = await window.fitnessAppAPI.saveWorkoutData(workoutDays);
            
            if (result.success) {
                if (currentDayId === dayId) {
                    clearForm();
                }
                renderSavedDays();
                showNotification("Day deleted successfully!");
            } else {
                showNotification("Error deleting day: " + result.error);
            }
        } catch (error) {
            showNotification("Error deleting day: " + error.message);
        }
    }
}

// Initialize the app when DOM is loaded
document.addEventListener('DOMContentLoaded', initApp);