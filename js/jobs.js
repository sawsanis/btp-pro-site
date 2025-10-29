// ========== FONCTIONS EMPLOI ==========
async function loadJobsAnnounces() {
    const posts = await btpDB.get('job_posts');
    const container = document.getElementById('jobs-container');
    
    if (posts.length === 0) {
        container.innerHTML = '<div class="col-12 text-center"><p class="text-muted">Aucune offre d\'emploi disponible pour le moment</p></div>';
        return;
    }
    
    let html = '';
    posts.forEach(post => {
        if (post.status === ANNOUNCE_STATUS.APPROVED) {
            html += `
            <div class="col-md-6 col-lg-4">
                <div class="card h-100">
                    <div class="card-body">
                        <h5 class="card-title">${post.poste}</h5>
                        <p class="card-text text-muted">${post.description.substring(0, 100)}...</p>
                        <div class="mb-2">
                            <span class="badge bg-warning">${post.contrat}</span>
                            <span class="badge bg-secondary ms-1">${post.ville}</span>
                        </div>
                        <div class="d-flex justify-content-between align-items-center">
                            <div>
                                <strong class="text-primary">${post.salaire}</strong>
                            </div>
                        </div>
                    </div>
                    <div class="card-footer bg-transparent">
                        <button class="btn btn-warning btn-sm w-100" onclick="contactSeller(${post.id}, 'job')">
                            <i class="fas fa-envelope me-1"></i>Postuler
                        </button>
                    </div>
                </div>
            </div>`;
        }
    });
    
    container.innerHTML = html || '<div class="col-12 text-center"><p class="text-muted">Aucune offre d\'emploi disponible pour le moment</p></div>';
}

async function filterJobs() {
    const type = document.getElementById('jobTypeFilter').value;
    const city = document.getElementById('jobCityFilter').value;
    const experience = document.getElementById('jobExperienceFilter').value;
    const sort = document.getElementById('jobSort').value;
    
    const posts = await btpDB.get('job_posts');
    let filteredPosts = posts.filter(post => {
        if (type && post.contrat !== type) return false;
        if (city && post.ville !== city) return false;
        if (experience && post.experience !== experience) return false;
        return post.status === ANNOUNCE_STATUS.APPROVED;
    });
    
    // Trier les résultats
    switch(sort) {
        case 'premium':
            filteredPosts.sort((a, b) => (b.isPremium ? 1 : 0) - (a.isPremium ? 1 : 0));
            break;
        default: // 'newest'
            filteredPosts.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
    }
    
    displayJobsPosts(filteredPosts);
}

function displayJobsPosts(posts) {
    const container = document.getElementById('jobs-container');
    
    if (posts.length === 0) {
        container.innerHTML = '<div class="col-12 text-center"><p class="text-muted">Aucune offre d\'emploi trouvée</p></div>';
        return;
    }
    
    let html = '';
    posts.forEach(post => {
        html += `
        <div class="col-md-6 col-lg-4">
            <div class="card h-100">
                <div class="card-body">
                    <h5 class="card-title">${post.poste}</h5>
                    <p class="card-text text-muted">${post.description.substring(0, 100)}...</p>
                    <div class="mb-2">
                        <span class="badge bg-warning">${post.contrat}</span>
                        <span class="badge bg-secondary ms-1">${post.ville}</span>
                    </div>
                    <div class="d-flex justify-content-between align-items-center">
                        <div>
                            <strong class="text-primary">${post.salaire}</strong>
                        </div>
                    </div>
                </div>
                <div class="card-footer bg-transparent">
                    <button class="btn btn-warning btn-sm w-100" onclick="contactSeller(${post.id}, 'job')">
                        <i class="fas fa-envelope me-1"></i>Postuler
                    </button>
                </div>
            </div>
        </div>`;
    });
    
    container.innerHTML = html;
}

async function handlePublishJob(event) {
    event.preventDefault();
    await handlePublish(event, 'job_posts');
}