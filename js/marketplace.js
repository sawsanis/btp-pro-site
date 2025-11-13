// ========== FONCTIONS MARKETPLACE CORRIGÉES ==========
async function loadMarketplace() {
    console.log('🛍️ Chargement de la marketplace...');
    await loadMarketplaceAnnounces();
}

async function loadMarketplaceAnnounces() {
    console.log('🛍️ Chargement des produits marketplace...');
    
    try {
        const products = await btpDB.get('marketplace_posts');
        console.log('📊 Produits récupérés:', products.length);
        
        const container = document.getElementById('marketplace-container');
        
        if (!container) {
            console.warn('❌ Container marketplace non trouvé');
            return;
        }
        
        if (!products || products.length === 0) {
            container.innerHTML = `
                <div class="col-12 text-center py-5">
                    <i class="fas fa-shopping-cart fa-3x text-muted mb-3"></i>
                    <h5 class="text-muted">Aucun produit disponible</h5>
                    <p class="text-muted">Soyez le premier à publier un produit !</p>
                    <button class="btn btn-primary" onclick="goToSection('publish')">
                        <i class="fas fa-plus me-2"></i>Publier le premier produit
                    </button>
                </div>
            `;
            return;
        }
        
        const approvedProducts = products.filter(product => 
            product.status === 'approuve' || product.status === 'approved' || !product.status
        );
        
        console.log('✅ Produits approuvés:', approvedProducts.length);
        
        if (approvedProducts.length === 0) {
            container.innerHTML = `
                <div class="col-12 text-center py-5">
                    <i class="fas fa-shopping-cart fa-3x text-muted mb-3"></i>
                    <h5 class="text-muted">Aucun produit disponible</h5>
                    <p class="text-muted">Tous les produits sont en attente de modération</p>
                    <button class="btn btn-primary" onclick="goToSection('publish')">
                        <i class="fas fa-plus me-2"></i>Publier un produit
                    </button>
                </div>
            `;
            return;
        }
        
        // Initialiser les filtres
        initializeMarketplaceFilters(approvedProducts);
        
        // Utiliser la pagination
        if (typeof setupPagination === 'function') {
            setupPagination('marketplace-container', approvedProducts, displayMarketplacePosts);
            console.log(`✅ ${approvedProducts.length} produits chargés avec pagination`);
        } else {
            displayMarketplacePosts(approvedProducts);
        }
        
    } catch (error) {
        console.error('❌ Erreur chargement marketplace:', error);
        const container = document.getElementById('marketplace-container');
        if (container) {
            container.innerHTML = `
                <div class="col-12 text-center">
                    <p class="text-danger">
                        <i class="fas fa-exclamation-triangle me-2"></i>
                        Erreur lors du chargement des produits
                    </p>
                    <button class="btn btn-primary btn-sm" onclick="loadMarketplaceAnnounces()">
                        <i class="fas fa-redo me-1"></i>Réessayer
                    </button>
                </div>
            `;
        }
    }
}

