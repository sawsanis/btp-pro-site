// ========== REALESTATE CORE - CHARGEMENT PRINCIPAL ==========
console.log('🏗️ Chargement du module RealEstate Core...');

// ========== FONCTIONS DE BASE MANQUANTES ==========
function checkAuthForPublish() {
    console.log('🔐 Vérification authentification pour publication...');
    
    // Utiliser authState si disponible, sinon localStorage
    let currentUser;
    if (typeof authState !== 'undefined' && authState.currentUser) {
        currentUser = authState.currentUser;
    } else {
        currentUser = JSON.parse(localStorage.getItem('currentUser') || 'null');
    }
    
    if (!currentUser) {
        console.log('❌ Utilisateur non connecté - affichage modal connexion');
        if (typeof showLoginModal === 'function') {
            showLoginModal();
        } else {
            alert('Veuillez vous connecter pour publier une annonce');
        }
        return false;
    }
    
    console.log('✅ Utilisateur authentifié:', currentUser.email);
    return true;
}

function goToSection(section) {
    console.log('📍 Navigation vers section:', section);
    const sections = document.querySelectorAll('.section-content');
    sections.forEach(sec => sec.classList.remove('active'));
    
    const targetSection = document.getElementById(section + '-section');
    if (targetSection) {
        targetSection.classList.add('active');
    }
    
    // Mettre à jour la navigation
    const navLinks = document.querySelectorAll('.nav-link');
    navLinks.forEach(link => link.classList.remove('active'));
    
    const activeLink = document.querySelector(`[data-section="${section}"]`);
    if (activeLink) {
        activeLink.classList.add('active');
    }
}

function showPublishForm(formType) {
    console.log('📝 Affichage formulaire:', formType);
    const forms = document.querySelectorAll('.publish-form');
    forms.forEach(form => form.style.display = 'none');
    
    const targetForm = document.getElementById(formType + '-form');
    if (targetForm) {
        targetForm.style.display = 'block';
    }
}

// ========== FONCTIONS UTILITAIRES MANQUANTES ==========
function showAlert(message, type = 'info') {
    console.log(`📢 Alert [${type}]:`, message);
    
    // Créer une alerte Bootstrap simple
    const alertDiv = document.createElement('div');
    alertDiv.className = `alert alert-${type === 'error' ? 'danger' : type} alert-dismissible fade show`;
    alertDiv.innerHTML = `
        ${message}
        <button type="button" class="btn-close" data-bs-dismiss="alert"></button>
    `;
    
    // Ajouter au début du body
    document.body.insertBefore(alertDiv, document.body.firstChild);
    
    // Auto-suppression après 5 secondes
    setTimeout(() => {
        if (alertDiv.parentNode) {
            alertDiv.remove();
        }
    }, 5000);
}

function showLoading(show = true) {
    const existingLoader = document.getElementById('global-loader');
    
    if (show) {
        if (!existingLoader) {
            const loader = document.createElement('div');
            loader.id = 'global-loader';
            loader.className = 'position-fixed top-0 start-0 w-100 h-100 d-flex align-items-center justify-content-center';
            loader.style.backgroundColor = 'rgba(0,0,0,0.5)';
            loader.style.zIndex = '9999';
            loader.innerHTML = `
                <div class="spinner-border text-success" style="width: 3rem; height: 3rem;">
                    <span class="visually-hidden">Chargement...</span>
                </div>
            `;
            document.body.appendChild(loader);
        }
    } else {
        if (existingLoader) {
            existingLoader.remove();
        }
    }
}

function isInFavorites(itemId, type) {
    const favorites = JSON.parse(localStorage.getItem('favorites') || '{}');
    return favorites[type] && favorites[type].includes(itemId);
}

function toggleFavorite(itemId, type) {
    const favorites = JSON.parse(localStorage.getItem('favorites') || '{}');
    
    if (!favorites[type]) {
        favorites[type] = [];
    }
    
    const index = favorites[type].indexOf(itemId);
    if (index > -1) {
        favorites[type].splice(index, 1);
        showAlert('Retiré des favoris', 'info');
    } else {
        favorites[type].push(itemId);
        showAlert('Ajouté aux favoris', 'success');
    }
    
    localStorage.setItem('favorites', JSON.stringify(favorites));
    
    // Recharger l'affichage si on est dans la section immobilier
    if (document.getElementById('realestate-section')?.classList.contains('active')) {
        loadRealEstateAnnounces();
    }
}

