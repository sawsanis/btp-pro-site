// ========== ÉTAT DE L'APPLICATION ==========
const appState = {
    currentUser: null,
    currentSection: 'home',
    currentAccountSection: 'profile',
    isAdmin: false,
    theme: 'light',
    currentPage: {
        marketplace: 1,
        realestate: 1,
        jobs: 1,
        freelancers: 1,
        professionals: 1
    }
};

// ========== INITIALISATION ==========
document.addEventListener('DOMContentLoaded', function() {
    initializeApp();
    trackUserVisit();
    setupNavigation();
});

function initializeApp() {
    initializeModals();
    loadMarketplaceCategories();
    loadApprovedAnnounces();
    loadProfessionals();
    loadFreelancers();
    loadAdminStats();
    loadForumTopics();
    
    console.log('✅ Application initialisée !');
}

function initializeModals() {
    loginModal = new bootstrap.Modal(document.getElementById('loginModal'));
    registerModal = new bootstrap.Modal(document.getElementById('registerModal'));
}

// ========== NAVIGATION ==========
function setupNavigation() {
    // Navigation principale
    document.querySelectorAll('.nav-link[data-section]').forEach(link => {
        link.addEventListener('click', function(e) {
            e.preventDefault();
            const section = this.getAttribute('data-section');
            if (section) {
                goToSection(section);
            }
        });
    });
    
    // Navigation footer
    document.querySelectorAll('.footer a[data-section]').forEach(link => {
        link.addEventListener('click', function(e) {
            e.preventDefault();
            const section = this.getAttribute('data-section');
            if (section) {
                goToSection(section);
            }
        });
    });
    
    // Navigation compte utilisateur
    document.querySelectorAll('.account-sidebar .nav-link[data-account-section]').forEach(link => {
        link.addEventListener('click', function(e) {
            e.preventDefault();
            const section = this.getAttribute('data-account-section');
            if (section) {
                showAccountSection(section);
            }
        });
    });
    
    // Navigation dropdown utilisateur
    document.querySelectorAll('.dropdown-item[data-section]').forEach(link => {
        link.addEventListener('click', function(e) {
            e.preventDefault();
            const section = this.getAttribute('data-section');
            if (section) {
                goToSection(section);
            }
        });
    });
}

function goToSection(section) {
    console.log('Navigation vers:', section);
    
    // Vérifier l'accès aux sections privées
    if ((section === 'my_account' || section === 'favorites' || section === 'publish') && !appState.currentUser) {
        showAlert('🔐 Connectez-vous pour accéder à cette section', 'warning');
        showLoginModal();
        return;
    }

    if (section === 'admin' && !appState.isAdmin) {
        showAlert('❌ Accès réservé aux administrateurs', 'error');
        return;
    }

    // Masquer toutes les sections
    document.querySelectorAll('.section-content').forEach(s => {
        s.classList.remove('active');
    });
    
    // Mettre à jour les liens de navigation
    document.querySelectorAll('.nav-link').forEach(link => {
        link.classList.remove('active');
    });
    
    const targetSection = document.getElementById(section + '-section');
    if (targetSection) {
        targetSection.classList.add('active');
        appState.currentSection = section;
        
        // Activer le lien correspondant dans la navigation
        const activeLink = document.querySelector(`.nav-link[data-section="${section}"]`);
        if (activeLink) {
            activeLink.classList.add('active');
        }

        // Actions spécifiques selon la section
        switch(section) {
            case 'my_account':
                loadUserProfile();
                loadUserAnnounces();
                break;
            case 'admin':
                loadAdminStats();
                loadUsersTable();
                break;
            case 'marketplace':
                loadMarketplaceAnnounces();
                break;
            case 'realestate':
                loadRealEstateAnnounces();
                break;
            case 'jobs':
                loadJobsAnnounces();
                break;
            case 'freelancers':
                loadFreelancersAnnounces();
                break;
            case 'professionals':
                loadProfessionalsAnnounces();
                break;
            case 'publish':
                showPublishForm('marketplace');
                break;
            case 'forum-create':
                // Initialiser le formulaire de création de sujet
                break;
        }
    } else {
        console.warn('Section non trouvée:', section);
    }
    
    window.scrollTo({ top: 0, behavior: 'smooth' });
}

