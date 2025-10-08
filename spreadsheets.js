// spreadsheets.js - Updated for new single-exercise focused layout
console.log('📊 Spreadsheets page loaded');

let selectedWorkout = null;
let selectedYear = null;
let selectedExercise = null;
let selectedDayType = null;
let workoutData = [];

document.addEventListener('DOMContentLoaded', function() {
    console.log('📋 Initializing spreadsheet page...');
    
    // Set up event listeners
    document.getElementById('backButton').addEventListener('click', () => {
        window.location.href = 'analytics.html';
    });
    
    document.getElementById('spreadsheetWorkoutSelect').addEventListener('change', handleWorkoutSelection);
    document.getElementById('exerciseSelect').addEventListener('change', handleExerciseSelection);
    
    // View toggle functionality
    document.querySelectorAll('.view-btn').forEach(btn => {
        btn.addEventListener('click', function() {
            document.querySelectorAll('.view-btn').forEach(b => b.classList.remove('active'));
            this.classList.add('active');
            
            const view = this.dataset.view;
            document.querySelectorAll('.table-view, .stats-view').forEach(v => {
                v.classList.remove('active');
            });
            
            if (view === 'table') {
                document.getElementById('tableView').classList.add('active');
            } else {
                document.getElementById('statsView').classList.add('active');
                if (selectedExercise) {
                    displayExerciseStatistics(selectedExercise);
                }
            }
        });
    });
    
    // Load initial data
    loadWorkoutPlans();
});

async function loadWorkoutPlans() {
    console.log('🔄 Loading workout plans...');
    
    try {
        let workoutPlans = [];
        
        if (window.fitnessAppAPI && window.fitnessAppAPI.readWorkoutPlans) {
            workoutPlans = await window.fitnessAppAPI.readWorkoutPlans();
        } else {
            const savedPlans = localStorage.getItem('workoutPlans');
            workoutPlans = savedPlans ? JSON.parse(savedPlans) : [];
        }
        
        console.log('📋 Found workout plans:', workoutPlans);
        
        const select = document.getElementById('spreadsheetWorkoutSelect');
        select.innerHTML = '<option value="">-- Choose a workout plan --</option>';
        
        if (workoutPlans.length === 0) {
            showMessage('No workout plans found. Create one in Workout Builder first.');
            return;
        }
        
        workoutPlans.forEach(plan => {
            const option = document.createElement('option');
            option.value = plan.id;
            option.textContent = plan.name;
            select.appendChild(option);
        });
        
    } catch (error) {
        console.error('Error loading workout plans:', error);
        showMessage('Error loading workout plans', 'error');
    }
}

async function handleWorkoutSelection() {
    const workoutId = document.getElementById('spreadsheetWorkoutSelect').value;
    
    if (!workoutId) {
        resetDisplay();
        return;
    }
    
    try {
        // Load workout plan
        let workoutPlans = [];
        if (window.fitnessAppAPI && window.fitnessAppAPI.readWorkoutPlans) {
            workoutPlans = await window.fitnessAppAPI.readWorkoutPlans();
        } else {
            const saved = localStorage.getItem('workoutPlans');
            workoutPlans = saved ? JSON.parse(saved) : [];
        }
        
        selectedWorkout = workoutPlans.find(p => p.id === workoutId);
        
        if (!selectedWorkout) {
            showMessage('Workout plan not found', 'error');
            return;
        }
        
        // Load workout history for this plan
        await loadWorkoutHistory(workoutId);
        
        // Populate exercises dropdown
        populateExercisesDropdown();
        
        // Display year and day type tabs
        displayYearTabs();
        displayDayTypeTabs();
        
    } catch (error) {
        console.error('Error handling workout selection:', error);
        showMessage('Error loading workout data', 'error');
    }
}