// ========== FONCTIONS PRINCIPALES DE CHARGEMENT ==========
async function loadRealEstateAnnounces() {
    console.log('🏠 Chargement des biens immobiliers...');
    
    try {
        // Vérifier si btpDB est disponible
        if (typeof btpDB === 'undefined') {
            console.error('❌ btpDB non disponible');
            throw new Error('Base de données non initialisée');
        }
        
        const properties = await btpDB.get('realestate_posts');
        console.log('📊 Biens immobiliers récupérés:', properties ? properties.length : 0);
        
        const container = document.getElementById('realestate-container');
        
        if (!container) {
            console.warn('❌ Container realestate non trouvé');
            return;
        }
        
        // Afficher le chargement
        container.innerHTML = `
            <div class="col-12 text-center">
                <div class="spinner-border text-success" role="status">
                    <span class="visually-hidden">Chargement...</span>
                </div>
                <p class="text-muted mt-2">Chargement des biens immobiliers...</p>
            </div>
        `;
        
        if (!properties || properties.length === 0) {
            container.innerHTML = `
                <div class="col-12 text-center py-5">
                    <i class="fas fa-home fa-3x text-muted mb-3"></i>
                    <h5 class="text-muted">Aucun bien immobilier disponible</h5>
                    <p class="text-muted">Soyez le premier à publier un bien !</p>
                    <button class="btn btn-success" onclick="showPublishRealEstate()">
                        <i class="fas fa-plus me-2"></i>Publier le premier bien
                    </button>
                </div>
            `;
            return;
        }
        
        const approvedProperties = properties.filter(property => 
            property.status === 'approuve' || property.status === 'approved' || !property.status
        );
        
        console.log('✅ Biens immobiliers approuvés:', approvedProperties.length);
        
        if (approvedProperties.length === 0) {
            container.innerHTML = `
                <div class="col-12 text-center py-5">
                    <i class="fas fa-home fa-3x text-muted mb-3"></i>
                    <h5 class="text-muted">Aucun bien immobilier disponible</h5>
                    <p class="text-muted">Tous les biens sont en attente de modération</p>
                    <button class="btn btn-success" onclick="showPublishRealEstate()">
                        <i class="fas fa-plus me-2"></i>Publier un bien
                    </button>
                </div>
            `;
            return;
        }
        
        // Initialiser les filtres via le module display
        if (window.initializeRealEstateFilters) {
            window.initializeRealEstateFilters(approvedProperties);
        } else {
            console.warn('⚠️ initializeRealEstateFilters non disponible');
            initializeBasicFilters(approvedProperties);
        }
        
        // Utiliser la pagination
        if (typeof setupPagination === 'function') {
            setupPagination('realestate-container', approvedProperties, displayRealEstatePosts);
            console.log(`✅ ${approvedProperties.length} biens immobiliers chargés avec pagination`);
        } else {
            console.warn('⚠️ setupPagination non disponible - affichage direct');
            if (window.displayRealEstatePosts) {
                window.displayRealEstatePosts(approvedProperties);
            } else {
                displayBasicRealEstatePosts(approvedProperties);
            }
        }
        
    } catch (error) {
        console.error('❌ Erreur chargement realestate:', error);
        const container = document.getElementById('realestate-container');
        if (container) {
            container.innerHTML = `
                <div class="col-12 text-center">
                    <p class="text-danger">
                        <i class="fas fa-exclamation-triangle me-2"></i>
                        Erreur lors du chargement des biens immobiliers
                    </p>
                    <button class="btn btn-success btn-sm" onclick="loadRealEstateAnnounces()">
                        <i class="fas fa-redo me-1"></i>Réessayer
                    </button>
                </div>
            `;
        }
    }
}

