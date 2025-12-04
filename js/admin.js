// ========== FONCTIONS ADMIN ==========
async function loadAdminStats() {
    console.log('🔍 Vérification accès admin...', {
        currentUser: !!authState.currentUser,
        isAdmin: authState.isAdmin
    });
    
    // VÉRIFICATION RENFORCÉE DE LA SÉCURITÉ
    if (!authState.currentUser) {
        console.warn('❌ Accès admin refusé - Utilisateur non connecté');
        showAlert('❌ Vous devez être connecté pour accéder à l\'administration', 'error');
        setTimeout(() => goToSection('home'), 1000);
        return;
    }
    
    if (!authState.isAdmin) {
        console.warn('❌ Accès admin refusé - Pas administrateur');
        showAlert('❌ Accès réservé aux administrateurs', 'error');
        setTimeout(() => goToSection('home'), 1000);
        return;
    }
    
    console.log('📊 Chargement des statistiques admin...');
    
    try {
        const [users, marketplace, realestate, jobs, freelancers, professionals, jobApplications] = await Promise.all([
            btpDB.get('users'),
            btpDB.get('marketplace_posts'),
            btpDB.get('realestate_posts'),
            btpDB.get('job_posts'),
            btpDB.get('freelancers'),
            btpDB.get('professionals'),
            btpDB.get('job_applications')
        ]);
        
        // Compter les annonces en attente de modération
        const pendingMarketplace = marketplace.filter(post => post.status === 'en_attente');
        const pendingRealestate = realestate.filter(post => post.status === 'en_attente');
        const pendingJobs = jobs.filter(post => post.status === 'en_attente');
        const pendingFreelancers = freelancers.filter(post => post.status === 'en_attente');
        const pendingProfessionals = professionals.filter(post => post.status === 'en_attente');
        
        const totalPending = pendingMarketplace.length + pendingRealestate.length + pendingJobs.length + pendingFreelancers.length + pendingProfessionals.length;
        
        // Mettre à jour l'interface avec les statistiques
        updateStatsElement('stats-users', users.length);
        updateStatsElement('stats-marketplace', marketplace.length);
        updateStatsElement('stats-realestate', realestate.length);
        updateStatsElement('stats-jobs', jobs.length);
        updateStatsElement('stats-freelancers', freelancers.length);
        updateStatsElement('stats-professionals', professionals.length);
        updateStatsElement('stats-pending', totalPending);
        updateStatsElement('stats-applications', jobApplications.length);
        
        console.log(`✅ Statistiques chargées: ${users.length} users, ${marketplace.length} marketplace, ${realestate.length} immobilier, ${jobs.length} emplois, ${freelancers.length} freelancers, ${professionals.length} professionnels, ${totalPending} en attente, ${jobApplications.length} candidatures`);
        
    } catch (error) {
        console.error('❌ Erreur chargement stats admin:', error);
        showAlert('❌ Erreur lors du chargement des statistiques', 'error');
    }
}

function updateStatsElement(elementId, value) {
    const element = document.getElementById(elementId);
    if (element) {
        // Animation du compteur
        animateCounter(element, value);
    } else {
        console.warn(`❌ Élément stats non trouvé: ${elementId}`);
    }
}

function animateCounter(element, targetValue) {
    const duration = 1000; // 1 seconde
    const stepTime = 50;
    const steps = duration / stepTime;
    const increment = targetValue / steps;
    let currentValue = 0;
    
    const timer = setInterval(() => {
        currentValue += increment;
        if (currentValue >= targetValue) {
            element.textContent = targetValue;
            clearInterval(timer);
        } else {
            element.textContent = Math.floor(currentValue);
        }
    }, stepTime);
}

async function loadUsersTable() {
    if (!checkAdminAccess()) return;
    
    console.log('👥 Chargement du tableau des utilisateurs...');
    
    try {
        const users = await btpDB.get('users');
        const tableBody = document.getElementById('users-table-body');
        
        if (!tableBody) {
            console.warn('❌ Tableau des utilisateurs non trouvé');
            return;
        }
        
        let html = '';
        
        if (users.length === 0) {
            html = '<tr><td colspan="7" class="text-center text-muted py-4">Aucun utilisateur inscrit</td></tr>';
        } else {
            users.forEach(user => {
                // CORRECTION : Gestion sécurisée des données utilisateur
                const prenom = user.prenom || 'Non renseigné';
                const nom = user.nom || 'Non renseigné';
                const email = user.email || 'Non renseigné';
                const phone = user.phone || '';
                
                const statusBadge = user.isBlocked ? 
                    '<span class="badge bg-danger">🚫 Bloqué</span>' : 
                    '<span class="badge bg-success">✅ Actif</span>';
                
                const premiumBadge = user.hasPremium ? 
                    '<span class="badge bg-warning ms-1">⭐ PREMIUM</span>' : '';
                
                const adminBadge = user.role === 'admin' ? '<span class="badge bg-primary ms-1">👑 ADMIN</span>' : '';
                
                const lastVisit = user.lastVisit ? 
                    new Date(user.lastVisit).toLocaleDateString('fr-FR') : 
                    '<span class="text-muted">Jamais</span>';
                
                const registrationDate = user.createdAt ? 
                    new Date(user.createdAt).toLocaleDateString('fr-FR') : 
                    'Date inconnue';
                
                html += `
                <tr>
                    <td>
                        <div class="d-flex align-items-center">
                            <div class="user-avatar-small me-2">
                                <div style="width: 32px; height: 32px; border-radius: 50%; background: var(--primary-color); color: white; display: flex; align-items: center; justify-content: center; font-weight: bold; font-size: 0.8rem;">
                                    ${(prenom[0] || '') + (nom[0] || '')}
                                </div>
                            </div>
                            <div>
                                <strong class="d-block">${prenom} ${nom}</strong>
                                <small class="text-muted">ID: ${user.id}</small>
                            </div>
                        </div>
                        ${premiumBadge}
                        ${adminBadge}
                    </td>
                    <td>
                        <div>
                            <strong>${email}</strong>
                            ${phone ? `<br><small class="text-muted">📞 ${phone}</small>` : ''}
                        </div>
                    </td>
                    <td>${statusBadge}</td>
                    <td>
                        <small>${registrationDate}</small>
                    </td>
                    <td>
                        <small>${lastVisit}</small>
                    </td>
                    <td>
                        <span class="badge bg-info">${user.visitCount || 0}</span>
                    </td>
                    <td>
                        <div class="btn-group btn-group-sm">
                            <button class="btn btn-outline-primary" onclick="editUser('${user.id}')" title="Modifier">
                                <i class="fas fa-edit"></i>
                            </button>
                            <button class="btn btn-outline-${user.isBlocked ? 'success' : 'danger'}" 
                                    onclick="${user.isBlocked ? 'unblockUser' : 'blockUser'}('${user.id}')"
                                    title="${user.isBlocked ? 'Débloquer' : 'Bloquer'}">
                                <i class="fas fa-${user.isBlocked ? 'unlock' : 'lock'}"></i>
                            </button>
                            ${user.role !== 'admin' ? `
                            <button class="btn btn-outline-info" onclick="makeAdmin('${user.id}')" title="Rendre admin">
                                <i class="fas fa-user-shield"></i>
                            </button>
                            ` : ''}
                            <button class="btn btn-outline-warning" onclick="viewUserDetails('${user.id}')" title="Détails">
                                <i class="fas fa-eye"></i>
                            </button>
                            <!-- BOUTON DE SUPPRESSION AJOUTÉ -->
                            <button class="btn btn-outline-danger" onclick="showDeleteUserModal('${user.id}')" title="Supprimer définitivement">
                                <i class="fas fa-trash"></i>
                            </button>
                        </div>
                    </td>
                </tr>`;
            });
        }
        
        tableBody.innerHTML = html;
        console.log(`✅ ${users.length} utilisateurs chargés dans le tableau`);
        
    } catch (error) {
        console.error('❌ Erreur chargement utilisateurs:', error);
        const tableBody = document.getElementById('users-table-body');
        if (tableBody) {
            tableBody.innerHTML = `
                <tr>
                    <td colspan="7" class="text-center text-danger py-4">
                        <i class="fas fa-exclamation-triangle me-2"></i>
                        Erreur lors du chargement des utilisateurs
                        <br>
                        <button class="btn btn-sm btn-primary mt-2" onclick="loadUsersTable()">
                            <i class="fas fa-redo me-1"></i>Réessayer
                        </button>
                    </td>
                </tr>`;
        }
    }
}

// ========== SUPPRESSION D'UTILISATEUR ==========
async function deleteUser(userId) {
    if (!checkAdminAccess()) return;
    
    // Empêcher la suppression de soi-même
    if (userId === authState.currentUser.id) {
        showAlert('❌ Vous ne pouvez pas supprimer votre propre compte', 'error');
        return;
    }
    
    // Demander confirmation
    if (!confirm('⚠️ ÊTES-VOUS ABSOLUMENT SÛR DE VOULOIR SUPPRIMER CET UTILISATEUR ?\n\n' +
                 'Cette action est IRREVERSIBLE et supprimera :\n' +
                 '• Toutes les annonces de l\'utilisateur\n' +
                 '• Toutes ses candidatures\n' +
                 '• Son compte définitivement\n\n' +
                 'Veuillez confirmer cette suppression définitive.')) {
        return;
    }
    
    console.log(`🗑️ Suppression utilisateur ${userId} demandée`);
    
    showLoading(true);
    
    try {
        // 1. Récupérer les informations de l'utilisateur pour les logs
        const users = await btpDB.get('users');
        const userToDelete = users.find(u => u.id == userId);
        
        if (!userToDelete) {
            showAlert('❌ Utilisateur non trouvé', 'error');
            return;
        }
        
        const userName = `${userToDelete.prenom || ''} ${userToDelete.nom || ''}`.trim() || 'Utilisateur inconnu';
        
        // 2. Demander un mot de passe de confirmation pour sécurité supplémentaire
        const adminPassword = prompt(`Veuillez saisir votre mot de passe ADMINISTRATEUR pour confirmer la suppression de "${userName}" :\n(Cette action ne peut pas être annulée)`);
        
        if (!adminPassword) {
            showAlert('❌ Suppression annulée - Mot de passe requis', 'warning');
            return;
        }
        
        // Vérifier le mot de passe admin
        const isPasswordValid = await verifyAdminPassword(adminPassword);
        if (!isPasswordValid) {
            showAlert('❌ Mot de passe administrateur incorrect', 'error');
            return;
        }
        
        console.log(`🗑️ Suppression de l'utilisateur ${userName} (ID: ${userId})`);
        
        // 3. Supprimer toutes les données de l'utilisateur
        await deleteAllUserData(userId);
        
        // 4. Supprimer l'utilisateur de la base
        const success = await btpDB.delete('users', userId);
        
        if (success) {
            // 5. Journaliser l'action
            await logUserDeletion(userToDelete, authState.currentUser);
            
            showAlert(`✅ Utilisateur "${userName}" supprimé définitivement`, 'success');
            
            // 6. Recharger le tableau
            setTimeout(() => {
                loadUsersTable();
                loadAdminStats();
            }, 1000);
            
        } else {
            showAlert('❌ Erreur lors de la suppression de l\'utilisateur', 'error');
        }
        
    } catch (error) {
        console.error('❌ Erreur suppression utilisateur:', error);
        showAlert('❌ Erreur lors de la suppression de l\'utilisateur', 'error');
    } finally {
        showLoading(false);
    }
}

