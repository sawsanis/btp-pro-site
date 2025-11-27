// ========== REALESTATE MEDIA - COMPRESSION ET GALERIE ==========
console.log('🖼️ Chargement du module RealEstate Media...');

// ========== FONCTIONS DE COMPRESSION D'IMAGES ==========
function compressImage(file, maxWidth = 800, maxHeight = 600, quality = 0.7) {
    return new Promise((resolve, reject) => {
        console.log(`📸 Compression de l'image: ${file.name} (${(file.size/1024/1024).toFixed(2)} MB)`);
        
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');
        const img = new Image();
        
        img.onload = function() {
            // Calcul des nouvelles dimensions
            let width = img.width;
            let height = img.height;
            
            // Redimensionner seulement si l'image est plus grande que les dimensions max
            if (width > maxWidth || height > maxHeight) {
                const ratio = Math.min(maxWidth / width, maxHeight / height);
                width = Math.floor(width * ratio);
                height = Math.floor(height * ratio);
            }
            
            // Configuration du canvas
            canvas.width = width;
            canvas.height = height;
            
            // Appliquer les paramètres de qualité
            ctx.imageSmoothingQuality = 'high';
            ctx.drawImage(img, 0, 0, width, height);
            
            // Compression en JPEG (meilleure compression)
            canvas.toBlob(blob => {
                console.log(`✅ Image compressée: ${(blob.size/1024/1024).toFixed(2)} MB (réduction: ${((1 - blob.size/file.size) * 100).toFixed(1)}%)`);
                resolve(blob);
            }, 'image/jpeg', quality);
        };
        
        img.onerror = reject;
        img.src = URL.createObjectURL(file);
    });
}

// ========== UPLOAD AVEC COMPRESSION AUTOMATIQUE ==========
async function handlePhotoUploadWithCompression(form) {
    const photoInput = form.querySelector('input[type="file"]');
    const uploadedPhotos = [];
    
    if (photoInput && photoInput.files.length > 0) {
        console.log('📸 Upload de photos détecté:', photoInput.files.length, 'fichiers');
        
        // Limiter à 5 photos maximum
        const files = Array.from(photoInput.files).slice(0, 5);
        
        for (const file of files) {
            try {
                // Vérifier la taille du fichier (max 5MB)
                if (file.size > 5 * 1024 * 1024) {
                    showAlert(`❌ La photo "${file.name}" est trop volumineuse (max 5MB)`, 'error');
                    continue;
                }
                
                // Vérifier le type de fichier
                if (!file.type.startsWith('image/')) {
                    showAlert(`❌ Le fichier "${file.name}" n'est pas une image valide`, 'error');
                    continue;
                }
                
                let processedFile = file;
                
                // COMPRESSION AUTOMATIQUE pour les images > 500KB
                if (file.size > 500 * 1024) {
                    console.log(`🔄 Compression de ${file.name} (${(file.size/1024).toFixed(0)} KB)`);
                    processedFile = await compressImage(file, 800, 600, 0.7);
                } else {
                    console.log(`✅ Image ${file.name} déjà optimale (${(file.size/1024).toFixed(0)} KB)`);
                }
                
                // Conversion en Base64
                const base64Image = await convertFileToBase64(processedFile);
                uploadedPhotos.push(base64Image);
                
                console.log(`✅ Photo traitée: ${file.name}`);
                
            } catch (error) {
                console.error(`❌ Erreur traitement photo ${file.name}:`, error);
                showAlert(`❌ Erreur lors du traitement de "${file.name}"`, 'error');
            }
        }
    }
    
    console.log(`📊 ${uploadedPhotos.length} photos traitées avec compression`);
    return uploadedPhotos;
}

// ========== CONVERSION FICHIER EN BASE64 ==========
function convertFileToBase64(file) {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => resolve(reader.result);
        reader.onerror = reject;
        reader.readAsDataURL(file);
    });
}

