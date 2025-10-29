// ========== FONCTIONS ADMIN ==========
async function loadAdminStats() {
    if (!appState.isAdmin) return;
    
    const users = await btpDB.get('users');
    const marketplace = await btpDB.get('marketplace_posts');
    const realestate = await btpDB.get('realestate_posts');
    const jobs = await btpDB.get('job_posts');
    
    // Compter les annonces en attente de modération
    const pendingMarketplace = marketplace.filter(post => post.status === 'pending');
    const pendingRealestate = realestate.filter(post => post.status === 'pending');
    const pendingJobs = jobs.filter(post => post.status === 'pending');
    const totalPending = pendingMarketplace.length + pendingRealestate.length + pendingJobs.length;
    
    document.getElementById('stats-users').textContent = users.length;
    document.getElementById('stats-marketplace').textContent = marketplace.length;
    document.getElementById('stats-realestate').textContent = realestate.length;
    document.getElementById('stats-jobs').textContent = jobs.length;
    document.getElementById('stats-pending').textContent = totalPending;
}

async function loadUsersTable() {
    if (!appState.isAdmin) return;
    
    const users = await btpDB.get('users');
    const tableBody = document.getElementById('users-table-body');
    
    let html = '';
    users.forEach(user => {
        const statusBadge = user.isBlocked ? 
            '<span class="badge bg-danger">Bloqué</span>' : 
            '<span class="badge bg-success">Actif</span>';
        
        const premiumBadge = user.hasPremium ? 
            '<span class="premium-badge">PREMIUM</span>' : '';
        
        html += `
        <tr>
            <td>
                <strong>${user.prenom} ${user.nom}</strong>
                ${premiumBadge}
                ${user.role === 'admin' ? '<span class="admin-badge">ADMIN</span>' : ''}
            </td>
            <td>
                ${user.email}<br>
                <small class="text-muted">${user.phone || 'Non renseigné'}</small>
            </td>
            <td>${statusBadge}</td>
            <td>${new Date(user.createdAt).toLocaleDateString('fr-FR')}</td>
            <td>${user.lastVisit ? new Date(user.lastVisit).toLocaleDateString('fr-FR') : 'Jamais'}</td>
            <td>${user.visitCount || 0}</td>
            <td>
                <button class="btn btn-sm btn-outline-primary" onclick="editUser('${user.id}')">
                    <i class="fas fa-edit"></i>
                </button>
                <button class="btn btn-sm btn-outline-${user.isBlocked ? 'success' : 'danger'}" 
                        onclick="${user.isBlocked ? 'unblockUser' : 'blockUser'}('${user.id}')">
                    <i class="fas fa-${user.isBlocked ? 'unlock' : 'lock'}"></i>
                </button>
            </td>
        </tr>`;
    });
    
    tableBody.innerHTML = html || '<tr><td colspan="7" class="text-center text-muted">Aucun utilisateur</td></tr>';
}

// ========== MODÉRATION DES ANNONCES ==========
async function loadPendingModeration() {
    if (!appState.isAdmin) return;
    
    try {
        showLoading('moderation-ads-container');
        
        // Récupérer toutes les annonces
        const [marketplace, realestate, jobs] = await Promise.all([
            btpDB.get('marketplace_posts'),
            btpDB.get('realestate_posts'),
            btpDB.get('job_posts')
        ]);
        
        // Filtrer seulement les annonces en attente de modération
        const pendingMarketplace = marketplace.filter(post => post.status === 'pending' || !post.status);
        const pendingRealestate = realestate.filter(post => post.status === 'pending' || !post.status);
        const pendingJobs = jobs.filter(post => post.status === 'pending' || !post.status);
        
        const allPendingAds = [
            ...pendingMarketplace.map(ad => ({ ...ad, type: 'marketplace' })),
            ...pendingRealestate.map(ad => ({ ...ad, type: 'realestate' })),
            ...pendingJobs.map(ad => ({ ...ad, type: 'jobs' }))
        ];
        
        displayPendingAds(allPendingAds);
        
    } catch (error) {
        console.error('Erreur chargement modération:', error);
        showAlert('❌ Erreur lors du chargement des annonces', 'error');
        document.getElementById('moderation-ads-container').innerHTML = `
            <div class="alert alert-danger">Erreur lors du chargement des annonces</div>
        `;
    }
}

