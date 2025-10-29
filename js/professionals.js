// ========== FONCTIONS PROFESSIONNELS ==========
async function loadProfessionalsAnnounces() {
    const professionals = await btpDB.get('professionals');
    const container = document.getElementById('professionals-container');
    
    if (professionals.length === 0) {
        container.innerHTML = '<div class="col-12 text-center"><p class="text-muted">Aucun professionnel disponible pour le moment</p></div>';
        return;
    }
    
    let html = '';
    professionals.forEach(pro => {
        html += `
        <div class="col-md-6 col-lg-4">
            <div class="card h-100">
                <div class="card-body">
                    <h5 class="card-title">${pro.company}</h5>
                    <p class="card-text text-muted">${pro.description}</p>
                    <div class="mb-2">
                        <span class="badge bg-primary">${pro.specialty}</span>
                        <span class="badge bg-secondary ms-1">${pro.experience}+ ans</span>
                    </div>
                    <div class="d-flex justify-content-between align-items-center">
                        <div>
                            <i class="fas fa-star text-warning"></i>
                            <span class="ms-1">${pro.rating}</span>
                            <small class="text-muted">(${pro.reviewCount} avis)</small>
                        </div>
                        <div>
                            <i class="fas fa-map-marker-alt text-muted"></i>
                            <small class="text-muted">${pro.city}</small>
                        </div>
                    </div>
                </div>
                <div class="card-footer bg-transparent">
                    <button class="btn btn-primary btn-sm w-100" onclick="contactProfessional(${pro.id})">
                        <i class="fas fa-phone me-1"></i>Contacter
                    </button>
                </div>
            </div>
        </div>`;
    });
    
    container.innerHTML = html || '<div class="col-12 text-center"><p class="text-muted">Aucun professionnel disponible pour le moment</p></div>';
}

async function loadProfessionals() {
    // Fonction pour charger les professionnels (utilisée dans l'initialisation)
    await loadProfessionalsAnnounces();
}

async function filterProfessionals() {
    const specialty = document.getElementById('filterSpecialty').value;
    const city = document.getElementById('filterCity').value;
    const experience = document.getElementById('filterExperience').value;
    
    const professionals = await btpDB.get('professionals');
    let filteredProfessionals = professionals.filter(pro => {
        if (specialty && pro.specialty !== specialty) return false;
        if (city && pro.city !== city) return false;
        if (experience && pro.experience < parseInt(experience)) return false;
        return true;
    });
    
    displayProfessionalsPosts(filteredProfessionals);
}

function displayProfessionalsPosts(professionals) {
    const container = document.getElementById('professionals-container');
    
    if (professionals.length === 0) {
        container.innerHTML = '<div class="col-12 text-center"><p class="text-muted">Aucun professionnel trouvé</p></div>';
        return;
    }
    
    let html = '';
    professionals.forEach(pro => {
        html += `
        <div class="col-md-6 col-lg-4">
            <div class="card h-100">
                <div class="card-body">
                    <h5 class="card-title">${pro.company}</h5>
                    <p class="card-text text-muted">${pro.description}</p>
                    <div class="mb-2">
                        <span class="badge bg-primary">${pro.specialty}</span>
                        <span class="badge bg-secondary ms-1">${pro.experience}+ ans</span>
                    </div>
                    <div class="d-flex justify-content-between align-items-center">
                        <div>
                            <i class="fas fa-star text-warning"></i>
                            <span class="ms-1">${pro.rating}</span>
                            <small class="text-muted">(${pro.reviewCount} avis)</small>
                        </div>
                        <div>
                            <i class="fas fa-map-marker-alt text-muted"></i>
                            <small class="text-muted">${pro.city}</small>
                        </div>
                    </div>
                </div>
                <div class="card-footer bg-transparent">
                    <button class="btn btn-primary btn-sm w-100" onclick="contactProfessional(${pro.id})">
                        <i class="fas fa-phone me-1"></i>Contacter
                    </button>
                </div>
            </div>
        </div>`;
    });
    
    container.innerHTML = html;
}

// ========== FONCTIONS DE CONTACT ==========
function contactSeller(itemId, itemType) {
    if (!appState.currentUser) {
        showAlert('🔐 Connectez-vous pour contacter le vendeur', 'warning');
        showLoginModal();
        return;
    }
    
    // Ouvrir la messagerie avec le vendeur
    toggleMessaging();
    showAlert('💬 Messagerie ouverte - Vous pouvez maintenant discuter avec le vendeur', 'info');
}

function contactProfessional(professionalId) {
    if (!appState.currentUser) {
        showAlert('🔐 Connectez-vous pour contacter le professionnel', 'warning');
        showLoginModal();
        return;
    }
    
    toggleMessaging();
    showAlert('💬 Messagerie ouverte - Vous pouvez maintenant discuter avec le professionnel', 'info');
}

function contactFreelancer(freelancerId) {
    if (!appState.currentUser) {
        showAlert('🔐 Connectez-vous pour contacter le freelancer', 'warning');
        showLoginModal();
        return;
    }
    
    toggleMessaging();
    showAlert('💬 Messagerie ouverte - Vous pouvez maintenant discuter avec le freelancer', 'info');
}

function showProfessionalModal() {
    if (!appState.currentUser) {
        showAlert('🔐 Connectez-vous pour devenir professionnel', 'warning');
        showLoginModal();
        return;
    }
    
    showAlert('📋 Formulaire "Devenir Professionnel" - Fonctionnalité en développement avancé', 'info');
}