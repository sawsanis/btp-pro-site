// ========== FONCTIONS MARKETPLACE ==========
async function loadMarketplaceAnnounces() {
    const posts = await btpDB.get('marketplace_posts');
    const container = document.getElementById('marketplace-container');
    
    if (posts.length === 0) {
        container.innerHTML = '<div class="col-12 text-center"><p class="text-muted">Aucun produit disponible pour le moment</p></div>';
        return;
    }
    
    let html = '';
    posts.forEach(post => {
        if (post.status === ANNOUNCE_STATUS.APPROVED) {
            html += `
            <div class="col-md-6 col-lg-3">
                <div class="card h-100">
                    <div class="position-relative">
                        <img src="https://via.placeholder.com/300x200?text=${encodeURIComponent(post.title)}" 
                             class="card-img-top" alt="${post.title}" style="height: 200px; object-fit: cover;">
                        <button class="favorite-btn" onclick="toggleFavorite(${post.id}, 'marketplace')">
                            <i class="fas fa-heart"></i>
                        </button>
                        ${post.isPremium ? '<span class="premium-badge position-absolute top-0 end-0 m-2">⭐ PREMIUM</span>' : ''}
                    </div>
                    <div class="card-body">
                        <h5 class="card-title">${post.title}</h5>
                        <p class="card-text text-muted">${post.description.substring(0, 100)}...</p>
                        <div class="d-flex justify-content-between align-items-center">
                            <span class="h5 text-primary mb-0">${post.price} MAD</span>
                            <small class="text-muted">${post.unit}</small>
                        </div>
                        <div class="mt-2">
                            <i class="fas fa-map-marker-alt text-muted me-1"></i>
                            <small class="text-muted">${post.city}</small>
                        </div>
                    </div>
                    <div class="card-footer bg-transparent">
                        <button class="btn btn-primary btn-sm w-100" onclick="contactSeller(${post.id}, 'marketplace')">
                            <i class="fas fa-envelope me-1"></i>Contacter
                        </button>
                    </div>
                </div>
            </div>`;
        }
    });
    
    container.innerHTML = html || '<div class="col-12 text-center"><p class="text-muted">Aucun produit disponible pour le moment</p></div>';
}

async function filterMarketplace() {
    const category = document.getElementById('marketplaceCategoryFilter').value;
    const city = document.getElementById('marketplaceCityFilter').value;
    const sort = document.getElementById('marketplaceSort').value;
    
    const posts = await btpDB.get('marketplace_posts');
    let filteredPosts = posts.filter(post => {
        if (category && post.category !== category) return false;
        if (city && post.city !== city) return false;
        return post.status === ANNOUNCE_STATUS.APPROVED;
    });
    
    // Trier les résultats
    switch(sort) {
        case 'price_asc':
            filteredPosts.sort((a, b) => a.price - b.price);
            break;
        case 'price_desc':
            filteredPosts.sort((a, b) => b.price - a.price);
            break;
        case 'premium':
            filteredPosts.sort((a, b) => (b.isPremium ? 1 : 0) - (a.isPremium ? 1 : 0));
            break;
        default: // 'newest'
            filteredPosts.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
    }
    
    displayMarketplacePosts(filteredPosts);
}

function displayMarketplacePosts(posts) {
    const container = document.getElementById('marketplace-container');
    
    if (posts.length === 0) {
        container.innerHTML = '<div class="col-12 text-center"><p class="text-muted">Aucun produit trouvé</p></div>';
        return;
    }
    
    let html = '';
    posts.forEach(post => {
        html += `
        <div class="col-md-6 col-lg-3">
            <div class="card h-100">
                <div class="position-relative">
                    <img src="https://via.placeholder.com/300x200?text=${encodeURIComponent(post.title)}" 
                         class="card-img-top" alt="${post.title}" style="height: 200px; object-fit: cover;">
                    <button class="favorite-btn" onclick="toggleFavorite(${post.id}, 'marketplace')">
                        <i class="fas fa-heart"></i>
                    </button>
                    ${post.isPremium ? '<span class="premium-badge position-absolute top-0 end-0 m-2">⭐ PREMIUM</span>' : ''}
                </div>
                <div class="card-body">
                    <h5 class="card-title">${post.title}</h5>
                    <p class="card-text text-muted">${post.description.substring(0, 100)}...</p>
                    <div class="d-flex justify-content-between align-items-center">
                        <span class="h5 text-primary mb-0">${post.price} MAD</span>
                        <small class="text-muted">${post.unit}</small>
                    </div>
                    <div class="mt-2">
                        <i class="fas fa-map-marker-alt text-muted me-1"></i>
                        <small class="text-muted">${post.city}</small>
                    </div>
                </div>
                <div class="card-footer bg-transparent">
                    <button class="btn btn-primary btn-sm w-100" onclick="contactSeller(${post.id}, 'marketplace')">
                        <i class="fas fa-envelope me-1"></i>Contacter
                    </button>
                </div>
            </div>
        </div>`;
    });
    
    container.innerHTML = html;
}

