// ========== FONCTIONS ADMIN ==========
async function loadAdminStats() {
    if (!appState.isAdmin) return;
    
    const users = await btpDB.get('users');
    const marketplace = await btpDB.get('marketplace_posts');
    const realestate = await btpDB.get('realestate_posts');
    const jobs = await btpDB.get('job_posts');
    
    document.getElementById('stats-users').textContent = users.length;
    document.getElementById('stats-marketplace').textContent = marketplace.length;
    document.getElementById('stats-realestate').textContent = realestate.length;
    document.getElementById('stats-jobs').textContent = jobs.length;
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
                <button class="btn btn-sm btn-outline-primary" onclick="editUser(${user.id})">
                    <i class="fas fa-edit"></i>
                </button>
                <button class="btn btn-sm btn-outline-${user.isBlocked ? 'success' : 'danger'}" 
                        onclick="${user.isBlocked ? 'unblockUser' : 'blockUser'}(${user.id})">
                    <i class="fas fa-${user.isBlocked ? 'unlock' : 'lock'}"></i>
                </button>
            </td>
        </tr>`;
    });
    
    tableBody.innerHTML = html || '<tr><td colspan="7" class="text-center text-muted">Aucun utilisateur</td></tr>';
}

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