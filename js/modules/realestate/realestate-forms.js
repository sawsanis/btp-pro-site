// ========== REALESTATE FORMS - GESTION DES FORMULAIRES ==========
console.log('📝 Chargement du module RealEstate Forms...');

// ========== FONCTIONS MANQUANTES POUR LA VALIDATION ==========
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
    // Validation basique du téléphone (Maroc)
    const phoneRegex = /^(?:(?:\+|00)212|0)[5-7]\d{8}$/;
    return phoneRegex.test(phone.replace(/\s/g, ''));
}

// ========== PUBLICATION IMMOBILIÈRE AVEC COMPRESSION ==========
async function handlePublishRealEstate(event) {
    event.preventDefault();
    
    console.log('📝 Début publication immobilier...');
    
    // ✅ VÉRIFICATION UNIFIÉE ET SIMPLIFIÉE
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
    
    // Validation du téléphone
    if (!isValidPhone(data.phone)) {
        showAlert('❌ Veuillez saisir un numéro de téléphone valide', 'error');
        return;
    }
    
    if (typeof showLoading === 'function') {
        showLoading(true);
    }
    
    try {
        // 🔥 UPLOAD DES PHOTOS SIMPLIFIÉ
        let uploadedPhotos = [];
        const photoInput = form.querySelector('input[type="file"]');
        
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
                    
                    // Utiliser la compression si disponible, sinon upload direct
                    if (typeof compressImage === 'function') {
                        console.log(`🔄 Compression de ${file.name} (${(file.size/1024).toFixed(0)} KB)`);
                        const compressedBlob = await compressImage(file, 800, 600, 0.7);
                        const base64Image = await convertFileToBase64(compressedBlob);
                        uploadedPhotos.push(base64Image);
                    } else {
                        console.log(`✅ Upload direct de ${file.name}`);
                        const base64Image = await convertFileToBase64(file);
                        uploadedPhotos.push(base64Image);
                    }
                    
                    console.log(`✅ Photo traitée: ${file.name}`);
                    
                } catch (error) {
                    console.error(`❌ Erreur traitement photo ${file.name}:`, error);
                    showAlert(`❌ Erreur lors du traitement de "${file.name}"`, 'error');
                }
            }
        }
        
        console.log(`📊 ${uploadedPhotos.length} photos traitées`);
        
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
        
        // Générer un ID unique
        propertyData.id = Date.now() + Math.random().toString(36).substr(2, 9);
        
        const result = await btpDB.add('realestate_posts', propertyData);
        
        console.log('✅ Bien immobilier sauvegardé:', result);
        
        showAlert('✅ Votre bien immobilier a été publié avec succès ! Il sera visible après modération.', 'success');
        
        // Réinitialiser le formulaire
        form.reset();
        
        // Réinitialiser les photos preview
        if (typeof resetPhotoPreview === 'function') {
            resetPhotoPreview();
        } else {
            const previewContainer = document.getElementById('photoPreview');
            if (previewContainer) {
                previewContainer.innerHTML = '';
            }
            if (photoInput) {
                photoInput.value = '';
            }
        }
        
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

// ========== CONVERSION FICHIER EN BASE64 (fallback) ==========
async function convertFileToBase64(file) {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => resolve(reader.result);
        reader.onerror = reject;
        reader.readAsDataURL(file);
    });
}

// ========== INITIALISATION DES TYPES DE BIENS ==========
function initializeRealEstateFormTypes() {
    const typeSelect = document.getElementById('realestateType');
    if (!typeSelect) {
        console.warn('❌ Select realestateType non trouvé - le formulaire est peut-être caché');
        return false;
    }
    
    console.log('🔄 Initialisation des types de biens dans le formulaire...');
    
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
        { value: 'immeuble', label: 'Immeuble' },
        { value: 'garage', label: 'Garage' },
        { value: 'commerce', label: 'Commerce' },
        { value: 'cafe', label: 'Café' },
        { value: 'magasin', label: 'Magasin' }
    ];
    
    propertyTypes.forEach(type => {
        const option = document.createElement('option');
        option.value = type.value;
        option.textContent = type.label;
        typeSelect.appendChild(option);
    });
    
    console.log(`✅ ${propertyTypes.length} types de biens ajoutés au formulaire`);
    return true;
}