// Fonction pour vérifier le mot de passe admin
async function verifyAdminPassword(password) {
    try {
        const users = await btpDB.get('users');
        const currentAdmin = users.find(u => u.id == authState.currentUser.id);
        
        if (currentAdmin && currentAdmin.password === password) {
            return true;
        }
        return false;
    } catch (error) {
        console.error('Erreur vérification mot de passe:', error);
        return false;
    }
}

// Supprimer toutes les données associées à un utilisateur
async function deleteAllUserData(userId) {
    try {
        console.log(`🗑️ Nettoyage des données utilisateur ${userId}...`);
        
        // Liste de toutes les collections où l'utilisateur peut avoir des données
        const collections = [
            'marketplace_posts',
            'realestate_posts', 
            'job_posts',
            'freelancers',
            'professionals',
            'job_applications',
            'forum_topics',
            'forum_replies',
            'forum_messages',
            'notifications',
            'user_favorites',
            'user_searches'
        ];
        
        let totalDeleted = 0;
        
        for (const collection of collections) {
            try {
                const items = await btpDB.get(collection);
                if (items && items.length > 0) {
                    // Trouver les items de cet utilisateur
                    const userItems = items.filter(item => item.userId === userId);
                    
                    // Supprimer chaque item
                    for (const item of userItems) {
                        await btpDB.delete(collection, item.id);
                        totalDeleted++;
                    }
                    
                    if (userItems.length > 0) {
                        console.log(`🗑️ Supprimé ${userItems.length} éléments de ${collection}`);
                    }
                }
            } catch (error) {
                console.warn(`⚠️ Erreur nettoyage ${collection}:`, error.message);
            }
        }
        
        console.log(`✅ Nettoyage terminé: ${totalDeleted} éléments supprimés`);
        return totalDeleted;
        
    } catch (error) {
        console.error('❌ Erreur nettoyage données utilisateur:', error);
        throw error;
    }
}

// Journaliser la suppression
async function logUserDeletion(deletedUser, adminUser) {
    try {
        const deletionLog = {
            id: `deletion_${Date.now()}`,
            deletedUserId: deletedUser.id,
            deletedUserName: `${deletedUser.prenom || ''} ${deletedUser.nom || ''}`.trim() || 'Utilisateur inconnu',
            deletedUserEmail: deletedUser.email || '',
            adminUserId: adminUser.id,
            adminUserName: `${adminUser.prenom || ''} ${adminUser.nom || ''}`.trim(),
            reason: 'Suppression manuelle par administrateur',
            timestamp: new Date().toISOString(),
            deletedData: {
                premium: deletedUser.hasPremium || false,
                role: deletedUser.role || 'user',
                registeredDate: deletedUser.createdAt || 'Date inconnue',
                lastLogin: deletedUser.lastLogin || 'Jamais'
            }
        };
        
        // Enregistrer dans une collection spécifique
        await btpDB.post('admin_deletion_logs', deletionLog);
        console.log('📝 Suppression journalisée:', deletionLog);
        
    } catch (error) {
        console.warn('⚠️ Erreur journalisation suppression:', error);
    }
}

// Fonction pour afficher le modal de confirmation de suppression
async function showDeleteUserModal(userId) {
    if (!checkAdminAccess()) return;
    
    try {
        const users = await btpDB.get('users');
        const user = users.find(u => u.id == userId);
        
        if (!user) {
            showAlert('❌ Utilisateur non trouvé', 'error');
            return;
        }
        
        // Empêcher la suppression de soi-même
        if (userId === authState.currentUser.id) {
            showAlert('❌ Vous ne pouvez pas supprimer votre propre compte', 'error');
            return;
        }
        
        const userName = `${user.prenom || ''} ${user.nom || ''}`.trim() || 'Utilisateur inconnu';
        const userEmail = user.email || 'Email inconnu';
        const registrationDate = user.createdAt ? new Date(user.createdAt).toLocaleDateString('fr-FR') : 'Date inconnue';
        
        // Récupérer les statistiques pour affichage
        const [userPosts, userApplications] = await Promise.all([
            getUserPostsCount(userId),
            getUserApplicationsCount(userId)
        ]);
        
        const modalHTML = `
            <div class="modal fade" id="deleteUserModal" tabindex="-1">
                <div class="modal-dialog">
                    <div class="modal-content">
                        <div class="modal-header bg-danger text-white">
                            <h5 class="modal-title">
                                <i class="fas fa-exclamation-triangle me-2"></i>
                                Suppression d'utilisateur
                            </h5>
                            <button type="button" class="btn-close" data-bs-dismiss="modal"></button>
                        </div>
                        <div class="modal-body">
                            <div class="alert alert-danger">
                                <i class="fas fa-radiation me-2"></i>
                                <strong>ATTENTION : ACTION IRREVERSIBLE</strong>
                                <p class="mb-0 mt-2">Cette action supprimera définitivement l'utilisateur et toutes ses données.</p>
                            </div>
                            
                            <div class="card mb-3 border-danger">
                                <div class="card-header bg-danger text-white">
                                    <h6 class="mb-0">
                                        <i class="fas fa-user me-2"></i>
                                        Utilisateur à supprimer
                                    </h6>
                                </div>
                                <div class="card-body">
                                    <div class="mb-2">
                                        <strong>Nom :</strong> ${userName}
                                    </div>
                                    <div class="mb-2">
                                        <strong>Email :</strong> ${userEmail}
                                    </div>
                                    <div class="mb-2">
                                        <strong>Inscrit depuis :</strong> ${registrationDate}
                                    </div>
                                    <div class="mb-2">
                                        <strong>Rôle :</strong> 
                                        <span class="badge ${user.role === 'admin' ? 'bg-primary' : 'bg-secondary'}">
                                            ${user.role === 'admin' ? '👑 ADMIN' : '👤 UTILISATEUR'}
                                        </span>
                                    </div>
                                    ${user.hasPremium ? '<div class="mb-2"><strong>Abonnement :</strong> <span class="badge bg-warning">⭐ PREMIUM</span></div>' : ''}
                                </div>
                            </div>
                            
                            <div class="card mb-3 border-warning">
                                <div class="card-header bg-warning">
                                    <h6 class="mb-0">
                                        <i class="fas fa-chart-bar me-2"></i>
                                        Données qui seront supprimées
                                    </h6>
                                </div>
                                <div class="card-body">
                                    <div class="row text-center">
                                        <div class="col-4">
                                            <div class="p-2 bg-light rounded">
                                                <div class="h5 text-danger mb-0">${userPosts.total}</div>
                                                <small class="text-muted">Annonces</small>
                                            </div>
                                        </div>
                                        <div class="col-4">
                                            <div class="p-2 bg-light rounded">
                                                <div class="h5 text-danger mb-0">${userApplications.total}</div>
                                                <small class="text-muted">Candidatures</small>
                                            </div>
                                        </div>
                                        <div class="col-4">
                                            <div class="p-2 bg-light rounded">
                                                <div class="h5 text-danger mb-0">1</div>
                                                <small class="text-muted">Compte</small>
                                            </div>
                                        </div>
                                    </div>
                                    <div class="mt-2 text-center">
                                        <small class="text-muted">Total: ${userPosts.total + userApplications.total + 1} éléments seront supprimés</small>
                                    </div>
                                </div>
                            </div>
                            
                            <div class="form-check mb-3">
                                <input class="form-check-input" type="checkbox" id="confirmDeleteCheckbox">
                                <label class="form-check-label" for="confirmDeleteCheckbox">
                                    Je comprends que cette action est irréversible et que toutes les données seront perdues définitivement.
                                </label>
                            </div>
                            
                            <div class="mb-3">
                                <label for="deleteReason" class="form-label">Raison de la suppression (facultatif)</label>
                                <textarea class="form-control" id="deleteReason" rows="2" placeholder="Ex: Compte inactif, violation des CGU..."></textarea>
                            </div>
                        </div>
                        <div class="modal-footer">
                            <button type="button" class="btn btn-secondary" data-bs-dismiss="modal">
                                <i class="fas fa-times me-2"></i>Annuler
                            </button>
                            <button type="button" class="btn btn-danger" id="confirmDeleteBtn" onclick="confirmDeleteUser('${userId}')" disabled>
                                <i class="fas fa-trash me-2"></i>Supprimer définitivement
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        `;

        // Supprimer le modal existant
        const existingModal = document.getElementById('deleteUserModal');
        if (existingModal) existingModal.remove();

        // Ajouter le nouveau modal
        document.body.insertAdjacentHTML('beforeend', modalHTML);
        
        // Afficher le modal
        const modal = new bootstrap.Modal(document.getElementById('deleteUserModal'));
        modal.show();
        
        // Activer/désactiver le bouton selon la checkbox
        document.getElementById('confirmDeleteCheckbox').addEventListener('change', function() {
            document.getElementById('confirmDeleteBtn').disabled = !this.checked;
        });
        
    } catch (error) {
        console.error('❌ Erreur chargement modal suppression:', error);
        showAlert('❌ Erreur lors de la préparation de la suppression', 'error');
    }
}

