// ========== SYSTÈME UPLOAD PHOTO AVEC COMPRESSION 1MB ==========
class PhotoUploadSystem {
    constructor() {
        this.maxFiles = 10; // Maximum 10 photos
        this.maxSizeMB = 1; // Compression à 1MB maximum
        this.allowedTypes = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];
        this.photos = []; // Stockage temporaire des photos
        this.currentFormId = null;
        this.initializedForms = new Set(); // Pour éviter les doubles init
    }

    // Initialiser l'upload pour un formulaire
    initialize(formId, containerSelector = '.photo-upload-container') {
        console.log(`📸 Initialisation upload pour ${formId}...`);
        
        // Éviter les doubles initialisations
        if (this.initializedForms.has(formId)) {
            console.log(`⚠️ Upload déjà initialisé pour ${formId}`);
            return true;
        }
        
        this.currentFormId = formId;
        
        // Attendre que le DOM soit prêt
        setTimeout(() => {
            // Trouver le conteneur
            let container = document.querySelector(containerSelector);
            if (!container) {
                console.log(`🔍 Création conteneur pour ${formId}...`);
                container = this.createContainer(formId);
            }

            if (!container) {
                console.error(`❌ Impossible de créer/find conteneur pour ${formId}`);
                return false;
            }

            // SUPPRIMER l'ancien système s'il existe
            this.removeOldUploadSystem(container);

            // Créer le nouveau système
            this.createUploadSystem(container);
            
            // Réinitialiser les photos pour ce formulaire
            this.clearPhotos(formId);
            
            this.initializedForms.add(formId);
            console.log(`✅ Upload initialisé pour ${formId}`);
        }, 300);
        
        return true;
    }

    // Créer un conteneur si nécessaire
    createContainer(formId) {
        const form = document.getElementById(`${formId}-form`);
        if (!form) {
            console.error(`❌ Formulaire ${formId}-form non trouvé`);
            return null;
        }
        
        // Chercher d'abord par classe
        const existingContainer = form.querySelector('.photo-upload-container');
        if (existingContainer) {
            return existingContainer;
        }
        
        // Créer un nouveau conteneur
        const container = document.createElement('div');
        container.id = `${formId}-photos-container`;
        container.className = 'photo-upload-container mt-4';
        
        // Insérer avant le bouton de soumission
        const submitButton = form.querySelector('button[type="submit"]');
        if (submitButton) {
            submitButton.parentNode.insertBefore(container, submitButton);
            return container;
        }
        
        // Sinon, ajouter à la fin du formulaire
        form.appendChild(container);
        return container;
    }

    // Supprimer l'ancien système d'upload
    removeOldUploadSystem(container) {
        // Supprimer tous les anciens systèmes d'upload
        const oldSystems = container.querySelectorAll(
            '.photo-upload-area, .photo-upload-trigger, .photo-drop-zone, .photo-preview'
        );
        
        oldSystems.forEach(element => {
            element.remove();
        });
        
        // Vider les anciennes photos
        container.innerHTML = '';
    }

    // Créer le nouveau système d'upload
    createUploadSystem(container) {
        const html = `
            <div class="photo-upload-card card mb-4">
                <div class="card-header bg-light">
                    <h6 class="mb-0"><i class="fas fa-camera me-2"></i>Photos</h6>
                    <small class="text-muted">${this.maxFiles} photos max • ${this.maxSizeMB}MB max par photo</small>
                </div>
                <div class="card-body">
                    <!-- Zone de glisser-déposer -->
                    <div class="photo-drop-area border-2 border-dashed rounded p-5 text-center mb-4"
                         id="photo-drop-area"
                         style="border-color: #dee2e6; cursor: pointer;">
                        <i class="fas fa-cloud-upload-alt fa-3x text-muted mb-3"></i>
                        <h5 class="mb-2">Glissez-déposez vos photos ici</h5>
                        <p class="text-muted mb-3">ou cliquez pour sélectionner</p>
                        <button class="btn btn-primary btn-lg" id="photo-select-btn">
                            <i class="fas fa-plus me-2"></i>Sélectionner des photos
                        </button>
                        <input type="file" 
                               class="d-none" 
                               id="photo-file-input"
                               multiple 
                               accept="image/*">
                        <p class="text-muted small mt-3">
                            Formats acceptés: JPG, PNG, WebP, GIF • Compression automatique à ${this.maxSizeMB}MB
                        </p>
                    </div>
                    
                    <!-- Aperçu des photos -->
                    <div class="photo-preview-section mb-4">
                        <h6 class="mb-3"><i class="fas fa-images me-2"></i>Aperçu des photos</h6>
                        <div class="row g-3" id="photo-preview-grid">
                            <!-- Les miniatures apparaîtront ici -->
                        </div>
                        <div class="text-center py-4 ${this.getPhotos(this.currentFormId).length > 0 ? 'd-none' : ''}" 
                             id="no-photos-message">
                            <i class="fas fa-image fa-3x text-muted mb-3"></i>
                            <p class="text-muted">Aucune photo sélectionnée</p>
                        </div>
                    </div>
                    
                    <!-- Informations et compteur -->
                    <div class="photo-info card bg-light">
                        <div class="card-body p-3">
                            <div class="d-flex justify-content-between align-items-center mb-2">
                                <small class="text-muted">
                                    <span id="photo-count">0</span> / ${this.maxFiles} photos
                                </small>
                                <small class="text-muted" id="total-size">0 MB</small>
                            </div>
                            <div class="progress mb-2" style="height: 8px;">
                                <div class="progress-bar bg-success" 
                                     id="photo-progress-bar"
                                     role="progressbar" 
                                     style="width: 0%"></div>
                            </div>
                            <small class="text-muted d-block">
                                <i class="fas fa-info-circle me-1"></i>
                                Les photos sont automatiquement compressées pour optimiser l'espace
                            </small>
                        </div>
                    </div>
                </div>
            </div>
        `;
        
        container.innerHTML = html;
        
        // Initialiser les événements
        this.setupEvents();
        
        // Mettre à jour l'affichage
        this.updateDisplay();
    }

    // Configurer les événements
    setupEvents() {
        const dropArea = document.getElementById('photo-drop-area');
        const selectBtn = document.getElementById('photo-select-btn');
        const fileInput = document.getElementById('photo-file-input');
        
        if (!dropArea || !selectBtn || !fileInput) {
            console.error('❌ Éléments upload non trouvés');
            return;
        }
        
        // Clic sur le bouton
        selectBtn.addEventListener('click', (e) => {
            e.preventDefault();
            fileInput.click();
        });
        
        // Clic sur la zone de drop
        dropArea.addEventListener('click', (e) => {
            if (e.target === dropArea || e.target.closest('#photo-drop-area')) {
                fileInput.click();
            }
        });
        
        // Changement de fichiers
        fileInput.addEventListener('change', (e) => {
            const files = Array.from(e.target.files);
            this.handleFiles(files);
            fileInput.value = ''; // Réinitialiser
        });
        
        // Drag & drop
        dropArea.addEventListener('dragover', (e) => {
            e.preventDefault();
            dropArea.style.borderColor = '#0d6efd';
            dropArea.style.backgroundColor = 'rgba(13, 110, 253, 0.05)';
        });
        
        dropArea.addEventListener('dragleave', (e) => {
            e.preventDefault();
            dropArea.style.borderColor = '#dee2e6';
            dropArea.style.backgroundColor = '';
        });
        
        dropArea.addEventListener('drop', (e) => {
            e.preventDefault();
            dropArea.style.borderColor = '#dee2e6';
            dropArea.style.backgroundColor = '';
            
            const files = Array.from(e.dataTransfer.files);
            this.handleFiles(files);
        });
    }

    // Gérer les fichiers sélectionnés
    async handleFiles(files) {
        if (files.length === 0) return;
        
        // Vérifier le nombre de fichiers
        const currentPhotos = this.getPhotos(this.currentFormId);
        const remainingSlots = this.maxFiles - currentPhotos.length;
        
        if (files.length > remainingSlots) {
            showAlert(`❌ Vous ne pouvez ajouter que ${remainingSlots} photo(s) supplémentaire(s)`, 'error');
            files = files.slice(0, remainingSlots);
        }
        
        if (files.length === 0) return;
        
        // Afficher un message de chargement
        showAlert(`⏳ Traitement de ${files.length} photo(s)...`, 'info', 3000);
        
        // Traiter chaque fichier
        for (const file of files) {
            try {
                // Vérifier le type
                if (!this.allowedTypes.includes(file.type)) {
                    showAlert(`❌ ${file.name}: Type non supporté. Utilisez JPG, PNG, WebP ou GIF`, 'error');
                    continue;
                }
                
                // Compresser l'image
                const compressedFile = await this.compressImage(file);
                
                // Lire le fichier compressé
                const dataUrl = await this.readFileAsDataURL(compressedFile);
                
                // Ajouter la photo
                this.addPhoto({
                    id: Date.now() + Math.random(),
                    name: file.name,
                    originalName: file.name,
                    size: compressedFile.size,
                    originalSize: file.size,
                    type: compressedFile.type,
                    dataUrl: dataUrl,
                    file: compressedFile,
                    formId: this.currentFormId,
                    uploaded: true,
                    compressed: true,
                    compressionRatio: Math.round((1 - (compressedFile.size / file.size)) * 100)
                });
                
            } catch (error) {
                console.error(`❌ Erreur avec ${file.name}:`, error);
                showAlert(`❌ Erreur avec ${file.name}: ${error.message}`, 'error');
            }
        }
        
        // Mettre à jour l'affichage
        this.updateDisplay();
        
        // Afficher un message de succès
        showAlert(`✅ ${files.length} photo(s) ajoutée(s) avec succès`, 'success');
    }

    // Compresser une image
    compressImage(file, targetSizeMB = 1, quality = 0.85) {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.readAsDataURL(file);
            
            reader.onload = (event) => {
                const img = new Image();
                img.src = event.target.result;
                
                img.onload = () => {
                    const canvas = document.createElement('canvas');
                    
                    // Calculer les nouvelles dimensions (max 1200px)
                    let width = img.width;
                    let height = img.height;
                    const maxDimension = 1200;
                    
                    if (width > maxDimension || height > maxDimension) {
                        if (width > height) {
                            height = Math.round((height * maxDimension) / width);
                            width = maxDimension;
                        } else {
                            width = Math.round((width * maxDimension) / height);
                            height = maxDimension;
                        }
                    }
                    
                    canvas.width = width;
                    canvas.height = height;
                    
                    const ctx = canvas.getContext('2d');
                    ctx.drawImage(img, 0, 0, width, height);
                    
                    // Compresser en JPG pour réduire la taille
                    canvas.toBlob((blob) => {
                        const compressedFile = new File([blob], 
                            file.name.replace(/\.[^/.]+$/, "") + '.jpg', 
                            { type: 'image/jpeg' }
                        );
                        
                        resolve(compressedFile);
                    }, 'image/jpeg', quality);
                };
                
                img.onerror = reject;
            };
            
            reader.onerror = reject;
        });
    }

    // Lire un fichier comme DataURL
    readFileAsDataURL(file) {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.onload = (e) => resolve(e.target.result);
            reader.onerror = reject;
            reader.readAsDataURL(file);
        });
    }

    // Ajouter une photo
    addPhoto(photoData) {
        this.photos.push(photoData);
        this.updateDisplay();
    }

    // Mettre à jour l'affichage
    updateDisplay() {
        const formPhotos = this.getPhotos(this.currentFormId);
        const previewGrid = document.getElementById('photo-preview-grid');
        const noPhotosMsg = document.getElementById('no-photos-message');
        const photoCount = document.getElementById('photo-count');
        const totalSize = document.getElementById('total-size');
        const progressBar = document.getElementById('photo-progress-bar');
        
        if (!previewGrid) return;
        
        // Afficher/masquer le message "aucune photo"
        if (noPhotosMsg) {
            noPhotosMsg.classList.toggle('d-none', formPhotos.length > 0);
        }
        
        // Mettre à jour le compteur
        if (photoCount) {
            photoCount.textContent = formPhotos.length;
        }
        
        // Mettre à jour la taille totale
        if (totalSize) {
            const totalBytes = formPhotos.reduce((sum, photo) => sum + photo.size, 0);
            totalSize.textContent = this.formatFileSize(totalBytes);
        }
        
        // Mettre à jour la barre de progression
        if (progressBar) {
            const percentage = (formPhotos.length / this.maxFiles) * 100;
            progressBar.style.width = `${percentage}%`;
            
            // Changer la couleur
            progressBar.className = 'progress-bar';
            if (percentage >= 100) {
                progressBar.classList.add('bg-danger');
            } else if (percentage >= 80) {
                progressBar.classList.add('bg-warning');
            } else {
                progressBar.classList.add('bg-success');
            }
        }
        
        // Générer les miniatures
        previewGrid.innerHTML = '';
        
        formPhotos.forEach(photo => {
            const col = document.createElement('div');
            col.className = 'col-6 col-md-4 col-lg-3';
            col.innerHTML = `
                <div class="photo-thumbnail-card card" data-photo-id="${photo.id}">
                    <div class="position-relative">
                        <img src="${photo.dataUrl}" 
                             class="card-img-top"
                             alt="${photo.name}"
                             style="height: 120px; object-fit: cover;">
                        <div class="photo-stats position-absolute bottom-0 start-0 w-100 bg-dark bg-opacity-75 text-white p-2">
                            <small class="d-block">${this.formatFileSize(photo.size)}</small>
                            ${photo.compressed ? 
                              `<small class="d-block">Compressé: ${photo.compressionRatio}%</small>` : 
                              ''}
                        </div>
                        <button class="btn btn-danger btn-sm position-absolute top-0 end-0 m-2 remove-photo-btn"
                                data-photo-id="${photo.id}">
                            <i class="fas fa-times"></i>
                        </button>
                    </div>
                    <div class="card-body p-2">
                        <small class="text-truncate d-block" title="${photo.name}">${photo.name}</small>
                    </div>
                </div>
            `;
            previewGrid.appendChild(col);
        });
        
        // Ajouter les événements de suppression
        this.setupRemoveEvents();
    }

    // Configurer les événements de suppression
    setupRemoveEvents() {
        const removeButtons = document.querySelectorAll('.remove-photo-btn');
        
        removeButtons.forEach(button => {
            button.addEventListener('click', (e) => {
                e.preventDefault();
                e.stopPropagation();
                
                const photoId = button.dataset.photoId;
                if (confirm('Supprimer cette photo ?')) {
                    this.removePhoto(photoId);
                }
            });
        });
    }

    // Supprimer une photo
    removePhoto(photoId) {
        this.photos = this.photos.filter(photo => photo.id != photoId);
        this.updateDisplay();
        showAlert('🗑️ Photo supprimée', 'info');
    }

    // Obtenir les photos d'un formulaire
    getPhotos(formId = null) {
        if (formId) {
            return this.photos.filter(photo => photo.formId === formId);
        }
        return this.photos;
    }

    // Effacer toutes les photos d'un formulaire
    clearPhotos(formId = null) {
        if (formId) {
            this.photos = this.photos.filter(photo => photo.formId !== formId);
        } else {
            this.photos = [];
        }
        this.updateDisplay();
    }

    // Formater la taille du fichier
    formatFileSize(bytes) {
        if (bytes < 1024) return bytes + ' Bytes';
        if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
        return (bytes / (1024 * 1024)).toFixed(2) + ' MB';
    }

    // Obtenir les données des photos pour l'envoi
    getPhotoData(formId = null) {
        const photos = this.getPhotos(formId);
        return photos.map(photo => ({
            name: photo.name,
            size: photo.size,
            type: photo.type,
            dataUrl: photo.dataUrl,
            compressed: photo.compressed,
            compressionRatio: photo.compressionRatio
        }));
    }
}

