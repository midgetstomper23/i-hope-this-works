// spreadsheets.js - Rewritten with year-folder system and Electron API
console.log('📊 Spreadsheets page loaded');

let selectedWorkout = null;
let selectedYear = null;
let workoutData = [];

document.addEventListener('DOMContentLoaded', function() {
    console.log('📋 Initializing spreadsheet page...');
    
    // Set up event listeners
    document.getElementById('backButton').addEventListener('click', () => {
        window.location.href = 'analytics.html';
    });
    
    document.getElementById('spreadsheetWorkoutSelect').addEventListener('change', handleWorkoutSelection);
    
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
        
        // Display year folders
        displayYearFolders();
        
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

function displayYearFolders() {
    const container = document.getElementById('spreadsheetTabs');
    
    if (workoutData.length === 0) {
        container.innerHTML = '<div class="no-tabs-message">No workout sessions found for this plan.</div>';
        document.getElementById('spreadsheetBody').innerHTML = 
            '<tr><td colspan="10" class="no-data-message">No data available</td></tr>';
        return;
    }
    
    // Get workout start year
    const startYear = new Date(selectedWorkout.createdAt).getFullYear();
    const currentYear = new Date().getFullYear();
    
    // Create year folders
    container.innerHTML = '<h3>Select Year:</h3>';
    
    for (let year = startYear; year <= currentYear; year++) {
        const yearSessions = workoutData.filter(session => {
            return new Date(session.date).getFullYear() === year;
        });
        
        if (yearSessions.length > 0) {
            const yearTab = document.createElement('button');
            yearTab.className = 'day-tab year-tab';
            yearTab.textContent = `${year} (${yearSessions.length} workouts)`;
            yearTab.onclick = () => {
                document.querySelectorAll('.year-tab').forEach(t => t.classList.remove('active'));
                yearTab.classList.add('active');
                displayYearData(year);
            };
            container.appendChild(yearTab);
        }
    }
    
    // Auto-select most recent year
    const lastYear = currentYear;
    displayYearData(lastYear);
    document.querySelector('.year-tab:last-child')?.classList.add('active');
}

function displayYearData(year) {
    selectedYear = year;
    
    // Filter sessions for this year
    const yearSessions = workoutData.filter(session => {
        return new Date(session.date).getFullYear() === year;
    });
    
    console.log(`Displaying ${yearSessions.length} sessions for year ${year}`);
    
    // Update title
    document.getElementById('currentDayTitle').textContent = `${selectedWorkout.name} - ${year}`;
    
    // Render table
    renderSpreadsheetTable(yearSessions);
    
    // Calculate stats
    calculateStatistics(yearSessions);
    
    // Update summary
    updateSummaryStats(yearSessions);
}

function renderSpreadsheetTable(sessions) {
    const header = document.getElementById('spreadsheetHeader');
    const body = document.getElementById('spreadsheetBody');
    
    header.innerHTML = '';
    body.innerHTML = '';
    
    if (!sessions || sessions.length === 0) {
        body.innerHTML = '<tr><td colspan="10" class="no-data-message">No sessions for this year</td></tr>';
        return;
    }
    
    // Group by day type
    const dayGroups = {};
    sessions.forEach(session => {
        const dayName = session.dayName || 'Unknown Day';
        if (!dayGroups[dayName]) {
            dayGroups[dayName] = [];
        }
        dayGroups[dayName].push(session);
    });
    
    // Remove old day tabs if they exist
    const oldTabs = document.getElementById('dayTypeTabs');
    if (oldTabs) oldTabs.remove();
    
    // Create a tab system for day types
    const dayTabs = document.createElement('div');
    dayTabs.id = 'dayTypeTabs';
    dayTabs.style.cssText = 'display: flex; gap: 10px; margin-bottom: 20px; flex-wrap: wrap;';
    
    Object.keys(dayGroups).forEach((dayName, index) => {
        const tab = document.createElement('button');
        tab.className = 'day-tab';
        tab.textContent = `${dayName} (${dayGroups[dayName].length})`;
        tab.onclick = (e) => {
            document.querySelectorAll('#dayTypeTabs .day-tab').forEach(t => t.classList.remove('active'));
            e.target.classList.add('active');
            renderDayTable(dayGroups[dayName], dayName);
        };
        if (index === 0) tab.classList.add('active');
        dayTabs.appendChild(tab);
    });
    
    // Insert tabs before table
    const tableContainer = document.querySelector('.table-container');
    tableContainer.parentNode.insertBefore(dayTabs, tableContainer);
    
    // Show first day by default
    renderDayTable(dayGroups[Object.keys(dayGroups)[0]], Object.keys(dayGroups)[0]);
}

function renderDayTable(sessions, dayName) {
    const header = document.getElementById('spreadsheetHeader');
    const body = document.getElementById('spreadsheetBody');
    
    header.innerHTML = '';
    body.innerHTML = '';
    
    // Get all unique exercises
    const exercises = new Set();
    sessions.forEach(session => {
        session.exercises.forEach(ex => exercises.add(ex.name));
    });
    
    // Create header
    const headerRow = document.createElement('tr');
    headerRow.innerHTML = '<th>Date</th><th>Completed</th>';
    
    exercises.forEach(exName => {
        headerRow.innerHTML += `<th colspan="3">${exName}</th>`;
    });
    
    header.appendChild(headerRow);
    
    // Create subheader for weight/reps/sets
    const subheaderRow = document.createElement('tr');
    subheaderRow.innerHTML = '<th></th><th></th>';
    
    exercises.forEach(() => {
        subheaderRow.innerHTML += '<th>Weight</th><th>Reps</th><th>Sets</th>';
    });
    
    header.appendChild(subheaderRow);
    
    // Create rows sorted by date (newest first)
    sessions.sort((a, b) => new Date(b.date) - new Date(a.date));
    
    sessions.forEach((session, index) => {
        const row = document.createElement('tr');
        const sessionDate = new Date(session.date);
        const completed = true; // If it's in history, it was completed
        
        row.innerHTML = `
            <td>${sessionDate.toLocaleDateString()}</td>
            <td><span class="completion-badge ${completed ? 'completed' : 'missed'}">
                ${completed ? '✓' : '✗'}
            </span></td>
        `;
        
        exercises.forEach(exName => {
            const exercise = session.exercises.find(ex => ex.name === exName);
            if (exercise) {
                // Calculate progression from previous session
                let progressionIndicator = '';
                if (index < sessions.length - 1) {
                    const prevSession = sessions[index + 1];
                    const prevExercise = prevSession.exercises.find(ex => ex.name === exName);
                    if (prevExercise && exercise.weight > prevExercise.weight) {
                        const increase = exercise.weight - prevExercise.weight;
                        progressionIndicator = ` <span class="progression-up">+${increase}</span>`;
                    }
                }
                
                row.innerHTML += `
                    <td>${exercise.weight || '-'}${progressionIndicator}</td>
                    <td>${exercise.reps || '-'}</td>
                    <td>${exercise.sets || '-'}</td>
                `;
            } else {
                row.innerHTML += '<td>-</td><td>-</td><td>-</td>';
            }
        });
        
        body.appendChild(row);
    });
}

function calculateStatistics(sessions) {
    const statsContainer = document.getElementById('spreadsheetStats');
    
    if (!sessions || sessions.length === 0) {
        statsContainer.innerHTML = '<div class="no-data-message">No statistics available</div>';
        return;
    }
    
    let statsHTML = '<div class="stats-grid">';
    
    // Basic stats
    const totalWorkouts = sessions.length;
    const dateRange = `${formatDate(sessions[sessions.length - 1].date)} - ${formatDate(sessions[0].date)}`;
    
    statsHTML += `
        <div class="stat-item">
            <div class="stat-value">${totalWorkouts}</div>
            <div class="stat-label">Total Workouts</div>
        </div>
        <div class="stat-item">
            <div class="stat-value">${dateRange}</div>
            <div class="stat-label">Date Range</div>
        </div>
    `;
    
    // Exercise-specific stats
    const exerciseStats = {};
    sessions.forEach(session => {
        session.exercises.forEach(ex => {
            if (!exerciseStats[ex.name]) {
                exerciseStats[ex.name] = {
                    maxWeight: 0,
                    minWeight: Infinity,
                    totalSessions: 0
                };
            }
            exerciseStats[ex.name].maxWeight = Math.max(exerciseStats[ex.name].maxWeight, ex.weight || 0);
            exerciseStats[ex.name].minWeight = Math.min(exerciseStats[ex.name].minWeight, ex.weight || Infinity);
            exerciseStats[ex.name].totalSessions++;
        });
    });
    
    Object.entries(exerciseStats).forEach(([name, stats]) => {
        const progression = stats.maxWeight - stats.minWeight;
        statsHTML += `
            <div class="stat-item">
                <div class="stat-value">${stats.maxWeight} lbs</div>
                <div class="stat-label">${name} (Max)</div>
                <div class="stat-sublabel">+${progression} lbs total gain</div>
            </div>
        `;
    });
    
    statsHTML += '</div>';
    statsContainer.innerHTML = statsHTML;
}

function updateSummaryStats(sessions) {
    if (!sessions || sessions.length === 0) {
        document.getElementById('totalWorkouts').textContent = '0';
        document.getElementById('totalExercises').textContent = '0';
        document.getElementById('dateRange').textContent = '-';
        return;
    }
    
    const totalWorkouts = sessions.length;
    const uniqueExercises = new Set();
    sessions.forEach(session => {
        session.exercises.forEach(ex => uniqueExercises.add(ex.name));
    });
    
    const dates = sessions.map(s => new Date(s.date)).sort((a, b) => a - b);
    const dateRange = `${formatDate(dates[0])} - ${formatDate(dates[dates.length - 1])}`;
    
    document.getElementById('totalWorkouts').textContent = totalWorkouts;
    document.getElementById('totalExercises').textContent = uniqueExercises.size;
    document.getElementById('dateRange').textContent = dateRange;
}

function formatDate(dateString) {
    return new Date(dateString).toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric'
    });
}

function resetDisplay() {
    document.getElementById('spreadsheetTabs').innerHTML = '<div class="no-tabs-message">Select a workout plan</div>';
    document.getElementById('spreadsheetBody').innerHTML = 
        '<tr><td colspan="10" class="no-data-message">Select a workout plan</td></tr>';
    document.getElementById('spreadsheetStats').innerHTML = 
        '<div class="no-data-message">No statistics available</div>';
    document.getElementById('totalWorkouts').textContent = '0';
    document.getElementById('totalExercises').textContent = '0';
    document.getElementById('dateRange').textContent = '-';
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
        }
    });
});