async function handlePublishMarketplace(event) {
    event.preventDefault();
    await handlePublish(event, 'marketplace_posts');
}

// ========== FONCTIONS DE PUBLICATION ==========
function showPublishForm(type) {
    // Masquer tous les formulaires
    document.querySelectorAll('.publish-form').forEach(form => {
        form.style.display = 'none';
    });
    
    // Afficher le formulaire sélectionné
    document.getElementById(`${type}-form`).style.display = 'block';
    
    // Mettre à jour le titre
    const titles = {
        'marketplace': 'Nouveau produit Marketplace',
        'immobilier': 'Nouvelle annonce Immobilier',
        'emploi': 'Nouvelle offre d\'emploi',
        'freelance': 'Nouveau service Freelance'
    };
    
    document.getElementById('publish-title').textContent = titles[type] || 'Publier une annonce';
    
    // Mettre à jour l'état actif dans la sidebar
    document.querySelectorAll('.list-group-item').forEach(item => {
        item.classList.remove('active');
    });
    document.querySelector(`[onclick="showPublishForm('${type}')"]`).classList.add('active');
}

function showNewAnnounceForm() {
    showPublishForm('marketplace');
}

async function handlePublish(event, collection) {
    if (!appState.currentUser) {
        showAlert('🔐 Connectez-vous pour publier', 'warning');
        return;
    }
    
    const form = event.target;
    const formData = new FormData(form);
    const data = Object.fromEntries(formData.entries());
    
    // Ajouter les informations utilisateur
    data.userId = appState.currentUser.id;
    data.userName = `${appState.currentUser.prenom} ${appState.currentUser.nom}`;
    data.status = ANNOUNCE_STATUS.PENDING;
    data.isPremium = appState.currentUser.hasPremium || false;
    
    showLoading(true);
    
    try {
        await btpDB.post(collection, data);
        showAlert('✅ Annonce publiée avec succès ! Elle sera visible après modération.', 'success');
        form.reset();
        
        // Revenir à la section appropriée
        switch(collection) {
            case 'marketplace_posts':
                goToSection('marketplace');
                break;
            case 'realestate_posts':
                goToSection('realestate');
                break;
            case 'job_posts':
                goToSection('jobs');
                break;
            case 'freelancers':
                goToSection('freelancers');
                break;
        }
    } catch (error) {
        console.error('Erreur publication:', error);
        showAlert('❌ Erreur lors de la publication', 'error');
    } finally {
        showLoading(false);
    }
}

function handlePhotoUpload(input, type) {
    const files = input.files;
    const previewId = `${type}PhotoPreview`;
    const preview = document.getElementById(previewId);
    
    preview.innerHTML = '';
    
    for (let i = 0; i < Math.min(files.length, 5); i++) {
        const file = files[i];
        const reader = new FileReader();
        
        reader.onload = function(e) {
            const previewItem = document.createElement('div');
            previewItem.className = 'photo-preview-item';
            
            previewItem.innerHTML = `
                <img src="${e.target.result}" alt="Preview">
                <button type="button" class="photo-remove" onclick="removePhoto(this)">
                    <i class="fas fa-times"></i>
                </button>
            `;
            
            preview.appendChild(previewItem);
        };
        
        reader.readAsDataURL(file);
    }
}

function removePhoto(button) {
    button.parentElement.remove();
}