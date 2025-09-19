// progressive.js - Progressive Overload functionality

// Global variables
let selectedPhotos = [];
let uploadQueue = [];
let isDeleteMode = false;
let photosData = [];
let currentPath = [];
let viewMode = 'thumbnail';
let selectedWorkout = null;
let selectedDay = null;
let progressionSettings = {};

// DOM Elements
const backButton = document.getElementById('backButton');
const setupOverloadBtn = document.getElementById('setup-overload-btn');
const viewImagesBtn = document.getElementById('view-images-btn');
const setupModal = document.getElementById('setupModal');
const modalClose = document.getElementById('modalClose');
const saveProgressionBtn = document.getElementById('save-progression-btn');

// Initialize the page
document.addEventListener('DOMContentLoaded', function() {
    console.log('Progressive page loaded');
    
    // Set up event listeners
    backButton.addEventListener('click', goBack);
    setupOverloadBtn.addEventListener('click', openSetupModal);
    viewImagesBtn.addEventListener('click', showImageBank);
    modalClose.addEventListener('click', closeModal);
    saveProgressionBtn.addEventListener('click', saveProgressionPlan);
    
    // Image bank event listeners
    document.getElementById('imageBankClose').addEventListener('click', closeImageBank);
    document.getElementById('browseBtn').addEventListener('click', triggerFileBrowse);
    document.getElementById('photoUpload').addEventListener('change', handleFileSelect);
    document.getElementById('processUploadBtn').addEventListener('click', processUploads);
    document.getElementById('comparisonClose').addEventListener('click', closeComparison);
    document.getElementById('toggleDeleteMode').addEventListener('click', toggleDeleteMode);
    
    // Drag and drop
    const uploadZone = document.getElementById('uploadZone');
    uploadZone.addEventListener('dragover', handleDragOver);
    uploadZone.addEventListener('dragleave', handleDragLeave);
    uploadZone.addEventListener('drop', handleDrop);
    
    // Initialize date with today's date
    document.getElementById('photoDate').value = new Date().toISOString().split('T')[0];
    
    // Back buttons
    document.querySelector('.back-to-workouts')?.addEventListener('click', () => showStep(1));
    document.querySelector('.back-to-days')?.addEventListener('click', () => showStep(2));
    
    // Load existing progression plans
    loadProgressionPlans();
    
    // Initialize folder system
    currentPath = [];
    viewMode = 'thumbnail';
    
    // Add view mode toggle if it doesn't exist
    if (!document.querySelector('.view-options')) {
        setupViewModes();
    }
});

// Delete mode function
function toggleDeleteMode() {
    isDeleteMode = !isDeleteMode;
    const button = document.getElementById('toggleDeleteMode');
    const gallery = document.getElementById('photosTimeline');
    
    if (isDeleteMode) {
        button.textContent = 'Delete Mode: On';
        button.classList.add('active');
        if (gallery) gallery.classList.add('delete-mode');
    } else {
        button.textContent = 'Delete Mode: Off';
        button.classList.remove('active');
        if (gallery) gallery.classList.remove('delete-mode');
    }
}

// Windows Explorer-style folder system
function displayPhotos(photos) {
    photosData = photos || [];
    
    // Create folder structure
    const folderStructure = createFolderStructure(photosData);
    
    // Display folders and photos
    renderFolderExplorer(folderStructure);
}

function createFolderStructure(photos) {
    const structure = {
        type: 'root',
        name: 'All Photos',
        path: '',
        children: {},
        photos: []
    };

    if (!photos || !Array.isArray(photos)) return structure;

    photos.forEach(photo => {
        // Parse date for organization
        const date = new Date(photo.date);
        const year = date.getFullYear().toString();
        const month = (date.getMonth() + 1).toString().padStart(2, '0');
        const monthName = date.toLocaleString('default', { month: 'long' });
        const angle = photo.angle;

        // Add to year folder
        if (!structure.children[year]) {
            structure.children[year] = {
                type: 'year',
                name: year,
                path: year,
                children: {},
                photos: []
            };
        }

        // Add to month folder
        if (!structure.children[year].children[month]) {
            structure.children[year].children[month] = {
                type: 'month',
                name: `${monthName} ${year}`,
                path: `${year}/${month}`,
                children: {},
                photos: []
            };
        }

        // Add to angle folder
        if (!structure.children[year].children[month].children[angle]) {
            structure.children[year].children[month].children[angle] = {
                type: 'angle',
                name: `${angle} (${monthName} ${year})`,
                path: `${year}/${month}/${angle}`,
                children: {},
                photos: []
            };
        }

        // Add photo to angle folder
        structure.children[year].children[month].children[angle].photos.push(photo);
    });

    return structure;
}