// ========== INITIALISATION DES VILLES MAROCAINES (30 villes) ==========
function initializeRealEstateCities() {
    const citySelect = document.getElementById('realestateCity');
    if (!citySelect) {
        console.warn('❌ Select realestateCity non trouvé - le formulaire est peut-être caché');
        return false;
    }
    
    console.log('🏙️ Initialisation des villes marocaines...');
    
    // Vider les options existantes sauf la première
    while (citySelect.children.length > 1) {
        citySelect.removeChild(citySelect.lastChild);
    }
    
    // Liste des 30+ principales villes marocaines
    const moroccanCities = [
        { value: 'casablanca', label: 'Casablanca' },
        { value: 'rabat', label: 'Rabat' },
        { value: 'fes', label: 'Fès' },
        { value: 'marrakech', label: 'Marrakech' },
        { value: 'tanger', label: 'Tanger' },
        { value: 'agadir', label: 'Agadir' },
        { value: 'meknes', label: 'Meknès' },
        { value: 'oujda', label: 'Oujda' },
        { value: 'kenitra', label: 'Kénitra' },
        { value: 'tetouan', label: 'Tétouan' },
        { value: 'safi', label: 'Safi' },
        { value: 'mohammedia', label: 'Mohammédia' },
        { value: 'eljadida', label: 'El Jadida' },
        { value: 'berkane', label: 'Berkane' },
        { value: 'nador', label: 'Nador' },
        { value: 'taza', label: 'Taza' },
        { value: 'settat', label: 'Settat' },
        { value: 'larache', label: 'Larache' },
        { value: 'khouribga', label: 'Khouribga' },
        { value: 'benimellal', label: 'Béni Mellal' },
        { value: 'errachidia', label: 'Errachidia' },
        { value: 'tiznit', label: 'Tiznit' },
        { value: 'essaouira', label: 'Essaouira' },
        { value: 'chefchaouen', label: 'Chefchaouen' },
        { value: 'ouarzazate', label: 'Ouarzazate' },
        { value: 'figuig', label: 'Figuig' },
        { value: 'alhoceima', label: 'Al Hoceïma' },
        { value: 'asilah', label: 'Asilah' },
        { value: 'midelt', label: 'Midelt' },
        { value: 'taroudant', label: 'Taroudant' },
        { value: 'sidiifni', label: 'Sidi Ifni' },
        { value: 'dakhla', label: 'Dakhla' },
        { value: 'laayoune', label: 'Laâyoune' },
        { value: 'smara', label: 'Smara' },
        { value: 'guelmim', label: 'Guelmim' }
    ];
    
    moroccanCities.forEach(city => {
        const option = document.createElement('option');
        option.value = city.value;
        option.textContent = city.label;
        citySelect.appendChild(option);
    });
    
    console.log(`✅ ${moroccanCities.length} villes marocaines ajoutées au formulaire`);
    return true;
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
        
        // Vérifier les permissions - MODIFICATION: Permettre l'édition même après modération
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
        
        // MODIFICATION IMPORTANTE: Permettre l'édition quel que soit le statut
        // On ne bloque plus l'édition si le statut est "approuve"
        
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
        
        // Afficher les photos existantes dans le preview
        const previewContainer = document.getElementById('photoPreview');
        if (previewContainer && property.photos && property.photos.length > 0) {
            previewContainer.innerHTML = '';
            property.photos.forEach((photo, index) => {
                const preview = document.createElement('div');
                preview.className = 'photo-preview-item position-relative';
                preview.innerHTML = `
                    <img src="${photo}" class="img-thumbnail" alt="Preview" style="width: 100px; height: 100px; object-fit: cover;">
                    <button type="button" class="btn btn-danger btn-sm position-absolute top-0 end-0" onclick="removePhotoPreview(this)">
                        <i class="fas fa-times"></i>
                    </button>
                `;
                previewContainer.appendChild(preview);
            });
        }
        
        // Stocker l'ID pour la sauvegarde
        window.currentEditingPropertyId = propertyId;
        
        // Aller à la section publication
        if (typeof goToSection === 'function') {
            goToSection('publish');
        }
        
        // Afficher le formulaire immobilier et INITIALISER
        setTimeout(() => {
            const realEstateForm = document.getElementById('realestate-form');
            if (realEstateForm) {
                realEstateForm.style.display = 'block';
                
                // Initialiser les types et villes
                initializeRealEstateFormTypes();
                initializeRealEstateCities();
                
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
            let newPhotos = [];
            const files = Array.from(photoInput.files).slice(0, 5);
            for (const file of files) {
                if (file.size > 5 * 1024 * 1024) {
                    showAlert(`❌ La photo "${file.name}" est trop volumineuse (max 5MB)`, 'error');
                    continue;
                }
                const base64Image = await convertFileToBase64(file);
                newPhotos.push(base64Image);
            }
            if (newPhotos.length > 0) {
                properties[propertyIndex].photos = newPhotos;
            }
        }
        
        // Sauvegarder
        await btpDB.set('realestate_posts', properties);
        
        showAlert('✅ Annonce mise à jour avec succès !', 'success');
        
        // Réinitialiser
        form.reset();
        if (typeof resetPhotoPreview === 'function') {
            resetPhotoPreview();
        }
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

// ========== FONCTION D'INITIALISATION FORCÉE ==========
function forceInitializeRealEstateForm() {
    console.log('⚡ Initialisation forcée du formulaire immobilier...');
    
    let initialized = false;
    
    // Initialiser les types
    if (initializeRealEstateFormTypes()) {
        initialized = true;
    }
    
    // Initialiser les villes
    if (initializeRealEstateCities()) {
        initialized = true;
    }
    
    // Initialiser la prévisualisation des photos
    if (typeof setupPhotoPreview === 'function') {
        setupPhotoPreview();
        initialized = true;
    }
    
    if (initialized) {
        console.log('✅ Formulaire immobilier initialisé avec succès');
    } else {
        console.log('⚠️ Formulaire immobilier non trouvé (section peut-être cachée)');
    }
}

// ========== INITIALISATION AUTOMATIQUE ==========
function initializeFormFunctions() {
    console.log('🔄 Initialisation des fonctions formulaires...');
    
    // Initialiser maintenant si le formulaire est visible
    forceInitializeRealEstateForm();
    
    // Écouter les changements de section
    document.addEventListener('sectionChanged', function(e) {
        if (e.detail && e.detail.section === 'publish') {
            console.log('🎯 Navigation vers section publication - initialisation...');
            setTimeout(forceInitializeRealEstateForm, 100);
        }
    });
    
    // Écouter le clic sur "Publier un bien"
    document.addEventListener('click', function(e) {
        if (e.target && (
            e.target.closest('[onclick*="showPublishRealEstate"]') ||
            e.target.closest('[onclick*="goToSection(\'publish\')"]')
        )) {
            setTimeout(forceInitializeRealEstateForm, 300);
        }
    });
    
    // Vérifier toutes les 500ms pendant 5 secondes au chargement
    let checkCount = 0;
    const checkInterval = setInterval(() => {
        forceInitializeRealEstateForm();
        checkCount++;
        
        if (checkCount >= 10) { // 5 secondes (10 * 500ms)
            clearInterval(checkInterval);
        }
    }, 500);
}

// ========== EXPORT DES FONCTIONS ==========
window.handlePublishRealEstate = handlePublishRealEstate;
window.initializeRealEstateFormTypes = initializeRealEstateFormTypes;
window.initializeRealEstateCities = initializeRealEstateCities;
window.editRealEstateAnnounce = editRealEstateAnnounce;
window.handleUpdateRealEstate = handleUpdateRealEstate;
window.initializeFormFunctions = initializeFormFunctions;
window.validateRealEstateForm = validateRealEstateForm;
window.isValidPhone = isValidPhone;
window.convertFileToBase64 = convertFileToBase64;
window.forceInitializeRealEstateForm = forceInitializeRealEstateForm;

console.log('✅ realestate-forms.js chargé - Formulaires prêts');