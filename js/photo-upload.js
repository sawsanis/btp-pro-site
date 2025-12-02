// ========== SYSTÈME UPLOAD PHOTO SIMPLIFIÉ POUR IMMOBILIER ==========
console.log('📸 photo-upload.js - Version simplifiée');

class PhotoUploadSystem {
    constructor() {
        this.maxFiles = 10;
        this.maxSizeMB = 1;
        this.photos = [];
        this.initializedForms = new Set();
        console.log('✅ PhotoUploadSystem construit');
    }

    initialize(formId) {
        console.log(`🎯 Initialisation pour ${formId}`);
        
        if (this.initializedForms.has(formId)) {
            return;
        }
        
        this.currentFormId = formId;
        
        // Créer le conteneur
        const container = this.createContainer(formId);
        if (!container) {
            console.error('❌ Conteneur non créé');
            return;
        }
        
        // Créer l'interface
        this.createInterface(container);
        
        this.initializedForms.add(formId);
        console.log(`✅ ${formId} initialisé`);
    }

    createContainer(formId) {
        let form = document.getElementById(formId);
        if (!form) return null;
        
        let container = document.getElementById(`${formId}-photos-container`);
        if (!container) {
            container = document.createElement('div');
            container.id = `${formId}-photos-container`;
            container.className = 'mt-4';
            
            // Insérer avant le bouton de soumission
            const submitBtn = form.querySelector('button[type="submit"]');
            if (submitBtn) {
                submitBtn.parentNode.insertBefore(container, submitBtn);
            } else {
                form.appendChild(container);
            }
        }
        
        return container;
    }

    createInterface(container) {
        container.innerHTML = `
            <div class="card mb-3">
                <div class="card-header bg-light">
                    <h6 class="mb-0"><i class="fas fa-camera me-2"></i>Photos</h6>
                    <small class="text-muted">${this.maxFiles} photos max • ${this.maxSizeMB}MB max par photo</small>
                </div>
                <div class="card-body">
                    <div class="border rounded p-3 text-center mb-3" 
                         style="border-style: dashed !important; cursor: pointer;"
                         id="${this.currentFormId}-drop-area">
                        <i class="fas fa-cloud-upload-alt fa-2x text-muted mb-2"></i>
                        <p class="mb-1">Cliquez pour sélectionner des photos</p>
                        <button class="btn btn-sm btn-outline-primary mt-2" 
                                id="${this.currentFormId}-select-btn">
                            <i class="fas fa-plus me-1"></i>Sélectionner
                        </button>
                        <input type="file" class="d-none" id="${this.currentFormId}-file-input" 
                               multiple accept="image/*">
                        <p class="text-muted small mt-2">Formats: JPG, PNG, WebP</p>
                    </div>
                    
                    <div id="${this.currentFormId}-photo-grid" class="row g-2"></div>
                    
                    <div class="mt-3 text-center" id="${this.currentFormId}-no-photos">
                        <p class="text-muted mb-0">Aucune photo sélectionnée</p>
                    </div>
                </div>
            </div>
        `;
        
        this.setupEvents();
        this.updateDisplay();
    }

    setupEvents() {
        const formId = this.currentFormId;
        const selectBtn = document.getElementById(`${formId}-select-btn`);
        const fileInput = document.getElementById(`${formId}-file-input`);
        
        if (selectBtn && fileInput) {
            selectBtn.addEventListener('click', () => fileInput.click());
            fileInput.addEventListener('change', (e) => this.handleFileSelect(e));
        }
    }

    handleFileSelect(event) {
        const files = Array.from(event.target.files);
        const currentCount = this.getPhotos(this.currentFormId).length;
        
        if (files.length + currentCount > this.maxFiles) {
            showAlert(`Maximum ${this.maxFiles} photos autorisées`, 'error');
            return;
        }
        
        files.forEach(file => {
            if (!file.type.startsWith('image/')) {
                showAlert(`${file.name}: format non supporté`, 'error');
                return;
            }
            
            if (file.size > this.maxSizeMB * 1024 * 1024) {
                showAlert(`${file.name}: taille max ${this.maxSizeMB}MB`, 'error');
                return;
            }
            
            const reader = new FileReader();
            reader.onload = (e) => {
                this.addPhoto({
                    id: Date.now() + Math.random(),
                    dataUrl: e.target.result,
                    name: file.name,
                    size: file.size,
                    formId: this.currentFormId
                });
                this.updateDisplay();
            };
            reader.readAsDataURL(file);
        });
    }

    addPhoto(photo) {
        this.photos.push(photo);
    }

    getPhotos(formId) {
        return this.photos.filter(p => p.formId === formId);
    }

    removePhoto(photoId) {
        if (confirm('Supprimer cette photo ?')) {
            this.photos = this.photos.filter(p => p.id != photoId);
            this.updateDisplay();
            showAlert('Photo supprimée', 'info');
        }
    }

    updateDisplay() {
        const formId = this.currentFormId;
        const photos = this.getPhotos(formId);
        const grid = document.getElementById(`${formId}-photo-grid`);
        const noPhotos = document.getElementById(`${formId}-no-photos`);
        
        if (grid && noPhotos) {
            noPhotos.style.display = photos.length > 0 ? 'none' : 'block';
            
            grid.innerHTML = '';
            photos.forEach(photo => {
                const col = document.createElement('div');
                col.className = 'col-3';
                col.innerHTML = `
                    <div class="position-relative">
                        <img src="${photo.dataUrl}" class="img-fluid rounded" 
                             style="height: 80px; width: 100%; object-fit: cover;">
                        <button class="btn btn-danger btn-sm position-absolute top-0 end-0 m-1"
                                onclick="window.photoUploadSystemInstance.removePhoto('${photo.id}')"
                                style="padding: 0.1rem 0.3rem; font-size: 0.7rem;">
                            <i class="fas fa-times"></i>
                        </button>
                    </div>
                `;
                grid.appendChild(col);
            });
        }
    }
}

// Créer l'instance globale
const photoUploadSystemInstance = new PhotoUploadSystem();

// Exporter
window.PhotoUploadSystem = PhotoUploadSystem;
window.photoUploadSystemInstance = photoUploadSystemInstance;
window.initializePhotoUpload = (formId) => photoUploadSystemInstance.initialize(formId);

console.log('✅ photo-upload.js - Prêt');