function renderFolderExplorer(structure) {
    const foldersContainer = document.getElementById('foldersContainer');
    const photosContainer = document.getElementById('photosContainer');
    
    if (!foldersContainer || !photosContainer) return;

    // Clear containers
    foldersContainer.innerHTML = '';
    photosContainer.innerHTML = '';

    // Render current path
    renderBreadcrumb();

    // If we're at root level, show years
    if (currentPath.length === 0) {
        if (structure.children && Object.keys(structure.children).length > 0) {
            renderFolderList(structure.children, foldersContainer);
        } else {
            foldersContainer.innerHTML = '<p class="no-data">No folders found</p>';
        }
        return;
    }
    
    // Navigate to current path
    let currentFolder = structure;
    for (const segment of currentPath) {
        if (currentFolder.children && currentFolder.children[segment]) {
            currentFolder = currentFolder.children[segment];
        } else {
            console.error('Path segment not found:', segment);
            photosContainer.innerHTML = '<p class="no-data">Folder not found</p>';
            return;
        }
    }
    
    // Show subfolders if they exist
    if (currentFolder.children && Object.keys(currentFolder.children).length > 0) {
        renderFolderList(currentFolder.children, foldersContainer);
    }
    
    // Show photos in current folder
    if (currentFolder.photos && currentFolder.photos.length > 0) {
        renderPhotos(currentFolder.photos, photosContainer);
    } else {
        photosContainer.innerHTML = '<p class="no-data">No photos in this folder</p>';
    }
}

function renderFolderList(folders, container) {
    const folderList = document.createElement('div');
    folderList.className = 'folder-list';

    Object.values(folders).forEach(folder => {
        const folderItem = document.createElement('div');
        folderItem.className = 'folder-item';
        folderItem.innerHTML = `
            <span class="folder-icon">📁</span>
            <div class="folder-info">
                <div class="folder-name">${folder.name}</div>
                <div class="folder-count">${getFolderItemCount(folder)} items</div>
            </div>
        `;

        folderItem.addEventListener('click', () => {
            navigateToFolder(folder.path);
        });

        folderList.appendChild(folderItem);
    });

    container.appendChild(folderList);
}

function getFolderItemCount(folder) {
    let count = folder.photos ? folder.photos.length : 0;
    if (folder.children) {
        Object.values(folder.children).forEach(child => {
            count += getFolderItemCount(child);
        });
    }
    return count;
}

// FIXED: renderBreadcrumb function
function renderBreadcrumb() {
    const folderPath = document.getElementById('folderPath');
    if (!folderPath) return;
    
    folderPath.innerHTML = '';

    // Root button
    const rootButton = document.createElement('button');
    rootButton.className = 'path-item';
    rootButton.innerHTML = '📁 All Photos';
    rootButton.addEventListener('click', () => navigateToFolder(''));
    folderPath.appendChild(rootButton);

    // Build path if we have segments
    if (currentPath && currentPath.length > 0) {
        currentPath.forEach((segment, index) => {
            const separator = document.createElement('span');
            separator.className = 'path-separator';
            separator.textContent = '›';
            folderPath.appendChild(separator);

            const pathButton = document.createElement('button');
            pathButton.className = 'path-item';
            pathButton.textContent = segment;
            
            const pathToHere = currentPath.slice(0, index + 1);
            pathButton.addEventListener('click', () => navigateToFolder(pathToHere.join('/')));
            
            folderPath.appendChild(pathButton);
        });
    }
}

// FIXED: navigateToFolder function
function navigateToFolder(path) {
    try {
        if (!path) {
            currentPath = [];
        } else {
            // Ensure we have a clean path without empty segments
            currentPath = path.split('/').filter(segment => segment && segment.trim() !== '');
        }
        loadImageGallery();
    } catch (error) {
        console.error('Error navigating to folder:', error);
        currentPath = [];
        loadImageGallery();
    }
}