// Fonction de confirmation finale
async function confirmDeleteUser(userId) {
    const reason = document.getElementById('deleteReason')?.value || 'Suppression manuelle par administrateur';
    
    // Fermer le modal
    const modal = bootstrap.Modal.getInstance(document.getElementById('deleteUserModal'));
    if (modal) modal.hide();
    
    // Lancer la suppression après un délai
    setTimeout(() => {
        deleteUser(userId, reason);
    }, 300);
}

// ========== FONCTIONS DÉTAILS UTILISATEUR CORRIGÉES ==========

async function viewUserDetails(userId) {
    if (!checkAdminAccess()) return;
    
    console.log(`👤 Affichage détails utilisateur: ${userId}`);
    
    try {
        // Récupérer les données utilisateur complètes
        const users = await btpDB.get('users');
        const user = users.find(u => u.id == userId);
        
        if (!user) {
            showAlert('❌ Utilisateur non trouvé', 'error');
            return;
        }

        // Récupérer les statistiques de l'utilisateur
        const [userPosts, userApplications] = await Promise.all([
            getUserPostsCount(userId),
            getUserApplicationsCount(userId)
        ]);

        // Générer le contenu détaillé
        const userDetailsHTML = generateUserDetailsContent(user, userPosts, userApplications);
        
        // Afficher le modal
        showUserDetailsModal(userDetailsHTML, userId);
        
    } catch (error) {
        console.error('❌ Erreur chargement détails utilisateur:', error);
        showAlert('❌ Erreur lors du chargement des détails utilisateur', 'error');
    }
}

async function getUserPostsCount(userId) {
    try {
        const [marketplace, realestate, jobs, freelancers, professionals] = await Promise.all([
            btpDB.get('marketplace_posts'),
            btpDB.get('realestate_posts'),
            btpDB.get('job_posts'),
            btpDB.get('freelancers'),
            btpDB.get('professionals')
        ]);

        const userMarketplace = marketplace.filter(post => post.userId === userId);
        const userRealestate = realestate.filter(post => post.userId === userId);
        const userJobs = jobs.filter(post => post.userId === userId);
        const userFreelancers = freelancers.filter(post => post.userId === userId);
        const userProfessionals = professionals.filter(post => post.userId === userId);

        return {
            marketplace: userMarketplace.length,
            realestate: userRealestate.length,
            jobs: userJobs.length,
            freelancers: userFreelancers.length,
            professionals: userProfessionals.length,
            total: userMarketplace.length + userRealestate.length + userJobs.length + userFreelancers.length + userProfessionals.length
        };
    } catch (error) {
        console.error('Erreur comptage posts:', error);
        return { marketplace: 0, realestate: 0, jobs: 0, freelancers: 0, professionals: 0, total: 0 };
    }
}

async function getUserApplicationsCount(userId) {
    try {
        const applications = await btpDB.get('job_applications');
        const userApplications = applications.filter(app => app.candidateId === userId);
        
        return {
            total: userApplications.length,
            pending: userApplications.filter(app => app.status === 'en_attente').length,
            accepted: userApplications.filter(app => app.status === 'accepte').length,
            rejected: userApplications.filter(app => app.status === 'rejete').length
        };
    } catch (error) {
        console.error('Erreur comptage candidatures:', error);
        return { total: 0, pending: 0, accepted: 0, rejected: 0 };
    }
}

function generateUserDetailsContent(user, userPosts, userApplications) {
    // 🔥 CORRECTION : Utiliser les bons noms de champs depuis la base de données
    const prenom = user.prenom || 'Non renseigné';
    const nom = user.nom || 'Non renseigné';
    const email = user.email || 'Non renseigné';
    const phone = user.phone || 'Non renseigné';
    const city = user.city || 'Non renseignée';
    const company = user.company || 'Non renseignée';
    
    const registrationDate = user.createdAt ? new Date(user.createdAt).toLocaleDateString('fr-FR') : 'Date inconnue';
    const lastVisit = user.lastVisit ? new Date(user.lastVisit).toLocaleDateString('fr-FR') : 'Jamais';
    const lastLogin = user.lastLogin ? new Date(user.lastLogin).toLocaleString('fr-FR') : 'Jamais';

    return `
        <div class="user-details-container">
            <div class="row">
                <!-- Informations personnelles -->
                <div class="col-md-6">
                    <div class="card mb-4">
                        <div class="card-header bg-primary text-white">
                            <h5 class="mb-0">
                                <i class="fas fa-user me-2"></i>
                                Informations Personnelles
                            </h5>
                        </div>
                        <div class="card-body">
                            <div class="row mb-3">
                                <div class="col-4">
                                    <strong>Nom complet:</strong>
                                </div>
                                <div class="col-8">
                                    ${prenom} ${nom}
                                </div>
                            </div>
                            <div class="row mb-3">
                                <div class="col-4">
                                    <strong>Email:</strong>
                                </div>
                                <div class="col-8">
                                    ${email}
                                    ${user.isVerified ? '<span class="badge bg-success ms-2">Vérifié</span>' : '<span class="badge bg-warning ms-2">Non vérifié</span>'}
                                </div>
                            </div>
                            <div class="row mb-3">
                                <div class="col-4">
                                    <strong>Téléphone:</strong>
                                </div>
                                <div class="col-8">
                                    ${phone}
                                </div>
                            </div>
                            <div class="row mb-3">
                                <div class="col-4">
                                    <strong>Ville:</strong>
                                </div>
                                <div class="col-8">
                                    ${city}
                                </div>
                            </div>
                            <div class="row mb-3">
                                <div class="col-4">
                                    <strong>Entreprise:</strong>
                                </div>
                                <div class="col-8">
                                    ${company}
                                </div>
                            </div>
                            ${user.address ? `
                            <div class="row mb-3">
                                <div class="col-4">
                                    <strong>Adresse:</strong>
                                </div>
                                <div class="col-8">
                                    ${user.address}
                                </div>
                            </div>
                            ` : ''}
                            ${user.postalCode ? `
                            <div class="row mb-3">
                                <div class="col-4">
                                    <strong>Code postal:</strong>
                                </div>
                                <div class="col-8">
                                    ${user.postalCode}
                                </div>
                            </div>
                            ` : ''}
                            ${user.website ? `
                            <div class="row mb-3">
                                <div class="col-4">
                                    <strong>Site web:</strong>
                                </div>
                                <div class="col-8">
                                    <a href="${user.website}" target="_blank">${user.website}</a>
                                </div>
                            </div>
                            ` : ''}
                            ${user.description ? `
                            <div class="row mb-3">
                                <div class="col-4">
                                    <strong>Description:</strong>
                                </div>
                                <div class="col-8">
                                    <div class="border p-2 bg-light rounded">${user.description}</div>
                                </div>
                            </div>
                            ` : ''}
                        </div>
                    </div>
                </div>

                <!-- Statut et activité -->
                <div class="col-md-6">
                    <div class="card mb-4">
                        <div class="card-header bg-info text-white">
                            <h5 class="mb-0">
                                <i class="fas fa-chart-line me-2"></i>
                                Statut & Activité
                            </h5>
                        </div>
                        <div class="card-body">
                            <div class="row mb-3">
                                <div class="col-6">
                                    <strong>Statut:</strong>
                                </div>
                                <div class="col-6">
                                    ${user.isBlocked ? 
                                        '<span class="badge bg-danger">🚫 Bloqué</span>' : 
                                        '<span class="badge bg-success">✅ Actif</span>'}
                                </div>
                            </div>
                            <div class="row mb-3">
                                <div class="col-6">
                                    <strong>Rôle:</strong>
                                </div>
                                <div class="col-6">
                                    ${user.role === 'admin' ? 
                                        '<span class="badge bg-primary">👑 Administrateur</span>' : 
                                        '<span class="badge bg-secondary">👤 Utilisateur</span>'}
                                </div>
                            </div>
                            <div class="row mb-3">
                                <div class="col-6">
                                    <strong>Premium:</strong>
                                </div>
                                <div class="col-6">
                                    ${user.hasPremium ? 
                                        '<span class="badge bg-warning">⭐ Actif</span>' : 
                                        '<span class="badge bg-secondary">Basic</span>'}
                                </div>
                            </div>
                            <div class="row mb-3">
                                <div class="col-6">
                                    <strong>Visites:</strong>
                                </div>
                                <div class="col-6">
                                    <span class="badge bg-info">${user.visitCount || 0}</span>
                                </div>
                            </div>
                            <div class="row mb-3">
                                <div class="col-6">
                                    <strong>Dernière visite:</strong>
                                </div>
                                <div class="col-6">
                                    <small>${lastVisit}</small>
                                </div>
                            </div>
                            <div class="row mb-3">
                                <div class="col-6">
                                    <strong>Dernière connexion:</strong>
                                </div>
                                <div class="col-6">
                                    <small>${lastLogin}</small>
                                </div>
                            </div>
                            <div class="row mb-3">
                                <div class="col-6">
                                    <strong>Date d'inscription:</strong>
                                </div>
                                <div class="col-6">
                                    <small>${registrationDate}</small>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            <!-- Statistiques des annonces -->
            <div class="row">
                <div class="col-md-6">
                    <div class="card mb-4">
                        <div class="card-header bg-success text-white">
                            <h5 class="mb-0">
                                <i class="fas fa-bullhorn me-2"></i>
                                Annonces Publées
                            </h5>
                        </div>
                        <div class="card-body">
                            <div class="row text-center">
                                <div class="col-4">
                                    <div class="border rounded p-2 bg-light">
                                        <div class="h4 mb-0 text-primary">${userPosts.total}</div>
                                        <small class="text-muted">Total</small>
                                    </div>
                                </div>
                                <div class="col-4">
                                    <div class="border rounded p-2 bg-light">
                                        <div class="h6 mb-0">${userPosts.marketplace}</div>
                                        <small class="text-muted">Marketplace</small>
                                    </div>
                                </div>
                                <div class="col-4">
                                    <div class="border rounded p-2 bg-light">
                                        <div class="h6 mb-0">${userPosts.realestate}</div>
                                        <small class="text-muted">Immobilier</small>
                                    </div>
                                </div>
                            </div>
                            <div class="row text-center mt-2">
                                <div class="col-4">
                                    <div class="border rounded p-2 bg-light">
                                        <div class="h6 mb-0">${userPosts.jobs}</div>
                                        <small class="text-muted">Emplois</small>
                                    </div>
                                </div>
                                <div class="col-4">
                                    <div class="border rounded p-2 bg-light">
                                        <div class="h6 mb-0">${userPosts.freelancers}</div>
                                        <small class="text-muted">Freelance</small>
                                    </div>
                                </div>
                                <div class="col-4">
                                    <div class="border rounded p-2 bg-light">
                                        <div class="h6 mb-0">${userPosts.professionals}</div>
                                        <small class="text-muted">Pros</small>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                <!-- Candidatures -->
                <div class="col-md-6">
                    <div class="card mb-4">
                        <div class="card-header bg-warning text-white">
                            <h5 class="mb-0">
                                <i class="fas fa-file-alt me-2"></i>
                                Candidatures
                            </h5>
                        </div>
                        <div class="card-body">
                            <div class="row text-center">
                                <div class="col-3">
                                    <div class="border rounded p-2 bg-light">
                                        <div class="h4 mb-0">${userApplications.total}</div>
                                        <small class="text-muted">Total</small>
                                    </div>
                                </div>
                                <div class="col-3">
                                    <div class="border rounded p-2 bg-light">
                                        <div class="h6 mb-0 text-warning">${userApplications.pending}</div>
                                        <small class="text-muted">En attente</small>
                                    </div>
                                </div>
                                <div class="col-3">
                                    <div class="border rounded p-2 bg-light">
                                        <div class="h6 mb-0 text-success">${userApplications.accepted}</div>
                                        <small class="text-muted">Acceptées</small>
                                    </div>
                                </div>
                                <div class="col-3">
                                    <div class="border rounded p-2 bg-light">
                                        <div class="h6 mb-0 text-danger">${userApplications.rejected}</div>
                                        <small class="text-muted">Rejetées</small>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            <!-- Informations système -->
            <div class="row">
                <div class="col-12">
                    <div class="card">
                        <div class="card-header bg-secondary text-white">
                            <h5 class="mb-0">
                                <i class="fas fa-info-circle me-2"></i>
                                Informations Système
                            </h5>
                        </div>
                        <div class="card-body">
                            <div class="row">
                                <div class="col-md-4">
                                    <div class="mb-3">
                                        <strong>ID Utilisateur:</strong>
                                        <div class="text-muted font-monospace small">${user.id}</div>
                                    </div>
                                </div>
                                <div class="col-md-4">
                                    <div class="mb-3">
                                        <strong>Date d'inscription:</strong>
                                        <div>${registrationDate}</div>
                                    </div>
                                </div>
                                <div class="col-md-4">
                                    <div class="mb-3">
                                        <strong>Dernière mise à jour:</strong>
                                        <div>${user.updatedAt ? new Date(user.updatedAt).toLocaleDateString('fr-FR') : 'Inconnue'}</div>
                                    </div>
                                </div>
                            </div>
                            ${user.blockedAt ? `
                            <div class="alert alert-danger">
                                <i class="fas fa-ban me-2"></i>
                                <strong>Utilisateur bloqué</strong>
                                <div>Le ${new Date(user.blockedAt).toLocaleDateString('fr-FR')} par ${user.blockedBy || 'système'}</div>
                                ${user.blockReason ? `<div>Raison: ${user.blockReason}</div>` : ''}
                            </div>
                            ` : ''}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    `;
}