async function loadWorkoutHistory(workoutId) {
    try {
        let history = [];
        let workoutDays = [];
        
        // Load history
        if (window.fitnessAppAPI && window.fitnessAppAPI.readWorkoutHistory) {
            history = await window.fitnessAppAPI.readWorkoutHistory();
        } else {
            const saved = localStorage.getItem('workoutHistory');
            history = saved ? JSON.parse(saved) : [];
        }
        
        // Load workout days to get day names
        if (window.fitnessAppAPI && window.fitnessAppAPI.readWorkoutData) {
            workoutDays = await window.fitnessAppAPI.readWorkoutData();
        } else {
            const saved = localStorage.getItem('workoutData');
            workoutDays = saved ? JSON.parse(saved) : [];
        }
        
        // Filter by workout ID and enrich with day names
        workoutData = history.filter(session => session.workoutId === workoutId).map(session => {
            // If dayName is missing, look it up from dayId
            if (!session.dayName && session.dayId) {
                const day = workoutDays.find(d => d.id === session.dayId);
                if (day) {
                    session.dayName = day.name;
                }
            }
            return session;
        });
        
        console.log(`Found ${workoutData.length} sessions for this workout`);
        
    } catch (error) {
        console.error('Error loading workout history:', error);
        workoutData = [];
    }
}

function populateExercisesDropdown() {
    const exerciseSelect = document.getElementById('exerciseSelect');
    exerciseSelect.innerHTML = '<option value="">-- Select an exercise --</option>';
    
    if (workoutData.length === 0) return;
    
    // Get all unique exercises
    const exercises = new Set();
    workoutData.forEach(session => {
        session.exercises.forEach(ex => exercises.add(ex.name));
    });
    
    exercises.forEach(exercise => {
        const option = document.createElement('option');
        option.value = exercise;
        option.textContent = exercise;
        exerciseSelect.appendChild(option);
    });
}

function displayYearTabs() {
    const container = document.getElementById('yearTabs');
    
    if (workoutData.length === 0) {
        container.innerHTML = '<div class="no-tabs-message">No workout sessions found</div>';
        return;
    }
    
    // Get workout start year
    const startYear = new Date(selectedWorkout.createdAt).getFullYear();
    const currentYear = new Date().getFullYear();
    
    // Create year tabs
    container.innerHTML = '';
    
    for (let year = startYear; year <= currentYear; year++) {
        const yearSessions = workoutData.filter(session => {
            return new Date(session.date).getFullYear() === year;
        });
        
        if (yearSessions.length > 0) {
            const yearTab = document.createElement('button');
            yearTab.className = 'day-tab year-tab';
            yearTab.textContent = `${year} (${yearSessions.length})`;
            yearTab.onclick = () => {
                document.querySelectorAll('#yearTabs .year-tab').forEach(t => t.classList.remove('active'));
                yearTab.classList.add('active');
                selectedYear = year;
                if (selectedExercise) {
                    displayExerciseData(selectedExercise);
                }
            };
            container.appendChild(yearTab);
        }
    }
    
    // Auto-select most recent year
    document.querySelector('#yearTabs .year-tab:last-child')?.classList.add('active');
    selectedYear = currentYear;
}

function displayDayTypeTabs() {
    const container = document.getElementById('dayTypeTabs');
    
    if (workoutData.length === 0) {
        container.innerHTML = '<div class="no-tabs-message">No workout sessions found</div>';
        return;
    }
    
    // Group by day type
    const dayGroups = {};
    workoutData.forEach(session => {
        const dayName = session.dayName || 'Unknown Day';
        if (!dayGroups[dayName]) {
            dayGroups[dayName] = [];
        }
        dayGroups[dayName].push(session);
    });
    
    // Create day type tabs
    container.innerHTML = '';
    
    Object.keys(dayGroups).forEach(dayName => {
        const dayTab = document.createElement('button');
        dayTab.className = 'day-tab';
        dayTab.textContent = `${dayName} (${dayGroups[dayName].length})`;
        dayTab.onclick = () => {
            document.querySelectorAll('#dayTypeTabs .day-tab').forEach(t => t.classList.remove('active'));
            dayTab.classList.add('active');
            selectedDayType = dayName;
            if (selectedExercise) {
                displayExerciseData(selectedExercise);
            }
        };
        container.appendChild(dayTab);
    });
    
    // Auto-select first day type
    document.querySelector('#dayTypeTabs .day-tab:first-child')?.classList.add('active');
    selectedDayType = Object.keys(dayGroups)[0];
}