function renderPhotos(photos, container) {
    const photosGrid = document.createElement('div');
    photosGrid.className = `photos-grid ${viewMode}-view`;
    photosGrid.id = 'photosGrid';

    photos.forEach(photo => {
        const photoCard = document.createElement('div');
        photoCard.className = 'photo-card';
        
        if (viewMode === 'thumbnail') {
            photoCard.innerHTML = `
                <img src="${photo.data}" alt="${photo.angle} view" class="photo-image">
                <div class="photo-info">
                    <div class="photo-date">${formatDate(photo.date)}</div>
                    <div class="photo-angle">${photo.angle}</div>
                    <div class="photo-actions">
                        <button class="action-btn btn-secondary compare-btn">Compare</button>
                        <button class="action-btn btn-delete delete-btn">Delete</button>
                    </div>
                </div>
            `;
        } else {
            // List view
            photoCard.innerHTML = `
                <img src="${photo.data}" alt="${photo.angle} view" class="photo-image">
                <div class="photo-info">
                    <div class="photo-date">${formatDate(photo.date)}</div>
                    <div class="photo-angle">${photo.angle}</div>
                    <div class="photo-actions">
                        <button class="action-btn btn-secondary compare-btn">Compare</button>
                        <button class="action-btn btn-delete delete-btn">Delete</button>
                    </div>
                </div>
            `;
        }

        // Add event listeners
        const compareBtn = photoCard.querySelector('.compare-btn');
        if (compareBtn) {
            compareBtn.addEventListener('click', () => {
                openComparison(photo);
            });
        }

        const deleteBtn = photoCard.querySelector('.delete-btn');
        if (deleteBtn) {
            deleteBtn.addEventListener('click', () => {
                deletePhoto(photo.filename);
            });
        }

        photosGrid.appendChild(photoCard);
    });

    container.appendChild(photosGrid);
}

// Add view mode toggle
function setupViewModes() {
    const viewOptions = document.createElement('div');
    viewOptions.className = 'view-options';
    viewOptions.innerHTML = `
        <button class="view-btn ${viewMode === 'thumbnail' ? 'active' : ''}" data-view="thumbnail">
            🖼️ Thumbnails
        </button>
        <button class="view-btn ${viewMode === 'list' ? 'active' : ''}" data-view="list">
            📋 List
        </button>
    `;

    viewOptions.querySelectorAll('.view-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            viewMode = btn.dataset.view;
            loadImageGallery(); // Refresh view
        });
    });

    // Add to photos container
    const photosContainer = document.getElementById('photosContainer');
    if (photosContainer) {
        photosContainer.prepend(viewOptions);
    }
}

// Update your loadImageGallery function
async function loadImageGallery() {
    try {
        let photos = [];
        if (window.fitnessAppAPI && window.fitnessAppAPI.readProgressPhotos) {
            photos = await window.fitnessAppAPI.readProgressPhotos();
        } else {
            const saved = localStorage.getItem('progressPhotos');
            photos = saved ? JSON.parse(saved) : [];
        }
        
        // Ensure we have an array
        if (!Array.isArray(photos)) {
            photos = [];
        }
        
        displayPhotos(photos);
        setupViewModes(); // Add view mode buttons
    } catch (error) {
        console.error('Error loading photos:', error);
        // Reset to empty gallery on error
        displayPhotos([]);
    }
}

// Add delete photo function
async function deletePhoto(filename) {
    if (!confirm('Are you sure you want to delete this photo? This action cannot be undone.')) {
        return;
    }
    
    try {
        // Filter out the deleted photo
        const updatedPhotos = photosData.filter(photo => photo.filename !== filename);
        
        // Save updated photos
        if (window.fitnessAppAPI && window.fitnessAppAPI.saveProgressPhotos) {
            await window.fitnessAppAPI.saveProgressPhotos(updatedPhotos);
        } else {
            localStorage.setItem('progressPhotos', JSON.stringify(updatedPhotos));
        }
        
        // Show success message
        showNotification('Photo deleted successfully', 'success');
        
        // Reload gallery
        loadImageGallery();
        
        // Turn off delete mode
        if (isDeleteMode) {
            toggleDeleteMode();
        }
        
    } catch (error) {
        console.error('Error deleting photo:', error);
        showNotification('Error deleting photo', 'error');
    }
}

