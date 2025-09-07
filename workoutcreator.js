// Calendar-Based Workout Creator functionality
console.log("Calendar Workout Creator JS loaded");

// Initialize variables
let workoutPlans = [];
let savedDays = [];
let currentWorkoutId = null;
let currentWeek = 1;
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
async function initApp() {
    console.log("Initializing Calendar Workout Creator...");
    
    try {
        if (!window.fitnessAppAPI) {
            console.warn("fitnessAppAPI not found, using mock data");
            savedDays = [
                { id: 'day-1', name: 'Arm Day', icon: '💪' },
                { id: 'day-2', name: 'Leg Day', icon: '🦵' },
                { id: 'day-3', name: 'Cardio', icon: '🏃' }
            ];
            workoutPlans = [];
        } else {
            savedDays = await window.fitnessAppAPI.readWorkoutData();
            workoutPlans = await window.fitnessAppAPI.readWorkoutPlans();
        }
        
        console.log("Saved days loaded:", savedDays);
        console.log("Workout plans loaded:", workoutPlans);
        
        setupEventListeners();
        showWeek(currentWeek);
        renderSavedWorkouts();
        
    } catch (error) {
        console.error("Error initializing app:", error);
        savedDays = [
            { id: 'day-1', name: 'Arm Day', icon: '💪' },
            { id: 'day-2', name: 'Leg Day', icon: '🦵' },
            { id: 'day-3', name: 'Cardio', icon: '🏃' }
        ];
        workoutPlans = [];
        
        setupEventListeners();
        showWeek(currentWeek);
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
    
    document.querySelectorAll('.calendar-day').forEach(function(day) {
        day.addEventListener('click', handleDayClick);
    });
    
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
    currentWeek = currentWeek === 1 ? 2 : 1;
    showWeek(currentWeek);
}

function showNextWeek() {
    currentWeek = currentWeek === 1 ? 2 : 1;
    showWeek(currentWeek);
}

function showWeek(weekNumber) {
    weekTitle.textContent = "Week " + weekNumber + " of 2";
    prevWeekBtn.disabled = false;
    nextWeekBtn.disabled = false;
    prevWeekBtn.textContent = "← Switch Week";
    nextWeekBtn.textContent = "Switch Week →";
    
    if (weekNumber === 1) {
        week1Grid.style.display = 'grid';
        week2Grid.style.display = 'none';
    } else {
        week1Grid.style.display = 'none';
        week2Grid.style.display = 'grid';
    }
    
    if (currentWorkoutId) {
        loadWeekData(weekNumber);
    }
}

function handleDayClick(event) {
    selectedDayElement = event.currentTarget;
    var week = parseInt(selectedDayElement.dataset.week);
    var day = parseInt(selectedDayElement.dataset.day);
    openDayModal(week, day);
}

function openDayModal(week, day) {
    dayTypeOptions.innerHTML = '';
    
    // Add rest day option
    var restOption = document.createElement('div');
    restOption.className = 'day-type-option';
    restOption.innerHTML = '<div class="day-type-option-icon">🛌</div><div>Rest Day</div>';
    restOption.addEventListener('click', function() {
        assignDayToCalendar(null);
    });
    dayTypeOptions.appendChild(restOption);
    
    // Add saved days options
    if (savedDays && savedDays.length > 0) {
        savedDays.forEach(function(day) {
            var dayOption = document.createElement('div');
            dayOption.className = 'day-type-option';
            dayOption.innerHTML = '<div class="day-type-option-icon">' + (day.icon || '🏋️') + '</div><div>' + day.name + '</div>';
            dayOption.addEventListener('click', function() {
                assignDayToCalendar(day.id);
            });
            dayTypeOptions.appendChild(dayOption);
        });
    } else {
        var defaultOptions = [
            { icon: '💪', name: 'Arm Day' },
            { icon: '🦵', name: 'Leg Day' },
            { icon: '🏃', name: 'Cardio' },
            { icon: '🧘', name: 'Yoga/Stretch' }
        ];
        
        defaultOptions.forEach(function(option) {
            var dayOption = document.createElement('div');
            dayOption.className = 'day-type-option';
            dayOption.innerHTML = '<div class="day-type-option-icon">' + option.icon + '</div><div>' + option.name + '</div>';
            dayOption.addEventListener('click', function() {
                var tempDay = { 
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

function closeModal() {
    dayModal.style.display = 'none';
}

function assignDayToCalendar(dayId) {
    if (!selectedDayElement) return;
    
    var week = parseInt(selectedDayElement.dataset.week);
    var dayIndex = parseInt(selectedDayElement.dataset.day) - 1;
    var globalIndex = (week - 1) * 7 + dayIndex;
    
    if (!currentWorkoutId) {
        currentWorkoutId = 'workout-' + Date.now();
        workoutPlans.push({
            id: currentWorkoutId,
            name: workoutNameInput.value || 'New Workout Plan',
            schedule: Array(14).fill(null),
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString()
        });
    }
    
    var workoutPlan = workoutPlans.find(function(w) { return w.id === currentWorkoutId; });
    
    if (dayId) {
        var dayData = savedDays.find(function(d) { return d.id === dayId; });
        workoutPlan.schedule[globalIndex] = {
            dayId: dayId,
            dayName: dayData.name,
            icon: dayData.icon || '🏋️'
        };
        
        selectedDayElement.querySelector('.day-icon').textContent = dayData.icon || '🏋️';
        selectedDayElement.querySelector('.day-name').textContent = dayData.name;
        selectedDayElement.classList.remove('rest-day');
    } else {
        workoutPlan.schedule[globalIndex] = {
            dayId: null,
            dayName: 'Rest Day',
            icon: '🛌'
        };
        
        selectedDayElement.querySelector('.day-icon').textContent = '🛌';
        selectedDayElement.querySelector('.day-name').textContent = 'Rest Day';
        selectedDayElement.classList.add('rest-day');
    }
    
    workoutPlan.updatedAt = new Date().toISOString();
    closeModal();
}

function loadWeekData(weekNumber) {
    var workoutPlan = workoutPlans.find(function(w) { return w.id === currentWorkoutId; });
    if (!workoutPlan) return;
    
    var startIndex = (weekNumber - 1) * 7;
    var weekDays = document.querySelectorAll('.week-' + weekNumber + ' .calendar-day');
    
    weekDays.forEach(function(dayElement, index) {
        var globalIndex = startIndex + index;
        var daySchedule = workoutPlan.schedule[globalIndex];
        
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

function clearCurrentWeek() {
    if (confirm('Are you sure you want to clear this week?')) {
        if (currentWorkoutId) {
            var workoutPlan = workoutPlans.find(function(w) { return w.id === currentWorkoutId; });
            var startIndex = (currentWeek - 1) * 7;
            
            for (var i = 0; i < 7; i++) {
                workoutPlan.schedule[startIndex + i] = null;
            }
            
            workoutPlan.updatedAt = new Date().toISOString();
            loadWeekData(currentWeek);
        } else {
            var weekDays = document.querySelectorAll('.week-' + currentWeek + ' .calendar-day');
            weekDays.forEach(function(dayElement) {
                dayElement.querySelector('.day-icon').textContent = '❓';
                dayElement.querySelector('.day-name').textContent = 'Click to assign';
                dayElement.classList.remove('rest-day');
            });
        }
    }
}

async function saveWorkout() {
    var workoutName = workoutNameInput.value.trim();
    if (!workoutName) {
        showNotification("Please enter a name for your workout plan");
        return;
    }
    
    if (!currentWorkoutId) {
        showNotification("Please create a workout plan by assigning days to the calendar first");
        return;
    }
    
    var workoutPlan = workoutPlans.find(function(w) { return w.id === currentWorkoutId; });
    workoutPlan.name = workoutName;
    
    try {
        var result = await window.fitnessAppAPI.saveWorkoutPlans(workoutPlans);
        
        if (result.success) {
            showNotification('"' + workoutName + '" saved successfully!');
            renderSavedWorkouts();
        } else {
            showNotification("Error saving workout plan: " + result.error);
        }
    } catch (error) {
        showNotification("Error saving workout plan: " + error.message);
    }
}

function renderSavedWorkouts() {
    savedWorkoutsList.innerHTML = '';
    
    if (workoutPlans.length === 0) {
        savedWorkoutsList.innerHTML = '<p>No saved workout plans yet. Create your first plan above!</p>';
        return;
    }
    
    workoutPlans.forEach(function(plan) {
        var workoutHTML = '<div class="workout-plan-card">' +
            '<h3>' + plan.name + '</h3>' +
            '<p>' + plan.schedule.filter(function(day) { return day && day.dayId; }).length + ' workout days</p>' +
            '<div class="workout-actions">' +
            '<button class="action-btn edit-workout-btn">Edit</button>' +
            '<button class="action-btn btn-secondary delete-workout-btn">Delete</button>' +
            '<button class="action-btn apply-workout-btn">Apply as Current</button>' +
            '</div></div>';
        
        savedWorkoutsList.insertAdjacentHTML('beforeend', workoutHTML);
        
        var workoutCard = savedWorkoutsList.lastElementChild;
        workoutCard.querySelector('.edit-workout-btn').addEventListener('click', function() {
            loadWorkout(plan.id);
        });
        workoutCard.querySelector('.delete-workout-btn').addEventListener('click', function() {
            deleteWorkout(plan.id);
        });
        workoutCard.querySelector('.apply-workout-btn').addEventListener('click', function() {
            applyWorkout(plan.id);
        });
    });
}

function loadWorkout(workoutId) {
    var workout = workoutPlans.find(function(w) { return w.id === workoutId; });
    if (!workout) {
        showNotification("Workout plan not found!");
        return;
    }
    
    currentWorkoutId = workoutId;
    workoutNameInput.value = workout.name;
    currentWeek = 1;
    showWeek(currentWeek);
    loadWeekData(currentWeek);
}

async function deleteWorkout(workoutId) {
    if (confirm('Are you sure you want to delete this workout plan?')) {
        workoutPlans = workoutPlans.filter(function(plan) { return plan.id !== workoutId; });
        
        try {
            var result = await window.fitnessAppAPI.saveWorkoutPlans(workoutPlans);
            
            if (result.success) {
                if (currentWorkoutId === workoutId) {
                    clearForm();
                }
                renderSavedWorkouts();
                showNotification("Workout plan deleted successfully!");
            } else {
                showNotification("Error deleting workout plan: " + result.error);
            }
        } catch (error) {
            showNotification("Error deleting workout plan: " + error.message);
        }
    }
}

async function applyWorkout(workoutId) {
    var workout = workoutPlans.find(function(w) { return w.id === workoutId; });
    if (!workout) {
        showNotification("Workout plan not found!");
        return;
    }
    
    try {
        var result = await window.fitnessAppAPI.saveCurrentWorkout(workout);
        
        if (result.success) {
            showNotification('"' + workout.name + '" is now your current workout plan!');
        } else {
            showNotification("Error applying workout plan: " + result.error);
        }
    } catch (error) {
        showNotification("Error applying workout plan: " + error.message);
    }
}

function clearForm() {
    workoutNameInput.value = '';
    currentWorkoutId = null;
    currentWeek = 1;
    showWeek(currentWeek);
    
    document.querySelectorAll('.calendar-day').forEach(function(day) {
        day.querySelector('.day-icon').textContent = '❓';
        day.querySelector('.day-name').textContent = 'Click to assign';
        day.classList.remove('rest-day');
    });
}

// Initialize the app when DOM is loaded
document.addEventListener('DOMContentLoaded', initApp);