function goToPublish() {
    if (!appState.currentUser) {
        showAlert('🔐 Connectez-vous pour publier une annonce', 'warning');
        showLoginModal();
        return;
    }
    goToSection('publish');
}

function checkAuthAndGo(section, type) {
    if (!appState.currentUser) {
        showAlert('🔐 Connectez-vous pour accéder à cette fonctionnalité', 'warning');
        showLoginModal();
        return;
    }
    goToSection(section);
}

function showAccountSection(section) {
    // Masquer toutes les sections
    document.querySelectorAll('.account-section').forEach(s => {
        s.classList.remove('active');
    });
    
    // Désactiver tous les liens
    document.querySelectorAll('.account-sidebar .nav-link').forEach(link => {
        link.classList.remove('active');
    });
    
    // Activer la section sélectionnée
    document.getElementById('account-' + section).classList.add('active');
    
    // Activer le lien correspondant
    document.querySelector(`[data-account-section="${section}"]`).classList.add('active');
    
    appState.currentAccountSection = section;
}

// ========== GESTION DU PROFIL ==========
async function loadUserProfile() {
    if (!appState.currentUser) return;
    
    const user = appState.currentUser;
    
    document.getElementById('profile-fullname').textContent = `${user.prenom} ${user.nom}`;
    document.getElementById('profile-email').textContent = user.email;
    document.getElementById('profile-phone').textContent = user.phone || 'Non renseigné';
    document.getElementById('profile-created').textContent = new Date(user.createdAt).toLocaleDateString('fr-FR');
    document.getElementById('profile-initials').textContent = 
        `${user.prenom.charAt(0)}${user.nom.charAt(0)}`.toUpperCase();
    
    if (user.hasPremium) {
        document.getElementById('premium-status-badge').classList.remove('d-none');
    }
}

function toggleEditProfile() {
    const view = document.getElementById('profile-view');
    const edit = document.getElementById('profile-edit');
    
    if (view.style.display !== 'none') {
        // Passer en mode édition
        view.style.display = 'none';
        edit.style.display = 'block';
        
        // Remplir le formulaire
        document.getElementById('edit-prenom').value = appState.currentUser.prenom;
        document.getElementById('edit-nom').value = appState.currentUser.nom;
        document.getElementById('edit-email').value = appState.currentUser.email;
        document.getElementById('edit-phone').value = appState.currentUser.phone || '';
    } else {
        // Retourner en mode visualisation
        view.style.display = 'block';
        edit.style.display = 'none';
    }
}

async function updateProfile(event) {
    event.preventDefault();
    
    const prenom = document.getElementById('edit-prenom').value;
    const nom = document.getElementById('edit-nom').value;
    const email = document.getElementById('edit-email').value;
    const phone = document.getElementById('edit-phone').value;
    
    try {
        // Mettre à jour l'utilisateur dans la base
        await btpDB.put('users', appState.currentUser.id, {
            prenom,
            nom,
            email,
            phone
        });
        
        // Mettre à jour l'état local
        appState.currentUser.prenom = prenom;
        appState.currentUser.nom = nom;
        appState.currentUser.email = email;
        appState.currentUser.phone = phone;
        
        // Mettre à jour l'UI
        updateUIAfterAuth();
        toggleEditProfile();
        loadUserProfile();
        
        showAlert('✅ Profil mis à jour avec succès', 'success');
    } catch (error) {
        console.error('Erreur mise à jour profil:', error);
        showAlert('❌ Erreur lors de la mise à jour du profil', 'error');
    }
}