// ========== GESTION PRÉVISUALISATION PHOTOS ==========
function setupPhotoPreview() {
    const photoInput = document.getElementById('realestatePhotos');
    const previewContainer = document.getElementById('photoPreview');
    
    if (!photoInput || !previewContainer) return;
    
    photoInput.addEventListener('change', function(e) {
        const files = e.target.files;
        previewContainer.innerHTML = '';
        
        if (files.length > 5) {
            showAlert('❌ Maximum 5 photos autorisées', 'error');
            this.value = '';
            return;
        }
        
        for (let i = 0; i < files.length; i++) {
            const file = files[i];
            const reader = new FileReader();
            
            reader.onload = function(e) {
                const preview = document.createElement('div');
                preview.className = 'photo-preview-item position-relative';
                preview.innerHTML = `
                    <img src="${e.target.result}" class="img-thumbnail" alt="Preview" style="width: 100px; height: 100px; object-fit: cover;">
                    <button type="button" class="btn btn-danger btn-sm position-absolute top-0 end-0" onclick="removePhotoPreview(this)">
                        <i class="fas fa-times"></i>
                    </button>
                `;
                previewContainer.appendChild(preview);
            };
            
            reader.readAsDataURL(file);
        }
    });
}

function removePhotoPreview(button) {
    const previewItem = button.closest('.photo-preview-item');
    previewItem.remove();
    
    // Mettre à jour l'input file
    const photoInput = document.getElementById('realestatePhotos');
    photoInput.value = '';
}

function resetPhotoPreview() {
    const previewContainer = document.getElementById('photoPreview');
    if (previewContainer) {
        previewContainer.innerHTML = '';
    }
    
    const photoInput = document.getElementById('realestatePhotos');
    if (photoInput) {
        photoInput.value = '';
    }
}

// ========== GALERIE PHOTOS MODALE ==========
function showPhotoGallery(propertyId) {
    console.log('🖼️ Affichage galerie photos pour:', propertyId);
    
    // Récupérer les données de l'annonce
    btpDB.get('realestate_posts').then(properties => {
        const property = properties.find(p => p.id == propertyId);
        if (!property || !property.photos || property.photos.length === 0) {
            showAlert('❌ Aucune photo disponible pour ce bien', 'info');
            return;
        }
        
        let currentPhotoIndex = 0;
        
        const galleryModal = document.createElement('div');
        galleryModal.className = 'modal fade';
        galleryModal.id = 'photoGalleryModal';
        galleryModal.innerHTML = `
            <div class="modal-dialog modal-lg modal-dialog-centered">
                <div class="modal-content">
                    <div class="modal-header bg-dark text-white">
                        <h5 class="modal-title">
                            <i class="fas fa-images me-2"></i>
                            Galerie photos - ${property.title || 'Bien immobilier'}
                        </h5>
                        <button type="button" class="btn-close btn-close-white" data-bs-dismiss="modal"></button>
                    </div>
                    <div class="modal-body text-center">
                        <div class="photo-container mb-3">
                            <img id="galleryCurrentPhoto" src="${property.photos[0]}" 
                                 class="img-fluid rounded" 
                                 style="max-height: 500px; object-fit: contain;"
                                 alt="Photo du bien">
                        </div>
                        
                        ${property.photos.length > 1 ? `
                        <div class="navigation-buttons mb-3">
                            <button class="btn btn-outline-primary me-2" onclick="prevPhoto()">
                                <i class="fas fa-chevron-left"></i> Précédente
                            </button>
                            <span class="mx-3 text-muted">
                                <span id="currentPhotoNumber">1</span> / ${property.photos.length}
                            </span>
                            <button class="btn btn-outline-primary" onclick="nextPhoto()">
                                Suivante <i class="fas fa-chevron-right"></i>
                            </button>
                        </div>
                        
                        <div class="photo-thumbnails d-flex justify-content-center flex-wrap gap-2">
                            ${property.photos.map((photo, index) => `
                                <img src="${photo}" 
                                     class="thumbnail ${index === 0 ? 'active' : ''}" 
                                     style="width: 80px; height: 60px; object-fit: cover; cursor: pointer; border: 2px solid ${index === 0 ? '#0d6efd' : 'transparent'}"
                                     onclick="showPhoto(${index})"
                                     alt="Miniature ${index + 1}">
                            `).join('')}
                        </div>
                        ` : ''}
                    </div>
                    <div class="modal-footer">
                        <button type="button" class="btn btn-secondary" data-bs-dismiss="modal">
                            <i class="fas fa-times me-2"></i>Fermer
                        </button>
                    </div>
                </div>
            </div>
        `;
        
        // Supprimer l'ancien modal s'il existe
        const existingModal = document.getElementById('photoGalleryModal');
        if (existingModal) existingModal.remove();
        
        document.body.appendChild(galleryModal);
        
        // Définir les fonctions de navigation
        window.prevPhoto = function() {
            currentPhotoIndex = (currentPhotoIndex - 1 + property.photos.length) % property.photos.length;
            updateGallery();
        };
        
        window.nextPhoto = function() {
            currentPhotoIndex = (currentPhotoIndex + 1) % property.photos.length;
            updateGallery();
        };
        
        window.showPhoto = function(index) {
            currentPhotoIndex = index;
            updateGallery();
        };
        
        function updateGallery() {
            const currentPhoto = document.getElementById('galleryCurrentPhoto');
            const currentNumber = document.getElementById('currentPhotoNumber');
            const thumbnails = document.querySelectorAll('.thumbnail');
            
            if (currentPhoto) currentPhoto.src = property.photos[currentPhotoIndex];
            if (currentNumber) currentNumber.textContent = currentPhotoIndex + 1;
            
            // Mettre à jour les bordures des miniatures
            thumbnails.forEach((thumb, index) => {
                thumb.style.border = `2px solid ${index === currentPhotoIndex ? '#0d6efd' : 'transparent'}`;
            });
        }
        
        // Afficher le modal
        const modal = new bootstrap.Modal(galleryModal);
        modal.show();
        
    }).catch(error => {
        console.error('❌ Erreur chargement galerie:', error);
        showAlert('❌ Erreur lors du chargement des photos', 'error');
    });
}

