// index.js - Home page functionality with current workout integration

// Load current workout
async function loadCurrentWorkout() {
    try {
        console.log('Loading current workout...');
        if (window.fitnessAppAPI && window.fitnessAppAPI.readCurrentWorkout) {
            window.currentWorkout = await window.fitnessAppAPI.readCurrentWorkout();
            console.log('Loaded from API:', window.currentWorkout);
        } else {
            const saved = localStorage.getItem('currentWorkout');
            window.currentWorkout = saved ? JSON.parse(saved) : null;
            console.log('Loaded from localStorage:', window.currentWorkout);
        }
        
        console.log('Final current workout:', window.currentWorkout);
        
        // Update calendar if it's already generated
        if (typeof generateCalendar === 'function') {
            generateCalendar(currentMonth, currentYear);
        }
    } catch (error) {
        console.error('Error loading current workout:', error);
        window.currentWorkout = null;
    }
}

// Initialize the page
document.addEventListener('DOMContentLoaded', function() {
    console.log('Home page loaded');
    
    // Load current workout first
    loadCurrentWorkout();
    
    // Set current date
    const now = new Date();
    const options = { weekday: 'long', month: 'long', day: 'numeric' };
    const currentDateElement = document.getElementById('currentDate');
    if (currentDateElement) {
        currentDateElement.textContent = now.toLocaleDateString('en-US', options);
    } else {
        console.error('currentDate element not found');
    }
    
    // Calendar functionality
    let currentMonth = now.getMonth();
    let currentYear = now.getFullYear();
    
    const monthNames = ["January", "February", "March", "April", "May", "June",
        "July", "August", "September", "October", "November", "December"
    ];
    
    function generateCalendar(month, year) {
        const calendarDays = document.getElementById('calendarDays');
        const currentMonthYear = document.getElementById('currentMonthYear');
        
        if (!calendarDays || !currentMonthYear) {
            console.error('Calendar elements not found');
            return;
        }
        
        calendarDays.innerHTML = '';
        currentMonthYear.textContent = `${monthNames[month]} ${year}`;
        
        const firstDay = new Date(year, month, 1).getDay();
        const daysInMonth = new Date(year, month + 1, 0).getDate();
        
        // Add empty cells for days before the first day of the month
        for (let i = 0; i < firstDay; i++) {
            const emptyDay = document.createElement('div');
            emptyDay.classList.add('day');
            calendarDays.appendChild(emptyDay);
        }
        
        // Add cells for each day of the month
        for (let i = 1; i <= daysInMonth; i++) {
            const day = document.createElement('div');
            day.classList.add('day');
            day.textContent = i;
            
            // Mark current day
            if (i === now.getDate() && month === now.getMonth() && year === now.getFullYear()) {
                day.classList.add('current-day');
            }
            
            // Check if this is a workout day based on current workout plan
            if (isWorkoutDay(month, year, i)) {
                day.classList.add('workout-day');
            }
            
            // Check if this is a progression increase day
            isProgressionDay(month, year, i).then(isProgression => {
                if (isProgression) {
                    day.classList.add('progression-day');
                    day.title = 'Progression Increase Day';
                }
            });
            
            // Click: update Workout Day button icon based on selected schedule day
            day.addEventListener('click', () => {
                try {
                    if (!window.currentWorkout || !window.currentWorkout.schedule) return;
                    const date = new Date(year, month, i);
                    const dayOfWeek = date.getDay();
                    const scheduleIndex = dayOfWeek === 0 ? 6 : dayOfWeek - 1;
                    const scheduleDay = window.currentWorkout.schedule[scheduleIndex];
                    if (!scheduleDay) return;

                    const workoutBtns = document.querySelectorAll('.action-buttons .btn-workout i');
                    if (workoutBtns && workoutBtns.length > 0) {
                        const icon = scheduleDay.icon || '🏋️';
                        workoutBtns.forEach(el => { el.textContent = icon; });
                    }
                } catch (e) {
                    console.error('Error updating workout icon from calendar click:', e);
                }
            });

            calendarDays.appendChild(day);
        }
    }
    
    // Check if a specific day is a workout day
    function isWorkoutDay(month, year, day) {
        if (!window.currentWorkout || !window.currentWorkout.schedule) return false;
        
        const date = new Date(year, month, day);
        const dayOfWeek = date.getDay(); // 0 = Sunday, 1 = Monday, etc.
        
        // Adjust for your schedule format - this assumes schedule starts with Monday
        const scheduleIndex = dayOfWeek === 0 ? 6 : dayOfWeek - 1;
        
        // Check if this day has a workout in the schedule (not null and has dayId)
        const scheduleDay = window.currentWorkout.schedule[scheduleIndex];
        return scheduleDay && scheduleDay.dayId !== null;
    }
    
    // Check if a specific day is a progression increase day
    async function isProgressionDay(month, year, day) {
        try {
            const date = new Date(year, month, day);
            const dateString = date.toISOString().split('T')[0];
            
            // Get calendar data
            let calendarData = [];
            if (window.fitnessAppAPI && window.fitnessAppAPI.readCalendarData) {
                calendarData = await window.fitnessAppAPI.readCalendarData();
            } else {
                const saved = localStorage.getItem('calendarData');
                calendarData = saved ? JSON.parse(saved) : [];
            }
            
            return calendarData.some(entry => 
                entry.date === dateString && entry.progressionIncrease
            );
        } catch (error) {
            console.error('Error checking progression day:', error);
            return false;
        }
    }
    
    // Initialize calendar after current workout is loaded
    setTimeout(() => {
        generateCalendar(currentMonth, currentYear);
    }, 100);
    
    // Month navigation
    const prevMonthBtn = document.getElementById('prevMonth');
    const nextMonthBtn = document.getElementById('nextMonth');
    
    if (prevMonthBtn) {
        prevMonthBtn.addEventListener('click', function() {
            currentMonth--;
            if (currentMonth < 0) {
                currentMonth = 11;
                currentYear--;
            }
            generateCalendar(currentMonth, currentYear);
        });
    }
    
    if (nextMonthBtn) {
        nextMonthBtn.addEventListener('click', function() {
            currentMonth++;
            if (currentMonth > 11) {
                currentMonth = 0;
                currentYear++;
            }
            generateCalendar(currentMonth, currentYear);
        });
    }
    
    // Button functionality
    document.querySelectorAll('.action-btn').forEach(button => {
        button.addEventListener('click', function() {
            alert(`${this.querySelector('span').textContent} feature would open here`);
        });
    });
    
    // Update calendar when current workout changes
    window.addEventListener('currentWorkoutChanged', function() {
        generateCalendar(currentMonth, currentYear);
    });
    
    // Check for progression increases on page load
    async function checkProgressionIncreases() {
        try {
            const today = new Date().toISOString().split('T')[0];
            
            // Get progression plans
            let progressionPlans = [];
            if (window.fitnessAppAPI && window.fitnessAppAPI.readProgressionPlans) {
                progressionPlans = await window.fitnessAppAPI.readProgressionPlans();
            } else {
                const saved = localStorage.getItem('progressionPlans');
                progressionPlans = saved ? JSON.parse(saved) : [];
            }
            
            // Check if today is an increase day
            const todayPlans = progressionPlans.filter(plan => {
                return Object.values(plan.exercises).some(exercise => 
                    exercise.nextIncreaseDate === today
                );
            });
            
            if (todayPlans.length > 0) {
                showProgressionPopup(todayPlans);
            }
            
        } catch (error) {
            console.error('Error checking progression increases:', error);
        }
    }
    
    // Show progression increase popup (same as in progressive.js)
    function showProgressionPopup(plans) {
        const popup = document.createElement('div');
        popup.className = 'progression-popup';
        popup.innerHTML = `
            <div class="popup-content">
                <div class="popup-header">
                    <h3>📈 Time to Progress!</h3>
                    <button class="popup-close">×</button>
                </div>
                <div class="popup-body">
                    <p>It's time to increase your weights/reps for the following exercises:</p>
                    <div class="progression-exercises">
                        ${plans.map(plan => `
                            <div class="plan-section">
                                <h4>${plan.dayName}</h4>
                                ${Object.entries(plan.exercises).map(([exerciseName, exercise]) => `
                                    <div class="exercise-increase">
                                        <strong>${exerciseName}</strong>
                                        <span>Increase ${exercise.variable} by ${exercise.increaseAmount}</span>
                                        <span>Current: ${exercise.currentValue} → New: ${exercise.currentValue + exercise.increaseAmount}</span>
                                    </div>
                                `).join('')}
                            </div>
                        `).join('')}
                    </div>
                    <div class="popup-actions">
                        <button class="action-btn" id="applyProgression">Apply Increases</button>
                        <button class="action-btn btn-secondary" id="skipProgression">Skip for Now</button>
                    </div>
                </div>
            </div>
        `;
        
        document.body.appendChild(popup);
        
        // Event listeners
        popup.querySelector('.popup-close').addEventListener('click', () => {
            document.body.removeChild(popup);
        });
        
        popup.querySelector('#applyProgression').addEventListener('click', () => {
            applyProgressionIncreases(plans);
            document.body.removeChild(popup);
        });
        
        popup.querySelector('#skipProgression').addEventListener('click', () => {
            skipProgressionIncreases(plans);
            document.body.removeChild(popup);
        });
    }
    
    // Apply progression increases (same as in progressive.js)
    async function applyProgressionIncreases(plans) {
        try {
            // Update progression plans with new values
            let progressionPlans = [];
            if (window.fitnessAppAPI && window.fitnessAppAPI.readProgressionPlans) {
                progressionPlans = await window.fitnessAppAPI.readProgressionPlans();
            } else {
                const saved = localStorage.getItem('progressionPlans');
                progressionPlans = saved ? JSON.parse(saved) : [];
            }
            
            plans.forEach(plan => {
                const planIndex = progressionPlans.findIndex(p => p.id === plan.id);
                if (planIndex !== -1) {
                    Object.entries(plan.exercises).forEach(([exerciseName, exercise]) => {
                        if (exercise.nextIncreaseDate === new Date().toISOString().split('T')[0]) {
                            // Update current value
                            progressionPlans[planIndex].exercises[exerciseName].currentValue += exercise.increaseAmount;
                            progressionPlans[planIndex].exercises[exerciseName].lastIncreased = new Date().toISOString();
                            
                            // Calculate next increase date
                            const nextDate = new Date();
                            nextDate.setDate(nextDate.getDate() + (exercise.intervalWeeks * 7));
                            progressionPlans[planIndex].exercises[exerciseName].nextIncreaseDate = nextDate.toISOString().split('T')[0];
                        }
                    });
                }
            });
            
            // Save updated plans
            if (window.fitnessAppAPI && window.fitnessAppAPI.saveProgressionPlans) {
                await window.fitnessAppAPI.saveProgressionPlans(progressionPlans);
            } else {
                localStorage.setItem('progressionPlans', JSON.stringify(progressionPlans));
            }
            
            showNotification('Progression increases applied successfully!', 'success');
            
        } catch (error) {
            console.error('Error applying progression increases:', error);
            showNotification('Error applying progression increases', 'error');
        }
    }
    
    // Skip progression increases (same as in progressive.js)
    async function skipProgressionIncreases(plans) {
        try {
            // Update next increase dates to tomorrow
            let progressionPlans = [];
            if (window.fitnessAppAPI && window.fitnessAppAPI.readProgressionPlans) {
                progressionPlans = await window.fitnessAppAPI.readProgressionPlans();
            } else {
                const saved = localStorage.getItem('progressionPlans');
                progressionPlans = saved ? JSON.parse(saved) : [];
            }
            
            plans.forEach(plan => {
                const planIndex = progressionPlans.findIndex(p => p.id === plan.id);
                if (planIndex !== -1) {
                    Object.entries(plan.exercises).forEach(([exerciseName, exercise]) => {
                        if (exercise.nextIncreaseDate === new Date().toISOString().split('T')[0]) {
                            // Move next increase to tomorrow
                            const tomorrow = new Date();
                            tomorrow.setDate(tomorrow.getDate() + 1);
                            progressionPlans[planIndex].exercises[exerciseName].nextIncreaseDate = tomorrow.toISOString().split('T')[0];
                        }
                    });
                }
            });
            
            // Save updated plans
            if (window.fitnessAppAPI && window.fitnessAppAPI.saveProgressionPlans) {
                await window.fitnessAppAPI.saveProgressionPlans(progressionPlans);
            } else {
                localStorage.setItem('progressionPlans', JSON.stringify(progressionPlans));
            }
            
            showNotification('Progression increases skipped. Will remind you tomorrow.', 'info');
            
        } catch (error) {
            console.error('Error skipping progression increases:', error);
            showNotification('Error skipping progression increases', 'error');
        }
    }
    
    // Show notification function
    function showNotification(message, type = 'info') {
        const notification = document.createElement('div');
        notification.className = `notification ${type}`;
        notification.textContent = message;
        notification.style.cssText = `
            position: fixed;
            top: 20px;
            right: 20px;
            padding: 12px 20px;
            background: ${type === 'error' ? '#e74c3c' : 
                        type === 'success' ? '#2ecc71' : '#3498db'};
            color: white;
            border-radius: 5px;
            z-index: 10000;
            box-shadow: 0 4px 12px rgba(0,0,0,0.15);
        `;
        
        document.body.appendChild(notification);
        
        setTimeout(() => {
            if (notification.parentNode) {
                notification.parentNode.removeChild(notification);
            }
        }, 3000);
    }
    
    // Check for progression increases on page load
    checkProgressionIncreases();
    
    // Navigation items - FIXED VERSION
    document.querySelectorAll('.nav-item').forEach(item => {
        item.addEventListener('click', function() {
            // Remove active class from all items
            document.querySelectorAll('.nav-item').forEach(nav => {
                nav.classList.remove('active');
            });
            // Add active class to clicked item
            this.classList.add('active');
        });
    });
});