function handleExerciseSelection() {
    const exerciseName = document.getElementById('exerciseSelect').value;
    selectedExercise = exerciseName;
    
    if (!exerciseName) {
        resetExerciseDisplay();
        return;
    }
    
    displayExerciseData(exerciseName);
}

function displayExerciseData(exerciseName) {
    // Update title
    document.getElementById('currentExerciseTitle').textContent = exerciseName;
    
    // Filter sessions based on selected year and day type
    let filteredSessions = workoutData.filter(session => {
        const sessionYear = new Date(session.date).getFullYear();
        const matchesYear = !selectedYear || sessionYear === selectedYear;
        const matchesDayType = !selectedDayType || session.dayName === selectedDayType;
        return matchesYear && matchesDayType;
    });
    
    // Sort by date (newest first)
    filteredSessions.sort((a, b) => new Date(b.date) - new Date(a.date));
    
    // Display exercise table
    displayExerciseTable(exerciseName, filteredSessions);
    
    // Update exercise stats
    updateExerciseStats(exerciseName, filteredSessions);
    
    // If in stats view, update statistics
    if (document.querySelector('.view-btn[data-view="stats"]').classList.contains('active')) {
        displayExerciseStatistics(exerciseName);
    }
}

function displayExerciseTable(exerciseName, sessions) {
    const tableBody = document.getElementById('exerciseTableBody');
    
    if (!sessions || sessions.length === 0) {
        tableBody.innerHTML = '<tr><td colspan="7" class="no-data-message">No sessions found for selected filters</td></tr>';
        return;
    }
    
    tableBody.innerHTML = '';
    
    sessions.forEach((session, index) => {
        const exercise = session.exercises.find(ex => ex.name === exerciseName);
        if (!exercise) return;
        
        const row = document.createElement('tr');
        const sessionDate = new Date(session.date);
        
        // Calculate progression from previous session with same day type
        let progression = '';
        if (index < sessions.length - 1) {
            const prevSession = sessions[index + 1];
            const prevExercise = prevSession.exercises.find(ex => ex.name === exerciseName);
            if (prevExercise && exercise.weight > prevExercise.weight) {
                const increase = exercise.weight - prevExercise.weight;
                progression = `<span class="progression-up">+${increase} lbs</span>`;
            }
        }
        
        row.innerHTML = `
            <td>${sessionDate.toLocaleDateString()}</td>
            <td>${session.dayName || 'Unknown'}</td>
            <td>${exercise.weight || '-'} lbs</td>
            <td>${exercise.reps || '-'}</td>
            <td>${exercise.sets || '-'}</td>
            <td>${progression}</td>
            <td><span class="completion-badge completed">✓</span></td>
        `;
        
        tableBody.appendChild(row);
    });
}

function updateExerciseStats(exerciseName, sessions) {
    const statsContainer = document.getElementById('exerciseStats');
    
    if (!sessions || sessions.length === 0) {
        statsContainer.innerHTML = '';
        return;
    }
    
    // Calculate stats
    const exerciseSessions = sessions.filter(session => 
        session.exercises.some(ex => ex.name === exerciseName)
    );
    
    const weights = exerciseSessions
        .map(session => {
            const ex = session.exercises.find(e => e.name === exerciseName);
            return ex ? ex.weight : 0;
        })
        .filter(weight => weight > 0);
    
    const maxWeight = weights.length > 0 ? Math.max(...weights) : 0;
    const minWeight = weights.length > 0 ? Math.min(...weights) : 0;
    const totalGain = maxWeight - minWeight;
    
    statsContainer.innerHTML = `
        <div class="exercise-stat">Sessions: ${exerciseSessions.length}</div>
        <div class="exercise-stat">Max Weight: ${maxWeight} lbs</div>
        <div class="exercise-stat">Total Gain: +${totalGain} lbs</div>
    `;
}

