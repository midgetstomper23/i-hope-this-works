// photos.js - Progress Photos Management System
console.log('📷 photos.js loaded');

let currentFolderId = 'root';
let currentEditingFolder = null;
let currentViewingPhoto = null;

// Folder structure in localStorage
const FOLDERS_KEY = 'progressPhotosFolders';
const PHOTOS_KEY = 'progressPhotos';

document.addEventListener('DOMContentLoaded', function() {
    console.log('📷 Initializing photos modal...');
    initializePhotosModal();
});

function initializePhotosModal() {
    console.log('📷 Setting up photos modal event listeners');
    
    // Event listeners for photos modal
    document.getElementById('createFolderBtn').addEventListener('click', openCreateFolderModal);
    document.getElementById('uploadPhotosBtn').addEventListener('click', triggerPhotoUpload);
    document.getElementById('photoUploadInput').addEventListener('change', handlePhotoUpload);
    document.getElementById('closePhotosModal').addEventListener('click', closePhotosModal);
    
    // Create folder modal
    document.getElementById('closeCreateFolderModal').addEventListener('click', closeCreateFolderModal);
    document.getElementById('cancelCreateFolder').addEventListener('click', closeCreateFolderModal);
    document.getElementById('confirmCreateFolder').addEventListener('click', confirmCreateFolder);
    
    // Photo viewer modal
    document.getElementById('closePhotoViewerModal').addEventListener('click', closePhotoViewerModal);
    document.getElementById('deletePhotoBtn').addEventListener('click', deleteCurrentPhoto);
    
    // Initialize data
    initializePhotosData();
}

function initializePhotosData() {
    // Initialize folders if not exists
    if (!localStorage.getItem(FOLDERS_KEY)) {
        const rootFolder = {
            id: 'root',
            name: 'Progress Photos',
            parentId: null,
            createdAt: new Date().toISOString()
        };
        localStorage.setItem(FOLDERS_KEY, JSON.stringify([rootFolder]));
    }
    
    // Initialize photos if not exists
    if (!localStorage.getItem(PHOTOS_KEY)) {
        localStorage.setItem(PHOTOS_KEY, JSON.stringify([]));
    }
}

function openPhotosModal() {
    document.getElementById('photosModal').style.display = 'flex';
    loadCurrentFolder();
}

function closePhotosModal() {
    document.getElementById('photosModal').style.display = 'none';
    currentFolderId = 'root';
}

function loadCurrentFolder() {
    const folders = getFolders();
    const photos = getPhotos();
    
    updateBreadcrumb();
    displayFolders(folders.filter(folder => folder.parentId === currentFolderId));
    displayPhotos(photos.filter(photo => photo.folderId === currentFolderId));
}

function getFolders() {
    return JSON.parse(localStorage.getItem(FOLDERS_KEY) || '[]');
}

function getPhotos() {
    return JSON.parse(localStorage.getItem(PHOTOS_KEY) || '[]');
}

function saveFolders(folders) {
    localStorage.setItem(FOLDERS_KEY, JSON.stringify(folders));
}

function savePhotos(photos) {
    localStorage.setItem(PHOTOS_KEY, JSON.stringify(photos));
}

function updateBreadcrumb() {
    const breadcrumb = document.getElementById('breadcrumb');
    breadcrumb.innerHTML = '';
    
    // Build breadcrumb trail
    const path = getFolderPath(currentFolderId);
    path.forEach((folder, index) => {
        const breadcrumbItem = document.createElement('span');
        breadcrumbItem.className = 'breadcrumb-item';
        breadcrumbItem.textContent = folder.name;
        breadcrumbItem.dataset.folderId = folder.id;
        
        if (index < path.length - 1) {
            breadcrumbItem.style.cursor = 'pointer';
            breadcrumbItem.style.color = '#3498db';
            breadcrumbItem.addEventListener('click', () => navigateToFolder(folder.id));
        } else {
            breadcrumbItem.style.color = '#2c3e50';
            breadcrumbItem.style.fontWeight = 'bold';
        }
        
        breadcrumb.appendChild(breadcrumbItem);
        
        if (index < path.length - 1) {
            const separator = document.createElement('span');
            separator.textContent = ' › ';
            separator.style.margin = '0 8px';
            separator.style.color = '#7f8c8d';
            breadcrumb.appendChild(separator);
        }
    });
}