// ========== AFFICHAGE DE BASE DES BIENS ==========
function displayBasicRealEstatePosts(properties) {
    console.log('📝 Affichage basique des biens:', properties.length);
    const container = document.getElementById('realestate-container');
    
    if (!container) return;
    
    if (!properties || properties.length === 0) {
        container.innerHTML = `
            <div class="col-12 text-center py-5">
                <i class="fas fa-search fa-3x text-muted mb-3"></i>
                <p class="text-muted">Aucun bien immobilier trouvé</p>
            </div>
        `;
        return;
    }
    
    let html = '';
    properties.forEach((property, index) => {
        const isFavorite = isInFavorites(property.id, 'realestate');
        const favoriteBtnClass = isFavorite ? 'text-danger' : 'text-muted';
        const favoriteIcon = isFavorite ? 'fas' : 'far';
        
        // Vérifier si l'utilisateur peut éditer cette annonce
        let canEdit = false;
        if (typeof authState !== 'undefined' && authState.currentUser) {
            canEdit = authState.currentUser.id === property.userId || 
                     (authState.isAdmin === true);
        }
        
        // Gestion des photos
        const mainPhoto = property.photos && property.photos.length > 0 ? 
            property.photos[0] : null;
        
        const photosHtml = mainPhoto ? `
            <div class="position-relative">
                <img src="${mainPhoto}" class="card-img-top" alt="${property.title}" 
                     style="height: 200px; object-fit: cover;">
                ${property.photos.length > 1 ? `
                <div class="position-absolute bottom-0 end-0 m-2">
                    <span class="badge bg-dark bg-opacity-75">
                        <i class="fas fa-images me-1"></i>${property.photos.length}
                    </span>
                </div>
                ` : ''}
                <button class="btn btn-sm btn-light favorite-btn position-absolute top-0 end-0 m-2 ${favoriteBtnClass}" 
                        onclick="toggleFavorite('${property.id}', 'realestate')"
                        title="${isFavorite ? 'Retirer des favoris' : 'Ajouter aux favoris'}">
                    <i class="${favoriteIcon} fa-heart"></i>
                </button>
            </div>
        ` : `
            <div class="card-img-top bg-light d-flex align-items-center justify-content-center" style="height: 200px;">
                <i class="fas fa-home fa-3x text-muted"></i>
                <button class="btn btn-sm btn-light favorite-btn position-absolute top-0 end-0 m-2 ${favoriteBtnClass}" 
                        onclick="toggleFavorite('${property.id}', 'realestate')"
                        title="${isFavorite ? 'Retirer des favoris' : 'Ajouter aux favoris'}">
                    <i class="${favoriteIcon} fa-heart"></i>
                </button>
            </div>
        `;
        
        html += `
        <div class="col-md-6 col-lg-4 mb-4">
            <div class="card h-100 realestate-card">
                ${photosHtml}
                <div class="card-body d-flex flex-column">
                    <h5 class="card-title">${property.title || 'Bien sans titre'}</h5>
                    <p class="card-text text-muted flex-grow-1">
                        ${property.description ? (property.description.length > 100 ? property.description.substring(0, 100) + '...' : property.description) : 'Aucune description disponible'}
                    </p>
                    
                    <div class="property-info mb-3">
                        <div class="mb-2">
                            <i class="fas fa-tag text-success me-2"></i>
                            <strong>Type:</strong> ${getPropertyTypeLabel(property.type)}
                        </div>
                        ${property.surface ? `
                        <div class="mb-2">
                            <i class="fas fa-ruler-combined text-success me-2"></i>
                            <strong>Surface:</strong> ${property.surface} m²
                        </div>
                        ` : ''}
                        ${property.rooms ? `
                        <div class="mb-2">
                            <i class="fas fa-door-open text-success me-2"></i>
                            <strong>Pièces:</strong> ${property.rooms}
                        </div>
                        ` : ''}
                        ${property.city ? `
                        <div class="mb-2">
                            <i class="fas fa-map-marker-alt text-success me-2"></i>
                            <strong>Ville:</strong> ${property.city}
                        </div>
                        ` : ''}
                    </div>
                    
                    <div class="d-flex justify-content-between align-items-center mt-auto">
                        <h4 class="text-success mb-0">${formatPrice(property.price || 0)}</h4>
                        <small class="text-muted">${formatDate(property.createdAt)}</small>
                    </div>
                    
                    <!-- BOUTONS ÉDITION -->
                    <div class="actions mt-2">
                        <div class="btn-group btn-group-sm w-100">
                            ${canEdit ? `
                            <button class="btn btn-outline-primary btn-sm" onclick="handleEditRealEstate('${property.id}')" title="Modifier">
                                <i class="fas fa-edit"></i>
                            </button>
                            ` : ''}
                        </div>
                    </div>
                </div>
                <div class="card-footer bg-transparent">
                    <div class="d-flex gap-2">
                        ${property.photos && property.photos.length > 0 ? `
                        <button class="btn btn-outline-secondary btn-sm flex-grow-1" onclick="showPhotoGallery('${property.id}')" title="Voir les photos">
                            <i class="fas fa-images me-1"></i>Galerie
                        </button>
                        ` : `
                        <button class="btn btn-outline-secondary btn-sm flex-grow-1" disabled>
                            <i class="fas fa-images me-1"></i>Aucune photo
                        </button>
                        `}
                        ${property.phone ? `
                        <a href="tel:${property.phone}" class="btn btn-success btn-sm" title="Appeler">
                            <i class="fas fa-phone"></i>
                        </a>
                        ` : ''}
                    </div>
                </div>
            </div>
        </div>`;
    });
    
    container.innerHTML = html;
}

