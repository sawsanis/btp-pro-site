// ========== REALESTATE DISPLAY - AFFICHAGE ET FILTRES ==========
console.log('🎨 Chargement du module RealEstate Display...');

// ========== FONCTIONS UTILITAIRES MANQUANTES ==========
function truncateText(text, maxLength = 100) {
    if (!text) return '';
    if (text.length <= maxLength) return text;
    return text.substring(0, maxLength) + '...';
}

// ========== INITIALISATION DES VILLES DANS LES FILTRES ==========
function initializeRealEstateCitiesFilter() {
    const cityFilter = document.getElementById('realestateCityFilter');
    if (!cityFilter) {
        console.warn('❌ Filtre realestateCityFilter non trouvé');
        return;
    }
    
    console.log('🏙️ Initialisation des villes dans les filtres...');
    
    // Vider les options existantes sauf la première
    while (cityFilter.children.length > 1) {
        cityFilter.removeChild(cityFilter.lastChild);
    }
    
    // Liste complète des villes marocaines
    const moroccanCities = [
        'Agadir', 'Aïn Harrouda', 'Al Hoceïma', 'Asilah', 'Assa',
        'Azilal', 'Azrou', 'Ben Guerir', 'Berkane', 'Béni Mellal',
        'Bouizakarne', 'Boujdour', 'Bouskoura', 'Casablanca',
        'Chefchaouen', 'Dakhla', 'Dar Bouazza', 'El Hajeb',
        'El Jadida', 'El Kelaa des Sraghna', 'Errachidia', 'Es-Semara',
        'Essaouira', 'Fam El Hisn', 'Fès', 'Figuig', 'Fnideq',
        'Foum Zguid', 'Guelmim', 'Guelta Zemmour', 'Ifrane', 'Jrada',
        'Kénitra', 'Khouribga', 'Laâyoune', 'Larache', 'Marrakech',
        'Martil', 'Meknès', 'Midelt', 'Mohammédia', 'Moulay Abdallah',
        'Nador', 'Ouarzazate', 'Oued Zem', 'Oujda', 'Oulad Teima',
        'Rabat', 'Safi', 'Salé', 'Sefrou', 'Settat', 'Sidi Bennour',
        'Sidi Ifni', 'Sidi Kacem', 'Sidi Slimane', 'Sidi Yahya Zaer',
        'Smara', 'Tafraout', 'Tanger', 'Tan-Tan', 'Taourirt',
        'Taroudant', 'Tarfaya', 'Tata', 'Taza', 'Témara', 'Tétouan',
        'Tiflet', 'Tiznit', 'Youssoufia', 'Zagora', 'Autres'
    ];
    
    // Trier les villes par ordre alphabétique
    moroccanCities.sort();
    
    moroccanCities.forEach(city => {
        const option = document.createElement('option');
        option.value = city;
        option.textContent = city;
        cityFilter.appendChild(option);
    });
    
    console.log(`✅ ${moroccanCities.length} villes ajoutées aux filtres`);
}

// ========== INITIALISATION DES ÉVÉNEMENTS DE FILTRES ==========
function initializeRealEstateFilterEvents() {
    console.log('🎯 Initialisation des événements de filtres...');
    
    // Lier les filtres aux événements
    const typeFilter = document.getElementById('realestateTypeFilter');
    const cityFilter = document.getElementById('realestateCityFilter');
    const priceFilter = document.getElementById('realestatePriceFilter');
    const sortFilter = document.getElementById('realestateSort');
    
    if (typeFilter) {
        typeFilter.onchange = filterRealEstate;
        console.log('✅ Type filter event attached');
    }
    
    if (cityFilter) {
        cityFilter.onchange = filterRealEstate;
        console.log('✅ City filter event attached');
    }
    
    if (priceFilter) {
        priceFilter.onchange = filterRealEstate;
        console.log('✅ Price filter event attached');
    }
    
    if (sortFilter) {
        sortFilter.onchange = filterRealEstate;
        console.log('✅ Sort filter event attached');
    }
}

