// ========== REALESTATE FORMS - GESTION DES FORMULAIRES IMMOBILIER ==========
console.log('🏠 realestate-forms.js - Démarrage...');

// ========== INITIALISATION DES VILLES MAROCAINES (30 villes) ==========
function initializeRealEstateCities() {
    console.log('🏙️ Initialisation des villes marocaines...');
    
    let citySelect = null;
    
    // 1. Chercher le formulaire immobilier
    const immobilierForm = document.getElementById('immobilier-form');
    
    if (immobilierForm) {
        console.log('✅ Formulaire immobilier-form trouvé');
        
        // Chercher le champ ville
        citySelect = immobilierForm.querySelector('[name="city"]') || 
                    immobilierForm.querySelector('[name="ville"]') ||
                    immobilierForm.querySelector('[name="location"]') ||
                    immobilierForm.querySelector('input[placeholder*="ville"]') ||
                    immobilierForm.querySelector('input[placeholder*="Ville"]');
        
        if (citySelect) {
            console.log('🎯 Champ ville trouvé:', citySelect.name || citySelect.placeholder);
        }
    }
    
    // 2. Recherche globale
    if (!citySelect) {
        citySelect = document.querySelector('[name="city"]') ||
                    document.querySelector('[name="ville"]') ||
                    document.querySelector('#ville') ||
                    document.querySelector('#city');
    }
    
    if (!citySelect) {
        console.warn('❌ Champ ville non trouvé');
        return false;
    }
    
    // Si c'est un select, ajouter les villes
    if (citySelect.tagName === 'SELECT') {
        // Vider les options sauf la première
        while (citySelect.children.length > 1) {
            citySelect.removeChild(citySelect.lastChild);
        }
        
        // Liste des villes marocaines
        const moroccanCities = [
            'Casablanca', 'Rabat', 'Fès', 'Marrakech', 'Tanger', 'Agadir',
            'Meknès', 'Oujda', 'Kénitra', 'Tétouan', 'Safi', 'Mohammédia',
            'El Jadida', 'Berkane', 'Nador', 'Taza', 'Settat', 'Larache',
            'Khouribga', 'Béni Mellal', 'Errachidia', 'Tiznit', 'Essaouira',
            'Chefchaouen', 'Ouarzazate', 'Figuig', 'Al Hoceïma', 'Asilah',
            'Midelt', 'Taroudant', 'Sidi Ifni', 'Dakhla', 'Laâyoune', 'Smara', 'Guelmim'
        ];
        
        moroccanCities.sort().forEach(city => {
            const option = document.createElement('option');
            option.value = city.toLowerCase().replace(/\s+/g, '_');
            option.textContent = city;
            citySelect.appendChild(option);
        });
        
        console.log(`✅ ${moroccanCities.length} villes ajoutées`);
        return true;
    }
    
    return false;
}

// ========== INITIALISATION DES TYPES DE BIENS ==========
function initializeRealEstateFormTypes() {
    console.log('🏠 Initialisation des types de biens...');
    
    let typeSelect = null;
    
    const immobilierForm = document.getElementById('immobilier-form');
    if (immobilierForm) {
        typeSelect = immobilierForm.querySelector('[name="type"]') ||
                    immobilierForm.querySelector('select[name="type"]');
    }
    
    if (!typeSelect) {
        typeSelect = document.querySelector('[name="type"]') ||
                    document.querySelector('select[name="type"]');
    }
    
    if (!typeSelect) {
        console.warn('❌ Select type non trouvé');
        return false;
    }
    
    // Vérifier si le select est déjà rempli
    if (typeSelect.options.length < 10) {
        // Garder la première option
        const hasDefaultOption = typeSelect.options.length > 0 && 
                               (typeSelect.options[0].value === '' || 
                                typeSelect.options[0].text.includes('Choisir'));
        
        if (!hasDefaultOption) {
            typeSelect.innerHTML = '<option value="">Choisir un type</option>';
        } else {
            while (typeSelect.children.length > 1) {
                typeSelect.removeChild(typeSelect.lastChild);
            }
        }
        
        // Liste des types harmonisée avec les autres fichiers
        const propertyTypes = [
            { value: 'villa', label: 'Villa' },
            { value: 'appartement', label: 'Appartement' },
            { value: 'maison', label: 'Maison' },
            { value: 'studio', label: 'Studio' },
            { value: 'duplex', label: 'Duplex' },
            { value: 'triplex', label: 'Triplex' },
            { value: 'riad', label: 'Riad' },
            { value: 'ferme', label: 'Ferme' },
            { value: 'chalet', label: 'Chalet' },
            { value: 'bungalow', label: 'Bungalow' },
            { value: 'residence', label: 'Résidence' },
            { value: 'bureau', label: 'Bureau' },
            { value: 'local_commercial', label: 'Local commercial' },
            { value: 'commerce', label: 'Commerce' },
            { value: 'cafe', label: 'Café' },
            { value: 'magasin', label: 'Magasin' },
            { value: 'entrepot', label: 'Entrepôt' },
            { value: 'usine', label: 'Usine' },
            { value: 'terrain', label: 'Terrain' },
            { value: 'immeuble', label: 'Immeuble' },
            { value: 'garage', label: 'Garage' }
        ];
        
        propertyTypes.forEach(type => {
            const option = document.createElement('option');
            option.value = type.value;
            option.textContent = type.label;
            typeSelect.appendChild(option);
        });
        
        console.log(`✅ ${propertyTypes.length} types de biens ajoutés`);
    }
    
    return true;
}

