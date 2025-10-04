// spreadsheets.js - COMPLETE FILE WITH BUILT-IN DEMO DATA
console.log('📊 Spreadsheets page loaded');

document.addEventListener('DOMContentLoaded', function() {
    console.log('📋 Initializing spreadsheet page...');
    
    // Set up event listeners
    document.getElementById('backButton').addEventListener('click', () => {
        window.location.href = 'analytics.html';
    });
    
    document.getElementById('loadDemoData').addEventListener('click', loadDemoData);
    document.getElementById('spreadsheetWorkoutSelect').addEventListener('change', loadWorkoutData);
    document.getElementById('applyDateFilter').addEventListener('click', applyDateFilter);
    document.getElementById('exportCSV').addEventListener('click', exportToCSV);
    
    // Set default dates
    const today = new Date();
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(today.getDate() - 30);
    document.getElementById('dateFrom').value = thirtyDaysAgo.toISOString().split('T')[0];
    document.getElementById('dateTo').value = today.toISOString().split('T')[0];
    
    // Load initial data
    loadWorkoutPlans();
});

// DEMO DATA IS BUILT RIGHT INTO THIS FUNCTION
async function loadDemoData() {
    console.log('🎮 Loading demo data...');
    
    try {
        // DEMO WORKOUT PLANS DATA
        const demoPlans = [
            {
                id: "demo_plan_1",
                name: "Demo Workout Plan",
                schedule: [
                    {
                        dayId: "day-1757634610452",
                        dayName: "LEG SEX MODE V1",
                        icon: "🦵"
                    },
                    {
                        dayId: "day-1757822976102", 
                        dayName: "PULL DAY SEX V1",
                        icon: "💪"
                    }
                ],
                createdAt: "2024-01-01T00:00:00.000Z"
            }
        ];

        // DEMO WORKOUT SESSIONS DATA (completed workouts with progression)
        const demoData = [
            {
                id: "session-1",
                workoutId: "demo_plan_1",
                dayId: "day-1757634610452",
                dayName: "LEG SEX MODE V1",
                date: "2024-01-15",
                duration: "45 minutes",
                notes: "Great leg workout! Felt strong on squats.",
                exercises: [
                    {
                        name: "Normal Squats",
                        sets: 4,
                        reps: 12,
                        weight: 30,
                        rest: 120
                    },
                    {
                        name: "Calf Raises", 
                        sets: 4,
                        reps: 15,
                        weight: 30,
                        rest: 75
                    },
                    {
                        name: "Bulgarian Split Squats",
                        sets: 3,
                        reps: 8,
                        weight: 20,
                        rest: 120
                    }
                ]
            },
            {
                id: "session-2", 
                workoutId: "demo_plan_1",
                dayId: "day-1757822976102",
                dayName: "PULL DAY SEX V1",
                date: "2024-01-16",
                duration: "50 minutes",
                notes: "Back and biceps feeling pumped!",
                exercises: [
                    {
                        name: "Rows",
                        sets: 4,
                        reps: 15,
                        weight: 35,
                        rest: 120
                    },
                    {
                        name: "Dumbbell Curls",
                        sets: 4,
                        reps: 12,
                        weight: 20,
                        rest: 60
                    },
                    {
                        name: "Face Pulls",
                        sets: 4,
                        reps: 25,
                        weight: 60,
                        rest: 60
                    }
                ]
            },
            {
                id: "session-3",
                workoutId: "demo_plan_1", 
                dayId: "day-1757634610452",
                dayName: "LEG SEX MODE V1",
                date: "2024-01-22",
                duration: "48 minutes",
                notes: "Progressive overload achieved!",
                exercises: [
                    {
                        name: "Normal Squats",
                        sets: 4,
                        reps: 12,
                        weight: 35,  // Increased from 30 to 35
                        rest: 120
                    },
                    {
                        name: "Calf Raises",
                        sets: 4, 
                        reps: 15,
                        weight: 35,  // Increased from 30 to 35
                        rest: 75
                    },
                    {
                        name: "Bulgarian Split Squats",
                        sets: 3,
                        reps: 8, 
                        weight: 25,  // Increased from 20 to 25
                        rest: 120
                    }
                ]
            },
            {
                id: "session-4",
                workoutId: "demo_plan_1",
                dayId: "day-1757822976102",
                dayName: "PULL DAY SEX V1",
                date: "2024-01-23",
                duration: "52 minutes", 
                notes: "Strength increasing steadily",
                exercises: [
                    {
                        name: "Rows",
                        sets: 4,
                        reps: 15,
                        weight: 40,  // Increased from 35 to 40
                        rest: 120
                    },
                    {
                        name: "Dumbbell Curls",
                        sets: 4,
                        reps: 12,
                        weight: 25,  // Increased from 20 to 25
                        rest: 60
                    },
                    {
                        name: "Face Pulls",
                        sets: 4,
                        reps: 25,
                        weight: 65,  // Increased from 60 to 65
                        rest: 60
                    }
                ]
            }
        ];
        
        // Save to localStorage
        localStorage.setItem('workoutPlans', JSON.stringify(demoPlans));
        localStorage.setItem('workoutData', JSON.stringify(demoData));
        
        console.log('✅ DEMO DATA SAVED!');
        console.log('Workout Plans:', demoPlans);
        console.log('Workout Sessions:', demoData);
        
        // Reload the interface
        loadWorkoutPlans();
        
        showNotification('Demo data loaded! Select "Demo Workout Plan" to view your workout history.', 'success');
        
    } catch (error) {
        console.error('Error loading demo data:', error);
        showNotification('Error loading demo data', 'error');
    }
}

