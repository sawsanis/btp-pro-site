// ========== SYSTÈME UPLOAD PHOTO SIMPLIFIÉ POUR IMMOBILIER ==========
console.log('📸 photo-upload.js - Version CORRIGÉE avec ouverture sélecteur fonctionnelle');

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
            console.log(`⚠️ ${formId} déjà initialisé, mise à jour...`);
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
        
        // Désactiver la soumission automatique du formulaire
        this.preventFormSubmitOnFileSelect(formId);
        
        this.initializedForms.add(formId);
        console.log(`✅ ${formId} initialisé - Soumission automatique désactivée`);
    }

    createContainer(formId) {
        let form = document.getElementById(formId);
        if (!form) {
            console.log(`🔍 Recherche alternative pour ${formId}...`);
            // Chercher un formulaire avec classe ou contenu similaire
            const allForms = document.querySelectorAll('.publish-form, form');
            for (const f of allForms) {
                if (f.textContent.toLowerCase().includes('immobilier') && formId.includes('immobilier')) {
                    form = f;
                    console.log('🔍 Formulaire immobilier trouvé par contenu');
                    break;
                }
            }
        }
        
        if (!form) {
            console.error(`❌ Formulaire ${formId} non trouvé`);
            return null;
        }
        
        let container = document.getElementById(`${formId}-photos-container`);
        if (!container) {
            container = document.createElement('div');
            container.id = `${formId}-photos-container`;
            container.className = 'mt-4';
            
            // Trouver le bon endroit pour insérer
            const formElement = form.tagName === 'FORM' ? form : form.querySelector('form');
            if (formElement) {
                // Insérer avant le bouton de soumission ou à la fin du formulaire
                const submitBtn = formElement.querySelector('button[type="submit"], input[type="submit"]');
                if (submitBtn) {
                    submitBtn.parentNode.insertBefore(container, submitBtn);
                } else {
                    formElement.appendChild(container);
                }
            } else {
                // Fallback
                form.appendChild(container);
            }
        }
        
        return container;
    }

    createInterface(container) {
        const formId = this.currentFormId;
        
        container.innerHTML = `
            <div class="card mb-3">
                <div class="card-header bg-light">
                    <h6 class="mb-0"><i class="fas fa-camera me-2"></i>Photos</h6>
                    <small class="text-muted">${this.maxFiles} photos max • ${this.maxSizeMB}MB max par photo</small>
                </div>
                <div class="card-body">
                    <div class="border rounded p-3 text-center mb-3" 
                         style="border-style: dashed !important; cursor: pointer;"
                         id="${formId}-drop-area">
                        <i class="fas fa-cloud-upload-alt fa-2x text-muted mb-2"></i>
                        <p class="mb-1">Cliquez pour sélectionner des photos</p>
                        <button class="btn btn-sm btn-outline-primary mt-2" 
                                type="button"
                                id="${formId}-select-btn">
                            <i class="fas fa-plus me-1"></i>Sélectionner
                        </button>
                        <input type="file" class="d-none" id="${formId}-file-input" 
                               multiple accept="image/*">
                        <p class="text-muted small mt-2">Formats: JPG, PNG, WebP</p>
                    </div>
                    
                    <div id="${formId}-photo-grid" class="row g-2"></div>
                    
                    <div class="mt-3 text-center" id="${formId}-no-photos">
                        <p class="text-muted mb-0">Aucune photo sélectionnée</p>
                    </div>
                </div>
            </div>
        `;
        
        this.setupEvents();
        this.updateDisplay();
    }

    // CORRECTION : Méthode simplifiée pour éviter les conflits
    preventFormSubmitOnFileSelect(formId) {
        const fileInput = document.getElementById(`${formId}-file-input`);
        if (!fileInput) {
            console.warn(`❌ Input file non trouvé pour ${formId}`);
            return;
        }
        
        console.log(`🔒 Configuration anti-soumission pour ${formId}`);
        
        // CORRECTION : NE PAS bloquer le clic sur l'input file
        fileInput.addEventListener('click', (e) => {
            console.log('🖱️ Clic sur input file - autorisé');
            // NE PAS faire e.stopPropagation() ici
        });
        
        fileInput.addEventListener('change', (e) => {
            console.log('📁 Changement fichier - gestion normale');
            e.stopPropagation(); // Arrêter la propagation seulement
            
            // Gérer la sélection de fichiers
            this.handleFileSelect(e);
            
            // Réinitialiser la valeur pour permettre la sélection des mêmes fichiers
            e.target.value = '';
        });
        
        // CORRECTION : Simplifier les événements sur les boutons
        const dropArea = document.getElementById(`${formId}-drop-area`);
        const selectBtn = document.getElementById(`${formId}-select-btn`);
        
        // Fonction pour ouvrir le sélecteur
        const openFileSelector = (e) => {
            e.stopPropagation();
            e.preventDefault();
            
            console.log(`🎯 Ouverture sélecteur fichiers pour ${formId}`);
            if (fileInput) {
                fileInput.click();
            }
        };
        
        if (dropArea) {
            dropArea.onclick = null;
            dropArea.addEventListener('click', openFileSelector);
        }
        
        if (selectBtn) {
            selectBtn.onclick = null;
            selectBtn.addEventListener('click', openFileSelector);
        }
    }

    setupEvents() {
        const formId = this.currentFormId;
        console.log(`🔧 Configuration événements pour ${formId}`);
        
        // Les événements sont déjà configurés dans preventFormSubmitOnFileSelect
    }

    handleFileSelect(event) {
        console.log('📁 Gestion sélection fichiers...');
        
        const files = Array.from(event.target.files);
        const currentCount = this.getPhotos(this.currentFormId).length;
        
        console.log(`📁 ${files.length} fichier(s) sélectionné(s), ${currentCount} déjà chargé(s)`);
        
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
                console.log(`✅ ${file.name} ajoutée (${Math.round(file.size/1024)} KB)`);
                
                // Notification discrète
                if (files.length === 1) {
                    showAlert(`✅ ${file.name} ajoutée`, 'success');
                }
            };
            reader.readAsDataURL(file);
        });
        
        // Notification groupée
        if (files.length > 1) {
            showAlert(`✅ ${files.length} photos ajoutées`, 'success');
        }
    }

    addPhoto(photo) {
        this.photos.push(photo);
        console.log(`📸 Photo ajoutée: ${photo.name} pour formulaire ${photo.formId}`);
    }

    getPhotos(formId) {
        return this.photos.filter(p => p.formId === formId);
    }

    removePhoto(photoId) {
        if (confirm('Supprimer cette photo ?')) {
            const photo = this.photos.find(p => p.id == photoId);
            if (photo) {
                this.photos = this.photos.filter(p => p.id != photoId);
                this.updateDisplay();
                showAlert(`Photo "${photo.name}" supprimée`, 'info');
                console.log(`🗑️ Photo supprimée: ${photo.name}`);
            }
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
                col.className = 'col-4 col-md-3 col-lg-2';
                col.innerHTML = `
                    <div class="position-relative mb-2">
                        <img src="${photo.dataUrl}" class="img-fluid rounded" 
                             style="height: 80px; width: 100%; object-fit: cover;"
                             alt="Photo ${photo.name}">
                        <button class="btn btn-danger btn-sm position-absolute top-0 end-0 m-1"
                                onclick="window.photoUploadSystemInstance.removePhoto('${photo.id}')"
                                type="button"
                                style="padding: 0.1rem 0.3rem; font-size: 0.7rem;">
                            <i class="fas fa-times"></i>
                        </button>
                        <div class="position-absolute bottom-0 start-0 w-100 text-white text-center" 
                             style="background: rgba(0,0,0,0.5); font-size: 0.6rem; padding: 2px;">
                            ${Math.round(photo.size / 1024)} KB
                        </div>
                    </div>
                `;
                grid.appendChild(col);
            });
            
            console.log(`📊 Affichage mis à jour: ${photos.length} photos pour ${formId}`);
        }
    }
    
    // Nouvelle méthode : Vider les photos d'un formulaire spécifique
    clearPhotos(formId) {
        this.photos = this.photos.filter(p => p.formId !== formId);
        this.updateDisplay();
        console.log(`🧹 Photos effacées pour ${formId}`);
    }
    
    // Nouvelle méthode : Compter les photos par formulaire
    getPhotoCount(formId) {
        return this.getPhotos(formId).length;
    }
}