async function loadUserAnnounces() {
    if (!appState.currentUser) return;
    
    const collections = ['marketplace_posts', 'realestate_posts', 'job_posts', 'freelancers'];
    let userAnnounces = [];
    
    for (const collection of collections) {
        const items = await btpDB.get(collection);
        const userItems = items.filter(item => item.userId === appState.currentUser.id);
        userAnnounces = userAnnounces.concat(userItems.map(item => ({
            ...item,
            type: collection.replace('_posts', '')
        })));
    }
    
    const container = document.getElementById('user-announces-list');
    
    // Mettre à jour les statistiques
    document.getElementById('stats-total-announces').textContent = userAnnounces.length;
    document.getElementById('stats-active-announces').textContent = 
        userAnnounces.filter(a => a.status === ANNOUNCE_STATUS.APPROVED).length;
    document.getElementById('stats-pending-announces').textContent = 
        userAnnounces.filter(a => a.status === ANNOUNCE_STATUS.PENDING).length;
    document.getElementById('stats-rejected-announces').textContent = 
        userAnnounces.filter(a => a.status === ANNOUNCE_STATUS.REJECTED).length;
    
    // Afficher les annonces
    let html = '';
    
    userAnnounces.forEach(announce => {
        const statusBadge = getStatusBadge(announce.status);
        
        html += `
        <div class="card mb-3">
            <div class="card-body">
                <div class="d-flex justify-content-between align-items-start">
                    <div>
                        <h5 class="card-title">${announce.title || announce.poste}</h5>
                        <p class="card-text text-muted">${announce.description.substring(0, 150)}...</p>
                        <div class="d-flex gap-2">
                            <span class="badge bg-secondary">${announce.type}</span>
                            ${statusBadge}
                            ${announce.isPremium ? '<span class="premium-badge">PREMIUM</span>' : ''}
                        </div>
                    </div>
                    <div class="text-end">
                        <small class="text-muted">${new Date(announce.createdAt).toLocaleDateString('fr-FR')}</small>
                        <div class="mt-2">
                            <button class="btn btn-outline-primary btn-sm me-1" onclick="editAnnounce('${announce.type}', ${announce.id})">
                                <i class="fas fa-edit"></i>
                            </button>
                            <button class="btn btn-outline-danger btn-sm" onclick="deleteAnnounce('${announce.type}', ${announce.id})">
                                <i class="fas fa-trash"></i>
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </div>`;
    });
    
    container.innerHTML = html || '<p class="text-muted text-center">Aucune annonce publiée</p>';
}

// ========== FONCTIONS DE GESTION DES ANNONCES ==========
function loadMarketplaceCategories() {
    const categories = [
        'ciment', 'béton', 'acier', 'bois', 'revetement', 
        'sanitaire', 'electricite', 'outillage', 'peinture', 'autres'
    ];
    
    const categorySelect = document.getElementById('marketplaceCategorySelect');
    const categoryFilter = document.getElementById('marketplaceCategoryFilter');
    
    categories.forEach(category => {
        const option1 = document.createElement('option');
        option1.value = category;
        option1.textContent = category.charAt(0).toUpperCase() + category.slice(1);
        if (categorySelect) categorySelect.appendChild(option1);
        
        const option2 = document.createElement('option');
        option2.value = category;
        option2.textContent = category.charAt(0).toUpperCase() + category.slice(1);
        if (categoryFilter) categoryFilter.appendChild(option2);
    });
}

async function loadApprovedAnnounces() {
    console.log('📦 Chargement des annonces approuvées...');
}

// ========== RECHERCHE GLOBALE ==========
function performGlobalSearch() {
    const searchTerm = document.getElementById('globalSearch').value || 
                     document.getElementById('globalSearchMobile').value;
    
    if (!searchTerm.trim()) {
        showAlert('🔍 Veuillez saisir un terme de recherche', 'warning');
        return;
    }
    
    showLoading(true);
    
    // Recherche dans toutes les collections
    Promise.all([
        btpDB.get('marketplace_posts'),
        btpDB.get('realestate_posts'),
        btpDB.get('job_posts'),
        btpDB.get('freelancers'),
        btpDB.get('professionals')
    ]).then(results => {
        const [marketplace, realestate, jobs, freelancers, professionals] = results;
        
        const allResults = [
            ...marketplace.map(item => ({...item, type: 'marketplace'})),
            ...realestate.map(item => ({...item, type: 'realestate'})),
            ...jobs.map(item => ({...item, type: 'jobs'})),
            ...freelancers.map(item => ({...item, type: 'freelancers'})),
            ...professionals.map(item => ({...item, type: 'professionals'}))
        ];
        
        const filteredResults = allResults.filter(item => {
            const searchableText = Object.values(item).join(' ').toLowerCase();
            return searchableText.includes(searchTerm.toLowerCase());
        });
        
        displaySearchResults(filteredResults, searchTerm);
        showLoading(false);
    });
}

