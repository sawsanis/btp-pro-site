// ========== FONCTIONS UTILITAIRES SYNCHRONISÉES ==========

// ✅ GESTION D'ÉTAT UNIFIÉE - Utiliser authState comme source de vérité
function getAppState() {
    if (typeof authState !== 'undefined') {
        return authState;
    }
    if (typeof appState !== 'undefined') {
        return appState;
    }
    return {
        currentUser: null,
        isAdmin: false,
        isAuthenticated: false,
        currentSection: 'home'
    };
}

// ✅ FONCTIONS DE RÉINITIALISATION DES FILTRES - VERSION CORRIGÉE
function resetSectionFilters(sectionId) {
    console.log('🔄 Réinitialisation des filtres pour:', sectionId);
    
    // Petit délai pour s'assurer que le DOM est chargé
    setTimeout(() => {
        switch(sectionId) {
            case 'marketplace':
                resetMarketplaceFilters();
                break;
            case 'realestate':
                resetRealEstateFilters();
                break;
            case 'jobs':
                resetJobsFilters();
                break;
            case 'freelancers':
                resetFreelancersFilters();
                break;
            case 'professionals':
                resetProfessionalsFilters();
                break;
            default:
                console.log('🔍 Aucun filtre à réinitialiser pour:', sectionId);
        }
    }, 150);
}

// ✅ FONCTIONS SPÉCIFIQUES AVEC LES BONS IDs
function resetMarketplaceFilters() {
    console.log('🔄 Réinitialisation Marketplace...');
    
    const filters = {
        'marketplaceCategoryFilter': '',
        'marketplaceCityFilter': '', 
        'marketplacePriceFilter': '',
        'marketplaceSort': 'newest'
    };
    
    applyFiltersReset(filters);
    
    // Réinitialiser aussi les champs de recherche
    const searchInput = document.querySelector('#marketplace-section input[type="search"]');
    if (searchInput) searchInput.value = '';
    
    console.log('✅ Filtres marketplace réinitialisés');
}

function resetRealEstateFilters() {
    console.log('🔄 Réinitialisation Immobilier...');
    
    const filters = {
        'realestateTypeFilter': '',
        'realestateCityFilter': '',
        'realestatePriceFilter': '', 
        'realestateSort': 'newest'
    };
    
    applyFiltersReset(filters);
    
    // Réinitialiser aussi les champs de recherche
    const searchInput = document.querySelector('#realestate-section input[type="search"]');
    if (searchInput) searchInput.value = '';
    
    console.log('✅ Filtres immobilier réinitialisés');
}

function resetJobsFilters() {
    console.log('🔄 Réinitialisation Emplois...');
    
    const filters = {
        'jobsTypeFilter': '',
        'jobsCityFilter': '',
        'jobsSalaryFilter': '',
        'jobsSort': 'newest'
    };
    
    applyFiltersReset(filters);
    
    // Réinitialiser aussi les champs de recherche
    const searchInput = document.querySelector('#jobs-section input[type="search"]');
    if (searchInput) searchInput.value = '';
    
    console.log('✅ Filtres emplois réinitialisés');
}

function resetFreelancersFilters() {
    console.log('🔄 Réinitialisation Freelance...');
    
    const filters = {
        'freelancersSpecialtyFilter': '',
        'freelancersCityFilter': '',
        'freelancersRateFilter': '', 
        'freelancersSort': 'newest'
    };
    
    applyFiltersReset(filters);
    
    // Réinitialiser aussi les champs de recherche
    const searchInput = document.querySelector('#freelancers-section input[type="search"]');
    if (searchInput) searchInput.value = '';
    
    console.log('✅ Filtres freelancers réinitialisés');
}

function resetProfessionalsFilters() {
    console.log('🔄 Réinitialisation Professionnels...');
    
    const filters = {
        'professionalsSpecialtyFilter': '',
        'professionalsCityFilter': '',
        'professionalsRatingFilter': '',
        'professionalsSort': 'newest'
    };
    
    applyFiltersReset(filters);
    
    // Réinitialiser aussi les champs de recherche
    const searchInput = document.querySelector('#professionals-section input[type="search"]');
    if (searchInput) searchInput.value = '';
    
    console.log('✅ Filtres professionnels réinitialisés');
}

// ✅ FONCTION GÉNÉRIQUE POUR APPLIQUER LA RÉINITIALISATION
function applyFiltersReset(filtersConfig) {
    let resetCount = 0;
    
    Object.entries(filtersConfig).forEach(([filterId, defaultValue]) => {
        const element = document.getElementById(filterId);
        if (element) {
            const currentValue = element.value;
            element.value = defaultValue;
            
            // Vérifier si la valeur a changé
            if (currentValue !== defaultValue) {
                resetCount++;
                
                // Déclencher l'événement change pour mettre à jour l'affichage
                const event = new Event('change', { bubbles: true });
                element.dispatchEvent(event);
            }
        } else {
            console.warn('❌ Filtre non trouvé:', filterId);
        }
    });
    
    console.log(`✅ ${resetCount} filtre(s) réinitialisé(s)`);
}

