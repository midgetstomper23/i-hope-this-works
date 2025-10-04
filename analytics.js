// analytics.js - Dynamic Analytics functionality

// Global variables
let selectedWorkout = null;
let selectedDay = null;
let progressChart = null;
let workoutHistory = []; // This will store our exercise performance data

// DOM Elements
const backButton = document.getElementById('backButton');
const step1 = document.getElementById('step1');
const step2 = document.getElementById('step2');
const step3 = document.getElementById('step3');
const workoutList = document.getElementById('workout-list');
const dayList = document.getElementById('day-list');
const metricSelect = document.getElementById('metric-select');
const chartCanvas = document.getElementById('progress-chart');
const chartLegend = document.getElementById('chart-legend');
const backToWorkoutsBtn = document.getElementById('backToWorkouts');
const backToDaysBtn = document.getElementById('backToDays');

// Initialize the page
document.addEventListener('DOMContentLoaded', function() {
    console.log('Analytics page loaded');
    
    // Set up event listeners
    backButton.addEventListener('click', goBack);
    backToWorkoutsBtn.addEventListener('click', showWorkoutSelection);
    backToDaysBtn.addEventListener('click', showDaySelection);
    metricSelect.addEventListener('change', updateChart);
    
    // FIXED: Demo data button event listener
    const demoBtn = document.getElementById('generateDemoData');
    if (demoBtn) {
        demoBtn.addEventListener('click', generateDemoData);
    } else {
        console.error('Generate Demo Data button not found!');
    }
    
    // Load workout plans and history
    loadWorkoutPlans();
    loadWorkoutHistory();
});

// Navigation functions
function goBack() {
    window.location.href = 'index.html';
}

function showWorkoutSelection() {
    step1.style.display = 'block';
    step2.style.display = 'none';
    step3.style.display = 'none';
    selectedWorkout = null;
}

function showDaySelection() {
    step1.style.display = 'none';
    step2.style.display = 'block';
    step3.style.display = 'none';
    selectedDay = null;
}

function showAnalyticsDashboard() {
    step1.style.display = 'none';
    step2.style.display = 'none';
    step3.style.display = 'block';
    updateChart();
}

// Load workout history data
async function loadWorkoutHistory() {
    try {
        // Try to get workout history from API or localStorage
        if (window.fitnessAppAPI && window.fitnessAppAPI.readWorkoutHistory) {
            workoutHistory = await window.fitnessAppAPI.readWorkoutHistory();
        } else {
            // Fallback to localStorage for development
            const saved = localStorage.getItem('workoutHistory');
            workoutHistory = saved ? JSON.parse(saved) : [];
            
            // If no history exists, create empty array
            if (!workoutHistory) {
                workoutHistory = [];
                localStorage.setItem('workoutHistory', JSON.stringify(workoutHistory));
            }
        }
    } catch (error) {
        console.error('Error loading workout history:', error);
        workoutHistory = [];
    }
}

// Load workout plans
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
        workoutList.innerHTML = '<p class="no-data">Error loading workout plans</p>';
    }
}

function displayWorkoutPlans(workoutPlans) {
    workoutList.innerHTML = '';
    
    if (workoutPlans.length === 0) {
        workoutList.innerHTML = `
            <div class="no-data-message">
                <p>No workout plans found.</p>
                <p>Click "Generate Demo Data" to create sample workouts for testing analytics.</p>
            </div>
        `;
        return;
    }
    
    workoutPlans.forEach(plan => {
        const workoutCard = document.createElement('div');
        workoutCard.className = 'analytics-card';
        workoutCard.innerHTML = `
            <div class="workout-plan-info">
                <h3>${plan.name}</h3>
                <p>${getWorkoutDayCount(plan)} workout days</p>
                <p class="workout-days">${getWorkoutDaysSummary(plan)}</p>
                <p class="workout-stats">${getWorkoutCompletionStats(plan.id)}</p>
            </div>
            <button class="action-btn select-workout-btn" data-workout-id="${plan.id}">
                Analyze
            </button>
        `;
        
        workoutList.appendChild(workoutCard);
        
        // Add event listener to select button
        const selectBtn = workoutCard.querySelector('.select-workout-btn');
        selectBtn.addEventListener('click', function() {
            selectedWorkout = workoutPlans.find(p => p.id === this.dataset.workoutId);
            loadDaysForWorkout(selectedWorkout);
        });
    });
}

