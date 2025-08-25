// Calendar-Based Workout Creator functionality
console.log("Calendar Workout Creator JS loaded");

// Initialize variables
let workoutPlans = [];
let savedDays = [];
let currentWorkoutId = null;
let currentWeek = 1; // Track current week (1 or 2)
let selectedDayElement = null;

// DOM Elements
const backButton = document.getElementById('backButton');
const workoutNameInput = document.getElementById('workout-name');
const prevWeekBtn = document.getElementById('prevWeekBtn');
const nextWeekBtn = document.getElementById('nextWeekBtn');
const weekTitle = document.querySelector('.calendar-navigation h3');
const saveWorkoutBtn = document.getElementById('saveWorkoutBtn');
const clearFormBtn = document.getElementById('clearFormBtn');
const savedWorkoutsList = document.getElementById('saved-workouts-list');
const dayModal = document.getElementById('dayModal');
const modalClose = document.getElementById('modalClose');
const dayTypeOptions = document.getElementById('day-type-options');
const week1Grid = document.querySelector('.week-1');
const week2Grid = document.querySelector('.week-2');

// Initialize application
// Initialize application
async function initApp() {
    console.log("Initializing Calendar Workout Creator...");
    
    try {
        // Check if API is available
        if (!window.fitnessAppAPI) {
            console.warn("fitnessAppAPI not found, using mock data");
            // Load mock data for development
            savedDays = [
                { id: 'day-1', name: 'Arm Day', icon: '💪' },
                { id: 'day-2', name: 'Leg Day', icon: '🦵' },
                { id: 'day-3', name: 'Cardio', icon: '🏃' }
            ];
            workoutPlans = [];
        } else {
            // Load saved days and workout plans
            savedDays = await window.fitnessAppAPI.readWorkoutData();
            workoutPlans = await window.fitnessAppAPI.readWorkoutPlans();
        }
        
        console.log("Saved days loaded:", savedDays);
        console.log("Workout plans loaded:", workoutPlans);
        
        // Set up event listeners
        setupEventListeners();
        
        // Show initial week
        showWeek(currentWeek);
        
        // Load saved workouts
        renderSavedWorkouts();
        
    } catch (error) {
        console.error("Error initializing app:", error);
        // Fallback to mock data
        savedDays = [
            { id: 'day-1', name: 'Arm Day', icon: '💪' },
            { id: 'day-2', name: 'Leg Day', icon: '🦵' },
            { id: 'day-3', name: 'Cardio', icon: '🏃' }
        ];
        workoutPlans = [];
        
        // Set up event listeners
        setupEventListeners();
        
        // Show initial week
        showWeek(currentWeek);
        
        // Load saved workouts
        renderSavedWorkouts();
    }
}

// Set up event listeners
function setupEventListeners() {
    backButton.addEventListener('click', goBack);
    prevWeekBtn.addEventListener('click', showPreviousWeek);
    nextWeekBtn.addEventListener('click', showNextWeek);
    saveWorkoutBtn.addEventListener('click', saveWorkout);
    clearFormBtn.addEventListener('click', clearCurrentWeek);
    modalClose.addEventListener('click', closeModal);
    
    // Day click events
    document.querySelectorAll('.calendar-day').forEach(day => {
        day.addEventListener('click', handleDayClick);
    });
    
    // Close modal when clicking outside
    dayModal.addEventListener('click', function(e) {
        if (e.target === dayModal) {
            closeModal();
        }
    });
}

// Navigation functions
function goBack() {
    window.history.back();
}

function showPreviousWeek() {
    if (currentWeek > 1) {
        currentWeek--;
        showWeek(currentWeek);
    }
}

function showNextWeek() {
    if (currentWeek < 2) {
        currentWeek++;
        showWeek(currentWeek);
    }
}

// Show specific week (1 or 2)
// Show specific week (1 or 2)
function showWeek(weekNumber) {
    // Update UI
    weekTitle.textContent = `Week ${weekNumber} of 2`;
    
    // Enable/disable navigation buttons
    prevWeekBtn.disabled = weekNumber === 1;
    nextWeekBtn.disabled = weekNumber === 2;
    
    // Update button text
    prevWeekBtn.textContent = weekNumber === 2 ? '← Week 1' : '← Week 1';
    nextWeekBtn.textContent = weekNumber === 1 ? 'Week 2 →' : 'Week 2 →';
    
    // Show/hide week grids
    if (weekNumber === 1) {
        week1Grid.style.display = 'grid';
        week2Grid.style.display = 'none';
    } else {
        week1Grid.style.display = 'none';
        week2Grid.style.display = 'grid';
    }
    
    // Load data for this week if we have a workout plan
    if (currentWorkoutId) {
        loadWeekData(weekNumber);
    }
}