// ========== INITIALISATION SÉCURISÉE ==========

// Créer l'instance globale
let photoUploadSystemInstance = null;

// Fonction d'initialisation sécurisée
function initializePhotoUploadSystem() {
    console.log('🔧 Initialisation sécurisée du système d\'upload photo...');
    
    if (!photoUploadSystemInstance) {
        photoUploadSystemInstance = new PhotoUploadSystem();
        console.log('✅ Instance PhotoUploadSystem créée');
        
        // CORRECTION : Nettoyer la sécurité excessive
        // Ne pas ajouter d'écouteurs globaux qui bloquent les clics
    }
    
    return photoUploadSystemInstance;
}

// ========== FONCTIONS D'INITIALISATION DES FORMULAIRES ==========

// Fonction pour initialiser un formulaire spécifique
function initializePhotoUploadForForm(formId) {
    console.log(`🎯 Initialisation upload photo pour ${formId}...`);
    
    // Attendre que le DOM soit prêt
    setTimeout(() => {
        if (!photoUploadSystemInstance) {
            initializePhotoUploadSystem();
        }
        
        if (photoUploadSystemInstance) {
            // Vérifier que le formulaire existe
            const form = document.getElementById(formId);
            if (!form) {
                console.warn(`⚠️ Formulaire ${formId} non trouvé, tentative de recherche...`);
                // Rechercher des formulaires similaires
                const allForms = document.querySelectorAll('form, .publish-form');
                for (const f of allForms) {
                    if (f.id.includes('immobilier') && formId.includes('immobilier')) {
                        console.log(`🔍 Utilisation du formulaire ${f.id} à la place`);
                        photoUploadSystemInstance.initialize(f.id);
                        return;
                    }
                }
            } else {
                photoUploadSystemInstance.initialize(formId);
            }
        }
    }, 500);
}

