// index.js - Home page functionality with current workout integration

// Initialize the page
document.addEventListener('DOMContentLoaded', function() {
    console.log('Home page loaded');
    
    // Set current date
    const now = new Date();
    const options = { weekday: 'long', month: 'long', day: 'numeric' };
    document.getElementById('currentDate').textContent = now.toLocaleDateString('en-US', options);
    
    // Calendar functionality
    let currentMonth = now.getMonth();
    let currentYear = now.getFullYear();
    
    const monthNames = ["January", "February", "March", "April", "May", "June",
        "July", "August", "September", "October", "November", "December"
    ];
    
    function generateCalendar(month, year) {
        const calendarDays = document.getElementById('calendarDays');
        calendarDays.innerHTML = '';
        
        document.getElementById('currentMonthYear').textContent = `${monthNames[month]} ${year}`;
        
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
        
        // Check if this day has a workout in the schedule
        return window.currentWorkout.schedule[scheduleIndex] !== null;
    }
    
    // Initialize calendar
    generateCalendar(currentMonth, currentYear);
    
    // Month navigation
    document.getElementById('prevMonth').addEventListener('click', function() {
        currentMonth--;
        if (currentMonth < 0) {
            currentMonth = 11;
            currentYear--;
        }
        generateCalendar(currentMonth, currentYear);
    });
    
    document.getElementById('nextMonth').addEventListener('click', function() {
        currentMonth++;
        if (currentMonth > 11) {
            currentMonth = 0;
            currentYear++;
        }
        generateCalendar(currentMonth, currentYear);
    });
    
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