// Initialiser l'instance globale
const photoUploadSystem = new PhotoUploadSystem();

// ========== FONCTIONS GLOBALES POUR LES FORMULAIRES ==========

// Initialiser l'upload pour un formulaire spécifique
window.initializePhotoUpload = function(formType) {
    console.log(`🎯 Initialisation upload pour ${formType}...`);
    return photoUploadSystem.initialize(formType);
};

// Obtenir les photos d'un formulaire
window.getFormPhotos = function(formType) {
    return photoUploadSystem.getPhotoData(formType);
};

// Effacer les photos d'un formulaire
window.clearFormPhotos = function(formType) {
    photoUploadSystem.clearPhotos(formType);
    return true;
};

// ========== INTÉGRATION AUTOMATIQUE AVEC LES FORMULAIRES ==========

// Initialiser quand un formulaire est affiché
function initializeFormUpload() {
    console.log('🔍 Recherche formulaires actifs...');
    
    const forms = ['marketplace', 'realestate', 'jobs', 'freelancers'];
    
    forms.forEach(formType => {
        const form = document.getElementById(`${formType}-form`);
        if (form && form.style.display === 'block') {
            console.log(`📋 Formulaire ${formType} actif - initialisation upload...`);
            setTimeout(() => {
                initializePhotoUpload(formType);
            }, 200);
        }
    });
}

