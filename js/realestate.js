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
        
        // 🔥 NOUVEAU: Gestion des photos uploadées
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
            photos: uploadedPhotos, // 🔥 Photos uploadées
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
        
        // 🔥 NOUVEAU: Réinitialiser les photos preview
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

// 🔥 NOUVELLE FONCTION: GESTION UPLOAD PHOTOS
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
                
                // 🔥 SIMULATION UPLOAD - À REMPLACER PAR VOTRE LOGIQUE UPLOAD
                const fakeUploadUrl = await simulatePhotoUpload(file);
                uploadedPhotos.push(fakeUploadUrl);
                
                console.log(`✅ Photo uploadée: ${file.name}`);
                
            } catch (error) {
                console.error(`❌ Erreur upload photo ${file.name}:`, error);
                showAlert(`❌ Erreur lors de l'upload de "${file.name}"`, 'error');
            }
        }
    }
    
    return uploadedPhotos;
}

// 🔥 FONCTION SIMULATION UPLOAD (À ADAPTER AVEC VOTRE SOLUTION)
async function simulatePhotoUpload(file) {
    return new Promise((resolve) => {
        setTimeout(() => {
            // Simuler une URL d'image uploadée
            const fakeUrl = `https://picsum.photos/400/300?random=${Math.random()}`;
            resolve(fakeUrl);
        }, 1000);
    });
}

// 🔥 NOUVELLE FONCTION: PRÉVISUALISATION DES PHOTOS
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
                    <img src="${e.target.result}" class="img-thumbnail" alt="Preview">
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

// 🔥 NOUVELLE FONCTION: SUPPRIMER PHOTO PREVIEW
function removePhotoPreview(button) {
    const previewItem = button.closest('.photo-preview-item');
    previewItem.remove();
    
    // Mettre à jour l'input file
    const photoInput = document.getElementById('realestatePhotos');
    // Réinitialiser l'input (limitation technique des inputs file)
    photoInput.value = '';
}

// 🔥 NOUVELLE FONCTION: RÉINITIALISER PREVIEW PHOTOS
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

// 🔥 NOUVELLE FONCTION: ÉDITION D'ANNONCE
async function editRealEstateAnnounce(announceId) {
    console.log('✏️ Édition annonce immobilier:', announceId);
    
    if (!checkAuth()) {
        showAlert('🔐 Veuillez vous connecter pour modifier une annonce', 'warning');
        return;
    }
    
    try {
        const properties = await btpDB.get('realestate_posts');
        const property = properties.find(p => p.id == announceId);
        
        if (!property) {
            showAlert('❌ Annonce non trouvée', 'error');
            return;
        }
        
        // Vérifier que l'utilisateur est le propriétaire ou admin
        const currentUser = authState.currentUser;
        if (property.userId !== currentUser.id && !authState.isAdmin) {
            showAlert('❌ Vous ne pouvez modifier que vos propres annonces', 'error');
            return;
        }
        
        // Afficher le modal d'édition
        showEditRealEstateModal(property);
        
    } catch (error) {
        console.error('❌ Erreur chargement annonce:', error);
        showAlert('❌ Erreur lors du chargement de l\'annonce', 'error');
    }
}