// ========== FILTRES DE BASE ==========
function initializeBasicFilters(properties) {
    console.log('🔧 Initialisation des filtres basiques...');
    
    // Remplir le filtre des types
    const typeFilter = document.getElementById('realestateTypeFilter');
    if (typeFilter) {
        const types = [...new Set(properties.map(p => p.type).filter(Boolean))];
        types.forEach(type => {
            const option = document.createElement('option');
            option.value = type;
            option.textContent = getPropertyTypeLabel(type);
            typeFilter.appendChild(option);
        });
    }
    
    // Remplir le filtre des villes
    const cityFilter = document.getElementById('realestateCityFilter');
    if (cityFilter) {
        const cities = [...new Set(properties.map(p => p.city).filter(Boolean))];
        cities.forEach(city => {
            const option = document.createElement('option');
            option.value = city;
            option.textContent = city;
            cityFilter.appendChild(option);
        });
    }
}

// ========== FONCTIONS UTILITAIRES (fallback si utils.js non chargé) ==========
function getPropertyTypeLabel(type) {
    // Si le module utils est chargé, utiliser sa version
    if (typeof window.getPropertyTypeLabel === 'function' && window.getPropertyTypeLabel !== getPropertyTypeLabel) {
        return window.getPropertyTypeLabel(type);
    }
    
    // Fallback local
    const types = {
        'villa': 'Villa', 'appartement': 'Appartement', 'maison': 'Maison',
        'ferme': 'Ferme', 'bungalow': 'Bungalow', 'usine': 'Usine',
        'entrepot': 'Entrepôt', 'bureau': 'Bureau', 'local': 'Local commercial',
        'terrain': 'Terrain', 'duplex': 'Duplex', 'studio': 'Studio',
        'riad': 'Riad', 'chalet': 'Chalet', 'residence': 'Résidence', 'immeuble': 'Immeuble'
    };
    return types[type] || type;
}

function formatPrice(price) {
    // Si le module utils est chargé, utiliser sa version
    if (typeof window.formatPrice === 'function' && window.formatPrice !== formatPrice) {
        return window.formatPrice(price);
    }
    
    // Fallback local
    if (!price && price !== 0) return 'Non spécifié';
    return new Intl.NumberFormat('fr-FR').format(price) + ' MAD';
}

function formatDate(dateString) {
    // Si le module utils est chargé, utiliser sa version
    if (typeof window.formatDate === 'function' && window.formatDate !== formatDate) {
        return window.formatDate(dateString);
    }
    
    // Fallback local
    if (!dateString) return '';
    const date = new Date(dateString);
    return date.toLocaleDateString('fr-FR');
}

// ========== FONCTION DE NAVIGATION PUBLICATION ==========
function showPublishRealEstate() {
    console.log('🎯 Navigation vers publication immobilier...');
    
    // Vérifier l'authentification d'abord
    if (!checkAuthForPublish()) {
        console.log('❌ Utilisateur non authentifié');
        return;
    }
    
    // Si authentifié, aller directement à la publication
    goToSection('publish');
    
    // S'assurer que le formulaire immobilier est visible
    setTimeout(() => {
        showPublishForm('realestate');
        
        // Initialiser les types de biens si disponible
        if (window.initializeRealEstateFormTypes) {
            window.initializeRealEstateFormTypes();
        }
        
        // Initialiser la prévisualisation des photos si disponible
        if (window.setupPhotoPreview) {
            window.setupPhotoPreview();
        }
    }, 100);
}

