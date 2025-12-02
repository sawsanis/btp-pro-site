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
    
    // Si on navigue vers immobilier, charger les annonces
    if (section === 'realestate') {
        setTimeout(() => {
            loadRealEstateAnnounces();
        }, 100);
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
        
        // Initialiser les filtres
        if (window.initializeRealEstateFilters) {
            window.initializeRealEstateFilters(approvedProperties);
        }
        
        // Utiliser la pagination si disponible
        if (typeof setupPagination === 'function') {
            setupPagination('realestate-container', approvedProperties, displayRealEstatePosts);
            console.log(`✅ ${approvedProperties.length} biens immobiliers chargés avec pagination`);
        } else {
            if (window.displayRealEstatePosts) {
                window.displayRealEstatePosts(approvedProperties);
            } else {
                // Fallback: affichage basique
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
        showPublishForm('immobilier');
        
        // Initialiser les types de biens si disponible
        if (window.initializeRealEstateFormTypes) {
            window.initializeRealEstateFormTypes();
        }
        
        // Initialiser les villes si disponible
        if (window.initializeRealEstateCities) {
            window.initializeRealEstateCities();
        }
    }, 100);
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

// ========== FONCTION D'AFFICHAGE BASIQUE (fallback) ==========
function displayBasicRealEstatePosts(properties) {
    const container = document.getElementById('realestate-container');
    if (!container) return;
    
    let html = '';
    properties.forEach(property => {
        html += `
        <div class="col-md-6 col-lg-4 mb-4">
            <div class="card h-100">
                <div class="card-body">
                    <h5 class="card-title">${property.title || 'Bien sans titre'}</h5>
                    <p class="card-text">${property.description ? truncateText(property.description, 100) : ''}</p>
                    <p><strong>Type:</strong> ${getPropertyTypeLabel(property.type)}</p>
                    <p><strong>Prix:</strong> ${formatPrice(property.price)}</p>
                    <p><strong>Ville:</strong> ${property.city || 'Non spécifiée'}</p>
                </div>
            </div>
        </div>`;
    });
    
    container.innerHTML = html;
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
        
        // Charger les annonces si on est dans la section immobilier
        if (document.getElementById('realestate-section')?.classList.contains('active')) {
            setTimeout(() => {
                loadRealEstateAnnounces();
            }, 500);
        }
        
        return {
            success: true,
            modules: initSteps
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

// ========== EXPORTS GLOBAUX ==========
window.loadRealEstateAnnounces = loadRealEstateAnnounces;
window.showPublishRealEstate = showPublishRealEstate;
window.initializeRealEstateModule = initializeRealEstateModule;
window.checkAuthForPublish = checkAuthForPublish;
window.showAlert = showAlert;
window.showLoading = showLoading;
window.toggleFavorite = toggleFavorite;
window.isInFavorites = isInFavorites;
window.getPropertyTypeLabel = getPropertyTypeLabel;
window.formatPrice = formatPrice;
window.formatDate = formatDate;
window.checkRealEstateSystemHealth = checkRealEstateSystemHealth;

// Auto-initialisation au chargement
document.addEventListener('DOMContentLoaded', function() {
    console.log('📄 DOM chargé - Initialisation RealEstate...');
    
    // Attendre que tous les scripts soient chargés
    setTimeout(() => {
        initializeRealEstateModule();
    }, 1000);
});

console.log('✅ realestate-core.js chargé - Module principal prêt');