// Update the savePhoto function to include month information
async function savePhoto(photoData) {
    try {
        let photos = [];
        if (window.fitnessAppAPI && window.fitnessAppAPI.readProgressPhotos) {
            photos = await window.fitnessAppAPI.readProgressPhotos();
        } else {
            const saved = localStorage.getItem('progressPhotos');
            photos = saved ? JSON.parse(saved) : [];
        }
        
        // Add month information for better organization
        const date = new Date(photoData.date);
        photoData.year = date.getFullYear();
        photoData.month = date.getMonth() + 1;
        photoData.monthName = date.toLocaleString('default', { month: 'long' });
        
        photos.push(photoData);
        
        if (window.fitnessAppAPI && window.fitnessAppAPI.saveProgressPhotos) {
            await window.fitnessAppAPI.saveProgressPhotos(photos);
        } else {
            localStorage.setItem('progressPhotos', JSON.stringify(photos));
        }
    } catch (error) {
        console.error('Error saving photo:', error);
        throw error;
    }
}

// Update the populateYearFilter function to include months
function populateYearFilter(photos) {
    const yearFilter = document.getElementById('yearFilter');
    if (!yearFilter) return;
    
    yearFilter.innerHTML = '<option value="all">All Years</option>';
    
    const years = new Set(photos.map(photo => {
        const date = new Date(photo.date);
        return date.getFullYear();
    }));
    
    years.forEach(year => {
        const option = document.createElement('option');
        option.value = year;
        option.textContent = year;
        yearFilter.appendChild(option);
    });
    
    // Add month filter options
    const angleFilter = document.getElementById('angleFilter');
    if (!angleFilter) return;
    
    angleFilter.innerHTML = `
        <option value="all">All Angles</option>
        <option value="front">Front</option>
        <option value="side">Side</option>
        <option value="back">Back</option>
        <option value="relaxed">Relaxed</option>
        <option value="flexed">Flexed</option>
    `;
    
    yearFilter.addEventListener('change', filterGallery);
    angleFilter.addEventListener('change', filterGallery);
}

// Enhanced filter function
function filterGallery() {
    const yearFilter = document.getElementById('yearFilter');
    const angleFilter = document.getElementById('angleFilter');
    
    if (!yearFilter || !angleFilter) return;
    
    const yearValue = yearFilter.value;
    const angleValue = angleFilter.value;
    
    const filteredPhotos = photosData.filter(photo => {
        const date = new Date(photo.date);
        const photoYear = date.getFullYear().toString();
        
        const yearMatch = yearValue === 'all' || photoYear === yearValue;
        const angleMatch = angleValue === 'all' || photo.angle === angleValue;
        
        return yearMatch && angleMatch;
    });
    
    displayPhotos(filteredPhotos);
}

// Image Bank Functions
function openImageBank() {
    document.getElementById('imageBankModal').style.display = 'block';
    // Reset to root view when opening
    currentPath = [];
    loadImageGallery();
}

function closeImageBank() {
    document.getElementById('imageBankModal').style.display = 'none';
    resetUploadZone();
}

function triggerFileBrowse() {
    document.getElementById('photoUpload').click();
}

function handleDragOver(e) {
    e.preventDefault();
    e.stopPropagation();
    document.getElementById('uploadZone').classList.add('drag-over');
}

function handleDragLeave(e) {
    e.preventDefault();
    e.stopPropagation();
    document.getElementById('uploadZone').classList.remove('drag-over');
}

function handleDrop(e) {
    e.preventDefault();
    e.stopPropagation();
    document.getElementById('uploadZone').classList.remove('drag-over');
    
    const files = Array.from(e.dataTransfer.files).filter(file => 
        file.type.startsWith('image/')
    );
    
    if (files.length > 0) {
        handleFiles(files);
    }
}

function handleFileSelect(e) {
    const files = Array.from(e.target.files).filter(file => 
        file.type.startsWith('image/')
    );
    
    if (files.length > 0) {
        handleFiles(files);
    }
}

function handleFiles(files) {
    selectedPhotos = files;
    showUploadPreviews(files);
    document.getElementById('processUploadBtn').disabled = false;
}

function showUploadPreviews(files) {
    const uploadZone = document.getElementById('uploadZone');
    uploadZone.innerHTML = '<div class="upload-preview" id="uploadPreview"></div>';
    
    const previewContainer = document.getElementById('uploadPreview');
    
    files.forEach((file, index) => {
        const reader = new FileReader();
        reader.onload = function(e) {
            const previewItem = document.createElement('div');
            previewItem.className = 'preview-item';
            previewItem.innerHTML = `
                <img src="${e.target.result}" alt="Preview">
                <button class="preview-remove" data-index="${index}">×</button>
            `;
            previewContainer.appendChild(previewItem);
            
            previewItem.querySelector('.preview-remove').addEventListener('click', function() {
                removePreview(index);
            });
        };
        reader.readAsDataURL(file);
    });
}