// ✅ FONCTION POUR DÉBOGUER LES FILTRES
function debugAllFilters() {
    console.log('🐛 Debug complet des filtres:');
    
    const sections = [
        { id: 'marketplace', name: 'Marketplace' },
        { id: 'realestate', name: 'Immobilier' },
        { id: 'jobs', name: 'Emplois' },
        { id: 'freelancers', name: 'Freelance' },
        { id: 'professionals', name: 'Professionnels' }
    ];
    
    sections.forEach(section => {
        console.log(`--- ${section.name} (${section.id}) ---`);
        const sectionElement = document.getElementById(section.id + '-section');
        if (sectionElement) {
            const filters = sectionElement.querySelectorAll('select, input[type="search"]');
            console.log(`📊 ${filters.length} filtre(s) trouvé(s):`);
            
            filters.forEach((filter, index) => {
                console.log(`  ${index + 1}. ${filter.id || 'sans-id'} (${filter.tagName}.${filter.className}): "${filter.value}"`);
            });
        } else {
            console.log('❌ Section non trouvée');
        }
    });
}

// Fonction pour afficher les alertes
function showAlert(message, type = 'info') {
    // Supprimer les alertes existantes
    const existingAlerts = document.querySelectorAll('.custom-alert');
    existingAlerts.forEach(alert => alert.remove());

    const alertDiv = document.createElement('div');
    alertDiv.className = `custom-alert alert alert-${type} alert-dismissible fade show`;
    alertDiv.innerHTML = `
        ${message}
        <button type="button" class="btn-close" data-bs-dismiss="alert"></button>
    `;
    
    document.body.appendChild(alertDiv);
    
    // Auto-dismiss après 5 secondes
    setTimeout(() => {
        if (alertDiv.parentNode) {
            alertDiv.remove();
        }
    }, 5000);
}

// Fonction pour afficher le loading
function showLoading(show = true) {
    let loader = document.getElementById('loading-spinner');
    
    if (show) {
        if (!loader) {
            loader = document.createElement('div');
            loader.id = 'loading-spinner';
            loader.className = 'loading-spinner';
            loader.innerHTML = `
                <div class="spinner-border text-primary" role="status">
                    <span class="visually-hidden">Chargement...</span>
                </div>
            `;
            document.body.appendChild(loader);
        }
        loader.style.display = 'flex';
    } else if (loader) {
        loader.style.display = 'none';
    }
}

// Fonction pour changer le thème - CORRIGÉ : Pas de message
function changeTheme(theme) {
    document.body.setAttribute('data-theme', theme);
    localStorage.setItem('btp_pro_theme', theme);
    // SUPPRIMÉ : Le message "Thème activé"
}

// Fonction pour initialiser le thème
function initializeTheme() {
    const savedTheme = localStorage.getItem('btp_pro_theme') || 'light';
    changeTheme(savedTheme);
}

// ========== GESTION DES FAVORIS CORRIGÉE ==========
function isInFavorites(itemId, itemType) {
    try {
        const favorites = JSON.parse(localStorage.getItem('btp_favorites')) || [];
        return favorites.some(fav => fav.id == itemId && fav.type === itemType);
    } catch (error) {
        console.error('Erreur lecture favoris:', error);
        return false;
    }
}

function toggleFavorite(itemId, itemType) {
    const currentState = getAppState();
    
    if (!currentState.currentUser || !currentState.isAuthenticated) {
        if (typeof showLoginModal === 'function') {
            showLoginModal();
        }
        showAlert('🔐 Connectez-vous pour ajouter aux favoris', 'warning');
        return;
    }
    
    try {
        const favorites = JSON.parse(localStorage.getItem('btp_favorites')) || [];
        const existingIndex = favorites.findIndex(fav => fav.id == itemId && fav.type === itemType);
        
        if (existingIndex > -1) {
            favorites.splice(existingIndex, 1);
            showAlert('❤️ Retiré des favoris', 'success');
        } else {
            favorites.push({
                id: itemId,
                type: itemType,
                addedAt: new Date().toISOString(),
                userId: currentState.currentUser.id
            });
            showAlert('❤️ Ajouté aux favoris', 'success');
        }
        
        localStorage.setItem('btp_favorites', JSON.stringify(favorites));
        
        // Mettre à jour l'affichage si on est dans la section favoris
        if (currentState.currentSection === 'favorites') {
            loadFavorites();
        }
        
    } catch (error) {
        console.error('Erreur favoris:', error);
        showAlert('❌ Erreur lors de la gestion des favoris', 'error');
    }
}