function displaySearchResults(results, searchTerm) {
    let html = '';
    
    if (results.length === 0) {
        html = `
        <div class="col-12">
            <div class="card">
                <div class="card-body text-center">
                    <i class="fas fa-search fa-3x text-muted mb-3"></i>
                    <h4>Aucun résultat trouvé</h4>
                    <p class="text-muted">Aucun élément ne correspond à "${searchTerm}"</p>
                </div>
            </div>
        </div>`;
    } else {
        results.forEach(item => {
            const typeLabels = {
                'marketplace': 'Marketplace',
                'realestate': 'Immobilier',
                'jobs': 'Emploi',
                'freelancers': 'Freelance',
                'professionals': 'Professionnel'
            };
            
            html += `
            <div class="col-md-6 col-lg-4">
                <div class="card h-100">
                    <div class="card-body">
                        <span class="badge bg-primary mb-2">${typeLabels[item.type]}</span>
                        <h5 class="card-title">${item.title || item.poste || item.company}</h5>
                        <p class="card-text text-muted">${item.description?.substring(0, 100)}...</p>
                        <div class="d-flex justify-content-between align-items-center">
                            ${item.price ? `<span class="h6 text-primary mb-0">${typeof item.price === 'number' ? item.price.toLocaleString() : item.price} MAD</span>` : ''}
                            ${item.rating ? `<small><i class="fas fa-star text-warning"></i> ${item.rating}</small>` : ''}
                        </div>
                    </div>
                    <div class="card-footer bg-transparent">
                        <button class="btn btn-primary btn-sm w-100" onclick="goToSection('${item.type}')">
                            Voir détails
                        </button>
                    </div>
                </div>
            </div>`;
        });
    }
    
    // Afficher les résultats dans la section appropriée
    const currentSection = appState.currentSection;
    const container = document.getElementById(`${currentSection}-container`);
    if (container) {
        container.innerHTML = html;
    }
    
    showAlert(`🔍 ${results.length} résultat(s) trouvé(s) pour "${searchTerm}"`, 'success');
}

// ========== FONCTIONS DE GESTION DES FAVORIS ==========
async function toggleFavorite(itemId, itemType) {
    if (!appState.currentUser) {
        showAlert('🔐 Connectez-vous pour ajouter aux favoris', 'warning');
        showLoginModal();
        return;
    }
    
    const favorites = await btpDB.get('favorites');
    const existingFavorite = favorites.find(fav => 
        fav.userId === appState.currentUser.id && 
        fav.itemId === itemId && 
        fav.itemType === itemType
    );
    
    if (existingFavorite) {
        // Supprimer des favoris
        await btpDB.put('favorites', existingFavorite.id, { isActive: false });
        showAlert('❤️ Retiré des favoris', 'success');
    } else {
        // Ajouter aux favoris
        await btpDB.post('favorites', {
            userId: appState.currentUser.id,
            itemId: itemId,
            itemType: itemType,
            isActive: true,
            addedAt: new Date().toISOString()
        });
        showAlert('❤️ Ajouté aux favoris', 'success');
    }
}