function showUserDetailsModal(content, userId) {
    const modalHTML = `
        <div class="modal fade" id="userDetailsModal" tabindex="-1">
            <div class="modal-dialog modal-xl">
                <div class="modal-content">
                    <div class="modal-header bg-primary text-white">
                        <h5 class="modal-title">
                            <i class="fas fa-user-circle me-2"></i>
                            Détails de l'Utilisateur
                        </h5>
                        <button type="button" class="btn-close" data-bs-dismiss="modal"></button>
                    </div>
                    <div class="modal-body" style="max-height: 70vh; overflow-y: auto;">
                        ${content}
                    </div>
                    <div class="modal-footer">
                        <button type="button" class="btn btn-secondary" data-bs-dismiss="modal">
                            <i class="fas fa-times me-2"></i>Fermer
                        </button>
                        <button type="button" class="btn btn-primary" onclick="editUser('${userId}')">
                            <i class="fas fa-edit me-2"></i>Modifier
                        </button>
                    </div>
                </div>
            </div>
        </div>
    `;

    // Supprimer le modal existant
    const existingModal = document.getElementById('userDetailsModal');
    if (existingModal) existingModal.remove();

    // Ajouter le nouveau modal
    document.body.insertAdjacentHTML('beforeend', modalHTML);
    
    // Afficher le modal
    const modal = new bootstrap.Modal(document.getElementById('userDetailsModal'));
    modal.show();
}

// ========== FONCTION EDIT USER CORRIGÉE ==========

async function editUser(userId) {
    if (!checkAdminAccess()) return;
    
    console.log(`✏️ Édition utilisateur: ${userId}`);
    
    try {
        const users = await btpDB.get('users');
        const user = users.find(u => u.id == userId);
        
        if (!user) {
            showAlert('❌ Utilisateur non trouvé', 'error');
            return;
        }

        showEditUserModal(user);
        
    } catch (error) {
        console.error('❌ Erreur chargement utilisateur:', error);
        showAlert('❌ Erreur lors du chargement des données utilisateur', 'error');
    }
}

function showEditUserModal(user) {
    // CORRECTION : Gestion sécurisée des données avec valeurs par défaut
    const prenom = user.prenom || '';
    const nom = user.nom || '';
    const email = user.email || '';
    const phone = user.phone || '';
    const city = user.city || '';
    const company = user.company || '';
    
    const modalHTML = `
        <div class="modal fade" id="editUserModal" tabindex="-1">
            <div class="modal-dialog modal-lg">
                <div class="modal-content">
                    <div class="modal-header bg-warning text-white">
                        <h5 class="modal-title">
                            <i class="fas fa-edit me-2"></i>
                            Modifier l'Utilisateur
                        </h5>
                        <button type="button" class="btn-close" data-bs-dismiss="modal"></button>
                    </div>
                    <div class="modal-body">
                        <form id="editUserForm">
                            <div class="row">
                                <div class="col-md-6">
                                    <div class="mb-3">
                                        <label for="editPrenom" class="form-label">Prénom *</label>
                                        <input type="text" class="form-control" id="editPrenom" value="${prenom}" required>
                                    </div>
                                </div>
                                <div class="col-md-6">
                                    <div class="mb-3">
                                        <label for="editNom" class="form-label">Nom *</label>
                                        <input type="text" class="form-control" id="editNom" value="${nom}" required>
                                    </div>
                                </div>
                            </div>
                            
                            <div class="mb-3">
                                <label for="editEmail" class="form-label">Email *</label>
                                <input type="email" class="form-control" id="editEmail" value="${email}" required>
                            </div>
                            
                            <div class="row">
                                <div class="col-md-6">
                                    <div class="mb-3">
                                        <label for="editPhone" class="form-label">Téléphone</label>
                                        <input type="tel" class="form-control" id="editPhone" value="${phone}">
                                    </div>
                                </div>
                                <div class="col-md-6">
                                    <div class="mb-3">
                                        <label for="editCity" class="form-label">Ville</label>
                                        <input type="text" class="form-control" id="editCity" value="${city}">
                                    </div>
                                </div>
                            </div>
                            
                            <div class="mb-3">
                                <label for="editCompany" class="form-label">Entreprise</label>
                                        <input type="text" class="form-control" id="editCompany" value="${company}">
                            </div>
                            
                            <div class="row">
                                <div class="col-md-4">
                                    <div class="mb-3">
                                        <label class="form-label">Statut</label>
                                        <div>
                                            <div class="form-check form-check-inline">
                                                <input class="form-check-input" type="radio" name="editStatus" id="editStatusActive" value="active" ${!user.isBlocked ? 'checked' : ''}>
                                                <label class="form-check-label" for="editStatusActive">Actif</label>
                                            </div>
                                            <div class="form-check form-check-inline">
                                                <input class="form-check-input" type="radio" name="editStatus" id="editStatusBlocked" value="blocked" ${user.isBlocked ? 'checked' : ''}>
                                                <label class="form-check-label" for="editStatusBlocked">Bloqué</label>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                                <div class="col-md-4">
                                    <div class="mb-3">
                                        <label class="form-label">Rôle</label>
                                        <div>
                                            <div class="form-check form-check-inline">
                                                <input class="form-check-input" type="radio" name="editRole" id="editRoleUser" value="user" ${user.role !== 'admin' ? 'checked' : ''}>
                                                <label class="form-check-label" for="editRoleUser">Utilisateur</label>
                                            </div>
                                            <div class="form-check form-check-inline">
                                                <input class="form-check-input" type="radio" name="editRole" id="editRoleAdmin" value="admin" ${user.role === 'admin' ? 'checked' : ''}>
                                                <label class="form-check-label" for="editRoleAdmin">Admin</label>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                                <div class="col-md-4">
                                    <div class="mb-3">
                                        <label class="form-label">Premium</label>
                                        <div class="form-check form-switch">
                                            <input class="form-check-input" type="checkbox" id="editPremium" ${user.hasPremium ? 'checked' : ''}>
                                            <label class="form-check-label" for="editPremium">Abonnement actif</label>
                                        </div>
                                    </div>
                                </div>
                            </div>
                            
                            ${user.isBlocked ? `
                            <div class="mb-3">
                                <label for="editBlockReason" class="form-label">Raison du blocage</label>
                                <textarea class="form-control" id="editBlockReason" rows="2">${user.blockReason || ''}</textarea>
                            </div>
                            ` : ''}
                            
                            <div class="alert alert-info">
                                <i class="fas fa-info-circle me-2"></i>
                                Les modifications seront appliquées immédiatement après sauvegarde.
                            </div>
                        </form>
                    </div>
                    <div class="modal-footer">
                        <button type="button" class="btn btn-secondary" data-bs-dismiss="modal">
                            <i class="fas fa-times me-2"></i>Annuler
                        </button>
                        <button type="button" class="btn btn-warning" onclick="saveUserChanges('${user.id}')">
                            <i class="fas fa-save me-2"></i>Enregistrer
                        </button>
                    </div>
                </div>
            </div>
        </div>
    `;

    // Supprimer le modal existant
    const existingModal = document.getElementById('editUserModal');
    if (existingModal) existingModal.remove();

    // Ajouter le nouveau modal
    document.body.insertAdjacentHTML('beforeend', modalHTML);
    
    // Afficher le modal
    const modal = new bootstrap.Modal(document.getElementById('editUserModal'));
    modal.show();
}