// ✅ FONCTION AMÉLIORÉE : Charger les favoris
function loadFavorites() {
    try {
        const favorites = JSON.parse(localStorage.getItem('btp_favorites')) || [];
        const container = document.getElementById('favorites-section');
        
        if (!container) return;
        
        if (favorites.length === 0) {
            container.innerHTML = `
                <div class="container my-5 py-5">
                    <div class="row">
                        <div class="col-12">
                            <div class="card">
                                <div class="card-body text-center">
                                    <i class="fas fa-heart fa-3x text-muted mb-3"></i>
                                    <h4>Vos favoris apparaîtront ici</h4>
                                    <p class="text-muted">Ajoutez des éléments en cliquant sur le cœur</p>
                                    <button class="btn btn-primary mt-3" onclick="goToSection('marketplace')">
                                        <i class="fas fa-shopping-cart me-2"></i>Parcourir la Marketplace
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            `;
            return;
        }
        
        // Charger les détails des favoris
        loadFavoritesDetails(favorites);
        
    } catch (error) {
        console.error('Erreur chargement favoris:', error);
        showAlert('❌ Erreur lors du chargement des favoris', 'error');
    }
}

// ✅ FONCTION AMÉLIORÉE : Charger les détails des favoris
async function loadFavoritesDetails(favorites) {
    try {
        showLoading(true);
        
        // Récupérer toutes les données
        const [marketplace, realestate, jobs, freelancers, professionals] = await Promise.all([
            btpDB.get('marketplace_posts'),
            btpDB.get('realestate_posts'),
            btpDB.get('job_posts'),
            btpDB.get('freelancers'),
            btpDB.get('professionals')
        ]);
        
        // Associer les favoris avec leurs données complètes
        const favoritesWithDetails = favorites.map(fav => {
            let itemData = null;
            
            switch(fav.type) {
                case 'marketplace':
                    itemData = marketplace.find(item => item.id == fav.id);
                    break;
                case 'realestate':
                    itemData = realestate.find(item => item.id == fav.id);
                    break;
                case 'jobs':
                    itemData = jobs.find(item => item.id == fav.id);
                    break;
                case 'freelancers':
                    itemData = freelancers.find(item => item.id == fav.id);
                    break;
                case 'professionals':
                    itemData = professionals.find(item => item.id == fav.id);
                    break;
            }
            
            return {
                ...fav,
                data: itemData
            };
        }).filter(fav => fav.data); // Filtrer les favoris non trouvés
        
        // Afficher les favoris
        displayFavorites(favoritesWithDetails);
        
    } catch (error) {
        console.error('Erreur chargement détails favoris:', error);
        showAlert('❌ Erreur lors du chargement des favoris', 'error');
    } finally {
        showLoading(false);
    }
}

// ✅ FONCTION AMÉLIORÉE : Afficher les favoris
function displayFavorites(favorites) {
    const container = document.getElementById('favorites-section');
    
    if (!container) return;
    
    let html = `
        <div class="container my-4">
            <div class="d-flex justify-content-between align-items-center mb-4">
                <h2>
                    <i class="fas fa-heart text-danger me-2"></i>
                    Mes Favoris
                </h2>
                <span class="badge bg-primary">${favorites.length} élément(s)</span>
            </div>
            
            <div class="row" id="favorites-container">
    `;
    
    if (favorites.length === 0) {
        html += `
            <div class="col-12">
                <div class="card text-center py-5">
                    <i class="fas fa-heart-broken fa-3x text-muted mb-3"></i>
                    <h4>Aucun favori</h4>
                    <p class="text-muted">Les éléments que vous ajoutez aux favoris apparaîtront ici</p>
                </div>
            </div>
        `;
    } else {
        favorites.forEach(fav => {
            const item = fav.data;
            if (!item) return;
            
            // Structure commune pour tous les types
            const title = item.title || item.poste || item.company || 'Sans titre';
            const description = item.description || 'Aucune description';
            const city = item.city || item.ville || 'Non spécifié';
            const price = item.price ? formatPrice(item.price) : null;
            const date = formatDate(fav.addedAt);
            
            html += `
                <div class="col-md-6 col-lg-4 mb-4">
                    <div class="card h-100 favorite-card">
                        <div class="card-header d-flex justify-content-between align-items-center">
                            <span class="badge ${getFavoriteTypeBadge(fav.type)}">
                                ${getFavoriteTypeLabel(fav.type)}
                            </span>
                            <button class="btn btn-sm btn-outline-danger" 
                                    onclick="toggleFavorite('${fav.id}', '${fav.type}')"
                                    title="Retirer des favoris">
                                <i class="fas fa-heart-broken"></i>
                            </button>
                        </div>
                        <div class="card-body">
                            <h5 class="card-title">${title}</h5>
                            <p class="card-text text-muted">${truncateText(description, 80)}</p>
                            
                            <div class="favorite-details">
                                ${price ? `<div><strong>Prix:</strong> ${price}</div>` : ''}
                                <div><strong>Ville:</strong> ${city}</div>
                                <div><strong>Ajouté:</strong> ${date}</div>
                            </div>
                        </div>
                        <div class="card-footer bg-transparent">
                            <button class="btn btn-primary btn-sm w-100" 
                                    onclick="goToFavoriteItem('${fav.type}', '${fav.id}')">
                                <i class="fas fa-eye me-1"></i>Voir détails
                            </button>
                        </div>
                    </div>
                </div>
            `;
        });
    }
    
    html += `
            </div>
        </div>
    `;
    
    container.innerHTML = html;
}