// ========== FONCTIONS UTILITAIRES POUR L'AFFICHAGE ==========
function truncateText(text, maxLength) {
    if (!text) return '';
    if (text.length <= maxLength) return text;
    return text.substring(0, maxLength) + '...';
}

function formatPrice(price) {
    if (!price && price !== 0) return 'Non spécifié';
    return new Intl.NumberFormat('fr-FR').format(price) + ' MAD';
}

function formatDate(dateString) {
    if (!dateString) return '';
    const date = new Date(dateString);
    return date.toLocaleDateString('fr-FR');
}

function getPropertyTypeLabel(type) {
    const types = {
        'villa': 'Villa',
        'appartement': 'Appartement',
        'maison': 'Maison',
        'ferme': 'Ferme',
        'bungalow': 'Bungalow',
        'usine': 'Usine',
        'entrepot': 'Entrepôt',
        'bureau': 'Bureau',
        'local': 'Local commercial',
        'terrain': 'Terrain',
        'duplex': 'Duplex',
        'studio': 'Studio',
        'riad': 'Riad',
        'chalet': 'Chalet',
        'residence': 'Résidence',
        'immeuble': 'Immeuble'
    };
    return types[type] || type;
}

// ========== INITIALISATION DES FONCTIONS MÉDIA ==========
function initializeMediaFunctions() {
    console.log('🔄 Initialisation des fonctions media...');
    setupPhotoPreview();
}

// ========== EXPORT DES FONCTIONS ==========
window.compressImage = compressImage;
window.handlePhotoUploadWithCompression = handlePhotoUploadWithCompression;
window.convertFileToBase64 = convertFileToBase64;
window.setupPhotoPreview = setupPhotoPreview;
window.removePhotoPreview = removePhotoPreview;
window.resetPhotoPreview = resetPhotoPreview;
window.showPhotoGallery = showPhotoGallery;
window.initializeMediaFunctions = initializeMediaFunctions;

// Export des fonctions utilitaires pour l'affichage
window.truncateText = truncateText;
window.formatPrice = formatPrice;
window.formatDate = formatDate;
window.getPropertyTypeLabel = getPropertyTypeLabel;

console.log('✅ realestate-media.js chargé - Compression, galerie et utilitaires prêts');