function getWorkoutCompletionStats(workoutId) {
    const workoutSessions = workoutHistory.filter(session => session.workoutId === workoutId);
    if (workoutSessions.length === 0) return 'No workouts completed yet';
    
    const completed = workoutSessions.length;
    const lastSession = new Date(workoutSessions[workoutSessions.length - 1].date);
    return `${completed} sessions completed | Last: ${lastSession.toLocaleDateString()}`;
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

// Load days for selected workout
function loadDaysForWorkout(workout) {
    dayList.innerHTML = '';
    
    if (!workout.schedule || workout.schedule.length === 0) {
        dayList.innerHTML = '<p class="no-data">No days configured for this workout plan.</p>';
        return;
    }
    
    // Get unique days from schedule
    const uniqueDays = {};
    workout.schedule.forEach((day, index) => {
        if (day && day.dayId) {
            if (!uniqueDays[day.dayId]) {
                uniqueDays[day.dayId] = {
                    ...day,
                    positions: [index]
                };
            } else {
                uniqueDays[day.dayId].positions.push(index);
            }
        }
    });
    
    // Display each unique day with actual stats
    Object.values(uniqueDays).forEach(day => {
        const dayStats = getDayPerformanceStats(day.dayId);
        
        const dayCard = document.createElement('div');
        dayCard.className = 'analytics-card';
        dayCard.innerHTML = `
            <div class="day-card-header">
                <span class="day-icon-preview">${day.icon || '🏋️'}</span>
                <h3>${day.dayName}</h3>
            </div>
            <p>${dayStats.sessions} sessions completed</p>
            <p>${dayStats.improvement}</p>
            <button class="action-btn select-day-btn" data-day-id="${day.dayId}">
                View Progress
            </button>
        `;
        
        dayList.appendChild(dayCard);
        
        // Add event listener to select button
        const selectBtn = dayCard.querySelector('.select-day-btn');
        selectBtn.addEventListener('click', function() {
            selectedDay = day;
            showAnalyticsDashboard();
        });
    });
    
    showDaySelection();
}

function getDayPerformanceStats(dayId) {
    const daySessions = workoutHistory.filter(session => session.dayId === dayId);
    
    if (daySessions.length === 0) {
        return {
            sessions: 0,
            improvement: 'No data yet'
        };
    }
    
    // Calculate improvement (simplified)
    let improvement = 'Steady progress';
    if (daySessions.length > 1) {
        const firstSession = daySessions[0];
        const lastSession = daySessions[daySessions.length - 1];
        
        if (lastSession.avgWeight > firstSession.avgWeight) {
            improvement = `↑ ${Math.round((lastSession.avgWeight - firstSession.avgWeight) / firstSession.avgWeight * 100)}% weight increase`;
        }
    }
    
    return {
        sessions: daySessions.length,
        improvement: improvement
    };
}

// Update chart based on selected metric
function updateChart() {
    const metric = metricSelect.value;
    renderProgressChart(metric);
}

// ===== FIXED DEMO DATA GENERATOR =====
async function generateDemoData() {
    console.log('🎮 Generating demo data for analytics...');
    
    try {
        // Create comprehensive demo data specifically for analytics
        const demoData = {
            workoutPlans: [
                {
                    id: "demo_analytics_plan",
                    name: "Demo Analytics Workout",
                    schedule: [
                        { dayId: "demo_chest_day", dayName: "Demo Chest Day", icon: "🏋️" },
                        { dayId: "demo_back_day", dayName: "Demo Back Day", icon: "💪" },
                        { dayId: "demo_legs_day", dayName: "Demo Legs Day", icon: "🦵" }
                    ]
                }
            ],
            workoutHistory: [
                {
                    id: "demo_1",
                    workoutId: "demo_analytics_plan",
                    dayId: "demo_chest_day",
                    date: "2024-01-15",
                    exercises: [
                        { name: "Bench Press", avgWeight: 185, reps: 8, sets: 3, restTime: 90 },
                        { name: "Incline Press", avgWeight: 155, reps: 8, sets: 3, restTime: 75 }
                    ]
                },
                {
                    id: "demo_2",
                    workoutId: "demo_analytics_plan", 
                    dayId: "demo_chest_day",
                    date: "2024-01-22",
                    exercises: [
                        { name: "Bench Press", avgWeight: 195, reps: 8, sets: 3, restTime: 85 },
                        { name: "Incline Press", avgWeight: 165, reps: 8, sets: 3, restTime: 70 }
                    ]
                },
                {
                    id: "demo_3",
                    workoutId: "demo_analytics_plan",
                    dayId: "demo_chest_day", 
                    date: "2024-01-29",
                    exercises: [
                        { name: "Bench Press", avgWeight: 205, reps: 8, sets: 3, restTime: 80 },
                        { name: "Incline Press", avgWeight: 175, reps: 8, sets: 3, restTime: 65 }
                    ]
                },
                {
                    id: "demo_4",
                    workoutId: "demo_analytics_plan",
                    dayId: "demo_back_day",
                    date: "2024-01-16",
                    exercises: [
                        { name: "Deadlifts", avgWeight: 225, reps: 5, sets: 3, restTime: 120 },
                        { name: "Pull-ups", avgWeight: 0, reps: 8, sets: 3, restTime: 90 }
                    ]
                },
                {
                    id: "demo_5",
                    workoutId: "demo_analytics_plan", 
                    dayId: "demo_back_day",
                    date: "2024-01-23",
                    exercises: [
                        { name: "Deadlifts", avgWeight: 235, reps: 5, sets: 3, restTime: 115 },
                        { name: "Pull-ups", avgWeight: 0, reps: 9, sets: 3, restTime: 85 }
                    ]
                },
                {
                    id: "demo_6",
                    workoutId: "demo_analytics_plan",
                    dayId: "demo_legs_day", 
                    date: "2024-01-17",
                    exercises: [
                        { name: "Squats", avgWeight: 205, reps: 6, sets: 3, restTime: 100 },
                        { name: "Leg Press", avgWeight: 315, reps: 10, sets: 3, restTime: 75 }
                    ]
                },
                {
                    id: "demo_7",
                    workoutId: "demo_analytics_plan",
                    dayId: "demo_legs_day",
                    date: "2024-01-24",
                    exercises: [
                        { name: "Squats", avgWeight: 215, reps: 6, sets: 3, restTime: 95 },
                        { name: "Leg Press", avgWeight: 335, reps: 10, sets: 3, restTime: 70 }
                    ]
                }
            ]
        };
        
        // Save to storage
        if (window.fitnessAppAPI && window.fitnessAppAPI.saveWorkoutPlans) {
            await window.fitnessAppAPI.saveWorkoutPlans(demoData.workoutPlans);
            await window.fitnessAppAPI.saveWorkoutHistory(demoData.workoutHistory);
        } else {
            localStorage.setItem('workoutPlans', JSON.stringify(demoData.workoutPlans));
            localStorage.setItem('workoutHistory', JSON.stringify(demoData.workoutHistory));
        }
        
        console.log('✅ Demo data generated successfully!');
        showNotification('Demo data generated! Now select "Demo Analytics Workout" from the list.', 'success');
        
        // RELOAD THE DATA TO SHOW THE NEW WORKOUT PLAN
        loadWorkoutPlans();
        loadWorkoutHistory();
        
    } catch (error) {
        console.error('Error generating demo data:', error);
        showNotification('Error generating demo data', 'error');
    }
}

// Render the progress chart with REAL data
function renderProgressChart(metric) {
    if (!selectedDay) return;
    
    const chartData = getChartDataForDay(selectedDay.dayId, metric);
    
    // Destroy existing chart if it exists
    if (progressChart) {
        progressChart.destroy();
    }
    
    // Create new chart
    const ctx = chartCanvas.getContext('2d');
    progressChart = new Chart(ctx, {
        type: 'line',
        data: {
            labels: chartData.dates,
            datasets: chartData.datasets
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                title: {
                    display: true,
                    text: `${selectedDay.dayName} Progress - ${getMetricName(metric)}`,
                    color: '#ffffff'
                },
                tooltip: {
                    mode: 'index',
                    intersect: false
                },
                legend: {
                    display: false
                }
            },
            scales: {
                x: {
                    display: true,
                    title: {
                        display: true,
                        text: 'Date',
                        color: '#cccccc'
                    },
                    ticks: {
                        color: '#cccccc'
                    },
                    grid: {
                        color: 'rgba(255, 255, 255, 0.1)'
                    }
                },
                y: {
                    display: true,
                    title: {
                        display: true,
                        text: getMetricName(metric),
                        color: '#cccccc'
                    },
                    ticks: {
                        color: '#cccccc'
                    },
                    grid: {
                        color: 'rgba(255, 255, 255, 0.1)'
                    }
                }
            }
        }
    });
    
    // Update legend
    updateChartLegend(chartData.datasets);
}