// ✅ FONCTIONS UTILITAIRES POUR LES FAVORIS
function getFavoriteTypeBadge(type) {
    const badgeMap = {
        'marketplace': 'bg-primary',
        'realestate': 'bg-success',
        'jobs': 'bg-warning',
        'freelancers': 'bg-purple',
        'professionals': 'bg-info'
    };
    return badgeMap[type] || 'bg-secondary';
}

function getFavoriteTypeLabel(type) {
    const labelMap = {
        'marketplace': '🛍️ Marketplace',
        'realestate': '🏠 Immobilier', 
        'jobs': '💼 Emploi',
        'freelancers': '🎨 Freelance',
        'professionals': '👷 Pro'
    };
    return labelMap[type] || type;
}

function goToFavoriteItem(type, id) {
    const sectionMap = {
        'marketplace': 'marketplace',
        'realestate': 'realestate',
        'jobs': 'jobs', 
        'freelancers': 'freelancers',
        'professionals': 'professionals'
    };
    
    const targetSection = sectionMap[type];
    if (targetSection) {
        goToSection(targetSection);
        // Optionnel: Scroll vers l'élément spécifique
        setTimeout(() => {
            const element = document.querySelector(`[data-item-id="${id}"]`);
            if (element) {
                element.scrollIntoView({ behavior: 'smooth', block: 'center' });
            }
        }, 500);
    }
}

// ========== FONCTIONS DE RECHERCHE GLOBALE ==========
function handleGlobalSearch() {
    const searchTerm = document.getElementById('globalSearch')?.value || 
                      document.getElementById('globalSearchMobile')?.value;
    
    if (!searchTerm || searchTerm.trim() === '') {
        showAlert('🔍 Veuillez saisir un terme de recherche', 'warning');
        return;
    }
    
    console.log('🔍 Recherche globale:', searchTerm);
    
    // RECHERCHE FONCTIONNELLE - CORRIGÉ
    performGlobalSearch(searchTerm);
}

// NOUVELLE FONCTION : Recherche fonctionnelle
function performGlobalSearch(searchTerm) {
    showLoading(true);
    
    try {
        // Recherche dans toutes les données disponibles
        const results = [];
        
        // Marketplace
        const marketplaceData = JSON.parse(localStorage.getItem('btp_marketplace') || '[]');
        const marketplaceResults = marketplaceData.filter(item => 
            item.title?.toLowerCase().includes(searchTerm.toLowerCase()) ||
            item.description?.toLowerCase().includes(searchTerm.toLowerCase()) ||
            item.category?.toLowerCase().includes(searchTerm.toLowerCase())
        );
        results.push(...marketplaceResults.map(item => ({...item, type: 'marketplace'})));
        
        // Immobilier
        const realestateData = JSON.parse(localStorage.getItem('btp_realestate') || '[]');
        const realestateResults = realestateData.filter(item => 
            item.title?.toLowerCase().includes(searchTerm.toLowerCase()) ||
            item.description?.toLowerCase().includes(searchTerm.toLowerCase()) ||
            item.type?.toLowerCase().includes(searchTerm.toLowerCase())
        );
        results.push(...realestateResults.map(item => ({...item, type: 'realestate'})));
        
        // Emplois
        const jobsData = JSON.parse(localStorage.getItem('btp_jobs') || '[]');
        const jobsResults = jobsData.filter(item => 
            item.poste?.toLowerCase().includes(searchTerm.toLowerCase()) ||
            item.description?.toLowerCase().includes(searchTerm.toLowerCase()) ||
            item.ville?.toLowerCase().includes(searchTerm.toLowerCase())
        );
        results.push(...jobsResults.map(item => ({...item, type: 'jobs'})));
        
        // Professionnels
        const professionalsData = JSON.parse(localStorage.getItem('btp_professionals') || '[]');
        const professionalsResults = professionalsData.filter(item => 
            item.company?.toLowerCase().includes(searchTerm.toLowerCase()) ||
            item.description?.toLowerCase().includes(searchTerm.toLowerCase()) ||
            item.specialty?.toLowerCase().includes(searchTerm.toLowerCase())
        );
        results.push(...professionalsResults.map(item => ({...item, type: 'professionals'})));
        
        // Afficher les résultats
        displaySearchResults(results, searchTerm);
        
    } catch (error) {
        console.error('Erreur recherche:', error);
        showAlert('❌ Erreur lors de la recherche', 'error');
    } finally {
        showLoading(false);
    }
}