function initializeMarketplaceFilters(products) {
    // Récupérer les catégories uniques
    const categories = [...new Set(products.map(p => p.category).filter(Boolean))];
    const cities = [...new Set(products.map(p => p.city).filter(Boolean))];
    
    // Mettre à jour le filtre des catégories
    const categoryFilter = document.getElementById('marketplaceCategoryFilter');
    if (categoryFilter) {
        // Garder l'option "Toutes les catégories"
        while (categoryFilter.children.length > 1) {
            categoryFilter.removeChild(categoryFilter.lastChild);
        }
        
        categories.forEach(category => {
            const option = document.createElement('option');
            option.value = category;
            option.textContent = getCategoryLabel(category);
            categoryFilter.appendChild(option);
        });
    }
    
    // Mettre à jour le filtre des villes
    const cityFilter = document.getElementById('marketplaceCityFilter');
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

async function filterMarketplace() {
    console.log('🔍 Filtrage marketplace...');
    
    try {
        const category = document.getElementById('marketplaceCategoryFilter')?.value;
        const city = document.getElementById('marketplaceCityFilter')?.value;
        const sort = document.getElementById('marketplaceSort')?.value;
        
        const products = await btpDB.get('marketplace_posts');
        let filteredProducts = products.filter(product => {
            if (category && product.category !== category) return false;
            if (city && product.city !== city) return false;
            return product.status === 'approuve' || product.status === 'approved' || !product.status;
        });
        
        // Trier les résultats
        if (sort === 'price_asc') {
            filteredProducts.sort((a, b) => (a.price || 0) - (b.price || 0));
        } else if (sort === 'price_desc') {
            filteredProducts.sort((a, b) => (b.price || 0) - (a.price || 0));
        } else if (sort === 'premium') {
            filteredProducts.sort((a, b) => (b.isPremium ? 1 : 0) - (a.isPremium ? 1 : 0));
        } else {
            // Plus récent d'abord
            filteredProducts.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
        }
        
        if (typeof setupPagination === 'function') {
            setupPagination('marketplace-container', filteredProducts, displayMarketplacePosts);
        } else {
            displayMarketplacePosts(filteredProducts);
        }
        
    } catch (error) {
        console.error('❌ Erreur filtrage marketplace:', error);
        showAlert('❌ Erreur lors du filtrage', 'error');
    }
}

function displayMarketplacePosts(products) {
    const container = document.getElementById('marketplace-container');
    
    if (!container) {
        console.warn('❌ Container marketplace non trouvé');
        return;
    }
    
    if (!products || products.length === 0) {
        container.innerHTML = `
            <div class="col-12 text-center py-5">
                <i class="fas fa-search fa-3x text-muted mb-3"></i>
                <p class="text-muted">Aucun produit trouvé</p>
                <p class="text-muted small">Essayez de modifier vos critères de recherche</p>
                <button class="btn btn-primary" onclick="clearMarketplaceFilters()">
                    <i class="fas fa-times me-2"></i>Effacer les filtres
                </button>
            </div>
        `;
        return;
    }
    
    let html = '';
    products.forEach((product, index) => {
        const isFavorite = isInFavorites(product.id, 'marketplace');
        const favoriteBtnClass = isFavorite ? 'text-danger' : 'text-muted';
        const favoriteIcon = isFavorite ? 'fas' : 'far';
        
        // CORRECTION : Afficher les contacts au lieu du bouton "Acheter"
        html += `
        <div class="col-md-6 col-lg-4 mb-4">
            <div class="card h-100 product-card">
                <div class="position-relative">
                    ${product.photos && product.photos.length > 0 ? `
                    <img src="${product.photos[0]}" class="card-img-top" alt="${product.title}" style="height: 200px; object-fit: cover;">
                    ` : `
                    <div class="card-img-top bg-light d-flex align-items-center justify-content-center" style="height: 200px;">
                        <i class="fas fa-box fa-3x text-muted"></i>
                    </div>
                    `}
                    <button class="btn btn-sm btn-light favorite-btn ${favoriteBtnClass}" 
                            onclick="toggleFavorite('${product.id}', 'marketplace')"
                            title="${isFavorite ? 'Retirer des favoris' : 'Ajouter aux favoris'}">
                        <i class="${favoriteIcon} fa-heart"></i>
                    </button>
                    ${product.isPremium ? `
                    <div class="position-absolute top-0 start-0 m-2">
                        <span class="badge bg-warning">⭐ Premium</span>
                    </div>
                    ` : ''}
                </div>
                <div class="card-body d-flex flex-column">
                    <h5 class="card-title">${product.title || 'Produit sans titre'}</h5>
                    <p class="card-text text-muted flex-grow-1">${product.description ? truncateText(product.description, 100) : 'Aucune description disponible'}</p>
                    
                    <div class="mb-3">
                        <span class="badge bg-primary">${getCategoryLabel(product.category)}</span>
                        ${product.city ? `<span class="badge bg-secondary ms-1">${product.city}</span>` : ''}
                        ${product.unit ? `<small class="text-muted ms-1">/ ${getUnitLabel(product.unit)}</small>` : ''}
                    </div>
                    
                    <div class="d-flex justify-content-between align-items-center mt-auto">
                        <h4 class="text-primary mb-0">${formatPrice(product.price || 0)}</h4>
                        <small class="text-muted">${formatDate(product.createdAt)}</small>
                    </div>
                    
                    <!-- BOUTONS ADMIN -->
                    ${appState.currentUser && appState.isAdmin ? `
                    <div class="admin-actions mt-2">
                        <div class="btn-group btn-group-sm w-100">
                            <button class="btn btn-outline-warning btn-sm" onclick="toggleAnnounceStatus('${product.id}', 'marketplace', '${product.status === 'en_pause' ? 'approuve' : 'en_pause'}')" 
                                    title="${product.status === 'en_pause' ? 'Activer' : 'Mettre en pause'}">
                                <i class="fas fa-${product.status === 'en_pause' ? 'play' : 'pause'}"></i>
                            </button>
                            <button class="btn btn-outline-info btn-sm" onclick="togglePremium('${product.id}', 'marketplace', ${!product.isPremium})" 
                                    title="${product.isPremium ? 'Retirer premium' : 'Mettre en avant'}">
                                <i class="fas fa-${product.isPremium ? 'star' : 'crown'}"></i>
                            </button>
                            <button class="btn btn-outline-danger btn-sm" onclick="deleteAnnounce('${product.id}', 'marketplace')" title="Supprimer">
                                <i class="fas fa-trash"></i>
                            </button>
                        </div>
                    </div>
                    ` : ''}
                </div>
                
                <!-- CORRECTION : REMPLACER "ACHETER" PAR LES CONTACTS -->
                <div class="card-footer bg-transparent">
                    <div class="contact-info">
                        <h6 class="mb-2">📞 Contacter le vendeur :</h6>
                        ${product.phone ? `
                        <div class="contact-phone">
                            <i class="fas fa-phone text-success"></i>
                            <strong>Téléphone :</strong>
                            <a href="tel:${product.phone}" class="ms-1">${product.phone}</a>
                        </div>
                        ` : ''}
                        ${product.userEmail ? `
                        <div class="contact-email mt-1">
                            <i class="fas fa-envelope text-primary"></i>
                            <strong>Email :</strong>
                            <a href="mailto:${product.userEmail}" class="ms-1">${product.userEmail}</a>
                        </div>
                        ` : ''}
                        ${product.userName ? `
                        <div class="contact-seller mt-2">
                            <small class="text-muted">
                                <i class="fas fa-user"></i> Vendeur : ${product.userName}
                            </small>
                        </div>
                        ` : ''}
                    </div>
                </div>
            </div>
        </div>`;
    });
    
    container.innerHTML = html;
    console.log(`✅ ${products.length} produits affichés avec contacts directs`);
}

// ========== FONCTIONS UTILITAIRES ==========
function getCategoryLabel(category) {
    const categories = {
        'ciment': 'Ciment',
        'acier': 'Acier',
        'revetement': 'Revêtement',
        'bois': 'Bois',
        'isolation': 'Isolation',
        'plomberie': 'Plomberie',
        'electricite': 'Électricité',
        'outillage': 'Outillage',
        'quincaillerie': 'Quincaillerie',
        'autres': 'Autres'
    };
    return categories[category] || category;
}

function getUnitLabel(unit) {
    const units = {
        'sac': 'sac',
        'm2': 'm²',
        'm3': 'm³',
        'unite': 'unité',
        'lot': 'lot',
        'kg': 'kg',
        'tonne': 'tonne'
    };
    return units[unit] || unit;
}

function formatPrice(price) {
    return new Intl.NumberFormat('fr-FR').format(price) + ' MAD';
}

function clearMarketplaceFilters() {
    document.getElementById('marketplaceCategoryFilter').value = '';
    document.getElementById('marketplaceCityFilter').value = '';
    document.getElementById('marketplaceSort').value = 'newest';
    filterMarketplace();
}

// ========== GESTION DES ANNONCES MARKETPLACE ==========
async function handlePublishMarketplace(event) {
    event.preventDefault();
    
    if (!checkAuthForPublish()) return;
    
    const form = event.target;
    const formData = new FormData(form);
    const data = Object.fromEntries(formData.entries());
    
    console.log('📝 Données du formulaire:', data);
    
    // Validation
    if (!data.title || !data.category || !data.price || !data.description || !data.phone) {
        showAlert('❌ Veuillez remplir tous les champs obligatoires', 'error');
        return;
    }
    
    // Validation du prix
    const price = parseFloat(data.price);
    if (isNaN(price) || price <= 0) {
        showAlert('❌ Veuillez saisir un prix valide', 'error');
        return;
    }
    
    showLoading(true);
    
    try {
        const productData = {
            title: data.title.trim(),
            category: data.category,
            price: price,
            unit: data.unit || 'unite',
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
        
        console.log('💾 Données à sauvegarder:', productData);
        
        const result = await btpDB.post('marketplace_posts', productData);
        
        console.log('✅ Produit sauvegardé:', result);
        
        showAlert('✅ Votre produit a été publié avec succès ! Il sera visible après modération.', 'success');
        
        // Réinitialiser le formulaire
        form.reset();
        
        // Rediriger vers la section marketplace
        setTimeout(() => {
            goToSection('marketplace');
        }, 2000);
        
    } catch (error) {
        console.error('❌ Erreur publication marketplace:', error);
        showAlert('❌ Erreur lors de la publication: ' + error.message, 'error');
    } finally {
        showLoading(false);
    }
}

function handleCategoryChange(select) {
    console.log('Catégorie sélectionnée:', select.value);
}

function handlePhotoUpload(input, type) {
    console.log('Upload photo pour:', type);
    showAlert('📸 Fonction d\'upload photo en développement', 'info');
}

// CORRECTION : Fonction supprimée car remplacée par l'affichage direct des contacts
// function contactSellerMarketplace(productId) {
//     // Cette fonction n'est plus nécessaire car les contacts sont affichés directement
// }

function viewProductDetails(productId) {
    showAlert('🔍 Fonction détails produit en développement', 'info');
}

// ========== EXPORT DES FONCTIONS CORRIGÉES ==========
window.loadMarketplace = loadMarketplace;
window.loadMarketplaceAnnounces = loadMarketplaceAnnounces;
window.filterMarketplace = filterMarketplace;
window.handlePublishMarketplace = handlePublishMarketplace;
window.handleCategoryChange = handleCategoryChange;
window.handlePhotoUpload = handlePhotoUpload;
window.viewProductDetails = viewProductDetails;
window.clearMarketplaceFilters = clearMarketplaceFilters;

console.log('✅ marketplace.js CORRIGÉ - Contacts directs affichés au lieu de "Acheter"');