function getChartDataForDay(dayId, metric) {
    // Filter sessions for this specific day
    const daySessions = workoutHistory.filter(session => session.dayId === dayId);
    
    if (daySessions.length === 0) {
        // Return empty data structure if no sessions
        return {
            dates: [],
            datasets: []
        };
    }
    
    // Get all unique exercises from this day's sessions
    const allExercises = new Set();
    daySessions.forEach(session => {
        session.exercises.forEach(exercise => {
            allExercises.add(exercise.name);
        });
    });
    
    // Prepare datasets for each exercise
    const datasets = Array.from(allExercises).map((exerciseName, index) => {
        const exerciseData = daySessions.map(session => {
            const exercise = session.exercises.find(e => e.name === exerciseName);
            if (!exercise) return null;
            
            switch (metric) {
                case 'weight':
                    return exercise.avgWeight || exercise.weight;
                case 'reps':
                    return exercise.reps;
                case 'volume':
                    return (exercise.avgWeight || exercise.weight) * exercise.reps * exercise.sets;
                case 'recovery':
                    return exercise.restTime;
                default:
                    return exercise.avgWeight || exercise.weight;
            }
        }).filter(value => value !== null);
        
        return {
            label: exerciseName,
            data: exerciseData,
            borderColor: getExerciseColor(index),
            backgroundColor: 'transparent',
            tension: 0.1,
            borderWidth: 2
        };
    }).filter(dataset => dataset.data.length > 0);
    
    // Get dates for the sessions that have data
    const dates = daySessions.map(session => {
        return new Date(session.date).toLocaleDateString();
    });
    
    return {
        dates: dates,
        datasets: datasets
    };
}

function getMetricName(metric) {
    const metricNames = {
        'weight': 'Weight (lbs)',
        'volume': 'Volume (lbs × reps × sets)',
        'reps': 'Reps',
        'recovery': 'Recovery Time (s)'
    };
    return metricNames[metric] || metric;
}

function updateChartLegend(datasets) {
    chartLegend.innerHTML = '<h3>Exercises:</h3>';
    
    datasets.forEach(dataset => {
        const legendItem = document.createElement('div');
        legendItem.className = 'legend-item';
        legendItem.innerHTML = `
            <span class="legend-color" style="background-color: ${dataset.borderColor}"></span>
            <span class="legend-label">${dataset.label}</span>
        `;
        chartLegend.appendChild(legendItem);
    });
}

function getExerciseColor(index) {
    const colors = [
        'rgb(75, 192, 192)',
        'rgb(255, 99, 132)',
        'rgb(255, 205, 86)',
        'rgb(54, 162, 235)',
        'rgb(153, 102, 255)',
        'rgb(255, 159, 64)'
    ];
    return colors[index % colors.length];
}