// NOUVELLE FONCTION : Affichage des résultats de recherche
function displaySearchResults(results, searchTerm) {
    if (results.length === 0) {
        showAlert(`🔍 Aucun résultat trouvé pour "${searchTerm}"`, 'info');
        return;
    }
    
    // Créer une modal pour afficher les résultats
    const modalHtml = `
        <div class="modal fade" id="searchResultsModal" tabindex="-1">
            <div class="modal-dialog modal-lg">
                <div class="modal-content">
                    <div class="modal-header">
                        <h5 class="modal-title">
                            <i class="fas fa-search me-2"></i>
                            Résultats pour "${searchTerm}"
                        </h5>
                        <button type="button" class="btn-close" data-bs-dismiss="modal"></button>
                    </div>
                    <div class="modal-body">
                        <div class="search-results-container">
                            ${results.map(item => `
                                <div class="card mb-3 search-result-item" onclick="goToSearchResult('${item.type}', '${item.id}')" style="cursor: pointer;">
                                    <div class="card-body">
                                        <div class="d-flex justify-content-between align-items-start">
                                            <div class="flex-grow-1">
                                                <h6 class="card-title mb-1">${item.title || item.poste || item.company || 'Sans titre'}</h6>
                                                <p class="card-text text-muted small mb-2">${truncateText(item.description, 120)}</p>
                                                <div class="d-flex align-items-center gap-2 flex-wrap">
                                                    <span class="badge ${getSearchTypeBadge(item.type)}">${getSearchTypeLabel(item.type)}</span>
                                                    ${item.price ? `<span class="badge bg-success">${formatPrice(item.price)}</span>` : ''}
                                                    ${item.ville ? `<span class="badge bg-secondary">${item.ville}</span>` : ''}
                                                    ${item.specialty ? `<span class="badge bg-info">${item.specialty}</span>` : ''}
                                                </div>
                                            </div>
                                            <div class="text-end">
                                                <small class="text-muted">${formatDate(item.createdAt)}</small>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            `).join('')}
                        </div>
                    </div>
                    <div class="modal-footer">
                        <button type="button" class="btn btn-secondary" data-bs-dismiss="modal">Fermer</button>
                    </div>
                </div>
            </div>
        </div>
    `;
    
    // Ajouter la modal au DOM
    const existingModal = document.getElementById('searchResultsModal');
    if (existingModal) {
        existingModal.remove();
    }
    
    document.body.insertAdjacentHTML('beforeend', modalHtml);
    
    // Afficher la modal
    const modal = new bootstrap.Modal(document.getElementById('searchResultsModal'));
    modal.show();
    
    showAlert(`🔍 ${results.length} résultat(s) trouvé(s) pour "${searchTerm}"`, 'success');
}

function getSearchTypeBadge(type) {
    const badgeMap = {
        'marketplace': 'bg-primary',
        'realestate': 'bg-success', 
        'jobs': 'bg-warning',
        'professionals': 'bg-info',
        'freelancers': 'bg-purple'
    };
    return badgeMap[type] || 'bg-secondary';
}

function getSearchTypeLabel(type) {
    const labels = {
        'marketplace': '🛒 Marketplace',
        'realestate': '🏠 Immobilier',
        'jobs': '💼 Emploi',
        'professionals': '👷 Professionnel',
        'freelancers': '🎨 Freelance'
    };
    return labels[type] || type;
}

function goToSearchResult(type, id) {
    // Fermer la modal
    const modal = bootstrap.Modal.getInstance(document.getElementById('searchResultsModal'));
    if (modal) modal.hide();
    
    // Rediriger vers la section appropriée
    const sectionMap = {
        'marketplace': 'marketplace',
        'realestate': 'realestate', 
        'jobs': 'jobs',
        'professionals': 'professionals',
        'freelancers': 'freelancers'
    };
    
    const targetSection = sectionMap[type];
    if (targetSection) {
        goToSection(targetSection);
        // Optionnel: Faire défiler jusqu'à l'élément spécifique
        setTimeout(() => {
            const element = document.querySelector(`[data-item-id="${id}"]`);
            if (element) {
                element.scrollIntoView({ behavior: 'smooth', block: 'center' });
                element.classList.add('highlight-search-result');
                setTimeout(() => element.classList.remove('highlight-search-result'), 2000);
            }
        }, 500);
    }
}

// ========== GESTION DU COMPTE UTILISATEUR ==========
function navigateToAccountSection(sectionId) {
    // Masquer toutes les sections du compte
    document.querySelectorAll('.account-section').forEach(section => {
        section.classList.remove('active');
        section.style.display = 'none';
    });
    
    // Afficher la section cible
    const targetSection = document.getElementById(`account-${sectionId}`);
    if (targetSection) {
        targetSection.classList.add('active');
        targetSection.style.display = 'block';
    }
    
    // Mettre à jour la navigation active
    document.querySelectorAll('.account-sidebar .nav-link').forEach(link => {
        link.classList.remove('active');
    });
    
    const activeLink = document.querySelector(`[data-account-section="${sectionId}"]`);
    if (activeLink) {
        activeLink.classList.add('active');
    }
    
    // Charger les données de la section si nécessaire
    loadAccountSectionData(sectionId);
}

function loadAccountSectionData(sectionId) {
    switch(sectionId) {
        case 'profile':
            loadProfileData();
            break;
        case 'announces':
            loadUserAnnounces();
            break;
        case 'favorites':
            loadFavorites();
            break;
        // Les autres sections peuvent être ajoutées ici
    }
}