function removePreview(index) {
    selectedPhotos.splice(index, 1);
    if (selectedPhotos.length === 0) {
        resetUploadZone();
    } else {
        showUploadPreviews(selectedPhotos);
    }
}

function resetUploadZone() {
    const uploadZone = document.getElementById('uploadZone');
    uploadZone.innerHTML = `
        <div class="upload-placeholder">
            <div class="upload-icon">📸</div>
            <p>Drag & drop photos here or click to browse</p>
            <input type="file" id="photoUpload" multiple accept="image/*" style="display: none;">
            <button class="action-btn" id="browseBtn">Browse Files</button>
        </div>
    `;
    document.getElementById('browseBtn').addEventListener('click', triggerFileBrowse);
    document.getElementById('processUploadBtn').disabled = true;
    selectedPhotos = [];
}

async function processUploads() {
    const date = document.getElementById('photoDate').value;
    const angle = document.getElementById('photoAngle').value;
    
    if (!date) {
        showNotification('Please select a date', 'error');
        return;
    }

    if (selectedPhotos.length === 0) {
        showNotification('Please select photos to upload', 'error');
        return;
    }
    
    // Create progress UI
    const uploadZone = document.getElementById('uploadZone');
    uploadZone.innerHTML = `
        <div class="upload-progress">
            <h4>Uploading Photos...</h4>
            <div class="progress-bar">
                <div class="progress-fill" style="width: 0%"></div>
            </div>
            <p>Processing 0/${selectedPhotos.length}</p>
        </div>
    `;
    
    // Process each photo
    for (let i = 0; i < selectedPhotos.length; i++) {
        const file = selectedPhotos[i];
        await processSinglePhoto(file, date, angle, i);
        
        // Update progress
        const progress = ((i + 1) / selectedPhotos.length) * 100;
        document.querySelector('.progress-fill').style.width = progress + '%';
        document.querySelector('.upload-progress p').textContent = 
            `Processing ${i + 1}/${selectedPhotos.length}`;
    }
    
    // Complete
    setTimeout(() => {
        showNotification('Photos uploaded successfully!', 'success');
        resetUploadZone();
        loadImageGallery();
    }, 500);
}

async function processSinglePhoto(file, date, angle, index) {
    return new Promise((resolve) => {
        const reader = new FileReader();
        reader.onload = async function(e) {
            // Create filename with timestamp
            const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
            const filename = `${date}_${angle}_${timestamp}.jpg`;
            
            // Save photo data
            const photoData = {
                filename: filename,
                date: date,
                angle: angle,
                timestamp: new Date().toISOString(),
                data: e.target.result // Base64 encoded image
            };
            
            // Save to storage
            await savePhoto(photoData);
            resolve();
        };
        reader.readAsDataURL(file);
    });
}

function formatDate(dateString) {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { 
        year: 'numeric', 
        month: 'short', 
        day: 'numeric' 
    });
}

function openComparison(photo) {
    console.log('Opening comparison for:', photo.filename);
    showNotification('Comparison feature coming soon!', 'info');
    // Or actually implement the comparison feature
}

function closeComparison() {
    document.getElementById('comparisonModal').style.display = 'none';
}

function goBack() {
    window.location.href = 'index.html';
}

function openSetupModal() {
    setupModal.style.display = 'block';
    loadWorkoutPlans();
    showStep(1);
}

function closeModal() {
    setupModal.style.display = 'none';
    resetSetup();
}

function showImageBank() {
    openImageBank();
}

function showStep(stepNumber) {
    // Hide all steps
    document.querySelectorAll('.setup-step').forEach(step => {
        step.style.display = 'none';
    });
    
    // Show selected step
    const stepElement = document.getElementById(`step${stepNumber}`);
    if (stepElement) {
        stepElement.style.display = 'block';
    }
}

function resetSetup() {
    selectedWorkout = null;
    selectedDay = null;
    progressionSettings = {};
    showStep(1);
}