async function saveUserChanges(userId) {
    if (!checkAdminAccess()) return;
    
    const form = document.getElementById('editUserForm');
    if (!form.checkValidity()) {
        form.reportValidity();
        return;
    }
    
    const updates = {
        prenom: document.getElementById('editPrenom').value.trim(),
        nom: document.getElementById('editNom').value.trim(),
        email: document.getElementById('editEmail').value.trim(),
        phone: document.getElementById('editPhone').value.trim(),
        city: document.getElementById('editCity').value.trim(),
        company: document.getElementById('editCompany').value.trim(),
        isBlocked: document.querySelector('input[name="editStatus"]:checked').value === 'blocked',
        role: document.querySelector('input[name="editRole"]:checked').value,
        hasPremium: document.getElementById('editPremium').checked,
        updatedAt: new Date().toISOString(),
        updatedBy: authState.currentUser.id
    };
    
    if (updates.isBlocked) {
        updates.blockReason = document.getElementById('editBlockReason')?.value.trim() || 'Modifié par administrateur';
        updates.blockedAt = new Date().toISOString();
        updates.blockedBy = authState.currentUser.id;
    } else {
        updates.blockReason = null;
        updates.blockedAt = null;
        updates.blockedBy = null;
    }
    
    console.log(`💾 Sauvegarde modifications utilisateur ${userId}:`, updates);
    
    try {
        await btpDB.put('users', userId, updates);
        
        // Fermer le modal
        const modal = bootstrap.Modal.getInstance(document.getElementById('editUserModal'));
        modal.hide();
        
        showAlert('✅ Utilisateur modifié avec succès', 'success');
        
        // Recharger le tableau des utilisateurs
        setTimeout(() => {
            loadUsersTable();
        }, 500);
        
    } catch (error) {
        console.error('❌ Erreur sauvegarde utilisateur:', error);
        showAlert('❌ Erreur lors de la sauvegarde', 'error');
    }
}

// ========== MODÉRATION DES ANNONCES ==========
async function loadPendingModeration() {
    if (!checkAdminAccess()) return;
    
    console.log('⚖️ Chargement des annonces en attente de modération...');
    
    try {
        const [marketplace, realestate, jobs, freelancers, professionals] = await Promise.all([
            btpDB.get('marketplace_posts'),
            btpDB.get('realestate_posts'),
            btpDB.get('job_posts'),
            btpDB.get('freelancers'),
            btpDB.get('professionals')
        ]);
        
        const pendingMarketplace = marketplace.filter(post => post.status === 'en_attente');
        const pendingRealestate = realestate.filter(post => post.status === 'en_attente');
        const pendingJobs = jobs.filter(post => post.status === 'en_attente');
        const pendingFreelancers = freelancers.filter(post => post.status === 'en_attente');
        const pendingProfessionals = professionals.filter(post => post.status === 'en_attente');
        
        const allPendingAds = [
            ...pendingMarketplace.map(ad => ({ ...ad, type: 'marketplace' })),
            ...pendingRealestate.map(ad => ({ ...ad, type: 'realestate' })),
            ...pendingJobs.map(ad => ({ ...ad, type: 'jobs' })),
            ...pendingFreelancers.map(ad => ({ ...ad, type: 'freelancers' })),
            ...pendingProfessionals.map(ad => ({ ...ad, type: 'professionals' }))
        ].sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt)); // Plus récent d'abord
        
        displayPendingAds(allPendingAds);
        console.log(`✅ ${allPendingAds.length} annonces en attente de modération`);
        
    } catch (error) {
        console.error('❌ Erreur chargement modération:', error);
        showAlert('❌ Erreur lors du chargement des annonces', 'error');
        const tableBody = document.getElementById('moderation-table-body');
        if (tableBody) {
            tableBody.innerHTML = `
                <tr>
                    <td colspan="6" class="text-center text-danger py-4">
                        <i class="fas fa-exclamation-triangle me-2"></i>
                        Erreur lors du chargement
                        <br>
                        <button class="btn btn-sm btn-primary mt-2" onclick="loadPendingModeration()">
                            <i class="fas fa-redo me-1"></i>Réessayer
                        </button>
                    </td>
                </tr>`;
        }
    }
}

function displayPendingAds(ads) {
    const tableBody = document.getElementById('moderation-table-body');
    
    if (!tableBody) {
        console.warn('❌ Tableau de modération non trouvé');
        return;
    }
    
    if (!ads || ads.length === 0) {
        tableBody.innerHTML = `
            <tr>
                <td colspan="6" class="text-center text-muted py-5">
                    <i class="fas fa-check-circle fa-3x mb-3 text-success"></i>
                    <div class="h5">Aucune annonce en attente</div>
                    <small>Toutes les annonces sont modérées !</small>
                </td>
            </tr>
        `;
        return;
    }
    
    let html = '';
    ads.forEach((ad, index) => {
        const typeLabel = getAdTypeLabel(ad.type);
        const createdAt = ad.createdAt ? new Date(ad.createdAt).toLocaleDateString('fr-FR') : 'Date inconnue';
        const title = ad.title || ad.poste || ad.company || 'Sans titre';
        const description = ad.description ? truncateText(ad.description, 80) : 'Aucune description';
        
        html += `
        <tr>
            <td>
                <div>
                    <strong class="d-block">${title}</strong>
                    <small class="text-muted">${description}</small>
                </div>
            </td>
            <td>
                <span class="badge bg-secondary">${typeLabel}</span>
                ${ad.city ? `<br><small class="text-muted"><i class="fas fa-map-marker-alt"></i> ${ad.city}</small>` : ''}
            </td>
            <td>
                <div>
                    <strong>${ad.userName || 'Utilisateur inconnu'}</strong>
                    ${ad.userEmail ? `<br><small class="text-muted">📧 ${ad.userEmail}</small>` : ''}
                    ${ad.phone ? `<br><small class="text-muted">📞 ${ad.phone}</small>` : ''}
                </div>
            </td>
            <td>
                <small>${createdAt}</small>
            </td>
            <td>
                <span class="badge bg-warning">⏳ En attente</span>
            </td>
            <td>
                <div class="btn-group btn-group-sm">
                    <button class="btn btn-success" onclick="approveAd('${ad.id}', '${ad.type}')" title="Approuver">
                        <i class="fas fa-check"></i>
                    </button>
                    <button class="btn btn-danger" onclick="rejectAd('${ad.id}', '${ad.type}')" title="Rejeter">
                        <i class="fas fa-times"></i>
                    </button>
                    <button class="btn btn-info" onclick="viewAdDetails('${ad.id}', '${ad.type}')" title="Détails">
                        <i class="fas fa-eye"></i>
                    </button>
                    <button class="btn btn-outline-danger" onclick="deleteAnnounce('${ad.id}', '${ad.type}')" title="Supprimer">
                        <i class="fas fa-trash"></i>
                    </button>
                </div>
            </td>
        </tr>`;
    });
    
    tableBody.innerHTML = html;
}

function getAdTypeLabel(type) {
    const labels = {
        'marketplace': '🛍️ Marketplace',
        'realestate': '🏠 Immobilier',
        'jobs': '💼 Emploi',
        'freelancers': '🎨 Freelance',
        'professionals': '👷 Professionnel'
    };
    return labels[type] || type;
}

function truncateText(text, maxLength) {
    if (!text) return '';
    if (text.length <= maxLength) return text;
    return text.substring(0, maxLength) + '...';
}

async function approveAd(adId, adType) {
    if (!checkAdminAccess()) return;
    
    if (!confirm('Êtes-vous sûr de vouloir approuver cette annonce ? Elle sera visible par tous les utilisateurs.')) {
        return;
    }
    
    console.log(`✅ Approbation annonce ${adId} (${adType})`);
    
    try {
        const collectionName = getCollectionName(adType);
        await btpDB.put(collectionName, adId, { 
            status: 'approuve',
            moderatedAt: new Date().toISOString(),
            moderatedBy: authState.currentUser.id
        });
        
        showAlert('✅ Annonce approuvée avec succès', 'success');
        
        // Recharger les données
        setTimeout(() => {
            loadPendingModeration();
            loadAdminStats();
        }, 500);
        
    } catch (error) {
        console.error('❌ Erreur approbation annonce:', error);
        showAlert('❌ Erreur lors de l\'approbation', 'error');
    }
}