function loadWorkoutPlans() {
    console.log('🔄 Loading workout plans...');
    
    try {
        const savedPlans = localStorage.getItem('workoutPlans');
        const workoutPlans = savedPlans ? JSON.parse(savedPlans) : [];
        
        console.log('📋 Found workout plans:', workoutPlans);
        
        const select = document.getElementById('spreadsheetWorkoutSelect');
        select.innerHTML = '<option value="">-- Choose a workout plan --</option>';
        
        if (workoutPlans.length === 0) {
            console.log('No workout plans found');
            document.getElementById('spreadsheetTabs').innerHTML = 
                '<div class="no-tabs-message">No workout plans found. Click "Load Demo Data" to get started!</div>';
            return;
        }
        
        workoutPlans.forEach(plan => {
            console.log('➕ Adding plan:', plan.name);
            const option = document.createElement('option');
            option.value = plan.id;
            option.textContent = plan.name;
            select.appendChild(option);
        });
        
    } catch (error) {
        console.error('Error loading workout plans:', error);
    }
}

function loadWorkoutData() {
    const workoutId = document.getElementById('spreadsheetWorkoutSelect').value;
    console.log('📥 Loading data for workout:', workoutId);
    
    if (!workoutId) {
        resetDisplay();
        return;
    }
    
    try {
        const savedData = localStorage.getItem('workoutData');
        const allWorkoutData = savedData ? JSON.parse(savedData) : [];
        
        console.log('📊 All workout data:', allWorkoutData);
        
        // Filter by workout ID and date range
        const dateFrom = document.getElementById('dateFrom').value;
        const dateTo = document.getElementById('dateTo').value;
        
        const filteredData = allWorkoutData.filter(entry => {
            const matchesWorkout = entry.workoutId === workoutId;
            if (!matchesWorkout) return false;
            
            if (dateFrom || dateTo) {
                const entryDate = new Date(entry.date);
                const fromDate = dateFrom ? new Date(dateFrom) : null;
                const toDate = dateTo ? new Date(dateTo) : null;
                if (toDate) toDate.setHours(23, 59, 59);
                
                const afterFrom = !fromDate || entryDate >= fromDate;
                const beforeTo = !toDate || entryDate <= toDate;
                
                return afterFrom && beforeTo;
            }
            
            return true;
        });
        
        console.log('🎯 Filtered data:', filteredData);
        displayWorkoutData(filteredData);
        
    } catch (error) {
        console.error('Error loading workout data:', error);
    }
}

function displayWorkoutData(workoutData) {
    console.log('🖥️ Displaying workout data:', workoutData);
    
    if (!workoutData || workoutData.length === 0) {
        document.getElementById('spreadsheetBody').innerHTML = 
            '<tr><td colspan="10" class="no-data-message">No workout data found.</td></tr>';
        document.getElementById('spreadsheetTabs').innerHTML = 
            '<div class="no-tabs-message">No data available for selected criteria</div>';
        updateSummaryStats(0, 0, '-');
        return;
    }
    
    // Group by day
    const daysData = {};
    workoutData.forEach(entry => {
        if (!daysData[entry.dayId]) {
            daysData[entry.dayId] = {
                dayName: entry.dayName,
                entries: []
            };
        }
        daysData[entry.dayId].entries.push(entry);
    });
    
    console.log('📁 Days data:', daysData);
    
    // Create day tabs
    const tabsContainer = document.getElementById('spreadsheetTabs');
    tabsContainer.innerHTML = '';
    
    Object.keys(daysData).forEach(dayId => {
        const dayData = daysData[dayId];
        const tab = document.createElement('button');
        tab.className = 'day-tab';
        tab.textContent = dayData.dayName;
        tab.onclick = (e) => {
            document.querySelectorAll('.day-tab').forEach(t => t.classList.remove('active'));
            e.target.classList.add('active');
            showDayData(dayId, dayData);
        };
        tabsContainer.appendChild(tab);
    });
    
    // Show first day
    const firstDayId = Object.keys(daysData)[0];
    if (firstDayId) {
        const firstTab = tabsContainer.querySelector('.day-tab');
        firstTab.classList.add('active');
        showDayData(firstDayId, daysData[firstDayId]);
    }
    
    // Update summary
    updateSummaryStats(workoutData.length, countTotalExercises(workoutData), getDateRange(workoutData));
}

