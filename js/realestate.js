// ========== CHARGEMENT DES BIENS IMMOBILIERS CORRIGÉ ==========
async function loadRealEstateAnnounces() {
    console.log('🏠 Chargement des biens immobiliers...');
    
    try {
        const properties = await btpDB.get('realestate_posts');
        console.log('📊 Biens immobiliers récupérés:', properties.length);
        
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
                    <button class="btn btn-success" onclick="goToSection('publish')">
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
                    <button class="btn btn-success" onclick="goToSection('publish')">
                        <i class="fas fa-plus me-2"></i>Publier un bien
                    </button>
                </div>
            `;
            return;
        }
        
        // Initialiser les filtres
        initializeRealEstateFilters(approvedProperties);
        
        // Utiliser la pagination
        if (typeof setupPagination === 'function') {
            setupPagination('realestate-container', approvedProperties, displayRealEstatePosts);
            console.log(`✅ ${approvedProperties.length} biens immobiliers chargés avec pagination`);
        } else {
            displayRealEstatePosts(approvedProperties);
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

function initializeRealEstateFilters(properties) {
    // Récupérer les types uniques
    const types = [...new Set(properties.map(p => p.type).filter(Boolean))];
    const cities = [...new Set(properties.map(p => p.city).filter(Boolean))];
    
    // Mettre à jour le filtre des types
    const typeFilter = document.getElementById('realestateTypeFilter');
    if (typeFilter) {
        // Garder l'option "Tous les types"
        while (typeFilter.children.length > 1) {
            typeFilter.removeChild(typeFilter.lastChild);
        }
        
        types.forEach(type => {
            const option = document.createElement('option');
            option.value = type;
            option.textContent = getPropertyTypeLabel(type);
            typeFilter.appendChild(option);
        });
    }
    
    // Mettre à jour le filtre des villes
    const cityFilter = document.getElementById('realestateCityFilter');
    if (cityFilter) {
        // Garder l'option "Toutes les villes"
        while (cityFilter.children.length > 1) {
            cityFilter.removeChild(cityFilter.lastChild);
        }
        
        cities.forEach(city => {
            const option = document.createElement('option');
            option.value = city;
            option.textContent = city;
            cityFilter.appendChild(option);
        });
    }
}

async function filterRealEstate() {
    console.log('🔍 Filtrage immobilier...');
    
    try {
        const type = document.getElementById('realestateTypeFilter')?.value;
        const city = document.getElementById('realestateCityFilter')?.value;
        const priceRange = document.getElementById('realestatePriceFilter')?.value;
        const sort = document.getElementById('realestateSort')?.value;
        
        const properties = await btpDB.get('realestate_posts');
        let filteredProperties = properties.filter(property => {
            if (type && property.type !== type) return false;
            if (city && property.city !== city) return false;
            
            // Filtrage par prix
            if (priceRange && property.price) {
                const price = property.price;
                switch(priceRange) {
                    case '0-500000':
                        if (price > 500000) return false;
                        break;
                    case '500000-1000000':
                        if (price < 500000 || price > 1000000) return false;
                        break;
                    case '1000000-2000000':
                        if (price < 1000000 || price > 2000000) return false;
                        break;
                    case '2000000+':
                        if (price < 2000000) return false;
                        break;
                }
            }
            
            return property.status === 'approuve' || property.status === 'approved' || !property.status;
        });
        
        // Trier les résultats
        if (sort === 'price_asc') {
            filteredProperties.sort((a, b) => (a.price || 0) - (b.price || 0));
        } else if (sort === 'price_desc') {
            filteredProperties.sort((a, b) => (b.price || 0) - (a.price || 0));
        } else if (sort === 'premium') {
            filteredProperties.sort((a, b) => (b.isPremium ? 1 : 0) - (a.isPremium ? 1 : 0));
        } else {
            // Plus récent d'abord
            filteredProperties.sort((a, b) => new Date(b.createdAt || 0) - new Date(a.createdAt || 0));
        }
        
        if (typeof setupPagination === 'function') {
            setupPagination('realestate-container', filteredProperties, displayRealEstatePosts);
        } else {
            displayRealEstatePosts(filteredProperties);
        }
        
        // Afficher le nombre de résultats
        showFilterResults('realestate-container', filteredProperties.length);
        
    } catch (error) {
        console.error('❌ Erreur filtrage immobilier:', error);
        showAlert('❌ Erreur lors du filtrage', 'error');
    }
}

function displayRealEstatePosts(properties) {
    const container = document.getElementById('realestate-container');
    
    if (!container) {
        console.warn('❌ Container realestate non trouvé');
        return;
    }
    
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
        
        const isFavorite = isInFavorites(property.id, 'realestate');
        const favoriteBtnClass = isFavorite ? 'text-danger' : 'text-muted';
        const favoriteIcon = isFavorite ? 'fas' : 'far';
        
        html += `
        <div class="col-md-6 col-lg-4 mb-4">
            <div class="card h-100 realestate-card">
                <div class="position-relative">
                    ${property.photos && property.photos.length > 0 ? `
                    <img src="${property.photos[0]}" class="card-img-top" alt="${property.title}" style="height: 200px; object-fit: cover;">
                    ` : `
                    <div class="card-img-top bg-light d-flex align-items-center justify-content-center" style="height: 200px;">
                        <i class="fas fa-home fa-3x text-muted"></i>
                    </div>
                    `}
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
                <div class="card-body d-flex flex-column">
                    <h5 class="card-title">${property.title || 'Bien sans titre'}</h5>
                    <p class="card-text text-muted flex-grow-1">${property.description ? truncateText(property.description, 100) : 'Aucune description disponible'}</p>
                    
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
                        <h4 class="text-success mb-0">${formatPrice(property.price || 0)}</h4>
                        <small class="text-muted">${formatDate(property.createdAt)}</small>
                    </div>
                    
                    <!-- BOUTONS ADMIN CORRIGÉS -->
                    ${appState.currentUser && appState.isAdmin ? `
                    <div class="admin-actions mt-2">
                        <div class="btn-group btn-group-sm w-100">
                            <button class="btn btn-outline-warning btn-sm" onclick="toggleAnnounceStatus('${property.id}', 'realestate', '${property.status === 'en_pause' ? 'approuve' : 'en_pause'}')" 
                                    title="${property.status === 'en_pause' ? 'Activer' : 'Mettre en pause'}">
                                <i class="fas fa-${property.status === 'en_pause' ? 'play' : 'pause'}"></i>
                            </button>
                            <button class="btn btn-outline-info btn-sm" onclick="togglePremium('${property.id}', 'realestate', ${!property.isPremium})" 
                                    title="${property.isPremium ? 'Retirer premium' : 'Mettre en avant'}">
                                <i class="fas fa-${property.isPremium ? 'star' : 'crown'}"></i>
                            </button>
                            <button class="btn btn-outline-danger btn-sm" onclick="deleteAnnounce('${property.id}', 'realestate')" title="Supprimer">
                                <i class="fas fa-trash"></i>
                            </button>
                        </div>
                    </div>
                    ` : ''}
                </div>
                <div class="card-footer bg-transparent">
                    <div class="d-flex gap-2">
                        <button class="btn btn-outline-secondary btn-sm flex-grow-1" onclick="viewPropertyDetails('${property.id}')" title="Voir détails">
                            <i class="fas fa-info-circle me-1"></i>Détails
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

// ========== GESTION DES ANNONCES IMMOBILIÈRES CORRIGÉE ==========
async function handlePublishRealEstate(event) {
    event.preventDefault();
    
    // ✅ NOUVELLE VÉRIFICATION UNIFIÉE
    if (!checkAuthForPublish()) return;
    
    const form = event.target;
    const formData = new FormData(form);
    const data = Object.fromEntries(formData.entries());
    
    console.log('📝 Données du formulaire immobilier:', data);
    
    // Validation améliorée
    if (!data.title || !data.type || !data.price || !data.address || !data.description || !data.phone) {
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
            userId: appState.currentUser.id,
            userName: `${appState.currentUser.prenom} ${appState.currentUser.nom}`,
            userEmail: appState.currentUser.email,
            status: 'en_attente',
            isPremium: false,
            photos: [],
            viewCount: 0,
            contactCount: 0,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString()
        };
        
        console.log('💾 Données immobilier à sauvegarder:', propertyData);
        
        const result = await btpDB.post('realestate_posts', propertyData);
        
        console.log('✅ Bien immobilier sauvegardé:', result);
        
        showAlert('✅ Votre bien immobilier a été publié avec succès ! Il sera visible après modération.', 'success');
        
        // Réinitialiser le formulaire
        form.reset();
        
        // Rediriger vers la section immobilier
        setTimeout(() => {
            goToSection('realestate');
        }, 2000);
        
    } catch (error) {
        console.error('❌ Erreur publication immobilier:', error);
        showAlert('❌ Erreur lors de la publication: ' + error.message, 'error');
    } finally {
        showLoading(false);
    }
}

// ========== FONCTIONS UTILITAIRES CORRIGÉES ==========
function getPropertyTypeLabel(type) {
    const types = {
        'villa': 'Villa',
        'appartement': 'Appartement',
        'terrain': 'Terrain',
        'local': 'Local commercial',
        'bureau': 'Bureau',
        'maison': 'Maison',
        'duplex': 'Duplex'
    };
    return types[type] || type;
}

function formatPrice(price) {
    if (!price && price !== 0) return 'Non spécifié';
    return new Intl.NumberFormat('fr-FR').format(price) + ' MAD';
}

function viewPropertyDetails(propertyId) {
    showAlert('🔍 Fonction détails bien immobilier en développement', 'info');
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

// ========== EXPORT DES FONCTIONS CORRIGÉES ==========
window.loadRealEstateAnnounces = loadRealEstateAnnounces;
window.filterRealEstate = filterRealEstate;
window.handlePublishRealEstate = handlePublishRealEstate;
window.viewPropertyDetails = viewPropertyDetails;
window.clearRealEstateFilters = clearRealEstateFilters;
window.getPropertyTypeLabel = getPropertyTypeLabel;

console.log('✅ realestate.js CORRIGÉ - Module immobilier OPTIMISÉ avec affichage direct des coordonnées');