async function rejectAd(adId, adType) {
    if (!checkAdminAccess()) return;
    
    const reason = prompt('Veuillez saisir la raison du rejet :');
    if (!reason || reason.trim() === '') {
        showAlert('❌ Veuillez saisir une raison pour le rejet', 'warning');
        return;
    }
    
    console.log(`❌ Rejet annonce ${adId} (${adType}) - Raison: ${reason}`);
    
    try {
        const collectionName = getCollectionName(adType);
        await btpDB.put(collectionName, adId, { 
            status: 'rejete',
            moderationReason: reason.trim(),
            moderatedAt: new Date().toISOString(),
            moderatedBy: authState.currentUser.id
        });
        
        showAlert('✅ Annonce rejetée avec succès', 'success');
        
        // Recharger les données
        setTimeout(() => {
            loadPendingModeration();
            loadAdminStats();
        }, 500);
        
    } catch (error) {
        console.error('❌ Erreur rejet annonce:', error);
        showAlert('❌ Erreur lors du rejet', 'error');
    }
}

async function deleteAnnounce(announceId, announceType) {
    if (!checkAdminAccess()) return;
    
    if (!confirm('Êtes-vous sûr de vouloir SUPPRIMER DÉFINITIVEMENT cette annonce ? Cette action est irréversible.')) {
        return;
    }
    
    console.log(`🗑️ Suppression annonce ${announceId} (${announceType})`);
    
    try {
        const collectionName = getCollectionName(announceType);
        const success = await btpDB.delete(collectionName, announceId);
        
        if (success) {
            showAlert('✅ Annonce supprimée avec succès', 'success');
            
            // Recharger les données
            setTimeout(() => {
                loadPendingModeration();
                loadAdminStats();
            }, 500);
            
        } else {
            showAlert('❌ Erreur lors de la suppression', 'error');
        }
        
    } catch (error) {
        console.error('❌ Erreur suppression annonce:', error);
        showAlert('❌ Erreur lors de la suppression', 'error');
    }
}

// ========== FONCTION DE VISION DÉTAILLÉE DES ANNONCES ==========
async function viewAdDetails(adId, adType) {
    if (!checkAdminAccess()) return;
    
    console.log(`🔍 Affichage détails annonce ${adId} (${adType})`);
    
    try {
        const collectionName = getCollectionName(adType);
        const ads = await btpDB.get(collectionName);
        const ad = ads.find(a => a.id == adId);
        
        if (!ad) {
            showAlert('❌ Annonce non trouvée', 'error');
            return;
        }

        // Récupérer les informations utilisateur
        const users = await btpDB.get('users');
        const user = users.find(u => u.id == ad.userId);
        const userName = user ? `${user.prenom || ''} ${user.nom || ''}`.trim() || 'Utilisateur inconnu' : 'Utilisateur inconnu';
        const userEmail = user ? user.email : 'Email non disponible';
        const userPhone = user ? user.phone : 'Téléphone non disponible';

        // Générer le contenu détaillé selon le type d'annonce
        const adDetails = generateAdDetailsContent(ad, adType, userName, userEmail, userPhone);
        
        // Afficher le modal avec les détails
        showAdDetailsModal(adDetails, adId, adType);
        
    } catch (error) {
        console.error('❌ Erreur chargement détails annonce:', error);
        showAlert('❌ Erreur lors du chargement des détails', 'error');
    }
}

function generateAdDetailsContent(ad, adType, userName, userEmail, userPhone) {
    const typeLabels = {
        'marketplace': '🛍️ Marketplace',
        'realestate': '🏠 Immobilier', 
        'jobs': '💼 Emploi',
        'freelancers': '🎨 Freelance',
        'professionals': '👷 Professionnel'
    };

    let detailsHTML = `
        <div class="ad-details-container">
            <div class="row">
                <!-- Informations principales -->
                <div class="col-md-8">
                    <div class="card mb-4">
                        <div class="card-header bg-primary text-white">
                            <h5 class="mb-0">
                                <i class="fas fa-info-circle me-2"></i>
                                Informations de l'annonce
                            </h5>
                        </div>
                        <div class="card-body">
                            ${generateAdSpecificDetails(ad, adType)}
                        </div>
                    </div>
                </div>
                
                <!-- Informations utilisateur et statut -->
                <div class="col-md-4">
                    <div class="card mb-4">
                        <div class="card-header bg-info text-white">
                            <h5 class="mb-0">
                                <i class="fas fa-user me-2"></i>
                                Informations utilisateur
                            </h5>
                        </div>
                        <div class="card-body">
                            <div class="mb-3">
                                <strong>Nom :</strong> ${userName}
                            </div>
                            <div class="mb-3">
                                <strong>Email :</strong> ${userEmail}
                            </div>
                            <div class="mb-3">
                                <strong>Téléphone :</strong> ${userPhone || 'Non renseigné'}
                            </div>
                            <div class="mb-3">
                                <strong>Type :</strong> 
                                <span class="badge bg-secondary">${typeLabels[adType]}</span>
                            </div>
                            <div class="mb-3">
                                <strong>Statut :</strong> 
                                <span class="badge bg-warning">⏳ En attente</span>
                            </div>
                            ${ad.createdAt ? `
                            <div class="mb-3">
                                <strong>Créée le :</strong> 
                                ${new Date(ad.createdAt).toLocaleDateString('fr-FR')}
                            </div>
                            ` : ''}
                        </div>
                    </div>
                </div>
            </div>
            
            <!-- Actions de modération -->
            <div class="row">
                <div class="col-12">
                    <div class="card">
                        <div class="card-header bg-warning">
                            <h5 class="mb-0">
                                <i class="fas fa-gavel me-2"></i>
                                Actions de modération
                            </h5>
                        </div>
                        <div class="card-body">
                            <div class="d-flex gap-2 flex-wrap">
                                <button class="btn btn-success" onclick="approveAdFromModal('${ad.id}', '${adType}')">
                                    <i class="fas fa-check me-2"></i>Approuver
                                </button>
                                <button class="btn btn-danger" onclick="rejectAdFromModal('${ad.id}', '${adType}')">
                                    <i class="fas fa-times me-2"></i>Rejeter
                                </button>
                                <button class="btn btn-outline-danger" onclick="deleteAnnounceFromModal('${ad.id}', '${adType}')">
                                    <i class="fas fa-trash me-2"></i>Supprimer
                                </button>
                                <button class="btn btn-outline-secondary ms-auto" data-bs-dismiss="modal">
                                    <i class="fas fa-times me-2"></i>Fermer
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    `;

    return detailsHTML;
}