async function loadWorkoutPlans() {
    try {
        let workoutPlans = [];
        
        if (window.fitnessAppAPI && window.fitnessAppAPI.readWorkoutPlans) {
            workoutPlans = await window.fitnessAppAPI.readWorkoutPlans();
        } else {
            const saved = localStorage.getItem('workoutPlans');
            workoutPlans = saved ? JSON.parse(saved) : [];
        }
        
        displayWorkoutPlans(workoutPlans);
    } catch (error) {
        console.error('Error loading workout plans:', error);
    }
}

function displayWorkoutPlans(workoutPlans) {
    const workoutList = document.getElementById('progressive-workout-list');
    if (!workoutList) return;
    
    workoutList.innerHTML = '';
    
    if (workoutPlans.length === 0) {
        workoutList.innerHTML = '<p class="no-data">No workout plans found.</p>';
        return;
    }
    
    workoutPlans.forEach(plan => {
        const workoutCard = document.createElement('div');
        workoutCard.className = 'workout-card';
        workoutCard.innerHTML = `
            <h4>${plan.name}</h4>
            <p>${getWorkoutDayCount(plan)} workout days</p>
            <button class="action-btn select-workout-btn">Select</button>
        `;
        
        workoutCard.querySelector('.select-workout-btn').addEventListener('click', () => {
            selectedWorkout = plan;
            loadDaysForWorkout(plan);
            showStep(2);
        });
        
        workoutList.appendChild(workoutCard);
    });
}

function getWorkoutDayCount(workoutPlan) {
    if (!workoutPlan.schedule) return 0;
    return workoutPlan.schedule.filter(day => day && day.dayId).length;
}

function loadDaysForWorkout(workout) {
    const dayList = document.getElementById('progressive-day-list');
    if (!dayList) return;
    
    dayList.innerHTML = '';
    
    if (!workout.schedule) {
        dayList.innerHTML = '<p class="no-data">No days configured.</p>';
        return;
    }
    
    // Get unique days
    const uniqueDays = {};
    workout.schedule.forEach(day => {
        if (day && day.dayId) {
            if (!uniqueDays[day.dayId]) {
                uniqueDays[day.dayId] = day;
            }
        }
    });
    
    Object.values(uniqueDays).forEach(day => {
        const dayCard = document.createElement('div');
        dayCard.className = 'day-card';
        dayCard.innerHTML = `
            <div class="day-header">
                <span class="day-icon">${day.icon || '🏋️'}</span>
                <h4>${day.dayName}</h4>
            </div>
            <button class="action-btn select-day-btn">Select</button>
        `;
        
        dayCard.querySelector('.select-day-btn').addEventListener('click', () => {
            selectedDay = day;
            loadExercisesConfiguration();
            showStep(3);
        });
        
        dayList.appendChild(dayCard);
    });
}

async function loadExercisesConfiguration() {
    const exercisesConfig = document.getElementById('exercises-config');
    if (!exercisesConfig) return;
    
    exercisesConfig.innerHTML = '<p>Loading exercises...</p>';
    
    try {
        // Load saved days to get exercises
        let savedDays = [];
        if (window.fitnessAppAPI && window.fitnessAppAPI.readWorkoutData) {
            savedDays = await window.fitnessAppAPI.readWorkoutData();
        } else {
            const saved = localStorage.getItem('workoutData');
            savedDays = saved ? JSON.parse(saved) : [];
        }
        
        const dayData = savedDays.find(d => d.id === selectedDay.dayId);
        if (!dayData || !dayData.exercises) {
            exercisesConfig.innerHTML = '<p class="no-data">No exercises found for this day.</p>';
            return;
        }
        
        displayExercisesConfiguration(dayData.exercises);
    } catch (error) {
        console.error('Error loading exercises:', error);
        exercisesConfig.innerHTML = '<p class="error">Error loading exercises</p>';
    }
}