// ========== FONCTION DE FILTRAGE PRINCIPALE (CORRIGÉE) ==========
async function filterRealEstate() {
    console.log('🔍 Filtrage immobilier...');
    
    try {
        const type = document.getElementById('realestateTypeFilter')?.value;
        const city = document.getElementById('realestateCityFilter')?.value;
        const priceRange = document.getElementById('realestatePriceFilter')?.value;
        const sort = document.getElementById('realestateSort')?.value;
        
        console.log('🎯 Filtres sélectionnés:', { type, city, priceRange, sort });
        
        const properties = await btpDB.get('realestate_posts') || [];
        console.log('📊 Total des biens:', properties.length);
        
        let filteredProperties = properties.filter(property => {
            // Filtre statut
            if (!(property.status === 'approuve' || property.status === 'approved' || !property.status)) {
                return false;
            }
            
            // Filtre par type
            if (type && property.type !== type) {
                console.log(`❌ Type filtré: ${property.type} !== ${type}`);
                return false;
            }
            
            // Filtre par ville
            if (city && property.city !== city) {
                console.log(`❌ Ville filtrée: ${property.city} !== ${city}`);
                return false;
            }
            
            // Filtre par prix
            if (priceRange && property.price) {
                const price = property.price;
                let isValid = true;
                
                switch(priceRange) {
                    case '0-500000':
                        isValid = price <= 500000;
                        break;
                    case '500000-1000000':
                        isValid = price >= 500000 && price <= 1000000;
                        break;
                    case '1000000-2000000':
                        isValid = price >= 1000000 && price <= 2000000;
                        break;
                    case '2000000+':
                        isValid = price >= 2000000;
                        break;
                }
                
                if (!isValid) {
                    console.log(`❌ Prix filtré: ${price} hors de la plage ${priceRange}`);
                    return false;
                }
            }
            
            return true;
        });
        
        console.log(`📊 Résultats filtrés: ${filteredProperties.length}/${properties.length}`);
        
        // CORRECTION : TOUJOURS afficher les résultats, même si 0
        displayRealEstatePosts(filteredProperties);
        
        // Trier les résultats (après affichage pour optimisation)
        if (sort === 'price_asc') {
            filteredProperties.sort((a, b) => (a.price || 0) - (b.price || 0));
        } else if (sort === 'price_desc') {
            filteredProperties.sort((a, b) => (b.price || 0) - (a.price || 0));
        } else if (sort === 'premium') {
            filteredProperties.sort((a, b) => {
                if (b.isPremium && !a.isPremium) return 1;
                if (a.isPremium && !b.isPremium) return -1;
                return new Date(b.createdAt || 0) - new Date(a.createdAt || 0);
            });
        } else {
            // Plus récent d'abord (par défaut)
            filteredProperties.sort((a, b) => new Date(b.createdAt || 0) - new Date(a.createdAt || 0));
        }
        
        // Ré-afficher avec le bon tri
        if (filteredProperties.length > 0) {
            displayRealEstatePosts(filteredProperties);
        }
        
        // Afficher le nombre de résultats
        showFilterResults('realestate-container', filteredProperties.length);
        
    } catch (error) {
        console.error('❌ Erreur filtrage immobilier:', error);
        if (typeof showAlert === 'function') {
            showAlert('❌ Erreur lors du filtrage: ' + error.message, 'error');
        }
    }
}