// Surveiller les changements de formulaire
document.addEventListener('DOMContentLoaded', function() {
    console.log('📄 DOM chargé - Configuration upload automatique...');
    
    // Initialiser au chargement
    setTimeout(initializeFormUpload, 500);
    
    // Surveiller les changements manuels de formulaire
    const observer = new MutationObserver(function(mutations) {
        mutations.forEach(function(mutation) {
            if (mutation.type === 'attributes' && mutation.attributeName === 'style') {
                const target = mutation.target;
                if (target.classList.contains('publish-form')) {
                    setTimeout(initializeFormUpload, 100);
                }
            }
        });
    });
    
    // Observer tous les formulaires de publication
    const publishForms = document.querySelectorAll('.publish-form');
    publishForms.forEach(form => {
        observer.observe(form, { attributes: true, attributeFilter: ['style'] });
    });
    
    // Écouter les événements personnalisés si l'application les utilise
    document.addEventListener('formChanged', initializeFormUpload);
});

// Compatibilité avec la fonction showPublishForm existante
if (typeof showPublishForm === 'function') {
    const originalShowPublishForm = showPublishForm;
    window.showPublishForm = function(formType) {
        originalShowPublishForm(formType);
        setTimeout(() => {
            initializePhotoUpload(formType);
        }, 300);
    };
}

console.log('✅ photo-upload.js chargé - Système unique avec compression 1MB');