// 🔥 NOUVELLE FONCTION: AFFICHER MODAL ÉDITION
function showEditRealEstateModal(property) {
    // Créer ou récupérer le modal d'édition
    let editModal = document.getElementById('editRealEstateModal');
    
    if (!editModal) {
        editModal = document.createElement('div');
        editModal.className = 'modal fade';
        editModal.id = 'editRealEstateModal';
        editModal.innerHTML = `
            <div class="modal-dialog modal-lg">
                <div class="modal-content">
                    <div class="modal-header bg-success text-white">
                        <h5 class="modal-title">
                            <i class="fas fa-edit me-2"></i>Modifier l'annonce
                        </h5>
                        <button type="button" class="btn-close btn-close-white" data-bs-dismiss="modal"></button>
                    </div>
                    <div class="modal-body">
                        <form id="editRealEstateForm" onsubmit="handleEditRealEstate(event)">
                            <input type="hidden" id="editPropertyId" name="id">
                            
                            <div class="row">
                                <div class="col-md-6 mb-3">
                                    <label class="form-label">Titre *</label>
                                    <input type="text" class="form-control" id="editTitle" name="title" required>
                                </div>
                                <div class="col-md-6 mb-3">
                                    <label class="form-label">Type de bien *</label>
                                    <select class="form-control" id="editType" name="type" required>
                                        <option value="">Choisir un type</option>
                                        <option value="villa">Villa</option>
                                        <option value="appartement">Appartement</option>
                                        <option value="maison">Maison</option>
                                        <option value="terrain">Terrain</option>
                                        <option value="local">Local commercial</option>
                                        <option value="bureau">Bureau</option>
                                        <option value="duplex">Duplex</option>
                                    </select>
                                </div>
                            </div>
                            
                            <div class="row">
                                <div class="col-md-4 mb-3">
                                    <label class="form-label">Prix (MAD) *</label>
                                    <input type="number" class="form-control" id="editPrice" name="price" required>
                                </div>
                                <div class="col-md-4 mb-3">
                                    <label class="form-label">Surface (m²)</label>
                                    <input type="number" class="form-control" id="editSurface" name="surface">
                                </div>
                                <div class="col-md-4 mb-3">
                                    <label class="form-label">Nombre de pièces</label>
                                    <input type="number" class="form-control" id="editRooms" name="rooms">
                                </div>
                            </div>
                            
                            <div class="mb-3">
                                <label class="form-label">Adresse *</label>
                                <input type="text" class="form-control" id="editAddress" name="address" required>
                            </div>
                            
                            <div class="mb-3">
                                <label class="form-label">Ville</label>
                                <input type="text" class="form-control" id="editCity" name="city">
                            </div>
                            
                            <div class="mb-3">
                                <label class="form-label">Description *</label>
                                <textarea class="form-control" id="editDescription" name="description" rows="4" required></textarea>
                            </div>
                            
                            <div class="mb-3">
                                <label class="form-label">Téléphone *</label>
                                <input type="tel" class="form-control" id="editPhone" name="phone" required>
                            </div>
                            
                            <!-- SECTION PHOTOS EXISTANTES -->
                            <div class="mb-3">
                                <label class="form-label">Photos actuelles</label>
                                <div id="existingPhotos" class="d-flex flex-wrap gap-2 mb-3"></div>
                            </div>
                            
                            <!-- SECTION NOUVELLES PHOTOS -->
                            <div class="mb-3">
                                <label class="form-label">Ajouter de nouvelles photos (max 5)</label>
                                <input type="file" class="form-control" id="editPhotos" name="photos" multiple accept="image/*">
                                <div class="form-text">Formats acceptés: JPG, PNG, WebP. Max 5MB par photo.</div>
                                <div id="editPhotoPreview" class="d-flex flex-wrap gap-2 mt-2"></div>
                            </div>
                        </form>
                    </div>
                    <div class="modal-footer">
                        <button type="button" class="btn btn-secondary" data-bs-dismiss="modal">Annuler</button>
                        <button type="submit" form="editRealEstateForm" class="btn btn-success">
                            <i class="fas fa-save me-2"></i>Enregistrer les modifications
                        </button>
                    </div>
                </div>
            </div>
        `;
        document.body.appendChild(editModal);
        
        // Initialiser la prévisualisation des photos
        setupEditPhotoPreview();
    }
    
    // Remplir le formulaire avec les données existantes
    document.getElementById('editPropertyId').value = property.id;
    document.getElementById('editTitle').value = property.title || '';
    document.getElementById('editType').value = property.type || '';
    document.getElementById('editPrice').value = property.price || '';
    document.getElementById('editSurface').value = property.surface || '';
    document.getElementById('editRooms').value = property.rooms || '';
    document.getElementById('editAddress').value = property.address || '';
    document.getElementById('editCity').value = property.city || '';
    document.getElementById('editDescription').value = property.description || '';
    document.getElementById('editPhone').value = property.phone || '';
    
    // Afficher les photos existantes
    displayExistingPhotos(property.photos || []);
    
    // Afficher le modal
    const modal = new bootstrap.Modal(editModal);
    modal.show();
}