function loadProfileData() {
    const currentState = getAppState();
    if (!currentState.currentUser) return;
    
    const user = currentState.currentUser;
    
    // Mettre à jour l'affichage du profil
    const elements = {
        'profile-fullname': `${user.prenom} ${user.nom}`,
        'profile-email': user.email,
        'profile-phone': user.phone || 'Non renseigné',
        'profile-created': user.createdAt ? new Date(user.createdAt).toLocaleDateString('fr-FR') : 'Date inconnue',
        'profile-initials': (user.prenom?.[0] || '') + (user.nom?.[0] || '')
    };
    
    Object.entries(elements).forEach(([id, value]) => {
        const element = document.getElementById(id);
        if (element) element.textContent = value;
    });
    
    // Mettre à jour le formulaire d'édition
    const editPrenom = document.getElementById('edit-prenom');
    const editNom = document.getElementById('edit-nom');
    const editEmail = document.getElementById('edit-email');
    const editPhone = document.getElementById('edit-phone');
    
    if (editPrenom) editPrenom.value = user.prenom || '';
    if (editNom) editNom.value = user.nom || '';
    if (editEmail) editEmail.value = user.email || '';
    if (editPhone) editPhone.value = user.phone || '';
    
    // Badge premium
    const premiumBadge = document.getElementById('premium-status-badge');
    if (premiumBadge) {
        if (user.hasPremium) {
            premiumBadge.classList.remove('d-none');
        } else {
            premiumBadge.classList.add('d-none');
        }
    }
}

function toggleEditProfile() {
    const profileView = document.getElementById('profile-view');
    const profileEdit = document.getElementById('profile-edit');
    
    if (profileView && profileEdit) {
        const isEditing = profileView.style.display === 'none';
        
        if (isEditing) {
            profileView.style.display = 'block';
            profileEdit.style.display = 'none';
        } else {
            profileView.style.display = 'none';
            profileEdit.style.display = 'block';
        }
    }
}

async function updateProfile(event) {
    event.preventDefault();
    
    const currentState = getAppState();
    if (!currentState.currentUser) return;
    
    const formData = {
        prenom: document.getElementById('edit-prenom').value.trim(),
        nom: document.getElementById('edit-nom').value.trim(),
        email: document.getElementById('edit-email').value.trim(),
        phone: document.getElementById('edit-phone').value.trim()
    };
    
    // Validation
    if (!formData.prenom || !formData.nom || !formData.email) {
        showAlert('❌ Veuillez remplir tous les champs obligatoires', 'error');
        return;
    }
    
    if (!validateEmail(formData.email)) {
        showAlert('❌ Format d\'email invalide', 'error');
        return;
    }
    
    showLoading(true);
    
    try {
        // Mettre à jour dans la base de données
        await btpDB.put('users', currentState.currentUser.id, formData);
        
        // Mettre à jour l'état local
        currentState.currentUser = { ...currentState.currentUser, ...formData };
        localStorage.setItem('currentUser', JSON.stringify(currentState.currentUser));
        
        showAlert('✅ Profil mis à jour avec succès', 'success');
        
        // Recharger les données du profil
        loadProfileData();
        toggleEditProfile();
        
        // Mettre à jour l'interface utilisateur
        if (window.updateAuthUI) {
            updateAuthUI();
        }
        
    } catch (error) {
        console.error('Erreur mise à jour profil:', error);
        showAlert('❌ Erreur lors de la mise à jour du profil', 'error');
    } finally {
        showLoading(false);
    }
}

async function loadUserAnnounces() {
    const currentState = getAppState();
    if (!currentState.currentUser) return;
    
    try {
        // Récupérer toutes les annonces de l'utilisateur
        const [marketplace, realestate, jobs, freelancers, professionals] = await Promise.all([
            btpDB.get('marketplace_posts'),
            btpDB.get('realestate_posts'),
            btpDB.get('job_posts'),
            btpDB.get('freelancers'),
            btpDB.get('professionals')
        ]);
        
        const userAnnounces = [
            ...marketplace.filter(ad => ad.userId == currentState.currentUser.id).map(ad => ({ ...ad, type: 'marketplace' })),
            ...realestate.filter(ad => ad.userId == currentState.currentUser.id).map(ad => ({ ...ad, type: 'realestate' })),
            ...jobs.filter(ad => ad.userId == currentState.currentUser.id).map(ad => ({ ...ad, type: 'jobs' })),
            ...freelancers.filter(ad => ad.userId == currentState.currentUser.id).map(ad => ({ ...ad, type: 'freelancers' })),
            ...professionals.filter(ad => ad.userId == currentState.currentUser.id).map(ad => ({ ...ad, type: 'professionals' }))
        ];
        
        displayUserAnnounces(userAnnounces);
        
        // Mettre à jour les statistiques
        updateAnnounceStats(userAnnounces);
        
    } catch (error) {
        console.error('Erreur chargement annonces utilisateur:', error);
        showAlert('❌ Erreur lors du chargement de vos annonces', 'error');
    }
}