// ========== AFFICHAGE DES CARTES BIENS IMMOBILIERS ==========
function displayRealEstatePosts(properties) {
    const container = document.getElementById('realestate-container');
    
    if (!container) {
        console.warn('❌ Container realestate non trouvé');
        return;
    }
    
    // CORRECTION CRITIQUE : Vider TOUJOURS le container d'abord
    container.innerHTML = '';
    
    if (!properties || properties.length === 0) {
        container.innerHTML = `
            <div class="col-12 text-center py-5">
                <i class="fas fa-search fa-3x text-muted mb-3"></i>
                <p class="text-muted">Aucun bien immobilier trouvé</p>
                <p class="text-muted small">Essayez de modifier vos critères de recherche</p>
                <button class="btn btn-success" onclick="clearRealEstateFilters()">
                    <i class="fas fa-times me-2"></i>Effacer les filtres
                </button>
            </div>
        `;
        return;
    }
    
    let html = '';
    properties.forEach((property, index) => {
        // Ajouter une pub Adsense tous les 8 biens
        if (index > 0 && index % 8 === 0) {
            html += `
            <div class="col-12 mb-4">
                <div class="adsense-horizontal text-center p-3 bg-light rounded">
                    <i class="fas fa-ad fa-2x text-muted mb-2"></i>
                    <p class="text-muted mb-0">Espace publicitaire</p>
                    <small class="text-muted">Annonce Google Adsense</small>
                </div>
            </div>`;
        }
        
        // Vérifier si les fonctions de favoris sont disponibles
        const isFavorite = typeof isInFavorites === 'function' ? 
            isInFavorites(property.id, 'realestate') : false;
        const favoriteBtnClass = isFavorite ? 'text-danger' : 'text-muted';
        const favoriteIcon = isFavorite ? 'fas' : 'far';
        
        // Vérifier si l'utilisateur peut éditer cette annonce
        let canEdit = false;
        if (typeof authState !== 'undefined' && authState.currentUser) {
            canEdit = authState.currentUser.id === property.userId || 
                     (authState.isAdmin === true);
        }
        
        // Galerie photos avec navigation
        const photosHtml = property.photos && property.photos.length > 0 ? `
            <div class="position-relative">
                <img src="${property.photos[0]}" class="card-img-top" alt="${property.title}" 
                     style="height: 200px; object-fit: cover; cursor: pointer;"
                     onclick="showPhotoGallery('${property.id}')">
                ${property.photos.length > 1 ? `
                <div class="position-absolute bottom-0 end-0 m-2">
                    <span class="badge bg-dark bg-opacity-75">
                        <i class="fas fa-images me-1"></i>${property.photos.length}
                    </span>
                </div>
                ` : ''}
                <button class="btn btn-sm btn-light favorite-btn ${favoriteBtnClass}" 
                        onclick="toggleFavorite('${property.id}', 'realestate')"
                        title="${isFavorite ? 'Retirer des favoris' : 'Ajouter aux favoris'}">
                    <i class="${favoriteIcon} fa-heart"></i>
                </button>
                ${property.isPremium ? `
                <div class="position-absolute top-0 start-0 m-2">
                    <span class="badge bg-warning">⭐ Premium</span>
                </div>
                ` : ''}
            </div>
        ` : `
            <div class="card-img-top bg-light d-flex align-items-center justify-content-center" style="height: 200px;">
                <i class="fas fa-home fa-3x text-muted"></i>
            </div>
        `;
        
        html += `
        <div class="col-md-6 col-lg-4 mb-4">
            <div class="card h-100 realestate-card">
                ${photosHtml}
                <div class="card-body d-flex flex-column">
                    <h5 class="card-title">${property.title || 'Bien sans titre'}</h5>
                    <p class="card-text text-muted flex-grow-1">${property.description ? truncateText(property.description, 100) : 'Aucune description disponible'}</p>
                    
                    <div class="property-info mb-3">
                        <div class="mb-2">
                            <i class="fas fa-tag text-success me-2"></i>
                            <strong>Type:</strong> ${typeof getPropertyTypeLabel === 'function' ? getPropertyTypeLabel(property.type) : property.type}
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
                    
                    <!-- AFFICHAGE DES COORDONNÉES DIRECTEMENT -->
                    <div class="contact-info mb-3 p-3 bg-light rounded">
                        <h6 class="text-success mb-2">
                            <i class="fas fa-user-circle me-2"></i>Annonceur
                        </h6>
                        ${property.userName ? `
                        <div class="mb-1">
                            <i class="fas fa-user me-2"></i>
                            <strong>Nom:</strong> ${property.userName}
                        </div>
                        ` : ''}
                        ${property.phone ? `
                        <div class="mb-1">
                            <i class="fas fa-phone text-success me-2"></i>
                            <strong>Téléphone:</strong> 
                            <a href="tel:${property.phone}" class="text-decoration-none text-success">
                                ${property.phone}
                            </a>
                        </div>
                        ` : ''}
                        ${property.userEmail ? `
                        <div class="mb-0">
                            <i class="fas fa-envelope text-success me-2"></i>
                            <strong>Email:</strong> 
                            <a href="mailto:${property.userEmail}" class="text-decoration-none text-success">
                                ${property.userEmail}
                            </a>
                        </div>
                        ` : ''}
                    </div>
                    
                    <div class="d-flex justify-content-between align-items-center mt-auto">
                        <h4 class="text-success mb-0">${typeof formatPrice === 'function' ? formatPrice(property.price || 0) : (property.price ? property.price.toLocaleString() + ' MAD' : 'Prix non spécifié')}</h4>
                        <small class="text-muted">${typeof formatDate === 'function' ? formatDate(property.createdAt) : (property.createdAt ? new Date(property.createdAt).toLocaleDateString('fr-FR') : '')}</small>
                    </div>
                </div>
                <div class="card-footer bg-transparent">
                    <div class="d-flex gap-2">
                        <button class="btn btn-outline-secondary btn-sm flex-grow-1" onclick="showPhotoGallery('${property.id}')" title="Voir les photos">
                            <i class="fas fa-images me-1"></i>Galerie
                        </button>
                        ${property.phone ? `
                        <a href="tel:${property.phone}" class="btn btn-success btn-sm" title="Appeler">
                            <i class="fas fa-phone"></i>
                        </a>
                        ` : ''}
                        ${property.userEmail ? `
                        <a href="mailto:${property.userEmail}" class="btn btn-primary btn-sm" title="Envoyer un email">
                            <i class="fas fa-envelope"></i>
                        </a>
                        ` : ''}
                    </div>
                </div>
            </div>
        </div>`;
    });
    
    container.innerHTML = html;
    console.log(`✅ ${properties.length} biens immobiliers affichés`);
}