// ========== FONCTION PRINCIPALE POUR LA SOUMISSION ==========
async function handlePublishRealEstate(event) {
    event.preventDefault();
    console.log('📝 Début de la publication immobilier...');
    
    // 1. Vérifier l'authentification
    if (!checkAuthForPublish()) {
        showAlert('🔐 Vous devez être connecté pour publier une annonce', 'warning');
        return;
    }
    
    const form = event.target;
    const formData = new FormData(form);
    const data = Object.fromEntries(formData.entries());
    
    console.log('📊 Données du formulaire:', data);
    
    // 2. Validation des champs obligatoires
    const requiredFields = ['title', 'type', 'price', 'address', 'description', 'phone'];
    for (const field of requiredFields) {
        if (!data[field] || data[field].trim() === '') {
            showAlert(`❌ Le champ "${field}" est obligatoire`, 'error');
            return;
        }
    }
    
    // 3. Validation numérique
    const price = parseFloat(data.price);
    if (isNaN(price) || price <= 0) {
        showAlert('❌ Prix invalide', 'error');
        return;
    }
    
    const surface = data.surface ? parseFloat(data.surface) : null;
    if (surface && (isNaN(surface) || surface <= 0)) {
        showAlert('❌ Surface invalide', 'error');
        return;
    }
    
    const rooms = data.rooms ? parseInt(data.rooms) : null;
    if (rooms && (isNaN(rooms) || rooms < 0)) {
        showAlert('❌ Nombre de pièces invalide', 'error');
        return;
    }
    
    // 4. Désactiver le bouton pendant le traitement
    const submitBtn = form.querySelector('button[type="submit"]');
    const originalBtnText = submitBtn.innerHTML;
    submitBtn.innerHTML = '<i class="fas fa-spinner fa-spin me-2"></i>Publication en cours...';
    submitBtn.disabled = true;
    
    try {
        showLoading(true);
        
        // 5. Récupérer les photos du nouveau système d'upload
        let photos = [];
        if (typeof photoUploadSystemInstance !== 'undefined' && photoUploadSystemInstance) {
            const formPhotos = photoUploadSystemInstance.getPhotos('immobilier-form');
            console.log('📸 Photos récupérées:', formPhotos.length);
            
            // Convertir les photos en base64 pour le stockage
            for (const photo of formPhotos) {
                if (photo.dataUrl) {
                    photos.push(photo.dataUrl);
                }
            }
        }
        
        // 6. Préparer les données pour la base de données
        const propertyData = {
            title: data.title.trim(),
            type: data.type,
            price: price,
            surface: surface,
            rooms: rooms,
            address: data.address.trim(),
            city: data.city || '',
            description: data.description.trim(),
            phone: data.phone.trim(),
            photos: photos,
            userId: appState.currentUser.id,
            userName: `${appState.currentUser.prenom} ${appState.currentUser.nom}`,
            userEmail: appState.currentUser.email,
            status: 'en_attente',
            isPremium: false,
            viewCount: 0,
            contactCount: 0,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString()
        };
        
        console.log('💾 Données à sauvegarder:', propertyData);
        
        // 7. Sauvegarder dans la base de données
        const result = await btpDB.post('realestate_posts', propertyData);
        
        console.log('✅ Bien immobilier sauvegardé:', result);
        
        // 8. Vider les photos du formulaire
        if (typeof photoUploadSystemInstance !== 'undefined' && photoUploadSystemInstance) {
            photoUploadSystemInstance.photos = photoUploadSystemInstance.photos.filter(
                photo => photo.formId !== 'immobilier-form'
            );
            photoUploadSystemInstance.updateDisplay();
        }
        
        // 9. Afficher le succès
        showAlert('✅ Votre bien immobilier a été publié avec succès ! Il sera visible après modération.', 'success');
        
        // 10. Réinitialiser le formulaire
        form.reset();
        
        // 11. Rediriger après 2 secondes
        setTimeout(() => {
            goToSection('realestate');
            
            // Réinitialiser le système d'upload
            if (typeof photoUploadSystemInstance !== 'undefined' && photoUploadSystemInstance) {
                setTimeout(() => {
                    photoUploadSystemInstance.initialize('immobilier-form');
                }, 1000);
            }
        }, 2000);
        
    } catch (error) {
        console.error('❌ Erreur publication immobilier:', error);
        showAlert('❌ Erreur lors de la publication: ' + error.message, 'error');
        
        // Réactiver le bouton en cas d'erreur
        submitBtn.innerHTML = originalBtnText;
        submitBtn.disabled = false;
        
    } finally {
        showLoading(false);
    }
}

