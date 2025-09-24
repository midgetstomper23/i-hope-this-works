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
    const demoBtn = document.getElementById('generateDemoData');
    if (demoBtn) demoBtn.addEventListener('click', generateDemoData);
    
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
        workoutList.innerHTML = '<p class="no-data">No workout plans found. Create one in the Workout Builder first.</p>';
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

// ===== Demo Data Generator =====
async function generateDemoData() {
    try {
        // Load plans and days
        let plans = [];
        if (window.fitnessAppAPI && window.fitnessAppAPI.readWorkoutPlans) {
            plans = await window.fitnessAppAPI.readWorkoutPlans();
        } else {
            plans = JSON.parse(localStorage.getItem('workoutPlans') || '[]');
        }

        // Fallback if no plans
        if (!plans || plans.length === 0) {
            showNotification('No workout plans found to seed data for.', 'error');
            return;
        }

        // Build a set of unique days from all plans
        const uniqueDayIds = new Set();
        plans.forEach(plan => {
            (plan.schedule || []).forEach(d => { if (d && d.dayId) uniqueDayIds.add(d.dayId); });
        });

        // Load day definitions to get exercise names
        let daysDef = [];
        if (window.fitnessAppAPI && window.fitnessAppAPI.readWorkoutData) {
            daysDef = await window.fitnessAppAPI.readWorkoutData();
        } else {
            daysDef = JSON.parse(localStorage.getItem('workoutData') || '[]');
        }

        // Prepare history array
        let history = [];
        if (window.fitnessAppAPI && window.fitnessAppAPI.readWorkoutHistory) {
            history = await window.fitnessAppAPI.readWorkoutHistory();
        } else {
            history = JSON.parse(localStorage.getItem('workoutHistory') || '[]');
        }

        const today = new Date();
        const start = new Date();
        start.setDate(today.getDate() - 60); // last 60 days

        // Helper to random walk values upwards
        function trend(base, step, variance=0.2) {
            const noise = (Math.random() - 0.5) * 2 * variance * step;
            return Math.max(0, base + step + noise);
        }

        // Create ~18-24 sessions spread over last 60 days
        const sessionCount = 22;
        for (let i = 0; i < sessionCount; i++) {
            const sessionDate = new Date(start);
            sessionDate.setDate(start.getDate() + Math.floor((i + 1) * (60 / sessionCount)));

            // Pick a random dayId from uniqueDayIds
            const dayIdsArray = Array.from(uniqueDayIds);
            if (dayIdsArray.length === 0) break;
            const dayId = dayIdsArray[i % dayIdsArray.length];
            const day = daysDef.find(d => d.id === dayId);
            if (!day) continue;

            // Seed baseline values per exercise
            let baseWeight = 20 + Math.random() * 30;
            const exercises = (day.exercises || []).slice(0, 4).map((ex, idx) => {
                baseWeight = trend(baseWeight, 1.2);
                const sets = parseInt(ex.sets || 3, 10);
                const reps = parseInt(ex.reps || 10, 10);
                return {
                    name: ex.name || `Exercise ${idx+1}`,
                    weight: Math.round(baseWeight),
                    avgWeight: Math.round(baseWeight),
                    sets: sets,
                    reps: reps,
                    restTime: parseInt(ex.rest || 60, 10)
                };
            });

            history.push({
                workoutId: plans[0].id,
                dayId: dayId,
                date: sessionDate.toISOString(),
                exercises: exercises
            });
        }

        // Save history
        if (window.fitnessAppAPI && window.fitnessAppAPI.saveWorkoutHistory) {
            await window.fitnessAppAPI.saveWorkoutHistory(history);
        } else {
            localStorage.setItem('workoutHistory', JSON.stringify(history));
        }

        showNotification('Demo data generated. Select a plan/day to view charts.', 'success');

        // Refresh if a day is already selected
        if (selectedDay) {
            updateChart();
        }
    } catch (e) {
        console.error('Error generating demo data:', e);
        showNotification('Error generating demo data', 'error');
    }
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