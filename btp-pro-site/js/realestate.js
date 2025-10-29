// ========== FONCTIONS IMMOBILIER ==========
async function loadRealEstateAnnounces() {
    const posts = await btpDB.get('realestate_posts');
    const container = document.getElementById('realestate-container');
    
    if (posts.length === 0) {
        container.innerHTML = '<div class="col-12 text-center"><p class="text-muted">Aucun bien immobilier disponible pour le moment</p></div>';
        return;
    }
    
    let html = '';
    posts.forEach(post => {
        if (post.status === ANNOUNCE_STATUS.APPROVED) {
            html += `
            <div class="col-md-6 col-lg-4">
                <div class="card h-100">
                    <div class="position-relative">
                        <img src="https://via.placeholder.com/300x200?text=${encodeURIComponent(post.title)}" 
                             class="card-img-top" alt="${post.title}" style="height: 200px; object-fit: cover;">
                        <button class="favorite-btn" onclick="toggleFavorite(${post.id}, 'realestate')">
                            <i class="fas fa-heart"></i>
                        </button>
                        ${post.isPremium ? '<span class="premium-badge position-absolute top-0 end-0 m-2">⭐ PREMIUM</span>' : ''}
                    </div>
                    <div class="card-body">
                        <h5 class="card-title">${post.title}</h5>
                        <p class="card-text text-muted">${post.description.substring(0, 100)}...</p>
                        <div class="d-flex justify-content-between align-items-center">
                            <span class="h5 text-primary mb-0">${post.price.toLocaleString()} MAD</span>
                        </div>
                        <div class="mt-2">
                            <i class="fas fa-map-marker-alt text-muted me-1"></i>
                            <small class="text-muted">${post.address}</small>
                        </div>
                    </div>
                    <div class="card-footer bg-transparent">
                        <button class="btn btn-success btn-sm w-100" onclick="contactSeller(${post.id}, 'realestate')">
                            <i class="fas fa-envelope me-1"></i>Contacter
                        </button>
                    </div>
                </div>
            </div>`;
        }
    });
    
    container.innerHTML = html || '<div class="col-12 text-center"><p class="text-muted">Aucun bien immobilier disponible pour le moment</p></div>';
}

async function filterRealEstate() {
    const type = document.getElementById('realestateTypeFilter').value;
    const city = document.getElementById('realestateCityFilter').value;
    const price = document.getElementById('realestatePriceFilter').value;
    const sort = document.getElementById('realestateSort').value;
    
    const posts = await btpDB.get('realestate_posts');
    let filteredPosts = posts.filter(post => {
        if (type && post.type !== type) return false;
        if (city && post.city !== city) return false;
        if (price) {
            const [min, max] = price.split('-');
            if (max === '+') {
                if (post.price < parseInt(min)) return false;
            } else {
                if (post.price < parseInt(min) || post.price > parseInt(max)) return false;
            }
        }
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
    
    displayRealEstatePosts(filteredPosts);
}

function displayRealEstatePosts(posts) {
    const container = document.getElementById('realestate-container');
    
    if (posts.length === 0) {
        container.innerHTML = '<div class="col-12 text-center"><p class="text-muted">Aucun bien immobilier trouvé</p></div>';
        return;
    }
    
    let html = '';
    posts.forEach(post => {
        html += `
        <div class="col-md-6 col-lg-4">
            <div class="card h-100">
                <div class="position-relative">
                    <img src="https://via.placeholder.com/300x200?text=${encodeURIComponent(post.title)}" 
                         class="card-img-top" alt="${post.title}" style="height: 200px; object-fit: cover;">
                    <button class="favorite-btn" onclick="toggleFavorite(${post.id}, 'realestate')">
                        <i class="fas fa-heart"></i>
                    </button>
                    ${post.isPremium ? '<span class="premium-badge position-absolute top-0 end-0 m-2">⭐ PREMIUM</span>' : ''}
                </div>
                <div class="card-body">
                    <h5 class="card-title">${post.title}</h5>
                    <p class="card-text text-muted">${post.description.substring(0, 100)}...</p>
                    <div class="d-flex justify-content-between align-items-center">
                        <span class="h5 text-primary mb-0">${post.price.toLocaleString()} MAD</span>
                    </div>
                    <div class="mt-2">
                        <i class="fas fa-map-marker-alt text-muted me-1"></i>
                        <small class="text-muted">${post.address}</small>
                    </div>
                </div>
                <div class="card-footer bg-transparent">
                    <button class="btn btn-success btn-sm w-100" onclick="contactSeller(${post.id}, 'realestate')">
                        <i class="fas fa-envelope me-1"></i>Contacter
                    </button>
                </div>
            </div>
        </div>`;
    });
    
    container.innerHTML = html;
}

async function handlePublishRealEstate(event) {
    event.preventDefault();
    await handlePublish(event, 'realestate_posts');
}