function showDayData(dayId, dayData) {
    console.log('📅 Showing day data:', dayId, dayData);
    
    // Update title
    document.getElementById('currentDayTitle').textContent = dayData.dayName;
    
    // Render table
    renderSpreadsheetTable(dayData.entries);
    
    // Calculate stats
    calculateStatistics(dayData.entries);
}

function renderSpreadsheetTable(entries) {
    const header = document.getElementById('spreadsheetHeader');
    const body = document.getElementById('spreadsheetBody');
    
    header.innerHTML = '';
    body.innerHTML = '';
    
    if (!entries || entries.length === 0) {
        body.innerHTML = '<tr><td colspan="10" class="no-data-message">No data available</td></tr>';
        return;
    }
    
    // Get all unique exercises
    const exercises = new Set();
    entries.forEach(entry => {
        entry.exercises.forEach(ex => exercises.add(ex.name));
    });
    
    // Create header
    const headerRow = document.createElement('tr');
    headerRow.innerHTML = '<th>Date</th><th>Duration</th><th>Notes</th>';
    
    exercises.forEach(exName => {
        headerRow.innerHTML += `<th>${exName} (Weight)</th><th>${exName} (Reps)</th><th>${exName} (Sets)</th>`;
    });
    
    header.appendChild(headerRow);
    
    // Create rows
    entries.forEach(entry => {
        const row = document.createElement('tr');
        row.innerHTML = `
            <td>${formatDate(entry.date)}</td>
            <td>${entry.duration || 'N/A'}</td>
            <td>${entry.notes || ''}</td>
        `;
        
        exercises.forEach(exName => {
            const exercise = entry.exercises.find(ex => ex.name === exName);
            if (exercise) {
                row.innerHTML += `
                    <td>${exercise.weight || ''}</td>
                    <td>${exercise.reps || ''}</td>
                    <td>${exercise.sets || ''}</td>
                `;
            } else {
                row.innerHTML += '<td></td><td></td><td></td>';
            }
        });
        
        body.appendChild(row);
    });
}

function calculateStatistics(entries) {
    const statsContainer = document.getElementById('spreadsheetStats');
    
    if (!entries || entries.length === 0) {
        statsContainer.innerHTML = '<div class="no-data-message">No statistics available</div>';
        return;
    }
    
    let statsHTML = '<div class="stats-grid">';
    
    // Basic stats
    statsHTML += `
        <div class="stat-item">
            <div class="stat-value">${entries.length}</div>
            <div class="stat-label">Workouts</div>
        </div>
    `;
    
    // Exercise stats
    const exerciseStats = {};
    entries.forEach(entry => {
        entry.exercises.forEach(ex => {
            if (!exerciseStats[ex.name]) {
                exerciseStats[ex.name] = { maxWeight: 0, count: 0 };
            }
            exerciseStats[ex.name].maxWeight = Math.max(exerciseStats[ex.name].maxWeight, ex.weight || 0);
            exerciseStats[ex.name].count++;
        });
    });
    
    Object.keys(exerciseStats).forEach(exName => {
        statsHTML += `
            <div class="stat-item">
                <div class="stat-value">${exerciseStats[exName].maxWeight}</div>
                <div class="stat-label">${exName} Max</div>
            </div>
        `;
    });
    
    statsHTML += '</div>';
    statsContainer.innerHTML = statsHTML;
}

function applyDateFilter() {
    console.log('🔍 Applying date filter...');
    loadWorkoutData();
}

function exportToCSV() {
    showNotification('Export feature would run here', 'info');
}

function formatDate(dateString) {
    return new Date(dateString).toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'short', 
        day: 'numeric'
    });
}

function resetDisplay() {
    document.getElementById('spreadsheetBody').innerHTML = 
        '<tr><td colspan="10" class="no-data-message">Select a workout plan</td></tr>';
    document.getElementById('spreadsheetTabs').innerHTML = 
        '<div class="no-tabs-message">Select a workout plan</div>';
    document.getElementById('spreadsheetStats').innerHTML = 
        '<div class="no-data-message">No statistics available</div>';
    updateSummaryStats(0, 0, '-');
}

function countTotalExercises(workoutData) {
    let total = 0;
    workoutData.forEach(entry => {
        total += entry.exercises ? entry.exercises.length : 0;
    });
    return total;
}

function getDateRange(workoutData) {
    if (!workoutData.length) return '-';
    
    const dates = workoutData.map(entry => new Date(entry.date)).sort((a, b) => a - b);
    const start = dates[0];
    const end = dates[dates.length - 1];
    
    return `${formatDate(start)} - ${formatDate(end)}`;
}

function updateSummaryStats(totalWorkouts, totalExercises, dateRange) {
    document.getElementById('totalWorkouts').textContent = totalWorkouts;
    document.getElementById('totalExercises').textContent = totalExercises;
    document.getElementById('dateRange').textContent = dateRange;
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