function displayExerciseStatistics(exerciseName) {
    const statsContainer = document.getElementById('exerciseStatsView');
    
    // Filter sessions for this exercise
    const exerciseSessions = workoutData.filter(session => 
        session.exercises.some(ex => ex.name === exerciseName)
    );
    
    if (exerciseSessions.length === 0) {
        statsContainer.innerHTML = '<div class="no-data-message">No statistics available for this exercise</div>';
        return;
    }
    
    // Calculate detailed statistics
    const weights = exerciseSessions
        .map(session => {
            const ex = session.exercises.find(e => e.name === exerciseName);
            return ex ? ex.weight : 0;
        })
        .filter(weight => weight > 0);
    
    const maxWeight = Math.max(...weights);
    const minWeight = Math.min(...weights);
    const avgWeight = weights.reduce((a, b) => a + b, 0) / weights.length;
    
    // Group by month for trend analysis
    const monthlyData = {};
    exerciseSessions.forEach(session => {
        const date = new Date(session.date);
        const monthKey = `${date.getFullYear()}-${date.getMonth() + 1}`;
        const exercise = session.exercises.find(e => e.name === exerciseName);
        
        if (!monthlyData[monthKey]) {
            monthlyData[monthKey] = {
                maxWeight: 0,
                sessions: 0
            };
        }
        
        if (exercise && exercise.weight > monthlyData[monthKey].maxWeight) {
            monthlyData[monthKey].maxWeight = exercise.weight;
        }
        monthlyData[monthKey].sessions++;
    });
    
    let statsHTML = `
        <div class="stats-grid">
            <div class="stat-item">
                <div class="stat-value">${exerciseSessions.length}</div>
                <div class="stat-label">Total Sessions</div>
            </div>
            <div class="stat-item">
                <div class="stat-value">${maxWeight.toFixed(1)}</div>
                <div class="stat-label">Max Weight (lbs)</div>
            </div>
            <div class="stat-item">
                <div class="stat-value">${minWeight.toFixed(1)}</div>
                <div class="stat-label">Min Weight (lbs)</div>
            </div>
            <div class="stat-item">
                <div class="stat-value">${avgWeight.toFixed(1)}</div>
                <div class="stat-label">Avg Weight (lbs)</div>
            </div>
            <div class="stat-item">
                <div class="stat-value">+${(maxWeight - minWeight).toFixed(1)}</div>
                <div class="stat-label">Total Progression</div>
            </div>
        </div>
    `;
    
    statsContainer.innerHTML = statsHTML;
}

function resetDisplay() {
    document.getElementById('yearTabs').innerHTML = '<div class="no-tabs-message">Select a workout plan</div>';
    document.getElementById('dayTypeTabs').innerHTML = '<div class="no-tabs-message">Select a workout plan</div>';
    document.getElementById('exerciseSelect').innerHTML = '<option value="">-- Select an exercise --</option>';
    resetExerciseDisplay();
}

function resetExerciseDisplay() {
    document.getElementById('currentExerciseTitle').textContent = 'Select an exercise to view data';
    document.getElementById('exerciseTableBody').innerHTML = 
        '<tr><td colspan="7" class="no-data-message">Select an exercise to view data</td></tr>';
    document.getElementById('exerciseStatsView').innerHTML = 
        '<div class="no-data-message">No statistics available</div>';
    document.getElementById('exerciseStats').innerHTML = '';
}

function showMessage(message, type = 'info') {
    const notification = document.createElement('div');
    notification.textContent = message;
    notification.style.cssText = `
        position: fixed; top: 20px; right: 20px; padding: 12px 20px;
        background: ${type === 'error' ? '#e74c3c' : '#3498db'};
        color: white; border-radius: 5px; z-index: 10000;
    `;
    document.body.appendChild(notification);
    setTimeout(() => notification.remove(), 3000);
}