// ========== FILTRAGE DES ANNONCES ==========
function filterRealEstate() {
    console.log('🔍 Filtrage des annonces immobilières...');
    
    // Pour l'instant, recharger simplement les annonces
    // Une implémentation plus avancée filtrera en mémoire
    loadRealEstateAnnounces();
}

function clearRealEstateFilters() {
    const typeFilter = document.getElementById('realestateTypeFilter');
    const cityFilter = document.getElementById('realestateCityFilter');
    const priceFilter = document.getElementById('realestatePriceFilter');
    const sortFilter = document.getElementById('realestateSort');
    
    if (typeFilter) typeFilter.value = '';
    if (cityFilter) cityFilter.value = '';
    if (priceFilter) priceFilter.value = '';
    if (sortFilter) sortFilter.value = 'newest';
    
    filterRealEstate();
}

// ========== INITIALISATION DU MODULE ==========
function initializeRealEstateModule() {
    console.log('🔄 Initialisation du module RealEstate...');
    
    try {
        // Initialiser les sous-modules dans l'ordre de dépendance
        const initSteps = [];
        
        // 1. Utilitaires (base - doit être premier)
        if (typeof initializeUtilityFunctions === 'function') {
            initializeUtilityFunctions();
            initSteps.push('utils');
        } else {
            console.warn('⚠️ Utilitaires non disponibles - utilisation des fallbacks');
        }
        
        // 2. Media (photos, compression)
        if (typeof initializeMediaFunctions === 'function') {
            initializeMediaFunctions();
            initSteps.push('media');
        }
        
        // 3. Forms (formulaires)
        if (typeof initializeFormFunctions === 'function') {
            initializeFormFunctions();
            initSteps.push('forms');
        }
        
        // 4. Display (affichage, filtres)
        if (typeof initializeDisplayFunctions === 'function') {
            initializeDisplayFunctions();
            initSteps.push('display');
        }
        
        console.log('✅ Modules initialisés:', initSteps.length > 0 ? initSteps : 'Aucun module supplémentaire');
        
        // Vérifier la disponibilité des fonctions critiques
        const criticalFunctions = [
            'loadRealEstateAnnounces',
            'displayRealEstatePosts', 
            'handlePublishRealEstate',
            'showPhotoGallery'
        ];
        
        const availableFunctions = criticalFunctions.filter(fn => typeof window[fn] === 'function');
        console.log(`📊 Fonctions critiques: ${availableFunctions.length}/${criticalFunctions.length} disponibles`);
        
        // Charger les annonces si on est dans la section immobilier
        if (document.getElementById('realestate-section')?.classList.contains('active')) {
            setTimeout(() => {
                if (typeof loadRealEstateAnnounces === 'function') {
                    loadRealEstateAnnounces();
                } else {
                    console.error('❌ Impossible de charger les annonces - fonction manquante');
                }
            }, 500);
        }
        
        return {
            success: true,
            modules: initSteps,
            functions: {
                total: criticalFunctions.length,
                available: availableFunctions.length
            }
        };
        
    } catch (error) {
        console.error('❌ Erreur initialisation RealEstate:', error);
        return {
            success: false,
            error: error.message
        };
    }
}

// ========== DIAGNOSTIC DU SYSTÈME ==========
function checkRealEstateSystemHealth() {
    console.log('🏥 Vérification santé système RealEstate...');
    
    const health = {
        database: typeof btpDB !== 'undefined',
        auth: typeof authState !== 'undefined',
        modules: {
            core: typeof initializeRealEstateModule === 'function',
            utils: typeof initializeUtilityFunctions === 'function',
            media: typeof initializeMediaFunctions === 'function',
            forms: typeof initializeFormFunctions === 'function',
            display: typeof initializeDisplayFunctions === 'function'
        },
        functions: {
            load: typeof loadRealEstateAnnounces === 'function',
            display: typeof displayRealEstatePosts === 'function',
            publish: typeof handlePublishRealEstate === 'function',
            gallery: typeof showPhotoGallery === 'function'
        }
    };
    
    console.log('📊 Santé système:', health);
    return health;
}