function generateAdSpecificDetails(ad, adType) {
    switch(adType) {
        case 'marketplace':
            return `
                <div class="mb-3">
                    <strong>Titre :</strong> ${ad.title || 'Non spécifié'}
                </div>
                <div class="mb-3">
                    <strong>Description :</strong> 
                    <div class="border p-2 bg-light rounded mt-1">${ad.description || 'Aucune description'}</div>
                </div>
                <div class="row">
                    <div class="col-md-6">
                        <div class="mb-3">
                            <strong>Prix :</strong> ${ad.price ? `${ad.price} DH` : 'Non spécifié'}
                        </div>
                    </div>
                    <div class="col-md-6">
                        <div class="mb-3">
                            <strong>Catégorie :</strong> ${ad.category || 'Non spécifiée'}
                        </div>
                    </div>
                </div>
                <div class="row">
                    <div class="col-md-6">
                        <div class="mb-3">
                            <strong>Ville :</strong> ${ad.city || 'Non spécifiée'}
                        </div>
                    </div>
                    <div class="col-md-6">
                        <div class="mb-3">
                            <strong>État :</strong> ${ad.condition || 'Non spécifié'}
                        </div>
                    </div>
                </div>
                ${ad.phone ? `
                <div class="mb-3">
                    <strong>Téléphone de contact :</strong> ${ad.phone}
                </div>
                ` : ''}
            `;

        case 'realestate':
            return `
                <div class="mb-3">
                    <strong>Titre :</strong> ${ad.title || 'Non spécifié'}
                </div>
                <div class="mb-3">
                    <strong>Description :</strong> 
                    <div class="border p-2 bg-light rounded mt-1">${ad.description || 'Aucune description'}</div>
                </div>
                <div class="row">
                    <div class="col-md-4">
                        <div class="mb-3">
                            <strong>Type :</strong> ${ad.type || 'Non spécifié'}
                        </div>
                    </div>
                    <div class="col-md-4">
                        <div class="mb-3">
                            <strong>Prix :</strong> ${ad.price ? `${ad.price} DH` : 'Non spécifié'}
                        </div>
                    </div>
                    <div class="col-md-4">
                        <div class="mb-3">
                            <strong>Surface :</strong> ${ad.surface ? `${ad.surface} m²` : 'Non spécifiée'}
                        </div>
                    </div>
                </div>
                <div class="row">
                    <div class="col-md-6">
                        <div class="mb-3">
                            <strong>Ville :</strong> ${ad.city || 'Non spécifiée'}
                        </div>
                    </div>
                    <div class="col-md-6">
                        <div class="mb-3">
                            <strong>Quartier :</strong> ${ad.area || 'Non spécifié'}
                        </div>
                    </div>
                </div>
                ${ad.rooms ? `
                <div class="mb-3">
                    <strong>Pièces :</strong> ${ad.rooms}
                </div>
                ` : ''}
            `;

        case 'jobs':
            return `
                <div class="mb-3">
                    <strong>Poste :</strong> ${ad.poste || 'Non spécifié'}
                </div>
                <div class="mb-3">
                    <strong>Description :</strong> 
                    <div class="border p-2 bg-light rounded mt-1">${ad.description || 'Aucune description'}</div>
                </div>
                <div class="row">
                    <div class="col-md-6">
                        <div class="mb-3">
                            <strong>Entreprise :</strong> ${ad.company || 'Non spécifiée'}
                        </div>
                    </div>
                    <div class="col-md-6">
                        <div class="mb-3">
                            <strong>Type de contrat :</strong> ${ad.contractType || 'Non spécifié'}
                        </div>
                    </div>
                </div>
                <div class="row">
                    <div class="col-md-6">
                        <div class="mb-3">
                            <strong>Salaire :</strong> ${ad.salary ? `${ad.salary} DH` : 'Non spécifié'}
                        </div>
                    </div>
                    <div class="col-md-6">
                        <div class="mb-3">
                            <strong>Ville :</strong> ${ad.ville || 'Non spécifiée'}
                        </div>
                    </div>
                </div>
                ${ad.experience ? `
                <div class="mb-3">
                    <strong>Expérience requise :</strong> ${ad.experience}
                </div>
                ` : ''}
                ${ad.qualifications ? `
                <div class="mb-3">
                    <strong>Qualifications :</strong> ${ad.qualifications}
                </div>
                ` : ''}
            `;

        case 'freelancers':
            return `
                <div class="mb-3">
                    <strong>Service :</strong> ${ad.service || 'Non spécifié'}
                </div>
                <div class="mb-3">
                    <strong>Description :</strong> 
                    <div class="border p-2 bg-light rounded mt-1">${ad.description || 'Aucune description'}</div>
                </div>
                <div class="row">
                    <div class="col-md-6">
                        <div class="mb-3">
                            <strong>Spécialité :</strong> ${ad.specialty || 'Non spécifiée'}
                        </div>
                    </div>
                    <div class="col-md-6">
                        <div class="mb-3">
                            <strong>Tarif :</strong> ${ad.rate ? `${ad.rate} DH` : 'Non spécifié'}
                        </div>
                    </div>
                </div>
                <div class="row">
                    <div class="col-md-6">
                        <div class="mb-3">
                            <strong>Ville :</strong> ${ad.city || 'Non spécifiée'}
                        </div>
                    </div>
                    <div class="col-md-6">
                        <div class="mb-3">
                            <strong>Expérience :</strong> ${ad.experience || 0} an(s)
                        </div>
                    </div>
                </div>
                ${ad.skills ? `
                <div class="mb-3">
                    <strong>Compétences :</strong> ${Array.isArray(ad.skills) ? ad.skills.join(', ') : ad.skills}
                </div>
                ` : ''}
                ${ad.portfolio ? `
                <div class="mb-3">
                    <strong>Portfolio :</strong> 
                    <a href="${ad.portfolio}" target="_blank" class="text-primary">${ad.portfolio}</a>
                </div>
                ` : ''}
            `;

        case 'professionals':
            return `
                <div class="mb-3">
                    <strong>Entreprise :</strong> ${ad.company || 'Non spécifiée'}
                </div>
                <div class="mb-3">
                    <strong>Description :</strong> 
                    <div class="border p-2 bg-light rounded mt-1">${ad.description || 'Aucune description'}</div>
                </div>
                <div class="row">
                    <div class="col-md-6">
                        <div class="mb-3">
                            <strong>Spécialité :</strong> ${ad.specialty || 'Non spécifiée'}
                        </div>
                    </div>
                    <div class="col-md-6">
                        <div class="mb-3">
                            <strong>Ville :</strong> ${ad.city || 'Non spécifiée'}
                        </div>
                    </div>
                </div>
                <div class="row">
                    <div class="col-md-6">
                        <div class="mb-3">
                            <strong>Expérience :</strong> ${ad.experience || 0} an(s)
                        </div>
                    </div>
                    <div class="col-md-6">
                        <div class="mb-3">
                            <strong>Téléphone :</strong> ${ad.phone || 'Non spécifié'}
                        </div>
                    </div>
                </div>
                ${ad.email ? `
                <div class="mb-3">
                    <strong>Email :</strong> ${ad.email}
                </div>
                ` : ''}
                ${ad.website ? `
                <div class="mb-3">
                    <strong>Site web :</strong> 
                    <a href="${ad.website}" target="_blank" class="text-primary">${ad.website}</a>
                </div>
                ` : ''}
                ${ad.certifications ? `
                <div class="mb-3">
                    <strong>Certifications :</strong> ${ad.certifications}
                </div>
                ` : ''}
            `;

        default:
            return `
                <div class="alert alert-warning">
                    <i class="fas fa-exclamation-triangle me-2"></i>
                    Type d'annonce non reconnu
                </div>
                <pre>${JSON.stringify(ad, null, 2)}</pre>
            `;
    }
}

function showAdDetailsModal(content, adId, adType) {
    const modalHTML = `
        <div class="modal fade" id="adDetailsModal" tabindex="-1">
            <div class="modal-dialog modal-xl">
                <div class="modal-content">
                    <div class="modal-header bg-primary text-white">
                        <h5 class="modal-title">
                            <i class="fas fa-search me-2"></i>
                            Détails de l'annonce - ${getAdTypeLabel(adType)}
                        </h5>
                        <button type="button" class="btn-close" data-bs-dismiss="modal"></button>
                    </div>
                    <div class="modal-body" style="max-height: 70vh; overflow-y: auto;">
                        ${content}
                    </div>
                </div>
            </div>
        </div>
    `;

    // Supprimer le modal existant
    const existingModal = document.getElementById('adDetailsModal');
    if (existingModal) existingModal.remove();

    // Ajouter le nouveau modal
    document.body.insertAdjacentHTML('beforeend', modalHTML);
    
    // Afficher le modal
    const modal = new bootstrap.Modal(document.getElementById('adDetailsModal'));
    modal.show();
}

// ========== FONCTIONS D'ACTION DEPUIS LE MODAL ==========
async function approveAdFromModal(adId, adType) {
    const modal = bootstrap.Modal.getInstance(document.getElementById('adDetailsModal'));
    if (modal) modal.hide();
    
    setTimeout(() => {
        approveAd(adId, adType);
    }, 300);
}

async function rejectAdFromModal(adId, adType) {
    const modal = bootstrap.Modal.getInstance(document.getElementById('adDetailsModal'));
    if (modal) modal.hide();
    
    setTimeout(() => {
        rejectAd(adId, adType);
    }, 300);
}

async function deleteAnnounceFromModal(adId, adType) {
    const modal = bootstrap.Modal.getInstance(document.getElementById('adDetailsModal'));
    if (modal) modal.hide();
    
    setTimeout(() => {
        deleteAnnounce(adId, adType);
    }, 300);
}

function getCollectionName(adType) {
    const collections = {
        'marketplace': 'marketplace_posts',
        'realestate': 'realestate_posts',
        'jobs': 'job_posts',
        'freelancers': 'freelancers',
        'professionals': 'professionals'
    };
    return collections[adType] || adType;
}

// ========== GESTION ADSENSE CORRIGÉE ==========
async function loadAdsenseSlots() {
    if (!checkAdminAccess()) return;
    
    console.log('📢 Chargement des slots Adsense...');
    
    try {
        // CORRECTION : Vérifier si la collection existe, sinon l'initialiser
        let slots = await btpDB.get('adsense_slots');
        
        // Si pas de slots, initialiser les slots par défaut
        if (!slots || slots.length === 0) {
            console.log('🔄 Initialisation automatique des slots Adsense...');
            await initializeAdsenseSlots();
            slots = await btpDB.get('adsense_slots');
        }
        
        const container = document.getElementById('adsense-slots-container');
        
        if (!container) {
            console.warn('❌ Container Adsense non trouvé');
            return;
        }
        
        let html = '';
        
        if (!slots || slots.length === 0) {
            html = `
            <div class="text-center py-4 text-muted">
                <i class="fas fa-ad fa-3x mb-3"></i>
                <div class="h5">Aucun slot Adsense configuré</div>
                <small>Configurez vos emplacements publicitaires</small>
                <div class="mt-3">
                    <button class="btn btn-primary" onclick="initializeAdsenseSlots()">
                        <i class="fas fa-plus me-1"></i>Initialiser les slots par défaut
                    </button>
                </div>
            </div>`;
        } else {
            slots.forEach(slot => {
                const isActive = slot.isActive !== false;
                html += `
                <div class="card mb-3">
                    <div class="card-header d-flex justify-content-between align-items-center">
                        <h6 class="mb-0">
                            <i class="fas fa-ad me-2"></i>${slot.name}
                        </h6>
                        <div>
                            <span class="badge bg-secondary me-2">${slot.position}</span>
                            <span class="badge ${isActive ? 'bg-success' : 'bg-secondary'}">
                                <i class="fas fa-${isActive ? 'check' : 'pause'} me-1"></i>
                                ${isActive ? 'Actif' : 'Inactif'}
                            </span>
                        </div>
                    </div>
                    <div class="card-body">
                        <div class="mb-3">
                            <label class="form-label">Code Adsense</label>
                            <textarea class="form-control" rows="4" placeholder="Collez votre code Adsense ici..." id="adsense-code-${slot.id}">${slot.code || ''}</textarea>
                            <div class="form-text">
                                Insérez le code fourni par Google Adsense pour cet emplacement
                            </div>
                        </div>
                        <div class="d-flex gap-2 flex-wrap">
                            <button class="btn btn-primary" onclick="saveAdsenseSlot('${slot.id}')">
                                <i class="fas fa-save me-1"></i>Enregistrer
                            </button>
                            <button class="btn btn-outline-${isActive ? 'warning' : 'success'}" onclick="toggleAdsenseSlot('${slot.id}', ${!isActive})">
                                <i class="fas fa-${isActive ? 'pause' : 'play'} me-1"></i>${isActive ? 'Désactiver' : 'Activer'}
                            </button>
                            <button class="btn btn-outline-info" onclick="previewAdsenseSlot('${slot.id}')">
                                <i class="fas fa-eye me-1"></i>Prévisualiser
                            </button>
                        </div>
                    </div>
                </div>`;
            });
        }
        
        container.innerHTML = html;
        console.log(`✅ ${slots ? slots.length : 0} slots Adsense chargés`);
        
    } catch (error) {
        console.error('❌ Erreur chargement Adsense:', error);
        showAlert('❌ Erreur lors du chargement des slots Adsense', 'error');
    }
}