function displayPendingAds(ads) {
    const container = document.getElementById('moderation-ads-container');
    
    if (!ads || ads.length === 0) {
        container.innerHTML = `
            <div class="text-center py-5">
                <i class="fas fa-check-circle fa-3x text-success mb-3"></i>
                <h5 class="text-muted">Aucune annonce en attente de modération</h5>
                <p class="text-muted">Toutes les annonces ont été modérées</p>
            </div>
        `;
        return;
    }
    
    let html = `
        <div class="row">
            <div class="col-12">
                <div class="alert alert-info">
                    <i class="fas fa-info-circle"></i>
                    ${ads.length} annonce(s) en attente de modération
                </div>
            </div>
        </div>
        <div class="row">
    `;
    
    ads.forEach((ad, index) => {
        const typeLabel = getAdTypeLabel(ad.type);
        const createdAt = ad.createdAt ? new Date(ad.createdAt).toLocaleDateString('fr-FR') : 'Date inconnue';
        
        html += `
        <div class="col-md-6 col-lg-4 mb-4">
            <div class="card moderation-card">
                <div class="card-header d-flex justify-content-between align-items-center">
                    <span class="badge bg-warning">En attente</span>
                    <small class="text-muted">${typeLabel}</small>
                </div>
                <div class="card-body">
                    <h6 class="card-title">${ad.title || 'Sans titre'}</h6>
                    
                    ${ad.description ? `<p class="card-text small text-muted">${ad.description.substring(0, 100)}...</p>` : ''}
                    
                    ${ad.price ? `<p class="fw-bold text-primary">${formatPrice(ad.price)}</p>` : ''}
                    
                    ${ad.category ? `<p class="small"><strong>Catégorie:</strong> ${ad.category}</p>` : ''}
                    
                    ${ad.location ? `<p class="small"><strong>Lieu:</strong> ${ad.location}</p>` : ''}
                    
                    <div class="ad-meta">
                        <small class="text-muted">Publié le: ${createdAt}</small>
                        ${ad.authorName ? `<br><small class="text-muted">Par: ${ad.authorName}</small>` : ''}
                    </div>
                </div>
                <div class="card-footer">
                    <div class="d-flex gap-2 justify-content-between">
                        <button class="btn btn-success btn-sm flex-fill" onclick="approveAd('${ad.id}', '${ad.type}')">
                            <i class="fas fa-check"></i> Approuver
                        </button>
                        <button class="btn btn-danger btn-sm flex-fill" onclick="rejectAd('${ad.id}', '${ad.type}')">
                            <i class="fas fa-times"></i> Rejeter
                        </button>
                        <button class="btn btn-outline-secondary btn-sm" onclick="viewAdDetails('${ad.id}', '${ad.type}')">
                            <i class="fas fa-eye"></i>
                        </button>
                    </div>
                </div>
            </div>
        </div>
        `;
    });
    
    html += `</div>`;
    container.innerHTML = html;
}

function getAdTypeLabel(type) {
    const labels = {
        'marketplace': 'Marketplace',
        'realestate': 'Immobilier',
        'jobs': 'Emploi'
    };
    return labels[type] || type;
}

function formatPrice(price) {
    if (typeof price === 'number') {
        return new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'EUR' }).format(price);
    }
    return price;
}

async function approveAd(adId, adType) {
    if (!appState.isAdmin || !confirm('Êtes-vous sûr de vouloir approuver cette annonce ?')) {
        return;
    }
    
    try {
        const collectionName = getCollectionName(adType);
        await btpDB.put(collectionName, adId, { 
            status: 'approved',
            moderatedAt: new Date().toISOString(),
            moderatedBy: appState.currentUser.id
        });
        
        showAlert('✅ Annonce approuvée avec succès', 'success');
        loadPendingModeration();
        loadAdminStats(); // Mettre à jour les stats
        
    } catch (error) {
        console.error('Erreur approbation annonce:', error);
        showAlert('❌ Erreur lors de l\'approbation', 'error');
    }
}

async function rejectAd(adId, adType) {
    const reason = prompt('Veuillez saisir la raison du rejet :');
    if (!reason || !appState.isAdmin) return;
    
    try {
        const collectionName = getCollectionName(adType);
        await btpDB.put(collectionName, adId, { 
            status: 'rejected',
            moderationReason: reason,
            moderatedAt: new Date().toISOString(),
            moderatedBy: appState.currentUser.id
        });
        
        showAlert('✅ Annonce rejetée avec succès', 'success');
        loadPendingModeration();
        loadAdminStats(); // Mettre à jour les stats
        
    } catch (error) {
        console.error('Erreur rejet annonce:', error);
        showAlert('❌ Erreur lors du rejet', 'error');
    }
}

function viewAdDetails(adId, adType) {
    showAlert(`🔍 Détails de l'annonce ${adId} (${adType}) - Fonctionnalité en développement`, 'info');
}

function getCollectionName(adType) {
    const collections = {
        'marketplace': 'marketplace_posts',
        'realestate': 'realestate_posts',
        'jobs': 'job_posts'
    };
    return collections[adType] || adType;
}

// ========== GESTION DES UTILISATEURS ==========
async function blockUser(userId) {
    if (!appState.isAdmin) return;
    
    try {
        await btpDB.put('users', userId, { isBlocked: true });
        showAlert('✅ Utilisateur bloqué avec succès', 'success');
        loadUsersTable();
    } catch (error) {
        console.error('Erreur blocage utilisateur:', error);
        showAlert('❌ Erreur lors du blocage', 'error');
    }
}

async function unblockUser(userId) {
    if (!appState.isAdmin) return;
    
    try {
        await btpDB.put('users', userId, { isBlocked: false });
        showAlert('✅ Utilisateur débloqué avec succès', 'success');
        loadUsersTable();
    } catch (error) {
        console.error('Erreur déblocage utilisateur:', error);
        showAlert('❌ Erreur lors du déblocage', 'error');
    }
}

function editUser(userId) {
    showAlert(`👤 Édition de l'utilisateur ${userId} - Fonctionnalité en développement`, 'info');
}

function editAdsenseSlot(slotId) {
    showAlert(`📢 Édition du slot publicitaire ${slotId} - Fonctionnalité en développement`, 'info');
}

// ========== UTILITAIRES ==========
function showLoading(containerId) {
    const container = document.getElementById(containerId);
    if (container) {
        container.innerHTML = `
            <div class="text-center py-4">
                <div class="spinner-border text-primary" role="status">
                    <span class="visually-hidden">Chargement...</span>
                </div>
                <p class="mt-2 text-muted">Chargement des annonces...</p>
            </div>
        `;
    }
}

// Initialisation de l'admin
document.addEventListener('DOMContentLoaded', function() {
    // Charger les stats et la modération quand la page admin est active
    if (window.location.hash === '#admin' && appState.isAdmin) {
        setTimeout(() => {
            loadAdminStats();
            loadUsersTable();
            loadPendingModeration();
        }, 100);
    }
});