function displayExercisesConfiguration(exercises) {
    const exercisesConfig = document.getElementById('exercises-config');
    if (!exercisesConfig) return;
    
    exercisesConfig.innerHTML = '<h4>Configure Progression:</h4>';
    
    exercises.forEach((exercise, index) => {
        const exerciseConfig = document.createElement('div');
        exerciseConfig.className = 'exercise-config';
        exerciseConfig.innerHTML = `
            <div class="exercise-header">
                <h5>${exercise.name}</h5>
                <label class="toggle-label">
                    <input type="checkbox" class="enable-progression" data-exercise="${exercise.name}">
                    Enable Progression
                </label>
            </div>
            
            <div class="progression-settings" style="display: none;">
                <div class="form-group">
                    <label>Increase Amount (lbs/kg):</label>
                    <input type="number" min="0.5" step="0.5" value="5" 
                           class="increase-amount" data-exercise="${exercise.name}">
                </div>
                
                <div class="form-group">
                    <label>Interval (weeks):</label>
                    <input type="number" min="1" value="2" 
                           class="interval-weeks" data-exercise="${exercise.name}">
                </div>
                
                <div class="form-group">
                    <label>Next Increase Date:</label>
                    <input type="date" class="next-increase-date" data-exercise="${exercise.name}">
                </div>
            </div>
        `;
        
        // Toggle progression settings
        const toggle = exerciseConfig.querySelector('.enable-progression');
        const settings = exerciseConfig.querySelector('.progression-settings');
        
        if (toggle && settings) {
            toggle.addEventListener('change', function() {
                settings.style.display = this.checked ? 'block' : 'none';
            });
        }
        
        // Set default next increase date (2 weeks from now)
        const nextDateInput = exerciseConfig.querySelector('.next-increase-date');
        if (nextDateInput) {
            const twoWeeksFromNow = new Date();
            twoWeeksFromNow.setDate(twoWeeksFromNow.getDate() + 14);
            nextDateInput.value = twoWeeksFromNow.toISOString().split('T')[0];
        }
        
        exercisesConfig.appendChild(exerciseConfig);
    });
}

async function saveProgressionPlan() {
    // Collect all progression settings
    const progressionSettings = {};
    
    document.querySelectorAll('.exercise-config').forEach(config => {
        const enableCheckbox = config.querySelector('.enable-progression');
        if (!enableCheckbox) return;
        
        const exerciseName = enableCheckbox.dataset.exercise;
        const enabled = enableCheckbox.checked;
        
        if (enabled) {
            progressionSettings[exerciseName] = {
                increaseAmount: parseFloat(config.querySelector('.increase-amount').value),
                intervalWeeks: parseInt(config.querySelector('.interval-weeks').value),
                nextIncreaseDate: config.querySelector('.next-increase-date').value,
                lastIncreased: null,
                enabled: true
            };
        }
    });
    
    // Save progression plan
    try {
        const progressionPlan = {
            workoutId: selectedWorkout.id,
            workoutName: selectedWorkout.name,
            dayId: selectedDay.dayId,
            dayName: selectedDay.dayName,
            exercises: progressionSettings,
            createdAt: new Date().toISOString()
        };
        
        // Save to storage
        let existingPlans = [];
        if (window.fitnessAppAPI && window.fitnessAppAPI.readProgressionPlans) {
            existingPlans = await window.fitnessAppAPI.readProgressionPlans();
        } else {
            const saved = localStorage.getItem('progressionPlans');
            existingPlans = saved ? JSON.parse(saved) : [];
        }
        
        // Remove existing plan for this day if it exists
        const filteredPlans = existingPlans.filter(plan => 
            !(plan.workoutId === selectedWorkout.id && plan.dayId === selectedDay.dayId)
        );
        
        filteredPlans.push(progressionPlan);
        
        if (window.fitnessAppAPI && window.fitnessAppAPI.saveProgressionPlans) {
            await window.fitnessAppAPI.saveProgressionPlans(filteredPlans);
        } else {
            localStorage.setItem('progressionPlans', JSON.stringify(filteredPlans));
        }
        
        // SUCCESS: Replaced alert with notification
        showNotification('Progression plan saved successfully!', 'success');
        closeModal();
        
    } catch (error) {
        // ERROR: Replaced alert with notification + console error
        console.error('Error saving progression plan:', error);
        showNotification('Error saving progression plan', 'error');
    }
}

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

async function loadProgressionPlans() {
    // Load and display existing progression plans
    try {
        let progressionPlans = [];
        if (window.fitnessAppAPI && window.fitnessAppAPI.readProgressionPlans) {
            progressionPlans = await window.fitnessAppAPI.readProgressionPlans();
        } else {
            const saved = localStorage.getItem('progressionPlans');
            progressionPlans = saved ? JSON.parse(saved) : [];
        }
        
        console.log('Loaded progression plans:', progressionPlans);
    } catch (error) {
        console.error('Error loading progression plans:', error);
    }
}