// 🔥 NOUVELLE FONCTION: AFFICHER PHOTOS EXISTANTES
function displayExistingPhotos(photos) {
    const container = document.getElementById('existingPhotos');
    container.innerHTML = '';
    
    if (!photos || photos.length === 0) {
        container.innerHTML = '<p class="text-muted">Aucune photo</p>';
        return;
    }
    
    photos.forEach((photo, index) => {
        const photoElement = document.createElement('div');
        photoElement.className = 'position-relative';
        photoElement.innerHTML = `
            <img src="${photo}" class="img-thumbnail" style="width: 100px; height: 100px; object-fit: cover;" alt="Photo ${index + 1}">
            <button type="button" class="btn btn-danger btn-sm position-absolute top-0 end-0" onclick="removeExistingPhoto('${photo}', ${index})">
                <i class="fas fa-times"></i>
            </button>
        `;
        container.appendChild(photoElement);
    });
}

// 🔥 NOUVELLE FONCTION: SUPPRIMER PHOTO EXISTANTE
function removeExistingPhoto(photoUrl, index) {
    // Marquer la photo pour suppression
    const propertyId = document.getElementById('editPropertyId').value;
    const removedPhotos = JSON.parse(sessionStorage.getItem('removedPhotos') || '{}');
    if (!removedPhotos[propertyId]) {
        removedPhotos[propertyId] = [];
    }
    removedPhotos[propertyId].push(photoUrl);
    sessionStorage.setItem('removedPhotos', JSON.stringify(removedPhotos));
    
    // Masquer la photo dans l'interface
    const photoElements = document.querySelectorAll('#existingPhotos .position-relative');
    if (photoElements[index]) {
        photoElements[index].style.display = 'none';
    }
}

