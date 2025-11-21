// ========== CHARGEMENT DES BIENS IMMOBILIERS OPTIMISÉ ==========
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

// ========== PUBLICATION IMMOBILIÈRE CORRIGÉE ==========
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
    console.log('👤 Utilisateur actuel:', authState.currentUser);
    
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
    
    showLoading(true);
    
    try {
        // Récupérer l'utilisateur actuel de manière sécurisée
        const currentUser = authState.currentUser;
        if (!currentUser) {
            throw new Error('Utilisateur non authentifié');
        }
        
        // 🔥 CORRECTION: Gestion des photos uploadées - Stockage local
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
            userName: `${currentUser.prenom} ${currentUser.nom}`,
            userEmail: currentUser.email,
            status: 'en_attente',
            isPremium: false,
            photos: uploadedPhotos, // 🔥 Photos uploadées stockées localement
            viewCount: 0,
            contactCount: 0,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString()
        };
        
        console.log('💾 Données immobilier à sauvegarder:', propertyData);
        
        const result = await btpDB.add('realestate_posts', propertyData);
        
        console.log('✅ Bien immobilier sauvegardé:', result);
        
        showAlert('✅ Votre bien immobilier a été publié avec succès ! Il sera visible après modération.', 'success');
        
        // Réinitialiser le formulaire
        form.reset();
        
        // 🔥 CORRECTION: Réinitialiser les photos preview
        resetPhotoPreview();
        
        // Rediriger vers la section immobilier
        setTimeout(() => {
            goToSection('realestate');
            // Recharger les annonces
            setTimeout(() => loadRealEstateAnnounces(), 500);
        }, 1500);
        
    } catch (error) {
        console.error('❌ Erreur publication immobilier:', error);
        showAlert('❌ Erreur lors de la publication: ' + error.message, 'error');
    } finally {
        showLoading(false);
    }
}

// 🔥 CORRECTION: GESTION UPLOAD PHOTOS - STOCKAGE LOCAL
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
                
                // 🔥 CORRECTION: Stockage local des images (Base64)
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

// 🔥 FONCTION: PRÉVISUALISATION DES PHOTOS
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

// 🔥 FONCTION: SUPPRIMER PHOTO PREVIEW
function removePhotoPreview(button) {
    const previewItem = button.closest('.photo-preview-item');
    previewItem.remove();
    
    // Mettre à jour l'input file
    const photoInput = document.getElementById('realestatePhotos');
    // Réinitialiser l'input (limitation technique des inputs file)
    photoInput.value = '';
}

// 🔥 FONCTION: RÉINITIALISER PREVIEW PHOTOS
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

// 🔥 CORRECTION: INITIALISER LES TYPES DE BIENS DANS LE FORMULAIRE DE PUBLICATION
function initializeRealEstateFormTypes() {
    const typeSelect = document.getElementById('realestateType');
    if (!typeSelect) {
        console.warn('❌ Select realestateType non trouvé');
        return;
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

// 🔥 CORRECTION: AFFICHAGE AVEC GALERIE PHOTOS
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
        
        // Vérifier si l'utilisateur peut éditer cette annonce
        const canEdit = authState.currentUser && 
                       (authState.currentUser.id === property.userId || authState.isAdmin);
        
        // 🔥 CORRECTION: Galerie photos avec navigation
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
                    
                    <!-- BOUTONS ADMIN ET ÉDITION -->
                    <div class="actions mt-2">
                        <div class="btn-group btn-group-sm w-100">
                            ${canEdit ? `
                            <button class="btn btn-outline-primary btn-sm" onclick="editRealEstateAnnounce('${property.id}')" title="Modifier">
                                <i class="fas fa-edit"></i>
                            </button>
                            ` : ''}
                            ${authState.isAdmin ? `
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
                            ` : ''}
                        </div>
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
    console.log(`✅ ${properties.length} biens immobiliers affichés avec galerie photos`);
}

// 🔥 NOUVELLE FONCTION: GALERIE PHOTOS MODALE
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

// NOUVELLE FONCTION POUR AFFICHER LA PAGE DE PUBLICATION
function showPublishRealEstate() {
    console.log('🎯 Navigation vers publication immobilier...');
    
    // Vérifier l'authentification d'abord
    if (!checkAuthForPublish()) {
        console.log('❌ Utilisateur non authentifié - affichage modal connexion');
        return;
    }
    
    // Si authentifié, aller directement à la publication
    goToSection('publish');
    
    // S'assurer que le formulaire immobilier est visible
    setTimeout(() => {
        const realEstateForm = document.getElementById('realestate-form');
        if (realEstateForm) {
            realEstateForm.style.display = 'block';
            
            // 🔥 CORRECTION: Initialiser les types de biens COMPLETS dans le formulaire
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

// ========== FONCTIONS UTILITAIRES ==========
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

function formatPrice(price) {
    if (!price && price !== 0) return 'Non spécifié';
    return new Intl.NumberFormat('fr-FR').format(price) + ' MAD';
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

// ========== EXPORT DES FONCTIONS ==========
window.loadRealEstateAnnounces = loadRealEstateAnnounces;
window.filterRealEstate = filterRealEstate;
window.handlePublishRealEstate = handlePublishRealEstate;
window.clearRealEstateFilters = clearRealEstateFilters;
window.getPropertyTypeLabel = getPropertyTypeLabel;
window.showPublishRealEstate = showPublishRealEstate;

// 🔥 EXPORT DES NOUVELLES FONCTIONS
window.removePhotoPreview = removePhotoPreview;
window.setupPhotoPreview = setupPhotoPreview;
window.initializeRealEstateFormTypes = initializeRealEstateFormTypes;
window.showPhotoGallery = showPhotoGallery;

console.log('✅ realestate.js VALIDÉ - Types de biens complets + Galerie photos FONCTIONNELLE');