// ========== FONCTIONS DE GESTION DES MOTS DE PASSE ==========
async function changePassword(event) {
    event.preventDefault();
    
    const currentPassword = document.getElementById('currentPassword').value;
    const newPassword = document.getElementById('newPassword').value;
    const confirmNewPassword = document.getElementById('confirmNewPassword').value;
    
    if (!currentPassword || !newPassword || !confirmNewPassword) {
        showAlert('❌ Veuillez remplir tous les champs', 'error');
        return;
    }
    
    if (newPassword !== confirmNewPassword) {
        showAlert('❌ Les nouveaux mots de passe ne correspondent pas', 'error');
        return;
    }
    
    if (newPassword.length < 6) {
        showAlert('❌ Le nouveau mot de passe doit contenir au moins 6 caractères', 'error');
        return;
    }
    
    showLoading(true);
    
    try {
        // Vérifier le mot de passe actuel
        const hashedCurrentPassword = btpDB.hashPassword(currentPassword);
        if (hashedCurrentPassword !== appState.currentUser.password) {
            showAlert('❌ Mot de passe actuel incorrect', 'error');
            return;
        }
        
        // Mettre à jour le mot de passe
        await btpDB.put('users', appState.currentUser.id, {
            password: btpDB.hashPassword(newPassword)
        });
        
        // Mettre à jour l'état local
        appState.currentUser.password = btpDB.hashPassword(newPassword);
        
        showAlert('✅ Mot de passe changé avec succès', 'success');
        document.getElementById('changePasswordForm').reset();
        
    } catch (error) {
        console.error('Erreur changement mot de passe:', error);
        showAlert('❌ Erreur lors du changement de mot de passe', 'error');
    } finally {
        showLoading(false);
    }
}

console.log('🚀 BTP Pro Maroc - Application prête !');
console.log(`🌐 Firebase: ${firebaseOnline ? '✅ Connecté' : '❌ Hors ligne - Utilisation localStorage'}`);
// ========== FONCTIONS TEMPORAIRES POUR CORRIGER LES ERREURS ==========
console.log('🔄 Chargement des fonctions temporaires...');

// Fonctions manquantes pour l'initialisation
window.loadFreelancers = async function() {
    console.log('✅ loadFreelancers appelée');
    return true;
};

window.loadProfessionals = async function() {
    console.log('✅ loadProfessionals appelée');
    return true;
};

window.loadAdminStats = async function() {
    console.log('✅ loadAdminStats appelée');
    return true;
};

window.loadForumTopics = async function() {
    console.log('✅ loadForumTopics appelée');
    return true;
};

window.loadMarketplaceAnnounces = async function() {
    console.log('✅ loadMarketplaceAnnounces appelée');
    return true;
};

window.loadRealEstateAnnounces = async function() {
    console.log('✅ loadRealEstateAnnounces appelée');
    return true;
};

window.loadJobsAnnounces = async function() {
    console.log('✅ loadJobsAnnounces appelée');
    return true;
};

window.loadApprovedAnnounces = async function() {
    console.log('✅ loadApprovedAnnounces appelée');
    return true;
};

console.log('✅ Toutes les fonctions temporaires sont chargées');// ========== FONCTIONS TEMPORAIRES POUR CORRIGER LES ERREURS ==========
console.log('🔄 Chargement des fonctions temporaires...');

// Fonctions manquantes pour l'initialisation
window.loadFreelancers = async function() {
    console.log('✅ loadFreelancers appelée');
    return true;
};

window.loadProfessionals = async function() {
    console.log('✅ loadProfessionals appelée');
    return true;
};

window.loadAdminStats = async function() {
    console.log('✅ loadAdminStats appelée');
    return true;
};

window.loadForumTopics = async function() {
    console.log('✅ loadForumTopics appelée');
    return true;
};

window.loadMarketplaceAnnounces = async function() {
    console.log('✅ loadMarketplaceAnnounces appelée');
    return true;
};

window.loadRealEstateAnnounces = async function() {
    console.log('✅ loadRealEstateAnnounces appelée');
    return true;
};

window.loadJobsAnnounces = async function() {
    console.log('✅ loadJobsAnnounces appelée');
    return true;
};

window.loadApprovedAnnounces = async function() {
    console.log('✅ loadApprovedAnnounces appelée');
    return true;
};

console.log('✅ Toutes les fonctions temporaires sont chargées');