// 🔥 NOUVELLE FONCTION: PRÉVISUALISATION PHOTOS ÉDITION
function setupEditPhotoPreview() {
    const photoInput = document.getElementById('editPhotos');
    const previewContainer = document.getElementById('editPhotoPreview');
    
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
                    <img src="${e.target.result}" class="img-thumbnail" style="width: 100px; height: 100px; object-fit: cover;" alt="Preview">
                    <button type="button" class="btn btn-danger btn-sm position-absolute top-0 end-0" onclick="removeEditPhotoPreview(this)">
                        <i class="fas fa-times"></i>
                    </button>
                `;
                previewContainer.appendChild(preview);
            };
            
            reader.readAsDataURL(file);
        }
    });
}

// 🔥 NOUVELLE FONCTION: SUPPRIMER PHOTO PREVIEW ÉDITION
function removeEditPhotoPreview(button) {
    const previewItem = button.closest('.photo-preview-item');
    previewItem.remove();
}

// 🔥 NOUVELLE FONCTION: GESTION ÉDITION ANNONCE
async function handleEditRealEstate(event) {
    event.preventDefault();
    
    console.log('💾 Sauvegarde modifications annonce...');
    
    if (!checkAuth()) {
        showAlert('🔐 Session expirée, veuillez vous reconnecter', 'error');
        return;
    }
    
    const form = event.target;
    const formData = new FormData(form);
    const data = Object.fromEntries(formData.entries());
    const propertyId = data.id;
    
    showLoading(true);
    
    try {
        // Récupérer l'annonce existante
        const properties = await btpDB.get('realestate_posts');
        const existingProperty = properties.find(p => p.id == propertyId);
        
        if (!existingProperty) {
            throw new Error('Annonce non trouvée');
        }
        
        // Vérifier les permissions
        const currentUser = authState.currentUser;
        if (existingProperty.userId !== currentUser.id && !authState.isAdmin) {
            throw new Error('Permission refusée');
        }
        
        // Gérer les nouvelles photos
        const newPhotos = await handlePhotoUpload(form);
        
        // Gérer les photos supprimées
        const removedPhotos = JSON.parse(sessionStorage.getItem('removedPhotos') || '{}');
        const photosToRemove = removedPhotos[propertyId] || [];
        let updatedPhotos = existingProperty.photos || [];
        
        // Supprimer les photos marquées pour suppression
        updatedPhotos = updatedPhotos.filter(photo => !photosToRemove.includes(photo));
        
        // Ajouter les nouvelles photos
        updatedPhotos = [...updatedPhotos, ...newPhotos];
        
        const updateData = {
            title: data.title.trim(),
            type: data.type,
            price: parseFloat(data.price),
            surface: data.surface ? parseFloat(data.surface) : null,
            rooms: data.rooms ? parseInt(data.rooms) : null,
            address: data.address.trim(),
            city: data.city ? data.city.trim() : '',
            description: data.description.trim(),
            phone: data.phone.trim(),
            photos: updatedPhotos,
            updatedAt: new Date().toISOString()
        };
        
        console.log('💾 Mise à jour annonce:', updateData);
        
        await btpDB.put('realestate_posts', propertyId, updateData);
        
        // Nettoyer les photos supprimées du sessionStorage
        delete removedPhotos[propertyId];
        sessionStorage.setItem('removedPhotos', JSON.stringify(removedPhotos));
        
        showAlert('✅ Annonce modifiée avec succès', 'success');
        
        // Fermer le modal
        const modal = bootstrap.Modal.getInstance(document.getElementById('editRealEstateModal'));
        if (modal) {
            modal.hide();
        }
        
        // Recharger les annonces
        setTimeout(() => loadRealEstateAnnounces(), 500);
        
    } catch (error) {
        console.error('❌ Erreur modification annonce:', error);
        showAlert('❌ Erreur lors de la modification: ' + error.message, 'error');
    } finally {
        showLoading(false);
    }
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
        const realEstateForm = document.getElementById('realEstateForm');
        if (realEstateForm) {
            realEstateForm.style.display = 'block';
        }
        
        // Cacher les autres formulaires de publication
        const otherForms = document.querySelectorAll('.publish-form');
        otherForms.forEach(form => {
            if (form.id !== 'realEstateForm') {
                form.style.display = 'none';
            }
        });
        
        // Initialiser la prévisualisation des photos
        setupPhotoPreview();
    }, 100);
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
        
        // Vérifier si l'utilisateur peut éditer cette annonce
        const canEdit = authState.currentUser && 
                       (authState.currentUser.id === property.userId || authState.isAdmin);
        
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

// ========== FONCTIONS UTILITAIRES ==========
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

// ========== EXPORT DES FONCTIONS ==========
window.loadRealEstateAnnounces = loadRealEstateAnnounces;
window.filterRealEstate = filterRealEstate;
window.handlePublishRealEstate = handlePublishRealEstate;
window.viewPropertyDetails = viewPropertyDetails;
window.clearRealEstateFilters = clearRealEstateFilters;
window.getPropertyTypeLabel = getPropertyTypeLabel;
window.showPublishRealEstate = showPublishRealEstate;

// 🔥 EXPORT DES NOUVELLES FONCTIONS
window.editRealEstateAnnounce = editRealEstateAnnounce;
window.handleEditRealEstate = handleEditRealEstate;
window.removePhotoPreview = removePhotoPreview;
window.removeEditPhotoPreview = removeEditPhotoPreview;
window.removeExistingPhoto = removeExistingPhoto;
window.setupPhotoPreview = setupPhotoPreview;

console.log('✅ realestate.js CORRIGÉ - Édition annonces + Upload photos IMPLÉMENTÉ');