function displayUserAnnounces(announces) {
    const container = document.getElementById('user-announces-list');
    if (!container) return;
    
    if (announces.length === 0) {
        container.innerHTML = `
            <div class="text-center py-4">
                <i class="fas fa-bullhorn fa-3x text-muted mb-3"></i>
                <p class="text-muted">Vous n'avez publié aucune annonce</p>
                <button class="btn btn-primary" onclick="goToSection('publish')">
                    <i class="fas fa-plus me-2"></i>Publier votre première annonce
                </button>
            </div>
        `;
        return;
    }
    
    let html = '';
    announces.forEach(announce => {
        const statusBadge = getStatusBadge(announce.status);
        const typeLabel = getAnnounceTypeLabel(announce.type);
        
        html += `
        <div class="card mb-3">
            <div class="card-body">
                <div class="d-flex justify-content-between align-items-start">
                    <div class="flex-grow-1">
                        <h5 class="card-title">${announce.title || announce.poste || announce.company || 'Sans titre'}</h5>
                        <p class="card-text text-muted">${truncateText(announce.description, 120)}</p>
                        <div class="d-flex align-items-center gap-2">
                            <span class="badge bg-secondary">${typeLabel}</span>
                            ${statusBadge}
                            ${announce.isPremium ? '<span class="badge bg-warning">⭐ Premium</span>' : ''}
                            <small class="text-muted">${formatDate(announce.createdAt)}</small>
                        </div>
                    </div>
                    <div class="btn-group">
                        <button class="btn btn-outline-primary btn-sm" onclick="editAnnounce('${announce.id}', '${announce.type}')">
                            <i class="fas fa-edit"></i>
                        </button>
                        <button class="btn btn-outline-danger btn-sm" onclick="deleteUserAnnounce('${announce.id}', '${announce.type}')">
                            <i class="fas fa-trash"></i>
                        </button>
                    </div>
                </div>
            </div>
        </div>`;
    });
    
    container.innerHTML = html;
}

function updateAnnounceStats(announces) {
    const stats = {
        total: announces.length,
        active: announces.filter(ad => ad.status === 'approuve' || ad.status === 'approved').length,
        pending: announces.filter(ad => ad.status === 'en_attente').length,
        rejected: announces.filter(ad => ad.status === 'rejete' || ad.status === 'rejected').length
    };
    
    document.getElementById('stats-total-announces').textContent = stats.total;
    document.getElementById('stats-active-announces').textContent = stats.active;
    document.getElementById('stats-pending-announces').textContent = stats.pending;
    document.getElementById('stats-rejected-announces').textContent = stats.rejected;
}

function getStatusBadge(status) {
    const statusMap = {
        'approuve': { class: 'bg-success', text: 'Approuvé' },
        'approved': { class: 'bg-success', text: 'Approuvé' },
        'en_attente': { class: 'bg-warning', text: 'En attente' },
        'rejete': { class: 'bg-danger', text: 'Rejeté' },
        'rejected': { class: 'bg-danger', text: 'Rejeté' },
        'en_pause': { class: 'bg-secondary', text: 'En pause' }
    };
    
    const statusInfo = statusMap[status] || { class: 'bg-secondary', text: status };
    return `<span class="badge ${statusInfo.class}">${statusInfo.text}</span>`;
}

function getAnnounceTypeLabel(type) {
    const typeMap = {
        'marketplace': '🛍️ Marketplace',
        'realestate': '🏠 Immobilier',
        'jobs': '💼 Emploi',
        'freelancers': '🎨 Freelance',
        'professionals': '👷 Professionnel'
    };
    
    return typeMap[type] || type;
}

function editAnnounce(announceId, announceType) {
    showAlert(`✏️ Édition de l'annonce ${announceId} (${announceType}) - Fonctionnalité en développement`, 'info');
}

async function deleteUserAnnounce(announceId, announceType) {
    if (!confirm('Êtes-vous sûr de vouloir supprimer cette annonce ? Cette action est irréversible.')) {
        return;
    }
    
    showLoading(true);
    
    try {
        const success = await btpDB.delete(getCollectionName(announceType), announceId);
        
        if (success) {
            showAlert('✅ Annonce supprimée avec succès', 'success');
            loadUserAnnounces(); // Recharger la liste
        } else {
            showAlert('❌ Erreur lors de la suppression', 'error');
        }
        
    } catch (error) {
        console.error('Erreur suppression annonce:', error);
        showAlert('❌ Erreur lors de la suppression', 'error');
    } finally {
        showLoading(false);
    }
}

function getCollectionName(type) {
    const collections = {
        'marketplace': 'marketplace_posts',
        'realestate': 'realestate_posts',
        'jobs': 'job_posts',
        'freelancers': 'freelancers',
        'professionals': 'professionals'
    };
    
    return collections[type] || type;
}

// ========== FONCTIONS DE FORMATAGE ==========
function formatPrice(price) {
    if (!price && price !== 0) return 'Non spécifié';
    return new Intl.NumberFormat('fr-FR').format(price) + ' MAD';
}

function formatDate(dateString) {
    if (!dateString) return 'Date inconnue';
    
    try {
        const date = new Date(dateString);
        const now = new Date();
        const diffTime = Math.abs(now - date);
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
        
        if (diffDays === 1) return 'Hier';
        if (diffDays < 7) return `Il y a ${diffDays} jours`;
        if (diffDays < 30) return `Il y a ${Math.floor(diffDays / 7)} semaines`;
        
        return date.toLocaleDateString('fr-FR');
    } catch (error) {
        return 'Date inconnue';
    }
}