// Load data for a specific week
function loadWeekData(weekNumber) {
    const workoutPlan = workoutPlans.find(w => w.id === currentWorkoutId);
    if (!workoutPlan) return;
    
    const startIndex = (weekNumber - 1) * 7;
    const weekDays = document.querySelectorAll(`.week-${weekNumber} .calendar-day`);
    
    weekDays.forEach((dayElement, index) => {
        const globalIndex = startIndex + index;
        const daySchedule = workoutPlan.schedule[globalIndex];
        
        if (daySchedule) {
            if (daySchedule.dayId) {
                dayElement.querySelector('.day-icon').textContent = daySchedule.icon || '🏋️';
                dayElement.querySelector('.day-name').textContent = daySchedule.dayName;
                dayElement.classList.remove('rest-day');
            } else {
                dayElement.querySelector('.day-icon').textContent = '🛌';
                dayElement.querySelector('.day-name').textContent = 'Rest Day';
                dayElement.classList.add('rest-day');
            }
        } else {
            dayElement.querySelector('.day-icon').textContent = '❓';
            dayElement.querySelector('.day-name').textContent = 'Click to assign';
            dayElement.classList.remove('rest-day');
        }
    });
}

// Handle day click
function handleDayClick(event) {
    selectedDayElement = event.currentTarget;
    const week = parseInt(selectedDayElement.dataset.week);
    const day = parseInt(selectedDayElement.dataset.day);
    
    openDayModal(week, day);
}

// Open modal to select day type
function openDayModal(week, day) {
    dayTypeOptions.innerHTML = '';
    
    // Add rest day option
    const restOption = document.createElement('div');
    restOption.className = 'day-type-option';
    restOption.innerHTML = `
        <div class="day-type-option-icon">🛌</div>
        <div>Rest Day</div>
    `;
    restOption.addEventListener('click', () => assignDayToCalendar(null));
    dayTypeOptions.appendChild(restOption);
    
    // Add saved days options
    if (savedDays && savedDays.length > 0) {
        savedDays.forEach(day => {
            const dayOption = document.createElement('div');
            dayOption.className = 'day-type-option';
            dayOption.innerHTML = `
                <div class="day-type-option-icon">${day.icon || '🏋️'}</div>
                <div>${day.name}</div>
            `;
            dayOption.addEventListener('click', () => assignDayToCalendar(day.id));
            dayTypeOptions.appendChild(dayOption);
        });
    } else {
        // Add default options if no saved days
        const defaultOptions = [
            { icon: '💪', name: 'Arm Day' },
            { icon: '🦵', name: 'Leg Day' },
            { icon: '🏃', name: 'Cardio' },
            { icon: '🧘', name: 'Yoga/Stretch' }
        ];
        
        defaultOptions.forEach(option => {
            const dayOption = document.createElement('div');
            dayOption.className = 'day-type-option';
            dayOption.innerHTML = `
                <div class="day-type-option-icon">${option.icon}</div>
                <div>${option.name}</div>
            `;
            dayOption.addEventListener('click', () => {
                // Create a temporary day object
                const tempDay = { 
                    id: 'temp-' + Date.now(), 
                    name: option.name, 
                    icon: option.icon 
                };
                assignDayToCalendar(tempDay);
            });
            dayTypeOptions.appendChild(dayOption);
        });
    }
    
    dayModal.style.display = 'flex';
}

// Open modal to select day type
function openDayModal(week, day) {
    dayTypeOptions.innerHTML = '';
    
    // Add rest day option
    const restOption = document.createElement('div');
    restOption.className = 'day-type-option';
    restOption.innerHTML = `
        <div class="day-type-option-icon">🛌</div>
        <div>Rest Day</div>
    `;
    restOption.addEventListener('click', () => assignDayToCalendar(null));
    dayTypeOptions.appendChild(restOption);
    
    // Add saved days options
    savedDays.forEach(day => {
        const dayOption = document.createElement('div');
        dayOption.className = 'day-type-option';
        dayOption.innerHTML = `
            <div class="day-type-option-icon">${day.icon || '🏋️'}</div>
            <div>${day.name}</div>
        `;
        dayOption.addEventListener('click', () => assignDayToCalendar(day.id));
        dayTypeOptions.appendChild(dayOption);
    });
    
    dayModal.style.display = 'flex';
}