function getFolderPath(folderId) {
    const folders = getFolders();
    const path = [];
    let currentId = folderId;
    
    while (currentId) {
        const folder = folders.find(f => f.id === currentId);
        if (folder) {
            path.unshift(folder);
            currentId = folder.parentId;
        } else {
            break;
        }
    }
    
    return path;
}

function displayFolders(folders) {
    const grid = document.getElementById('foldersGrid');
    
    if (folders.length === 0) {
        grid.innerHTML = '<div class="no-items">No folders</div>';
        return;
    }
    
    grid.innerHTML = folders.map(folder => `
        <div class="folder-item" data-folder-id="${folder.id}">
            <div class="folder-icon">📁</div>
            <div class="folder-name">${folder.name}</div>
            <div class="folder-actions">
                <button class="icon-btn" onclick="renameFolder('${folder.id}')" title="Rename">✏️</button>
                <button class="icon-btn" onclick="deleteFolder('${folder.id}')" title="Delete">🗑️</button>
            </div>
        </div>
    `).join('');
    
    // Add click event to folders
    grid.querySelectorAll('.folder-item').forEach(item => {
        item.addEventListener('click', (e) => {
            if (!e.target.closest('.folder-actions')) {
                navigateToFolder(item.dataset.folderId);
            }
        });
    });
}

function displayPhotos(photos) {
    const grid = document.getElementById('photosGrid');
    
    if (photos.length === 0) {
        grid.innerHTML = '<div class="no-items">No photos</div>';
        return;
    }
    
    grid.innerHTML = photos.map(photo => `
        <div class="photo-item" data-photo-id="${photo.id}">
            <img src="${photo.dataUrl}" alt="Progress Photo" class="photo-thumbnail">
            <div class="photo-overlay">
                <button class="icon-btn" onclick="viewPhoto('${photo.id}')" title="View">👁️</button>
                <button class="icon-btn" onclick="deletePhoto('${photo.id}')" title="Delete">🗑️</button>
            </div>
        </div>
    `).join('');
}

function navigateToFolder(folderId) {
    currentFolderId = folderId;
    loadCurrentFolder();
}

function openCreateFolderModal() {
    currentEditingFolder = null;
    document.getElementById('createFolderTitle').textContent = 'Create New Folder';
    document.getElementById('folderNameInput').value = '';
    document.getElementById('createFolderModal').style.display = 'flex';
}

function closeCreateFolderModal() {
    document.getElementById('createFolderModal').style.display = 'none';
    currentEditingFolder = null;
}

function confirmCreateFolder() {
    const folderName = document.getElementById('folderNameInput').value.trim();
    
    if (!folderName) {
        alert('Please enter a folder name');
        return;
    }
    
    const folders = getFolders();
    const newFolder = {
        id: 'folder-' + Date.now(),
        name: folderName,
        parentId: currentFolderId,
        createdAt: new Date().toISOString()
    };
    
    folders.push(newFolder);
    saveFolders(folders);
    
    closeCreateFolderModal();
    loadCurrentFolder();
    showNotification('Folder created successfully!', 'success');
}

function renameFolder(folderId) {
    const folders = getFolders();
    const folder = folders.find(f => f.id === folderId);
    
    if (!folder) return;
    
    currentEditingFolder = folderId;
    document.getElementById('createFolderTitle').textContent = 'Rename Folder';
    document.getElementById('folderNameInput').value = folder.name;
    document.getElementById('createFolderModal').style.display = 'flex';
}