function debugRealEstateModules() {
    console.group('🐛 Debug Modules RealEstate');
    console.log('📦 Modules disponibles:');
    
    const modules = [
        { name: 'Core', fn: 'initializeRealEstateModule' },
        { name: 'Utils', fn: 'initializeUtilityFunctions' },
        { name: 'Media', fn: 'initializeMediaFunctions' },
        { name: 'Forms', fn: 'initializeFormFunctions' },
        { name: 'Display', fn: 'initializeDisplayFunctions' }
    ];
    
    modules.forEach(module => {
        const available = typeof window[module.fn] === 'function';
        console.log(`  ${available ? '✅' : '❌'} ${module.name}: ${available ? 'Disponible' : 'Manquant'}`);
    });
    
    console.groupEnd();
    return modules.every(m => typeof window[m.fn] === 'function');
}

// ========== FONCTIONS D'ÉDITION MANQUANTES ==========
function handleEditRealEstate(propertyId) {
    console.log('✏️ Tentative d\'édition annonce:', propertyId);
    
    // Vérifier si la fonction d'édition existe dans le module forms
    if (typeof editRealEstateAnnounce === 'function') {
        console.log('✅ Fonction editRealEstateAnnounce disponible - appel direct');
        editRealEstateAnnounce(propertyId);
        return;
    }
    
    console.log('🔄 Fonction editRealEstateAnnounce non disponible - chargement manuel');
    
    // Fallback manuel
    btpDB.get('realestate_posts').then(properties => {
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
        
        // Stocker l'ID pour la sauvegarde
        window.currentEditingPropertyId = propertyId;
        
        // Aller à la section publication
        goToSection('publish');
        
        // Remplir le formulaire d'édition après un délai
        setTimeout(() => {
            fillRealEstateForm(property);
        }, 500);
        
    }).catch(error => {
        console.error('❌ Erreur chargement annonce:', error);
        showAlert('❌ Erreur lors du chargement de l\'annonce', 'error');
    });
}

function fillRealEstateForm(property) {
    console.log('📝 Remplissage formulaire édition:', property);
    
    const setValue = (id, value) => {
        const element = document.getElementById(id);
        if (element) {
            element.value = value || '';
            console.log(`✅ Champ ${id} rempli:`, value);
        } else {
            console.warn(`❌ Champ ${id} non trouvé`);
        }
    };
    
    // Remplir les champs du formulaire
    setValue('realestateTitle', property.title);
    setValue('realestateType', property.type);
    setValue('realestatePrice', property.price);
    setValue('realestateSurface', property.surface);
    setValue('realestateRooms', property.rooms);
    setValue('realestateAddress', property.address);
    setValue('realestateCity', property.city);
    setValue('realestateDescription', property.description);
    setValue('realestatePhone', property.phone);
    
    // S'assurer que le formulaire immobilier est visible
    const realEstateForm = document.getElementById('realestate-form');
    if (realEstateForm) {
        realEstateForm.style.display = 'block';
        
        // Initialiser les types si nécessaire
        if (typeof initializeRealEstateFormTypes === 'function') {
            initializeRealEstateFormTypes();
        }
        
        // Mettre à jour le bouton de publication
        const submitBtn = realEstateForm.querySelector('button[type="submit"]');
        if (submitBtn) {
            submitBtn.innerHTML = '<i class="fas fa-save me-2"></i>Mettre à jour l\'annonce';
            // Remplacer l'event listener
            submitBtn.onclick = handleUpdateRealEstate;
        }
        
        console.log('✅ Formulaire d\'édition préparé');
        showAlert('📝 Formulaire d\'édition prêt. Modifiez les champs et cliquez sur "Mettre à jour"', 'info');
    } else {
        console.error('❌ Formulaire realestate-form non trouvé');
        showAlert('❌ Erreur: formulaire non trouvé', 'error');
    }
    
    // Cacher les autres formulaires
    const otherForms = document.querySelectorAll('.publish-form');
    otherForms.forEach(form => {
        if (form.id !== 'realestate-form') {
            form.style.display = 'none';
        }
    });
}