// Close modal
function closeModal() {
    dayModal.style.display = 'none';
}

// Assign day to calendar
function assignDayToCalendar(dayId) {
    if (!selectedDayElement) return;
    
    const week = parseInt(selectedDayElement.dataset.week);
    const dayIndex = parseInt(selectedDayElement.dataset.day) - 1;
    const globalIndex = (week - 1) * 7 + dayIndex;
    
    if (!currentWorkoutId) {
        // Create a new workout plan if none is being edited
        currentWorkoutId = 'workout-' + Date.now();
        workoutPlans.push({
            id: currentWorkoutId,
            name: workoutNameInput.value || 'New Workout Plan',
            schedule: Array(14).fill(null),
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString()
        });
    }
    
    const workoutPlan = workoutPlans.find(w => w.id === currentWorkoutId);
    
    if (dayId) {
        const dayData = savedDays.find(d => d.id === dayId);
        workoutPlan.schedule[globalIndex] = {
            dayId: dayId,
            dayName: dayData.name,
            icon: dayData.icon || '🏋️'
        };
        
        // Update UI
        selectedDayElement.querySelector('.day-icon').textContent = dayData.icon || '🏋️';
        selectedDayElement.querySelector('.day-name').textContent = dayData.name;
        selectedDayElement.classList.remove('rest-day');
    } else {
        workoutPlan.schedule[globalIndex] = {
            dayId: null,
            dayName: 'Rest Day',
            icon: '🛌'
        };
        
        // Update UI
        selectedDayElement.querySelector('.day-icon').textContent = '🛌';
        selectedDayElement.querySelector('.day-name').textContent = 'Rest Day';
        selectedDayElement.classList.add('rest-day');
    }
    
    workoutPlan.updatedAt = new Date().toISOString();
    closeModal();
}

// Render saved workouts
function renderSavedWorkouts() {
    savedWorkoutsList.innerHTML = '';
    
    if (workoutPlans.length === 0) {
        savedWorkoutsList.innerHTML = '<p>No saved workout plans yet. Create your first plan above!</p>';
        return;
    }
    
    workoutPlans.forEach(plan => {
        const workoutHTML = `
            <div class="workout-plan-card">
                <h3>${plan.name}</h3>
                <p>${plan.schedule.filter(day => day && day.dayId).length} workout days</p>
                <div class="workout-actions">
                    <button class="action-btn edit-workout-btn">Edit</button>
                    <button class="action-btn btn-secondary delete-workout-btn">Delete</button>
                    <button class="action-btn apply-workout-btn">Apply as Current</button>
                </div>
            </div>
        `;
        
        savedWorkoutsList.insertAdjacentHTML('beforeend', workoutHTML);
        
        // Add event listeners
        const workoutCard = savedWorkoutsList.lastElementChild;
        workoutCard.querySelector('.edit-workout-btn').addEventListener('click', () => loadWorkout(plan.id));
        workoutCard.querySelector('.delete-workout-btn').addEventListener('click', () => deleteWorkout(plan.id));
        workoutCard.querySelector('.apply-workout-btn').addEventListener('click', () => applyWorkout(plan.id));
    });
}

// Load workout for editing
function loadWorkout(workoutId) {
    const workout = workoutPlans.find(w => w.id === workoutId);
    if (!workout) {
        alert("Workout plan not found!");
        return;
    }
    
    currentWorkoutId = workoutId;
    workoutNameInput.value = workout.name;
    currentWeek = 1;
    showWeek(currentWeek);
    loadWeekData(currentWeek);
}

// Delete workout plan
async function deleteWorkout(workoutId) {
    if (confirm('Are you sure you want to delete this workout plan?')) {
        workoutPlans = workoutPlans.filter(plan => plan.id !== workoutId);
        
        try {
            const result = await window.fitnessAppAPI.saveWorkoutPlans(workoutPlans);
            
            if (result.success) {
                if (currentWorkoutId === workoutId) {
                    clearForm();
                }
                renderSavedWorkouts();
                alert("Workout plan deleted successfully!");
            } else {
                alert("Error deleting workout plan: " + result.error);
            }
        } catch (error) {
            alert("Error deleting workout plan: " + error.message);
        }
    }
}