// ========== FONCTION SIMPLE POUR OUVERTURE SÉLECTEUR ==========

// Fonction globale pour ouvrir le sélecteur de fichiers
window.openPhotoUploadSelector = function(formId) {
    console.log(`📁 Ouverture sélecteur pour ${formId}`);
    
    const fileInput = document.getElementById(`${formId}-file-input`);
    if (fileInput) {
        // Déclencher le clic directement
        fileInput.click();
        console.log('✅ Sélecteur déclenché');
    } else {
        console.error('❌ Input file non trouvé');
        // Essayer d'initialiser d'abord
        if (typeof initializePhotoUploadForForm === 'function') {
            initializePhotoUploadForForm(formId);
            // Réessayer après initialisation
            setTimeout(() => {
                const newFileInput = document.getElementById(`${formId}-file-input`);
                if (newFileInput) {
                    newFileInput.click();
                }
            }, 300);
        }
    }
};

// ========== EXPORTS GLOBAUX ==========

// Initialiser le système au chargement
document.addEventListener('DOMContentLoaded', function() {
    console.log('📄 DOM chargé - Initialisation système upload photo...');
    
    // Attendre un peu pour que tous les scripts soient chargés
    setTimeout(() => {
        initializePhotoUploadSystem();
        
        // Initialiser automatiquement les formulaires existants
        const formsToInitialize = ['immobilier-form', 'marketplace-form', 'jobs-form', 'freelancers-form'];
        formsToInitialize.forEach(formId => {
            if (document.getElementById(formId)) {
                setTimeout(() => initializePhotoUploadForForm(formId), 1000);
            }
        });
    }, 1000);
});

// Exporter
window.PhotoUploadSystem = PhotoUploadSystem;
window.photoUploadSystemInstance = {
    get: () => photoUploadSystemInstance,
    initialize: initializePhotoUploadSystem
};
window.initializePhotoUpload = initializePhotoUploadForForm;
window.initializePhotoUploadSystem = initializePhotoUploadSystem;

console.log('✅ photo-upload.js CORRIGÉ - Ouverture sélecteur fonctionnelle');