// ========== INITIALISATION DES FILTRES ==========
function initializeRealEstateFilters(properties) {
    console.log('🔧 Initialisation des filtres immobilier...');
    
    // CORRECTION: Utiliser TOUS les types possibles
    const allPossibleTypes = getAllPropertyTypes ? getAllPropertyTypes() : [
        // Habitations
        { value: 'villa', label: 'Villa' },
        { value: 'appartement', label: 'Appartement' },
        { value: 'maison', label: 'Maison' },
        { value: 'studio', label: 'Studio' },
        { value: 'duplex', label: 'Duplex' },
        { value: 'triplex', label: 'Triplex' },
        { value: 'riad', label: 'Riad' },
        { value: 'chalet', label: 'Chalet' },
        { value: 'bungalow', label: 'Bungalow' },
        { value: 'ferme', label: 'Ferme' },
        { value: 'residence', label: 'Résidence' },
        
        // Immobilier d'entreprise
        { value: 'bureau', label: 'Bureau' },
        { value: 'local_commercial', label: 'Local commercial' },
        { value: 'commerce', label: 'Commerce' },
        { value: 'cafe', label: 'Café' },
        { value: 'magasin', label: 'Magasin' },
        { value: 'entrepot', label: 'Entrepôt' },
        { value: 'usine', label: 'Usine' },
        
        // Autres
        { value: 'terrain', label: 'Terrain' },
        { value: 'immeuble', label: 'Immeuble' },
        { value: 'garage', label: 'Garage' }
    ];
    
    // Mettre à jour le filtre des types
    const typeFilter = document.getElementById('realestateTypeFilter');
    if (typeFilter) {
        console.log('🎯 Initialisation du filtre des types...');
        
        // Garder l'option "Tous les types"
        while (typeFilter.children.length > 1) {
            typeFilter.removeChild(typeFilter.lastChild);
        }
        
        // Ajouter TOUS les types possibles
        allPossibleTypes.forEach(type => {
            const option = document.createElement('option');
            option.value = typeof type === 'object' ? type.value : type;
            option.textContent = typeof type === 'object' ? type.label : 
                               (typeof getPropertyTypeLabel === 'function' ? getPropertyTypeLabel(type) : type);
            typeFilter.appendChild(option);
        });
        
        console.log(`✅ ${allPossibleTypes.length} types ajoutés aux filtres`);
    }
    
    // Mettre à jour le filtre des villes
    initializeRealEstateCitiesFilter();
    
    // Initialiser les événements des filtres
    initializeRealEstateFilterEvents();
    
    console.log('✅ Filtres immobilier initialisés');
}

// ========== FONCTIONS UTILITAIRES ==========
function clearRealEstateFilters() {
    console.log('🧹 Effacement des filtres immobilier...');
    
    const typeFilter = document.getElementById('realestateTypeFilter');
    const cityFilter = document.getElementById('realestateCityFilter');
    const priceFilter = document.getElementById('realestatePriceFilter');
    const sortFilter = document.getElementById('realestateSort');
    
    if (typeFilter) typeFilter.value = '';
    if (cityFilter) cityFilter.value = '';
    if (priceFilter) priceFilter.value = '';
    if (sortFilter) sortFilter.value = 'newest';
    
    // Relancer le filtrage
    filterRealEstate();
}

function showFilterResults(containerId, count) {
    const container = document.getElementById(containerId);
    if (!container) return;
    
    // Supprimer l'ancien compteur s'il existe
    const existingCounter = container.querySelector('.results-count');
    if (existingCounter) {
        existingCounter.remove();
    }
    
    const resultsCount = document.createElement('div');
    resultsCount.className = 'col-12 mt-3 results-count';
    resultsCount.innerHTML = `<small class="text-muted">${count} bien${count > 1 ? 's' : ''} immobilier${count > 1 ? 's' : ''} trouvé${count > 1 ? 's' : ''}</small>`;
    
    container.appendChild(resultsCount);
}

// ========== INITIALISATION ET EXPORTS ==========
function initializeDisplayFunctions() {
    console.log('🔄 Initialisation des fonctions d\'affichage...');
    
    // Initialiser les villes dans les filtres si disponibles
    if (document.getElementById('realestateCityFilter')) {
        initializeRealEstateCitiesFilter();
    }
    
    // Initialiser les événements des filtres
    if (document.getElementById('realestateTypeFilter')) {
        initializeRealEstateFilterEvents();
    }
}

// Export des fonctions
window.displayRealEstatePosts = displayRealEstatePosts;
window.initializeRealEstateFilters = initializeRealEstateFilters;
window.initializeRealEstateCitiesFilter = initializeRealEstateCitiesFilter;
window.initializeRealEstateFilterEvents = initializeRealEstateFilterEvents;
window.filterRealEstate = filterRealEstate;
window.clearRealEstateFilters = clearRealEstateFilters;
window.showFilterResults = showFilterResults;
window.initializeDisplayFunctions = initializeDisplayFunctions;

// Export des fonctions utilitaires
window.truncateText = truncateText;

console.log('✅ realestate-display.js chargé - Affichage et filtres prêts');