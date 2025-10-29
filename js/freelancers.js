// ========== FONCTIONS FREELANCERS ==========
async function loadFreelancersAnnounces() {
    const freelancers = await btpDB.get('freelancers');
    const container = document.getElementById('freelancers-container');
    
    if (freelancers.length === 0) {
        container.innerHTML = '<div class="col-12 text-center"><p class="text-muted">Aucun freelancer disponible pour le moment</p></div>';
        return;
    }
    
    let html = '';
    freelancers.forEach(freelancer => {
        if (freelancer.status === ANNOUNCE_STATUS.APPROVED) {
            html += `
            <div class="col-md-6 col-lg-4">
                <div class="card h-100">
                    <div class="card-body">
                        <h5 class="card-title">${freelancer.title}</h5>
                        <p class="card-text text-muted">${freelancer.description.substring(0, 100)}...</p>
                        <div class="mb-2">
                            <span class="badge bg-info">${freelancer.specialty}</span>
                            <span class="badge bg-secondary ms-1">${freelancer.experience}</span>
                            ${freelancer.isPremium ? '<span class="premium-badge ms-1">PREMIUM</span>' : ''}
                        </div>
                        <div class="d-flex justify-content-between align-items-center">
                            <div>
                                <i class="fas fa-star text-warning"></i>
                                <span class="ms-1">${freelancer.rating}</span>
                                <small class="text-muted">(${freelancer.reviewCount} avis)</small>
                            </div>
                            <div>
                                <strong class="text-primary">${freelancer.tarif}</strong>
                            </div>
                        </div>
                    </div>
                    <div class="card-footer bg-transparent">
                        <button class="btn btn-info btn-sm w-100" onclick="contactFreelancer(${freelancer.id})">
                            <i class="fas fa-envelope me-1"></i>Contacter
                        </button>
                    </div>
                </div>
            </div>`;
        }
    });
    
    container.innerHTML = html || '<div class="col-12 text-center"><p class="text-muted">Aucun freelancer disponible pour le moment</p></div>';
}

async function filterFreelancers() {
    const specialty = document.getElementById('freelancerSpecialtyFilter').value;
    const city = document.getElementById('freelancerCityFilter').value;
    const sort = document.getElementById('freelancerSort').value;
    
    const freelancers = await btpDB.get('freelancers');
    let filteredFreelancers = freelancers.filter(freelancer => {
        if (specialty && freelancer.specialty !== specialty) return false;
        if (city && freelancer.ville !== city) return false;
        return freelancer.status === ANNOUNCE_STATUS.APPROVED;
    });
    
    // Trier les résultats
    switch(sort) {
        case 'rating':
            filteredFreelancers.sort((a, b) => b.rating - a.rating);
            break;
        case 'premium':
            filteredFreelancers.sort((a, b) => (b.isPremium ? 1 : 0) - (a.isPremium ? 1 : 0));
            break;
        default: // 'newest'
            filteredFreelancers.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
    }
    
    displayFreelancersPosts(filteredFreelancers);
}

function displayFreelancersPosts(freelancers) {
    const container = document.getElementById('freelancers-container');
    
    if (freelancers.length === 0) {
        container.innerHTML = '<div class="col-12 text-center"><p class="text-muted">Aucun freelancer trouvé</p></div>';
        return;
    }
    
    let html = '';
    freelancers.forEach(freelancer => {
        html += `
        <div class="col-md-6 col-lg-4">
            <div class="card h-100">
                <div class="card-body">
                    <h5 class="card-title">${freelancer.title}</h5>
                    <p class="card-text text-muted">${freelancer.description.substring(0, 100)}...</p>
                    <div class="mb-2">
                        <span class="badge bg-info">${freelancer.specialty}</span>
                        <span class="badge bg-secondary ms-1">${freelancer.experience}</span>
                        ${freelancer.isPremium ? '<span class="premium-badge ms-1">PREMIUM</span>' : ''}
                    </div>
                    <div class="d-flex justify-content-between align-items-center">
                        <div>
                            <i class="fas fa-star text-warning"></i>
                            <span class="ms-1">${freelancer.rating}</span>
                            <small class="text-muted">(${freelancer.reviewCount} avis)</small>
                        </div>
                        <div>
                            <strong class="text-primary">${freelancer.tarif}</strong>
                        </div>
                    </div>
                </div>
                <div class="card-footer bg-transparent">
                    <button class="btn btn-info btn-sm w-100" onclick="contactFreelancer(${freelancer.id})">
                        <i class="fas fa-envelope me-1"></i>Contacter
                    </button>
                </div>
            </div>
        </div>`;
    });
    
    container.innerHTML = html;
}

async function handlePublishFreelance(event) {
    event.preventDefault();
    await handlePublish(event, 'freelancers');
}