// Apply workout as current plan
async function applyWorkout(workoutId) {
    const workout = workoutPlans.find(w => w.id === workoutId);
    if (!workout) {
        alert("Workout plan not found!");
        return;
    }
    
    try {
        const result = await window.fitnessAppAPI.saveCurrentWorkout(workout);
        
        if (result.success) {
            alert(`"${workout.name}" is now your current workout plan!`);
        } else {
            alert("Error applying workout plan: " + result.error);
        }
    } catch (error) {
        alert("Error applying workout plan: " + error.message);
    }
}

// Clear form
function clearForm() {
    workoutNameInput.value = '';
    currentWorkoutId = null;
    currentWeek = 1;
    showWeek(currentWeek);
    
    // Reset all days
    document.querySelectorAll('.calendar-day').forEach(day => {
        day.querySelector('.day-icon').textContent = '❓';
        day.querySelector('.day-name').textContent = 'Click to assign';
        day.classList.remove('rest-day');
    });
}

// Load data for a specific week
function loadWeekData(weekNumber) {
    const workoutPlan = workoutPlans.find(w => w.id === currentWorkoutId);
    if (!workoutPlan) return;
    
    const startIndex = (weekNumber - 1) * 7;
    const weekDays = document.querySelectorAll(`.week-${weekNumber} .calendar-day`);
    
    weekDays.forEach((dayElement, index) => {
        const globalIndex = startIndex + index;
        const daySchedule = workoutPlan.schedule[globalIndex];
        
        if (daySchedule) {
            if (daySchedule.dayId) {
                dayElement.querySelector('.day-icon').textContent = daySchedule.icon || '🏋️';
                dayElement.querySelector('.day-name').textContent = daySchedule.dayName;
                dayElement.classList.remove('rest-day');
            } else {
                dayElement.querySelector('.day-icon').textContent = '🛌';
                dayElement.querySelector('.day-name').textContent = 'Rest Day';
                dayElement.classList.add('rest-day');
            }
        } else {
            dayElement.querySelector('.day-icon').textContent = '❓';
            dayElement.querySelector('.day-name').textContent = 'Click to assign';
            dayElement.classList.remove('rest-day');
        }
    });
}

// Clear current week
function clearCurrentWeek() {
    if (confirm('Are you sure you want to clear this week?')) {
        if (currentWorkoutId) {
            const workoutPlan = workoutPlans.find(w => w.id === currentWorkoutId);
            const startIndex = (currentWeek - 1) * 7;
            
            // Clear the week data
            for (let i = 0; i < 7; i++) {
                workoutPlan.schedule[startIndex + i] = null;
            }
            
            workoutPlan.updatedAt = new Date().toISOString();
            
            // Update UI
            loadWeekData(currentWeek);
        } else {
            // Just reset the UI for the current week
            const weekDays = document.querySelectorAll(`.week-${currentWeek} .calendar-day`);
            weekDays.forEach(dayElement => {
                dayElement.querySelector('.day-icon').textContent = '❓';
                dayElement.querySelector('.day-name').textContent = 'Click to assign';
                dayElement.classList.remove('rest-day');
            });
        }
    }
}

// Save workout plan
async function saveWorkout() {
    const workoutName = workoutNameInput.value.trim();
    if (!workoutName) {
        alert("Please enter a name for your workout plan");
        return;
    }
    
    if (!currentWorkoutId) {
        alert("Please create a workout plan by assigning days to the calendar first");
        return;
    }
    
    const workoutPlan = workoutPlans.find(w => w.id === currentWorkoutId);
    workoutPlan.name = workoutName;
    
    // Save to file
    try {
        const result = await window.fitnessAppAPI.saveWorkoutPlans(workoutPlans);
        
        if (result.success) {
            alert(`"${workoutName}" saved successfully!`);
            renderSavedWorkouts();
        } else {
            alert("Error saving workout plan: " + result.error);
        }
    } catch (error) {
        alert("Error saving workout plan: " + error.message);
    }
}


// The rest of your existing functions (renderSavedWorkouts, loadWorkout, deleteWorkout, applyWorkout)
// remain unchanged from your original file

// Initialize the app when DOM is loaded
document.addEventListener('DOMContentLoaded', initApp);