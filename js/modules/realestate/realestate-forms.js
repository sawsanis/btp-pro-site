// ========== REALESTATE FORMS - GESTION DES FORMULAIRES ==========
console.log('📝 Chargement du module RealEstate Forms...');

// ========== FONCTIONS DE BASE ==========
function convertFileToBase64(file) {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => resolve(reader.result);
        reader.onerror = reject;
        reader.readAsDataURL(file);
    });
}

// ========== GESTION UPLOAD PHOTOS ==========
async function handlePhotoUpload(form) {
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
                
                // Conversion en Base64
                const base64Image = await convertFileToBase64(file);
                uploadedPhotos.push(base64Image);
                
                console.log(`✅ Photo convertie en Base64: ${file.name}`);
                
            } catch (error) {
                console.error(`❌ Erreur conversion photo ${file.name}:`, error);
                showAlert(`❌ Erreur lors du traitement de "${file.name}"`, 'error');
            }
        }
    }
    
    return uploadedPhotos;
}

// ========== GESTION PRÉVISUALISATION PHOTOS ==========
function setupPhotoPreview() {
    const photoInput = document.getElementById('realestatePhotos');
    const previewContainer = document.getElementById('photoPreview');
    
    if (!photoInput || !previewContainer) {
        console.warn('❌ Éléments de prévisualisation photos non trouvés');
        return;
    }
    
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
    if (previewItem) {
        previewItem.remove();
    }
    
    // Mettre à jour l'input file
    const photoInput = document.getElementById('realestatePhotos');
    if (photoInput) {
        photoInput.value = '';
    }
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

// ========== INITIALISATION DES TYPES DE BIENS ==========
function initializeRealEstateFormTypes() {
    console.log('🔄 Initialisation des types de biens dans le formulaire...');
    
    function attemptInitialization(retryCount = 0) {
        const typeSelect = document.getElementById('realestateType');
        
        if (!typeSelect) {
            if (retryCount < 10) { // Maximum 10 tentatives
                console.warn(`❌ Select realestateType non trouvé - Réessai dans 500ms (${retryCount + 1}/10)`);
                setTimeout(() => attemptInitialization(retryCount + 1), 500);
                return;
            } else {
                console.error('❌ Échec initialisation types après 10 tentatives');
                return;
            }
        }
        
        console.log('✅ Select realestateType trouvé - Initialisation...');
        
        // Vider les options existantes sauf la première
        while (typeSelect.children.length > 1) {
            typeSelect.removeChild(typeSelect.lastChild);
        }
        
        // Ajouter tous les types de biens COMPLETS
        const propertyTypes = [
            { value: 'villa', label: 'Villa' },
            { value: 'appartement', label: 'Appartement' },
            { value: 'maison', label: 'Maison' },
            { value: 'ferme', label: 'Ferme' },
            { value: 'bungalow', label: 'Bungalow' },
            { value: 'usine', label: 'Usine' },
            { value: 'entrepot', label: 'Entrepôt' },
            { value: 'bureau', label: 'Bureau' },
            { value: 'local', label: 'Local commercial' },
            { value: 'terrain', label: 'Terrain' },
            { value: 'duplex', label: 'Duplex' },
            { value: 'studio', label: 'Studio' },
            { value: 'riad', label: 'Riad' },
            { value: 'chalet', label: 'Chalet' },
            { value: 'residence', label: 'Résidence' },
            { value: 'immeuble', label: 'Immeuble' }
        ];
        
        propertyTypes.forEach(type => {
            const option = document.createElement('option');
            option.value = type.value;
            option.textContent = type.label;
            typeSelect.appendChild(option);
        });
        
        console.log(`✅ ${propertyTypes.length} types de biens ajoutés au formulaire`);
    }
    
    // Démarrer l'initialisation
    attemptInitialization();
}

// ========== VALIDATION DU FORMULAIRE ==========
function validateRealEstateForm(data) {
    const errors = [];
    
    // Validation du titre
    if (!data.title || data.title.trim().length < 5) {
        errors.push('Le titre doit contenir au moins 5 caractères');
    }
    
    // Validation du prix
    if (!data.price || isNaN(data.price) || data.price <= 0) {
        errors.push('Le prix doit être un nombre positif');
    }
    
    // Validation de la surface
    if (data.surface && (isNaN(data.surface) || data.surface < 0)) {
        errors.push('La surface doit être un nombre positif');
    }
    
    // Validation du téléphone
    if (!data.phone || !isValidPhone(data.phone)) {
        errors.push('Le numéro de téléphone n\'est pas valide');
    }
    
    return {
        isValid: errors.length === 0,
        errors: errors
    };
}

function isValidPhone(phone) {
    if (!phone) return false;
    
    console.log('📞 Validation téléphone:', phone);
    
    // Nettoyer le numéro (supprimer espaces, tirets, parenthèses, points)
    const cleanedPhone = phone.replace(/[\s\-\(\)\.]/g, '');
    
    // Regex plus permissive pour les formats marocains
    const phoneRegex = /^(?:(?:\+|00)212[\s\-]?[5-7][\s\-]?\d{2}[\s\-]?\d{2}[\s\-]?\d{2}[\s\-]?\d{2}|0[\s\-]?[5-7][\s\-]?\d{2}[\s\-]?\d{2}[\s\-]?\d{2}[\s\-]?\d{2}|[5-7]\d{8})$/;
    
    const isValid = phoneRegex.test(cleanedPhone);
    console.log('📞 Téléphone valide?', isValid);
    
    return isValid;
}

// ========== PUBLICATION IMMOBILIÈRE ==========
async function handlePublishRealEstate(event) {
    event.preventDefault();
    
    console.log('📝 Début publication immobilier...');
    
    // VÉRIFICATION UNIFIÉE ET SIMPLIFIÉE
    if (!checkAuthForPublish()) {
        console.log('❌ Échec vérification auth pour publication');
        return;
    }
    
    const form = event.target;
    const formData = new FormData(form);
    const data = Object.fromEntries(formData.entries());
    
    console.log('📊 Données du formulaire immobilier:', data);
    
    // Récupérer l'utilisateur actuel
    let currentUser;
    if (typeof authState !== 'undefined' && authState.currentUser) {
        currentUser = authState.currentUser;
    } else {
        currentUser = JSON.parse(localStorage.getItem('currentUser') || 'null');
    }
    
    console.log('👤 Utilisateur actuel:', currentUser);
    
    if (!currentUser) {
        showAlert('❌ Utilisateur non authentifié', 'error');
        return;
    }
    
    // Validation améliorée
    const requiredFields = ['title', 'type', 'price', 'address', 'description', 'phone'];
    const missingFields = requiredFields.filter(field => !data[field]);
    
    if (missingFields.length > 0) {
        showAlert('❌ Veuillez remplir tous les champs obligatoires', 'error');
        return;
    }
    
    // Validation du prix
    const price = parseFloat(data.price);
    if (isNaN(price) || price <= 0) {
        showAlert('❌ Veuillez saisir un prix valide', 'error');
        return;
    }
    
    // Validation de la surface si fournie
    if (data.surface && (isNaN(data.surface) || data.surface < 0)) {
        showAlert('❌ Veuillez saisir une surface valide', 'error');
        return;
    }
    
    // Validation du téléphone avec message plus clair
    if (!isValidPhone(data.phone)) {
        showAlert('❌ Veuillez saisir un numéro de téléphone marocain valide\n\nFormats acceptés:\n• 06 12 34 56 78\n• 0612345678\n• +212 6 12 34 56 78\n• 00212 612345678', 'error');
        return;
    }
    
    if (typeof showLoading === 'function') {
        showLoading(true);
    }
    
    try {
        // Gestion des photos uploadées
        const uploadedPhotos = await handlePhotoUpload(form);
        
        const propertyData = {
            title: data.title.trim(),
            type: data.type,
            price: price,
            surface: data.surface ? parseFloat(data.surface) : null,
            rooms: data.rooms ? parseInt(data.rooms) : null,
            address: data.address.trim(),
            city: data.city ? data.city.trim() : '',
            description: data.description.trim(),
            phone: data.phone.trim(),
            userId: currentUser.id,
            userName: `${currentUser.prenom || ''} ${currentUser.nom || ''}`.trim() || currentUser.email,
            userEmail: currentUser.email,
            status: 'en_attente',
            isPremium: false,
            photos: uploadedPhotos,
            viewCount: 0,
            contactCount: 0,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString()
        };
        
        console.log('💾 Données immobilier à sauvegarder:', propertyData);
        
        // Générer un ID unique si nécessaire
        if (!propertyData.id) {
            propertyData.id = Date.now() + Math.random().toString(36).substr(2, 9);
        }
        
        const result = await btpDB.post('realestate_posts', propertyData);
        
        console.log('✅ Bien immobilier sauvegardé:', result);
        
        showAlert('✅ Votre bien immobilier a été publié avec succès ! Il sera visible après modération.', 'success');
        
        // Réinitialiser le formulaire
        form.reset();
        
        // Réinitialiser les photos preview
        resetPhotoPreview();
        
        // Rediriger vers la section immobilier
        setTimeout(() => {
            if (typeof goToSection === 'function') {
                goToSection('realestate');
            }
            // Recharger les annonces
            setTimeout(() => {
                if (typeof loadRealEstateAnnounces === 'function') {
                    loadRealEstateAnnounces();
                }
            }, 500);
        }, 1500);
        
    } catch (error) {
        console.error('❌ Erreur publication immobilier:', error);
        showAlert('❌ Erreur lors de la publication: ' + error.message, 'error');
    } finally {
        if (typeof showLoading === 'function') {
            showLoading(false);
        }
    }
}

// ========== ÉDITION D'ANNONCE ==========
async function editRealEstateAnnounce(propertyId) {
    console.log('✏️ Édition annonce immobilier:', propertyId);
    
    try {
        const properties = await btpDB.get('realestate_posts');
        const property = properties.find(p => p.id == propertyId);
        
        if (!property) {
            showAlert('❌ Annonce non trouvée', 'error');
            return;
        }
        
        // Vérifier les permissions
        let currentUser;
        if (typeof authState !== 'undefined' && authState.currentUser) {
            currentUser = authState.currentUser;
        } else {
            currentUser = JSON.parse(localStorage.getItem('currentUser') || 'null');
        }
        
        const isAdmin = authState && authState.isAdmin === true;
        
        if (!currentUser || (currentUser.id !== property.userId && !isAdmin)) {
            showAlert('❌ Vous n\'avez pas la permission de modifier cette annonce', 'error');
            return;
        }
        
        // Remplir le formulaire d'édition
        const setValue = (id, value) => {
            const element = document.getElementById(id);
            if (element) element.value = value || '';
        };
        
        setValue('realestateTitle', property.title);
        setValue('realestateType', property.type);
        setValue('realestatePrice', property.price);
        setValue('realestateSurface', property.surface);
        setValue('realestateRooms', property.rooms);
        setValue('realestateAddress', property.address);
        setValue('realestateCity', property.city);
        setValue('realestateDescription', property.description);
        setValue('realestatePhone', property.phone);
        
        // Stocker l'ID pour la sauvegarde
        window.currentEditingPropertyId = propertyId;
        
        // Aller à la section publication
        if (typeof goToSection === 'function') {
            goToSection('publish');
        }
        
        // Afficher le formulaire immobilier
        setTimeout(() => {
            const realEstateForm = document.getElementById('realestate-form');
            if (realEstateForm) {
                realEstateForm.style.display = 'block';
                
                // Initialiser les types
                initializeRealEstateFormTypes();
                
                // Mettre à jour le bouton de publication
                const submitBtn = realEstateForm.querySelector('button[type="submit"]');
                if (submitBtn) {
                    submitBtn.innerHTML = '<i class="fas fa-save me-2"></i>Mettre à jour';
                    // Remplacer l'event listener
                    submitBtn.onclick = handleUpdateRealEstate;
                }
            }
            
            // Cacher les autres formulaires
            const otherForms = document.querySelectorAll('.publish-form');
            otherForms.forEach(form => {
                if (form.id !== 'realestate-form') {
                    form.style.display = 'none';
                }
            });
        }, 100);
        
    } catch (error) {
        console.error('❌ Erreur édition annonce:', error);
        showAlert('❌ Erreur lors du chargement de l\'annonce', 'error');
    }
}

// ========== MISE À JOUR D'ANNONCE ==========
async function handleUpdateRealEstate(event) {
    event.preventDefault();
    
    console.log('🔄 Mise à jour annonce immobilier...');
    
    if (!window.currentEditingPropertyId) {
        showAlert('❌ Aucune annonce en cours d\'édition', 'error');
        return;
    }
    
    const form = event.target;
    const formData = new FormData(form);
    const data = Object.fromEntries(formData.entries());
    
    // Validation
    const requiredFields = ['title', 'type', 'price', 'address', 'description', 'phone'];
    const missingFields = requiredFields.filter(field => !data[field]);
    
    if (missingFields.length > 0) {
        showAlert('❌ Veuillez remplir tous les champs obligatoires', 'error');
        return;
    }
    
    // Validation du téléphone avec message plus clair
    if (!isValidPhone(data.phone)) {
        showAlert('❌ Veuillez saisir un numéro de téléphone marocain valide\n\nFormats acceptés:\n• 06 12 34 56 78\n• 0612345678\n• +212 6 12 34 56 78\n• 00212 612345678', 'error');
        return;
    }
    
    if (typeof showLoading === 'function') {
        showLoading(true);
    }
    
    try {
        const properties = await btpDB.get('realestate_posts');
        const propertyIndex = properties.findIndex(p => p.id == window.currentEditingPropertyId);
        
        if (propertyIndex === -1) {
            throw new Error('Annonce non trouvée');
        }
        
        // Mettre à jour les données
        properties[propertyIndex].title = data.title.trim();
        properties[propertyIndex].type = data.type;
        properties[propertyIndex].price = parseFloat(data.price);
        properties[propertyIndex].surface = data.surface ? parseFloat(data.surface) : null;
        properties[propertyIndex].rooms = data.rooms ? parseInt(data.rooms) : null;
        properties[propertyIndex].address = data.address.trim();
        properties[propertyIndex].city = data.city ? data.city.trim() : '';
        properties[propertyIndex].description = data.description.trim();
        properties[propertyIndex].phone = data.phone.trim();
        properties[propertyIndex].updatedAt = new Date().toISOString();
        
        // Gérer les nouvelles photos si uploadées
        const photoInput = form.querySelector('input[type="file"]');
        if (photoInput && photoInput.files.length > 0) {
            const newPhotos = await handlePhotoUpload(form);
            if (newPhotos.length > 0) {
                properties[propertyIndex].photos = newPhotos;
            }
        }
        
        // Sauvegarder
        await btpDB.put('realestate_posts', window.currentEditingPropertyId, properties[propertyIndex]);
        
        showAlert('✅ Annonce mise à jour avec succès !', 'success');
        
        // Réinitialiser
        form.reset();
        resetPhotoPreview();
        delete window.currentEditingPropertyId;
        
        // Restaurer le bouton original
        const submitBtn = form.querySelector('button[type="submit"]');
        if (submitBtn) {
            submitBtn.innerHTML = '<i class="fas fa-paper-plane me-2"></i>Publier l\'annonce';
            submitBtn.onclick = handlePublishRealEstate;
        }
        
        // Retourner aux annonces
        setTimeout(() => {
            if (typeof goToSection === 'function') {
                goToSection('realestate');
            }
            if (typeof loadRealEstateAnnounces === 'function') {
                loadRealEstateAnnounces();
            }
        }, 1500);
        
    } catch (error) {
        console.error('❌ Erreur mise à jour annonce:', error);
        showAlert('❌ Erreur lors de la mise à jour: ' + error.message, 'error');
    } finally {
        if (typeof showLoading === 'function') {
            showLoading(false);
        }
    }
}

// ========== AFFICHAGE FORMULAIRE PUBLICATION ==========
function showPublishRealEstate() {
    console.log('🎯 Navigation vers publication immobilier...');
    
    // Vérifier l'authentification d'abord
    if (!checkAuthForPublish()) {
        console.log('❌ Utilisateur non authentifié - affichage modal connexion');
        return;
    }
    
    // Si authentifié, aller directement à la publication
    if (typeof goToSection === 'function') {
        goToSection('publish');
    }
    
    // S'assurer que le formulaire immobilier est visible
    setTimeout(() => {
        const realEstateForm = document.getElementById('realestate-form');
        if (realEstateForm) {
            realEstateForm.style.display = 'block';
            
            // Initialiser les types de biens COMPLETS dans le formulaire
            initializeRealEstateFormTypes();
        }
        
        // Cacher les autres formulaires de publication
        const otherForms = document.querySelectorAll('.publish-form');
        otherForms.forEach(form => {
            if (form.id !== 'realestate-form') {
                form.style.display = 'none';
            }
        });
        
        // Initialiser la prévisualisation des photos
        setupPhotoPreview();
    }, 100);
}

// ========== INITIALISATION ==========
function initializeFormFunctions() {
    console.log('🔄 Initialisation des fonctions formulaires...');
    
    // Auto-initialisation des types si le formulaire existe
    initializeRealEstateFormTypes();
    
    // Initialiser la prévisualisation des photos si disponible
    setupPhotoPreview();
}

// ========== EXPORT DES FONCTIONS ==========
window.handlePublishRealEstate = handlePublishRealEstate;
window.editRealEstateAnnounce = editRealEstateAnnounce;
window.handleUpdateRealEstate = handleUpdateRealEstate;
window.showPublishRealEstate = showPublishRealEstate;
window.initializeRealEstateFormTypes = initializeRealEstateFormTypes;
window.initializeFormFunctions = initializeFormFunctions;

// Export des fonctions de gestion des photos
window.setupPhotoPreview = setupPhotoPreview;
window.removePhotoPreview = removePhotoPreview;
window.resetPhotoPreview = resetPhotoPreview;
window.convertFileToBase64 = convertFileToBase64;
window.handlePhotoUpload = handlePhotoUpload;

// Export des fonctions de validation
window.validateRealEstateForm = validateRealEstateForm;
window.isValidPhone = isValidPhone;

console.log('✅ realestate-forms.js chargé - Formulaires et édition PRÊTS');