function deleteFolder(folderId) {
    if (!confirm('Delete this folder and all its contents?')) return;
    
    const folders = getFolders();
    const photos = getPhotos();
    
    // Recursively get all subfolders
    const foldersToDelete = getFolderTree(folderId);
    
    // Delete folders
    const updatedFolders = folders.filter(f => !foldersToDelete.includes(f.id));
    
    // Delete photos in these folders
    const updatedPhotos = photos.filter(photo => !foldersToDelete.includes(photo.folderId));
    
    saveFolders(updatedFolders);
    savePhotos(updatedPhotos);
    
    // If current folder is being deleted, go to parent
    if (foldersToDelete.includes(currentFolderId)) {
        const deletedFolder = folders.find(f => f.id === folderId);
        currentFolderId = deletedFolder.parentId || 'root';
    }
    
    loadCurrentFolder();
    showNotification('Folder deleted successfully!', 'success');
}

function getFolderTree(folderId) {
    const folders = getFolders();
    const tree = [folderId];
    
    function getSubfolders(parentId) {
        const subfolders = folders.filter(f => f.parentId === parentId);
        subfolders.forEach(folder => {
            tree.push(folder.id);
            getSubfolders(folder.id);
        });
    }
    
    getSubfolders(folderId);
    return tree;
}

function triggerPhotoUpload() {
    document.getElementById('photoUploadInput').click();
}

function handlePhotoUpload(event) {
    const files = event.target.files;
    
    if (files.length === 0) return;
    
    const photos = getPhotos();
    
    Array.from(files).forEach(file => {
        if (!file.type.startsWith('image/')) {
            showNotification('Only image files are allowed', 'error');
            return;
        }
        
        const reader = new FileReader();
        reader.onload = function(e) {
            const newPhoto = {
                id: 'photo-' + Date.now(),
                name: file.name,
                dataUrl: e.target.result,
                folderId: currentFolderId,
                uploadedAt: new Date().toISOString(),
                size: file.size,
                type: file.type
            };
            
            photos.push(newPhoto);
            savePhotos(photos);
            loadCurrentFolder();
            showNotification('Photo uploaded successfully!', 'success');
        };
        reader.readAsDataURL(file);
    });
    
    // Reset input
    event.target.value = '';
}

function viewPhoto(photoId) {
    const photos = getPhotos();
    const photo = photos.find(p => p.id === photoId);
    
    if (!photo) return;
    
    currentViewingPhoto = photoId;
    document.getElementById('viewerImage').src = photo.dataUrl;
    document.getElementById('photoViewerTitle').textContent = photo.name;
    document.getElementById('photoViewerModal').style.display = 'flex';
}

function closePhotoViewerModal() {
    document.getElementById('photoViewerModal').style.display = 'none';
    currentViewingPhoto = null;
}

function deletePhoto(photoId) {
    if (!confirm('Delete this photo?')) return;
    
    const photos = getPhotos();
    const updatedPhotos = photos.filter(p => p.id !== photoId);
    savePhotos(updatedPhotos);
    
    if (currentViewingPhoto === photoId) {
        closePhotoViewerModal();
    }
    
    loadCurrentFolder();
    showNotification('Photo deleted successfully!', 'success');
}

function deleteCurrentPhoto() {
    if (currentViewingPhoto) {
        deletePhoto(currentViewingPhoto);
    }
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

// Make all necessary functions globally available
window.openPhotosModal = openPhotosModal;
window.closePhotosModal = closePhotosModal;
window.loadCurrentFolder = loadCurrentFolder;
window.navigateToFolder = navigateToFolder;
window.renameFolder = renameFolder;
window.deleteFolder = deleteFolder;
window.viewPhoto = viewPhoto;
window.deletePhoto = deletePhoto;
window.openCreateFolderModal = openCreateFolderModal;
window.triggerPhotoUpload = triggerPhotoUpload;