// ========== FONCTIONS D'AIDE ==========
function getRealEstateTypeLabel(type) {
    const types = {
        'villa': 'Villa',
        'appartement': 'Appartement',
        'maison': 'Maison',
        'studio': 'Studio',
        'duplex': 'Duplex',
        'triplex': 'Triplex',
        'riad': 'Riad',
        'chalet': 'Chalet',
        'bungalow': 'Bungalow',
        'ferme': 'Ferme',
        'residence': 'Résidence',
        'bureau': 'Bureau',
        'local_commercial': 'Local commercial',
        'commerce': 'Commerce',
        'cafe': 'Café',
        'magasin': 'Magasin',
        'entrepot': 'Entrepôt',
        'usine': 'Usine',
        'terrain': 'Terrain',
        'immeuble': 'Immeuble',
        'garage': 'Garage'
    };
    
    return types[type] || type;
}

// ========== INITIALISATION COMPLÈTE DU FORMULAIRE ==========
function initializeRealEstateForm() {
    console.log('🏗️ Initialisation complète du formulaire immobilier...');
    
    // 1. Initialiser les types
    initializeRealEstateFormTypes();
    
    // 2. Initialiser les villes
    initializeRealEstateCities();
    
    // 3. Configurer le formulaire pour utiliser la nouvelle fonction de soumission
    const immobilierForm = document.getElementById('immobilier-form');
    if (immobilierForm) {
        const form = immobilierForm.querySelector('form');
        if (form) {
            // Supprimer l'ancien gestionnaire si existant
            form.removeEventListener('submit', handleRealEstateSubmit);
            form.onsubmit = handlePublishRealEstate;
        }
    }
    
    // 4. Initialiser le système d'upload photo APRÈS un délai
    setTimeout(() => {
        if (typeof photoUploadSystemInstance !== 'undefined' && photoUploadSystemInstance) {
            console.log('📸 Initialisation du système d\'upload photo pour immobilier...');
            photoUploadSystemInstance.initialize('immobilier-form');
        } else {
            console.warn('⚠️ Système d\'upload photo non disponible');
        }
    }, 1000);
    
    console.log('✅ Formulaire immobilier initialisé avec nouveau système de soumission');
}

// ========== EXPORT DES FONCTIONS ==========
window.initializeRealEstateForm = initializeRealEstateForm;
window.initializeRealEstateCities = initializeRealEstateCities;
window.initializeRealEstateFormTypes = initializeRealEstateFormTypes;
window.handlePublishRealEstate = handlePublishRealEstate;
window.getRealEstateTypeLabel = getRealEstateTypeLabel;

console.log('✅ realestate-forms.js - Chargé et prêt');