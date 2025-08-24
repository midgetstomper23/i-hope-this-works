// Calendar-Based Workout Creator functionality
console.log("Calendar Workout Creator JS loaded");

// Initialize variables
let workoutPlans = [];
let savedDays = [];
let currentWorkoutId = null;
let currentWeek = 1;
let selectedDayIndex = null;

// DOM Elements
const backButton = document.getElementById('backButton');
const workoutNameInput = document.getElementById('workout-name');
const prevWeekBtn = document.getElementById('prevWeekBtn');
const nextWeekBtn = document.getElementById('nextWeekBtn');
const weekTitle = document.querySelector('.calendar-navigation h3');
const calendarDays = document.getElementById('calendar-days');
const saveWorkoutBtn = document.getElementById('saveWorkoutBtn');
const clearFormBtn = document.getElementById('clearFormBtn');
const savedWorkoutsList = document.getElementById('saved-workouts-list');
const dayModal = document.getElementById('dayModal');
const modalClose = document.getElementById('modalClose');
const dayTypeOptions = document.getElementById('day-type-options');

// Day names for the schedule
const dayNames = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];

// Initialize application
async function initApp() {
    console.log("Initializing Calendar Workout Creator...");
    
    try {
        // Load saved days and workout plans
        savedDays = await window.fitnessAppAPI.readWorkoutData();
        workoutPlans = await window.fitnessAppAPI.readWorkoutPlans();
        
        console.log("Saved days loaded:", savedDays);
        console.log("Workout plans loaded:", workoutPlans);
        
        // Render the calendar
        renderCalendar();
        
        // Load saved workouts
        renderSavedWorkouts();
        
        // Set up event listeners
        setupEventListeners();
        
    } catch (error) {
        console.error("Error initializing app:", error);
        alert("Error loading data. Please check console for details.");
    }
}

// Set up event listeners
function setupEventListeners() {
    backButton.addEventListener('click', goBack);
    prevWeekBtn.addEventListener('click', showPreviousWeek);
    nextWeekBtn.addEventListener('click', showNextWeek);
    saveWorkoutBtn.addEventListener('click', saveWorkout);
    clearFormBtn.addEventListener('click', clearCalendar);
    modalClose.addEventListener('click', closeModal);
    
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
        renderCalendar();
    }
}

function showNextWeek() {
    if (currentWeek < 2) {
        currentWeek++;
        renderCalendar();
    }
}

// Render the calendar
function renderCalendar() {
    weekTitle.textContent = `Week ${currentWeek}`;
    calendarDays.innerHTML = '';
    
    // Create 14 days (2 weeks)
    for (let i = 0; i < 14; i++) {
        const dayNumber = i + 1;
        const week = Math.floor(i / 7) + 1;
        
        // Only show days for the current week
        if (week !== currentWeek) {
            // Add empty placeholder for days not in current week
            const emptyDay = document.createElement('div');
            emptyDay.className = 'empty-day';
            calendarDays.appendChild(emptyDay);
            continue;
        }
        
        const dayElement = document.createElement('div');
        dayElement.className = 'calendar-day';
        dayElement.dataset.index = i;
        
        // Check if we have a workout day for this date
        const workoutPlan = currentWorkoutId ? 
            workoutPlans.find(w => w.id === currentWorkoutId) : null;
        
        let dayContent = '';
        if (workoutPlan && workoutPlan.schedule[i]) {
            const daySchedule = workoutPlan.schedule[i];
            if (daySchedule.dayId) {
                const dayData = savedDays.find(d => d.id === daySchedule.dayId);
                const dayIcon = dayData.icon || '🏋️';
                dayContent = `
                    <div class="calendar-day-content">
                        <div class="day-icon">${dayIcon}</div>
                        <div class="day-name">${dayData.name}</div>
                    </div>
                `;
            } else {
                dayContent = `
                    <div class="calendar-day-content">
                        <div class="day-icon">🛌</div>
                        <div class="day-name">Rest Day</div>
                    </div>
                `;
                dayElement.classList.add('rest-day');
            }
        } else {
            dayContent = `
                <div class="calendar-day-content">
                    <div class="day-icon">❓</div>
                    <div class="day-name">Click to assign</div>
                </div>
            `;
        }
        
        dayElement.innerHTML = `
            <div class="calendar-day-number">${dayNumber}</div>
            ${dayContent}
        `;
        
        dayElement.addEventListener('click', () => openDayModal(i));
        calendarDays.appendChild(dayElement);
    }
}

// Open modal to select day type
function openDayModal(dayIndex) {
    selectedDayIndex = dayIndex;
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
    if (!currentWorkoutId) {
        // Create a new workout plan if none is being edited
        currentWorkoutId = 'workout-' + Date.now();
        workoutPlans.push({
            id: currentWorkoutId,
            name: workoutNameInput.value || 'New Workout Plan',
            schedule: Array(14).fill(null).map(() => ({ dayId: null, dayName: '' })),
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString()
        });
    }
    
    const workoutPlan = workoutPlans.find(w => w.id === currentWorkoutId);
    if (dayId) {
        const dayData = savedDays.find(d => d.id === dayId);
        workoutPlan.schedule[selectedDayIndex] = {
            dayId: dayId,
            dayName: dayData.name
        };
    } else {
        workoutPlan.schedule[selectedDayIndex] = {
            dayId: null,
            dayName: 'Rest Day'
        };
    }
    
    workoutPlan.updatedAt = new Date().toISOString();
    closeModal();
    renderCalendar();
}

// Clear calendar
function clearCalendar() {
    if (confirm('Are you sure you want to clear the calendar?')) {
        if (currentWorkoutId) {
            const workoutPlan = workoutPlans.find(w => w.id === currentWorkoutId);
            workoutPlan.schedule = Array(14).fill(null).map(() => ({ dayId: null, dayName: '' }));
            renderCalendar();
        } else {
            // Create a new empty plan
            currentWorkoutId = 'workout-' + Date.now();
            workoutPlans.push({
                id: currentWorkoutId,
                name: workoutNameInput.value || 'New Workout Plan',
                schedule: Array(14).fill(null).map(() => ({ dayId: null, dayName: '' })),
                createdAt: new Date().toISOString(),
                updatedAt: new Date().toISOString()
            });
            renderCalendar();
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
                <p>${plan.schedule.filter(day => day.dayId).length} workout days</p>
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
    renderCalendar();
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
    renderCalendar();
}

// Initialize the app when DOM is loaded
document.addEventListener('DOMContentLoaded', initApp);