async function initializeAdsenseSlots() {
    if (!checkAdminAccess()) return;
    
    const defaultSlots = [
        {
            id: 'header_ad',
            name: 'Bannière Header',
            position: 'header',
            code: '<ins class="adsbygoogle" style="display:block" data-ad-client="ca-pub-XXXXXXXXXXXXXX" data-ad-slot="XXXXXXXXXX" data-ad-format="auto"></ins>',
            isActive: true,
            createdAt: new Date().toISOString()
        },
        {
            id: 'sidebar_ad', 
            name: 'Sidebar Droite',
            position: 'sidebar',
            code: '<ins class="adsbygoogle" style="display:block" data-ad-client="ca-pub-XXXXXXXXXXXXXX" data-ad-slot="XXXXXXXXXX" data-ad-format="rectangle"></ins>',
            isActive: true,
            createdAt: new Date().toISOString()
        },
        {
            id: 'footer_ad',
            name: 'Bannière Footer',
            position: 'footer', 
            code: '<ins class="adsbygoogle" style="display:block" data-ad-client="ca-pub-XXXXXXXXXXXXXX" data-ad-slot="XXXXXXXXXX" data-ad-format="auto"></ins>',
            isActive: true,
            createdAt: new Date().toISOString()
        },
        {
            id: 'content_ad',
            name: 'Intégré Contenu',
            position: 'content',
            code: '<ins class="adsbygoogle" style="display:block" data-ad-client="ca-pub-XXXXXXXXXXXXXX" data-ad-slot="XXXXXXXXXX" data-ad-format="auto"></ins>',
            isActive: true,
            createdAt: new Date().toISOString()
        }
    ];
    
    try {
        // Vérifier si les slots existent déjà
        const existingSlots = await btpDB.get('adsense_slots');
        
        if (existingSlots && existingSlots.length > 0) {
            showAlert('ℹ️ Les slots Adsense sont déjà initialisés', 'info');
            return;
        }
        
        // Créer les slots par défaut
        for (const slot of defaultSlots) {
            await btpDB.post('adsense_slots', slot);
        }
        
        showAlert('✅ Slots Adsense initialisés avec succès', 'success');
        loadAdsenseSlots();
        
    } catch (error) {
        console.error('❌ Erreur initialisation slots:', error);
        showAlert('❌ Erreur lors de l\'initialisation des slots Adsense', 'error');
    }
}

async function saveAdsenseSlot(slotId) {
    if (!checkAdminAccess()) return;
    
    const codeTextarea = document.getElementById(`adsense-code-${slotId}`);
    const code = codeTextarea?.value.trim();
    
    if (!code) {
        showAlert('❌ Veuillez entrer un code Adsense', 'error');
        return;
    }
    
    console.log(`💾 Sauvegarde slot Adsense ${slotId}`);
    
    try {
        await btpDB.put('adsense_slots', slotId, { 
            code: code,
            updatedAt: new Date().toISOString(),
            updatedBy: authState.currentUser.id
        });
        
        showAlert('✅ Code Adsense enregistré avec succès', 'success');
        
    } catch (error) {
        console.error('❌ Erreur sauvegarde Adsense:', error);
        showAlert('❌ Erreur lors de la sauvegarde', 'error');
    }
}

async function toggleAdsenseSlot(slotId, newState) {
    if (!checkAdminAccess()) return;
    
    console.log(`🔧 ${newState ? 'Activation' : 'Désactivation'} slot Adsense ${slotId}`);
    
    try {
        await btpDB.put('adsense_slots', slotId, { 
            isActive: newState,
            updatedAt: new Date().toISOString(),
            updatedBy: authState.currentUser.id
        });
        
        showAlert(`✅ Slot ${newState ? 'activé' : 'désactivé'} avec succès`, 'success');
        loadAdsenseSlots();
        
    } catch (error) {
        console.error('❌ Erreur changement état Adsense:', error);
        showAlert('❌ Erreur lors de la modification', 'error');
    }
}

function previewAdsenseSlot(slotId) {
    showAlert(`👁️ Prévisualisation du slot ${slotId} - Fonctionnalité en développement`, 'info');
}

// ========== GESTION DES UTILISATEURS ==========
async function blockUser(userId) {
    if (!checkAdminAccess()) return;
    
    if (!confirm('Êtes-vous sûr de vouloir bloquer cet utilisateur ? Il ne pourra plus se connecter.')) return;
    
    console.log(`🚫 Blocage utilisateur ${userId}`);
    
    try {
        await btpDB.put('users', userId, { 
            isBlocked: true,
            blockedAt: new Date().toISOString(),
            blockedBy: authState.currentUser.id
        });
        showAlert('✅ Utilisateur bloqué avec succès', 'success');
        loadUsersTable();
    } catch (error) {
        console.error('❌ Erreur blocage utilisateur:', error);
        showAlert('❌ Erreur lors du blocage', 'error');
    }
}

async function unblockUser(userId) {
    if (!checkAdminAccess()) return;
    
    if (!confirm('Êtes-vous sûr de vouloir débloquer cet utilisateur ?')) return;
    
    console.log(`🔓 Déblocage utilisateur ${userId}`);
    
    try {
        await btpDB.put('users', userId, { 
            isBlocked: false,
            unblockedAt: new Date().toISOString(),
            unblockedBy: authState.currentUser.id
        });
        showAlert('✅ Utilisateur débloqué avec succès', 'success');
        loadUsersTable();
    } catch (error) {
        console.error('❌ Erreur déblocage utilisateur:', error);
        showAlert('❌ Erreur lors du déblocage', 'error');
    }
}

async function makeAdmin(userId) {
    if (!checkAdminAccess()) return;
    
    if (!confirm('Êtes-vous sûr de vouloir donner les droits administrateur à cet utilisateur ? Il aura accès à toutes les fonctionnalités admin.')) return;
    
    console.log(`👑 Promotion admin utilisateur ${userId}`);
    
    try {
        await btpDB.put('users', userId, { 
            role: 'admin',
            promotedAt: new Date().toISOString(),
            promotedBy: authState.currentUser.id
        });
        showAlert('✅ Utilisateur promu administrateur avec succès', 'success');
        loadUsersTable();
    } catch (error) {
        console.error('❌ Erreur promotion admin:', error);
        showAlert('❌ Erreur lors de la promotion', 'error');
    }
}

// ========== FONCTIONS UTILITAIRES ==========
function checkAdminAccess() {
    console.log('🔐 Vérification accès admin (admin.js):', {
        user: !!authState.currentUser,
        admin: authState.isAdmin,
        userRole: authState.currentUser?.role
    });
    
    // VÉRIFICATION RENFORCÉE - DOUBLE CONTRÔLE
    if (!authState.currentUser) {
        console.warn('❌ Tentative d\'accès admin sans utilisateur connecté');
        showAlert('❌ Vous devez être connecté pour accéder à l\'administration', 'error');
        setTimeout(() => goToSection('home'), 1500);
        return false;
    }
    
    if (!authState.isAdmin) {
        console.warn('❌ Tentative d\'accès admin sans permission administrateur');
        showAlert('❌ Accès réservé aux administrateurs', 'error');
        setTimeout(() => goToSection('home'), 1500);
        return false;
    }
    
    console.log('✅ Accès admin autorisé dans admin.js');
    return true;
}

function refreshAdminData() {
    if (!checkAdminAccess()) return;
    
    console.log('🔄 Actualisation des données admin...');
    showLoading(true);
    
    Promise.all([
        loadAdminStats(),
        loadUsersTable(),
        loadPendingModeration(),
        loadAdsenseSlots()
    ]).finally(() => {
        setTimeout(() => showLoading(false), 500);
    });
}

// ========== FONCTION DE SYNCHRONISATION FORCÉE ==========
async function forceSyncData() {
    if (!checkAdminAccess()) return;
    
    if (!confirm('⚠️ Voulez-vous forcer la synchronisation des données locales vers Firebase ?\n\nCette opération peut prendre quelques minutes.')) {
        return;
    }
    
    showLoading(true);
    
    try {
        const success = await btpDB.forceSyncToFirebase();
        
        if (success) {
            showAlert('✅ Synchronisation forcée vers Firebase réussie !', 'success');
        } else {
            showAlert('⚠️ Synchronisation partielle, vérifiez la console', 'warning');
        }
    } catch (error) {
        console.error('❌ Erreur synchronisation forcée:', error);
        showAlert('❌ Erreur lors de la synchronisation', 'error');
    } finally {
        showLoading(false);
    }
}

// ========== INITIALISATION DE L'ADMIN ==========
document.addEventListener('DOMContentLoaded', function() {
    console.log('👑 Initialisation du module admin...');
});

// ========== EXPORT DES FONCTIONS ==========
window.loadAdminStats = loadAdminStats;
window.loadUsersTable = loadUsersTable;
window.loadPendingModeration = loadPendingModeration;
window.loadAdsenseSlots = loadAdsenseSlots;
window.initializeAdsenseSlots = initializeAdsenseSlots;
window.approveAd = approveAd;
window.rejectAd = rejectAd;
window.viewAdDetails = viewAdDetails;
window.deleteAnnounce = deleteAnnounce;
window.saveAdsenseSlot = saveAdsenseSlot;
window.previewAdsenseSlot = previewAdsenseSlot;
window.toggleAdsenseSlot = toggleAdsenseSlot;
window.blockUser = blockUser;
window.unblockUser = unblockUser;
window.makeAdmin = makeAdmin;
window.editUser = editUser;
window.viewUserDetails = viewUserDetails;
window.refreshAdminData = refreshAdminData;
window.checkAdminAccess = checkAdminAccess;
window.forceSyncData = forceSyncData;

// Nouvelles fonctions de modération détaillée
window.approveAdFromModal = approveAdFromModal;
window.rejectAdFromModal = rejectAdFromModal;
window.deleteAnnounceFromModal = deleteAnnounceFromModal;

// Nouvelles fonctions pour la gestion des utilisateurs
window.saveUserChanges = saveUserChanges;

// Nouvelles fonctions de suppression
window.deleteUser = deleteUser;
window.showDeleteUserModal = showDeleteUserModal;
window.confirmDeleteUser = confirmDeleteUser;

console.log('✅ admin.js CORRIGÉ - Fonction de synchronisation forcée ajoutée');