async function handleUpdateRealEstate(event) {
    if (event) event.preventDefault();
    
    console.log('🔄 Mise à jour directe annonce immobilier...');
    
    if (!window.currentEditingPropertyId) {
        showAlert('❌ Aucune annonce en cours d\'édition', 'error');
        return;
    }
    
    const form = document.getElementById('realestate-form');
    if (!form) {
        showAlert('❌ Formulaire non trouvé', 'error');
        return;
    }
    
    const formData = new FormData(form);
    const data = Object.fromEntries(formData.entries());
    
    console.log('📊 Données formulaire édition:', data);
    
    // Validation
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
    
    showLoading(true);
    
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
        
        // Sauvegarder
        await btpDB.put('realestate_posts', window.currentEditingPropertyId, properties[propertyIndex]);
        
        showAlert('✅ Annonce mise à jour avec succès !', 'success');
        
        // Réinitialiser le formulaire
        form.reset();
        if (typeof resetPhotoPreview === 'function') {
            resetPhotoPreview();
        }
        
        // Supprimer l'ID d'édition
        delete window.currentEditingPropertyId;
        
        // Restaurer le bouton original
        const submitBtn = form.querySelector('button[type="submit"]');
        if (submitBtn) {
            submitBtn.innerHTML = '<i class="fas fa-paper-plane me-2"></i>Publier l\'annonce';
            submitBtn.onclick = handlePublishRealEstate;
        }
        
        // Retourner aux annonces
        setTimeout(() => {
            goToSection('realestate');
            loadRealEstateAnnounces();
        }, 1500);
        
    } catch (error) {
        console.error('❌ Erreur mise à jour annonce:', error);
        showAlert('❌ Erreur lors de la mise à jour: ' + error.message, 'error');
    } finally {
        showLoading(false);
    }
}

// ========== EXPORTS GLOBAUX ==========
window.loadRealEstateAnnounces = loadRealEstateAnnounces;
window.showPublishRealEstate = showPublishRealEstate;
window.initializeRealEstateModule = initializeRealEstateModule;
window.filterRealEstate = filterRealEstate;
window.clearRealEstateFilters = clearRealEstateFilters;
window.checkAuthForPublish = checkAuthForPublish;
window.showAlert = showAlert;
window.showLoading = showLoading;
window.toggleFavorite = toggleFavorite;
window.isInFavorites = isInFavorites;
window.getPropertyTypeLabel = getPropertyTypeLabel;
window.formatPrice = formatPrice;
window.formatDate = formatDate;
window.checkRealEstateSystemHealth = checkRealEstateSystemHealth;
window.debugRealEstateModules = debugRealEstateModules;

// Export des fonctions d'édition
window.handleEditRealEstate = handleEditRealEstate;
window.fillRealEstateForm = fillRealEstateForm;
window.handleUpdateRealEstate = handleUpdateRealEstate;

// Fonctions de secours pour la galerie
window.showPhotoGallery = function(propertyId) {
    console.log('🖼️ Galerie demandée pour:', propertyId);
    showAlert('La galerie photos sera bientôt disponible', 'info');
};

// Auto-initialisation au chargement
document.addEventListener('DOMContentLoaded', function() {
    console.log('📄 DOM chargé - Initialisation RealEstate...');
    
    // Attendre que tous les scripts soient chargés
    setTimeout(() => {
        // Vérifier la santé du système
        const health = checkRealEstateSystemHealth();
        
        if (health.database && health.modules.core) {
            initializeRealEstateModule();
        } else {
            console.error('❌ Système RealEstate non fonctionnel - dépendances manquantes');
            
            // Afficher un message d'erreur à l'utilisateur
            const container = document.getElementById('realestate-container');
            if (container) {
                container.innerHTML = `
                    <div class="col-12 text-center py-5">
                        <i class="fas fa-exclamation-triangle fa-3x text-warning mb-3"></i>
                        <h5 class="text-warning">Système temporairement indisponible</h5>
                        <p class="text-muted">Veuillez rafraîchir la page</p>
                        <button class="btn btn-warning" onclick="location.reload()">
                            <i class="fas fa-redo me-2"></i>Rafraîchir
                        </button>
                    </div>
                `;
            }
        }
    }, 1000);
});

console.log('✅ realestate-core.js chargé - Module principal prêt');