function truncateText(text, maxLength = 100) {
    if (!text) return '';
    if (text.length <= maxLength) return text;
    return text.substring(0, maxLength) + '...';
}

// ========== FONCTIONS DE VALIDATION ==========
function validateEmail(email) {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
}

function validatePhone(phone) {
    const phoneRegex = /^(\+212|0)[5-7][0-9]{8}$/;
    return phoneRegex.test(phone.replace(/\s/g, ''));
}

function validatePassword(password) {
    return password && password.length >= 6;
}

// ========== INITIALISATION DES ÉCOUTEURS D'ÉVÉNEMENTS ==========
function initializeEventListeners() {
    // Écouteur pour la recherche globale (Enter key)
    const globalSearchInput = document.getElementById('globalSearch');
    const globalSearchMobile = document.getElementById('globalSearchMobile');
    
    if (globalSearchInput) {
        globalSearchInput.addEventListener('keypress', function(e) {
            if (e.key === 'Enter') {
                handleGlobalSearch();
            }
        });
    }
    
    if (globalSearchMobile) {
        globalSearchMobile.addEventListener('keypress', function(e) {
            if (e.key === 'Enter') {
                handleGlobalSearch();
            }
        });
    }
    
    // Écouteur pour les liens de navigation du compte
    document.addEventListener('click', function(e) {
        if (e.target.matches('[data-account-section]') || e.target.closest('[data-account-section]')) {
            e.preventDefault();
            const target = e.target.matches('[data-account-section]') ? e.target : e.target.closest('[data-account-section]');
            const section = target.getAttribute('data-account-section');
            navigateToAccountSection(section);
        }
    });
}

// ========== STYLES DYNAMIQUES ==========
const style = document.createElement('style');
style.textContent = `
    .loading-spinner {
        position: fixed;
        top: 0; left: 0;
        width: 100%; height: 100%;
        background: rgba(0,0,0,0.5);
        display: none;
        justify-content: center;
        align-items: center;
        z-index: 9999;
    }
    .custom-alert {
        position: fixed;
        top: 20px; right: 20px;
        z-index: 9999;
        min-width: 300px;
        animation: slideInRight 0.3s ease;
    }
    .section-content {
        display: none;
    }
    .section-content.active {
        display: block;
    }
    .search-result-item:hover {
        background-color: #f8f9fa;
        transform: translateY(-2px);
        transition: all 0.2s ease;
    }
    .highlight-search-result {
        background-color: #fff3cd !important;
        border: 2px solid #ffc107 !important;
        transition: all 0.5s ease;
    }
    .bg-purple {
        background-color: #6f42c1 !important;
    }
    .favorite-card:hover {
        transform: translateY(-2px);
        box-shadow: 0 4px 8px rgba(0,0,0,0.1);
        transition: all 0.3s ease;
    }
    @keyframes slideInRight {
        from {
            transform: translateX(100%);
            opacity: 0;
        }
        to {
            transform: translateX(0);
            opacity: 1;
        }
    }
`;
document.head.appendChild(style);

// ========== INITIALISATION ==========
document.addEventListener('DOMContentLoaded', function() {
    console.log('🔧 Initialisation des utilitaires...');
    
    // Initialiser le thème
    initializeTheme();
    
    // Initialiser les écouteurs d'événements
    initializeEventListeners();
    
    console.log('✅ Utilitaires initialisés');
});

// ========== EXPORT DES FONCTIONS ==========
window.showAlert = showAlert;
window.showLoading = showLoading;
window.changeTheme = changeTheme;
window.isInFavorites = isInFavorites;
window.toggleFavorite = toggleFavorite;
window.formatPrice = formatPrice;
window.formatDate = formatDate;
window.truncateText = truncateText;
window.validateEmail = validateEmail;
window.validatePhone = validatePhone;
window.validatePassword = validatePassword;

// ✅ EXPORT DES FONCTIONS DE RÉINITIALISATION CORRIGÉES
window.resetSectionFilters = resetSectionFilters;
window.resetMarketplaceFilters = resetMarketplaceFilters;
window.resetRealEstateFilters = resetRealEstateFilters;
window.resetJobsFilters = resetJobsFilters;
window.resetFreelancersFilters = resetFreelancersFilters;
window.resetProfessionalsFilters = resetProfessionalsFilters;
window.debugAllFilters = debugAllFilters;

// ✅ EXPORT DES FONCTIONS DE RECHERCHE ET COMPTE
window.handleGlobalSearch = handleGlobalSearch;
window.performGlobalSearch = performGlobalSearch;
window.displaySearchResults = displaySearchResults;
window.goToSearchResult = goToSearchResult;
window.navigateToAccountSection = navigateToAccountSection;
window.toggleEditProfile = toggleEditProfile;
window.updateProfile = updateProfile;
window.loadFavorites = loadFavorites;
window.loadUserAnnounces = loadUserAnnounces;

console.log('✅ utils.js SYNCHRONISÉ - Toutes les fonctionnalités restaurées');