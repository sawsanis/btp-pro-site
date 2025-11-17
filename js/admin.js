// ========== FONCTIONS ADMIN CORRIGÉES ==========

// Fonction de validation et nettoyage des données utilisateur
function validateAndCleanUser(user) {
    if (!user) {
        console.error('❌ Utilisateur null ou undefined');
        return createDefaultUser();
    }
    
    // Créer une copie pour éviter la mutation
    const cleanedUser = { ...user };
    
    // VALIDATION DES CHAMPS OBLIGATOIRES
    const requiredFields = ['prenom', 'nom', 'email'];
    requiredFields.forEach(field => {
        if (!cleanedUser[field] || cleanedUser[field].trim() === '') {
            console.warn(`⚠️ Champ ${field} manquant pour l'utilisateur ${cleanedUser.id}`, cleanedUser);
            
            // Valeurs par défaut intelligentes
            switch(field) {
                case 'prenom':
                    cleanedUser.prenom = 'Prénom';
                    break;
                case 'nom':
                    cleanedUser.nom = 'Nom';
                    break;
                case 'email':
                    cleanedUser.email = 'email@manquant.com';
                    break;
            }
        } else {
            // Nettoyage des chaînes
            cleanedUser[field] = cleanedUser[field].trim();
        }
    });
    
    // VALIDATION DES CHAMPS OPTIONNELS
    const optionalFields = ['phone', 'city', 'profession'];
    optionalFields.forEach(field => {
        if (cleanedUser[field] === null || cleanedUser[field] === undefined) {
            cleanedUser[field] = '';
        } else {
            cleanedUser[field] = String(cleanedUser[field]).trim();
        }
    });
    
    // VALIDATION DES BOOLÉENS
    cleanedUser.isBlocked = Boolean(cleanedUser.isBlocked);
    cleanedUser.hasPremium = Boolean(cleanedUser.hasPremium);
    cleanedUser.emailVerified = Boolean(cleanedUser.emailVerified);
    
    // VALIDATION DES NOMBRES
    cleanedUser.visitCount = Number(cleanedUser.visitCount) || 0;
    
    // VALIDATION DES DATES
    const dateFields = ['createdAt', 'lastVisit', 'lastLogin', 'updatedAt'];
    dateFields.forEach(field => {
        if (cleanedUser[field] && !isNaN(new Date(cleanedUser[field]).getTime())) {
            // Date valide - la conserver
            cleanedUser[field] = cleanedUser[field];
        } else if (field === 'createdAt' && !cleanedUser[field]) {
            // createdAt est obligatoire
            cleanedUser[field] = new Date().toISOString();
        } else {
            // Date invalide - la supprimer
            cleanedUser[field] = null;
        }
    });
    
    // VALIDATION DU ROLE
    if (!cleanedUser.role || !['user', 'admin'].includes(cleanedUser.role)) {
        cleanedUser.role = 'user';
    }
    
    console.log(`✅ Utilisateur ${cleanedUser.id} validé:`, {
        prenom: cleanedUser.prenom,
        nom: cleanedUser.nom,
        email: cleanedUser.email
    });
    
    return cleanedUser;
}

function createDefaultUser() {
    return {
        id: 'default-' + Date.now(),
        prenom: 'Utilisateur',
        nom: 'Inconnu',
        email: 'inconnu@btppro.com',
        phone: '',
        city: '',
        profession: '',
        role: 'user',
        isBlocked: false,
        hasPremium: false,
        emailVerified: false,
        visitCount: 0,
        createdAt: new Date().toISOString(),
        lastVisit: null,
        lastLogin: null
    };
}

// Fonction de réparation des données utilisateur
async function repairUserData() {
    if (!checkAdminAccess()) return;
    
    console.log('🔧 Début de la réparation des données utilisateur...');
    
    try {
        const users = await btpDB.get('users');
        let repairedCount = 0;
        
        for (const user of users) {
            const userBefore = { ...user };
            const userAfter = validateAndCleanUser(user);
            
            // Vérifier si des corrections ont été apportées
            const needsRepair = JSON.stringify(userBefore) !== JSON.stringify(userAfter);
            
            if (needsRepair) {
                console.log(`🔧 Réparation utilisateur ${user.id}:`, {
                    avant: userBefore,
                    après: userAfter
                });
                
                // Sauvegarder les corrections
                await btpDB.put('users', user.id, userAfter);
                repairedCount++;
            }
        }
        
        if (repairedCount > 0) {
            showAlert(`✅ ${repairedCount} utilisateur(s) réparé(s) avec succès`, 'success');
            console.log(`✅ Réparation terminée: ${repairedCount} utilisateurs corrigés`);
        } else {
            showAlert('ℹ️ Aucune réparation nécessaire - données déjà valides', 'info');
            console.log('ℹ️ Aucune réparation nécessaire');
        }
        
        // Recharger le tableau
        loadUsersTable();
        
    } catch (error) {
        console.error('❌ Erreur lors de la réparation:', error);
        showAlert('❌ Erreur lors de la réparation des données', 'error');
    }
}

async function loadAdminStats() {
    console.log('🔍 Vérification accès admin...', {
        currentUser: !!appState.currentUser,
        isAdmin: appState.isAdmin
    });
    
    // VÉRIFICATION RENFORCÉE DE LA SÉCURITÉ
    if (!appState.currentUser) {
        console.warn('❌ Accès admin refusé - Utilisateur non connecté');
        showAlert('❌ Vous devez être connecté pour accéder à l\'administration', 'error');
        setTimeout(() => goToSection('home'), 1000);
        return;
    }
    
    if (!appState.isAdmin) {
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
    
    console.log('👥 DEBUG - Chargement tableau utilisateurs avec corrections');
    
    try {
        const users = await btpDB.get('users');
        
        // DEBUG COMPLET - Analyser la structure des données
        console.group('🔍 DEBUG STRUCTURE UTILISATEURS');
        console.log('📊 Nombre total d\'utilisateurs:', users.length);
        
        if (users.length > 0) {
            // Analyser le premier utilisateur en détail
            const firstUser = users[0];
            console.log('👤 Premier utilisateur complet:', firstUser);
            console.log('📋 Structure des clés:', Object.keys(firstUser));
            
            // Vérifier chaque champ important
            const importantFields = ['prenom', 'nom', 'email', 'phone', 'city', 'profession'];
            importantFields.forEach(field => {
                console.log(`📍 ${field}:`, {
                    value: firstUser[field],
                    exists: field in firstUser,
                    type: typeof firstUser[field],
                    isNull: firstUser[field] === null,
                    isUndefined: firstUser[field] === undefined,
                    isEmptyString: firstUser[field] === ''
                });
            });
        }
        console.groupEnd();
        
        // VALIDATION DE TOUS LES UTILISATEURS
        const validatedUsers = users.map(user => validateAndCleanUser(user));
        
        const tableBody = document.getElementById('users-table-body');
        
        if (!tableBody) {
            console.warn('❌ Tableau des utilisateurs non trouvé');
            return;
        }
        
        let html = '';
        
        if (validatedUsers.length === 0) {
            html = '<tr><td colspan="7" class="text-center text-muted py-4">Aucun utilisateur inscrit</td></tr>';
        } else {
            validatedUsers.forEach((user, index) => {
                // DEBUG AVANT AFFICHAGE
                console.log(`👤 DEBUG Affichage utilisateur ${index}:`, {
                    id: user.id,
                    prenom: user.prenom,
                    nom: user.nom,
                    email: user.email,
                    hasPrenom: !!user.prenom,
                    hasNom: !!user.nom,
                    hasEmail: !!user.email
                });
                
                // UTILISATION DES DONNÉES VALIDÉES - PLUS BESOIN DE "Non renseigné"
                const prenom = user.prenom;
                const nom = user.nom;
                const email = user.email;
                const phone = user.phone || '';
                
                // Log si des champs étaient manquants avant validation
                if (user.prenom === 'Prénom' || user.nom === 'Nom' || user.email === 'email@manquant.com') {
                    console.warn(`⚠️ Données corrigées pour utilisateur ${user.id}`);
                }
                
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
                                    ${(prenom[0] || 'U') + (nom[0] || '')}
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
                        </div>
                    </td>
                </tr>`;
            });
        }
        
        tableBody.innerHTML = html;
        console.log(`✅ ${validatedUsers.length} utilisateurs validés chargés dans le tableau`);
        
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
                        <small class="text-muted">${error.message}</small>
                        <br>
                        <button class="btn btn-sm btn-primary mt-2" onclick="loadUsersTable()">
                            <i class="fas fa-redo me-1"></i>Réessayer
                        </button>
                    </td>
                </tr>`;
        }
    }
}

// ========== FONCTIONS DÉTAILS UTILISATEUR CORRIGÉES ==========

async function viewUserDetails(userId) {
    if (!checkAdminAccess()) return;
    
    console.log(`👤 Affichage détails utilisateur: ${userId}`);
    
    try {
        // Récupérer les données utilisateur complètes
        const user = await btpDB.get('users', userId);
        
        if (!user) {
            showAlert('❌ Utilisateur non trouvé', 'error');
            return;
        }

        // VALIDER LES DONNÉES AVANT AFFICHAGE
        const validatedUser = validateAndCleanUser(user);

        // Récupérer les statistiques de l'utilisateur
        const [userPosts, userApplications] = await Promise.all([
            getUserPostsCount(userId),
            getUserApplicationsCount(userId)
        ]);

        // Générer le contenu détaillé avec données validées
        const userDetailsHTML = generateUserDetailsContent(validatedUser, userPosts, userApplications);
        
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
    // UTILISATION DES DONNÉES DÉJÀ VALIDÉES - PLUS BESOIN DE "Non renseigné"
    const prenom = user.prenom;
    const nom = user.nom;
    const email = user.email;
    const phone = user.phone || 'Non renseigné';
    const city = user.city || 'Non renseignée';
    const profession = user.profession || 'Non renseignée';
    
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
                                    ${user.emailVerified ? '<span class="badge bg-success ms-2">Vérifié</span>' : '<span class="badge bg-warning ms-2">Non vérifié</span>'}
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
                                    <strong>Profession:</strong>
                                </div>
                                <div class="col-8">
                                    ${profession}
                                </div>
                            </div>
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
        const user = await btpDB.get('users', userId);
        
        if (!user) {
            showAlert('❌ Utilisateur non trouvé', 'error');
            return;
        }

        // VALIDER LES DONNÉES AVANT ÉDITION
        const validatedUser = validateAndCleanUser(user);
        showEditUserModal(validatedUser);
        
    } catch (error) {
        console.error('❌ Erreur chargement utilisateur:', error);
        showAlert('❌ Erreur lors du chargement des données utilisateur', 'error');
    }
}

function showEditUserModal(user) {
    // UTILISATION DES DONNÉES VALIDÉES
    const prenom = user.prenom;
    const nom = user.nom;
    const email = user.email;
    const phone = user.phone || '';
    const city = user.city || '';
    const profession = user.profession || '';
    
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
                                <label for="editProfession" class="form-label">Profession</label>
                                <input type="text" class="form-control" id="editProfession" value="${profession}">
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
        profession: document.getElementById('editProfession').value.trim(),
        isBlocked: document.querySelector('input[name="editStatus"]:checked').value === 'blocked',
        role: document.querySelector('input[name="editRole"]:checked').value,
        hasPremium: document.getElementById('editPremium').checked,
        updatedAt: new Date().toISOString(),
        updatedBy: appState.currentUser.id
    };
    
    // VALIDER LES DONNÉES AVANT SAUVEGARDE
    if (!updates.prenom || updates.prenom.trim() === '') {
        showAlert('❌ Le prénom est obligatoire', 'error');
        return;
    }
    
    if (!updates.nom || updates.nom.trim() === '') {
        showAlert('❌ Le nom est obligatoire', 'error');
        return;
    }
    
    if (!updates.email || updates.email.trim() === '') {
        showAlert('❌ L\'email est obligatoire', 'error');
        return;
    }
    
    if (updates.isBlocked) {
        updates.blockReason = document.getElementById('editBlockReason')?.value.trim() || 'Modifié par administrateur';
        updates.blockedAt = new Date().toISOString();
        updates.blockedBy = appState.currentUser.id;
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
            moderatedBy: appState.currentUser.id
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
            moderatedBy: appState.currentUser.id
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
        const ad = await btpDB.get(collectionName, adId);
        
        if (!ad) {
            showAlert('❌ Annonce non trouvée', 'error');
            return;
        }

        // Récupérer les informations utilisateur
        const user = await btpDB.get('users', ad.userId);
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

// ========== GESTION ADSENSE ==========
async function loadAdsenseSlots() {
    if (!checkAdminAccess()) return;
    
    console.log('📢 Chargement des slots Adsense...');
    
    try {
        const slots = await btpDB.get('adsense_slots');
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
                        <i class="fas fa-plus me-1"></i>Initialiser les slots
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
            code: '',
            isActive: false
        },
        {
            id: 'sidebar_ad', 
            name: 'Sidebar Droite',
            position: 'sidebar',
            code: '',
            isActive: false
        },
        {
            id: 'footer_ad',
            name: 'Bannière Footer',
            position: 'footer', 
            code: '',
            isActive: false
        }
    ];
    
    try {
        for (const slot of defaultSlots) {
            await btpDB.post('adsense_slots', slot);
        }
        
        showAlert('✅ Slots Adsense initialisés avec succès', 'success');
        loadAdsenseSlots();
        
    } catch (error) {
        console.error('❌ Erreur initialisation slots:', error);
        showAlert('❌ Erreur lors de l\'initialisation', 'error');
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
            updatedBy: appState.currentUser.id
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
            updatedBy: appState.currentUser.id
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
            blockedBy: appState.currentUser.id
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
            unblockedBy: appState.currentUser.id
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
            promotedBy: appState.currentUser.id
        });
        showAlert('✅ Utilisateur promu administrateur avec succès', 'success');
        loadUsersTable();
    } catch (error) {
        console.error('❌ Erreur promotion admin:', error);
        showAlert('❌ Erreur lors de la promotion', 'error');
    }
}

// ========== FONCTIONS POUR LES CANDIDATURES EMPLOI (ADMIN) ==========

async function loadJobApplicationsAdmin() {
    if (!checkAdminAccess()) return;
    
    console.log('📋 Chargement des candidatures (vue admin)...');
    
    try {
        const [applications, jobs] = await Promise.all([
            btpDB.get('job_applications'),
            btpDB.get('job_posts')
        ]);
        
        // Mettre à jour le compteur global
        window.jobApplicationsCount = {};
        applications.forEach(app => {
            window.jobApplicationsCount[app.jobId] = (window.jobApplicationsCount[app.jobId] || 0) + 1;
        });
        
        displayJobApplicationsAdmin(applications, jobs);
        
    } catch (error) {
        console.error('❌ Erreur chargement candidatures admin:', error);
        showAlert('❌ Erreur lors du chargement des candidatures', 'error');
    }
}

function displayJobApplicationsAdmin(applications, jobs) {
    const container = document.getElementById('admin-applications-container');
    
    if (!container) {
        console.warn('❌ Container applications admin non trouvé');
        return;
    }
    
    if (!applications || applications.length === 0) {
        container.innerHTML = `
            <div class="col-12 text-center py-5">
                <i class="fas fa-file-alt fa-3x text-muted mb-3"></i>
                <h5 class="text-muted">Aucune candidature reçue</h5>
                <p class="text-muted">Les candidatures aux offres d'emploi apparaîtront ici</p>
                <p class="text-info small">👑 Vue administrateur - Toutes les candidatures</p>
            </div>
        `;
        return;
    }
    
    let html = `
        <div class="d-flex justify-content-between align-items-center mb-4">
            <h5>
                <i class="fas fa-users me-2 text-warning"></i>
                Candidatures - Vue Admin
                <span class="badge bg-danger ms-2">Vue Globale</span>
            </h5>
            <div class="text-muted small">
                ${applications.length} candidature(s) au total
            </div>
        </div>
        
        <div class="row mb-4">
            <div class="col-md-3">
                <div class="card bg-primary text-white">
                    <div class="card-body text-center">
                        <i class="fas fa-clock fa-2x mb-2"></i>
                        <h4>${applications.filter(app => app.status === 'en_attente').length}</h4>
                        <p class="mb-0">En attente</p>
                    </div>
                </div>
            </div>
            <div class="col-md-3">
                <div class="card bg-warning text-white">
                    <div class="card-body text-center">
                        <i class="fas fa-play fa-2x mb-2"></i>
                        <h4>${applications.filter(app => app.status === 'en_cours').length}</h4>
                        <p class="mb-0">En cours</p>
                    </div>
                </div>
            </div>
            <div class="col-md-3">
                <div class="card bg-success text-white">
                    <div class="card-body text-center">
                        <i class="fas fa-check fa-2x mb-2"></i>
                        <h4>${applications.filter(app => app.status === 'accepte').length}</h4>
                        <p class="mb-0">Acceptées</p>
                    </div>
                </div>
            </div>
            <div class="col-md-3">
                <div class="card bg-danger text-white">
                    <div class="card-body text-center">
                        <i class="fas fa-times fa-2x mb-2"></i>
                        <h4>${applications.filter(app => app.status === 'rejete').length}</h4>
                        <p class="mb-0">Rejetées</p>
                    </div>
                </div>
            </div>
        </div>
    `;
    
    const applicationsByJob = {};
    applications.forEach(app => {
        if (!applicationsByJob[app.jobId]) {
            applicationsByJob[app.jobId] = [];
        }
        applicationsByJob[app.jobId].push(app);
    });
    
    Object.keys(applicationsByJob).forEach(jobId => {
        const jobApplications = applicationsByJob[jobId];
        const job = jobs.find(j => j.id === jobId);
        
        const jobTitle = job ? `${job.poste} - ${job.ville}` : `Offre #${jobId} (supprimée)`;
        const jobAuthor = job ? `par ${job.userName}` : '';
        
        html += `
        <div class="card mb-4">
            <div class="card-header bg-light d-flex justify-content-between align-items-center">
                <h5 class="mb-0">
                    <i class="fas fa-briefcase me-2 text-warning"></i>
                    ${jobTitle}
                    <small class="text-muted">${jobAuthor}</small>
                </h5>
                <div>
                    <span class="badge bg-warning">${jobApplications.length} candidature(s)</span>
                    ${job ? `<button class="btn btn-sm btn-outline-primary ms-2" onclick="viewJobApplications('${job.id}')">
                        <i class="fas fa-eye me-1"></i>Voir
                    </button>` : ''}
                </div>
            </div>
            <div class="card-body">
                <div class="table-responsive">
                    <table class="table table-sm table-striped">
                        <thead>
                            <tr>
                                <th>Candidat</th>
                                <th>Contact</th>
                                <th>Expérience</th>
                                <th>Date</th>
                                <th>Statut</th>
                                <th>Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            ${jobApplications.map(app => `
                            <tr>
                                <td>
                                    <strong>${app.candidateName}</strong>
                                    <br><small class="text-muted">ID: ${app.candidateId}</small>
                                </td>
                                <td>
                                    <div>📧 ${app.candidateEmail}</div>
                                    <div>📞 ${app.candidatePhone}</div>
                                </td>
                                <td>${app.experience || 'Non précisée'}</td>
                                <td>
                                    <small class="text-muted">
                                        ${formatDate(app.createdAt)}
                                    </small>
                                </td>
                                <td>
                                    <span class="badge ${getStatusBadgeClass(app.status)}">
                                        ${getStatusLabel(app.status)}
                                    </span>
                                </td>
                                <td>
                                    <div class="btn-group btn-group-sm">
                                        <button class="btn btn-outline-primary" onclick="viewApplicationDetails('${app.id}')" title="Voir détails">
                                            <i class="fas fa-eye"></i>
                                        </button>
                                        <button class="btn btn-outline-success" onclick="changeApplicationStatus('${app.id}', 'en_cours')" title="En cours">
                                            <i class="fas fa-play"></i>
                                        </button>
                                        <button class="btn btn-outline-warning" onclick="changeApplicationStatus('${app.id}', 'en_attente')" title="En attente">
                                            <i class="fas fa-pause"></i>
                                        </button>
                                        <button class="btn btn-outline-danger" onclick="changeApplicationStatus('${app.id}', 'rejete')" title="Rejeter">
                                            <i class="fas fa-times"></i>
                                        </button>
                                    </div>
                                </td>
                            </tr>
                            `).join('')}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
        `;
    });
    
    container.innerHTML = html;
    console.log(`✅ ${applications.length} candidatures affichées (vue admin)`);
}

// ========== FONCTIONS DE SAUVEGARDE CORRIGÉES ==========

async function exportBackup() {
    if (!checkAdminAccess()) return;
    
    console.log('💾 Début de l\'export de sauvegarde...');
    showLoading(true);
    
    try {
        // ✅ UTILISATION DIRECTE DU SYSTÈME EXPORT-IMPORT
        if (typeof exportImportManager !== 'undefined') {
            await exportImportManager.createFullBackup();
            await exportImportManager.downloadBackup();
        } else {
            throw new Error('Système d\'export non disponible');
        }
        
    } catch (error) {
        console.error('❌ Erreur export sauvegarde:', error);
        showAlert(`❌ Erreur lors de l'export: ${error.message}`, 'error');
    } finally {
        showLoading(false);
    }
}

async function importBackup(event) {
    if (!checkAdminAccess()) return;
    
    const file = event.target.files[0];
    if (!file) return;
    
    // Vérification de la taille
    if (file.size > 10 * 1024 * 1024) {
        showAlert('❌ Le fichier est trop volumineux (max. 10MB)', 'error');
        event.target.value = '';
        return;
    }
    
    console.log('📤 Import de sauvegarde...');
    showLoading(true);
    
    try {
        // ✅ UTILISATION DIRECTE DU SYSTÈME EXPORT-IMPORT
        if (typeof exportImportManager !== 'undefined') {
            if (!confirm('⚠️ ATTENTION: Cette action va écraser les données existantes. Voulez-vous continuer ?')) {
                return;
            }
            
            await exportImportManager.restoreFromBackup(file);
        } else {
            throw new Error('Système d\'import non disponible');
        }
        
    } catch (error) {
        console.error('❌ Erreur import sauvegarde:', error);
        showAlert(`❌ Erreur lors de l'import: ${error.message}`, 'error');
    } finally {
        showLoading(false);
        event.target.value = '';
    }
}

async function sendBackupByEmail() {
    if (!checkAdminAccess()) return;
    
    console.log('📧 Envoi de sauvegarde par email...');
    showLoading(true);
    
    try {
        // ✅ UTILISATION DIRECTE DU SYSTÈME EXPORT-IMPORT
        if (typeof exportImportManager !== 'undefined') {
            await exportImportManager.sendBackupByEmail();
        } else {
            throw new Error('Système d\'envoi email non disponible');
        }
        
    } catch (error) {
        console.error('❌ Erreur envoi email:', error);
        showAlert(`❌ Erreur lors de l'envoi par email: ${error.message}`, 'error');
    } finally {
        showLoading(false);
    }
}

function showBackupSection() {
    const backupHTML = `
        <div class="row">
            <div class="col-12">
                <div class="card">
                    <div class="card-header bg-warning text-white">
                        <h5 class="mb-0">
                            <i class="fas fa-database me-2"></i>
                            Sauvegarde des Données
                        </h5>
                    </div>
                    <div class="card-body">
                        <div class="alert alert-info">
                            <i class="fas fa-info-circle me-2"></i>
                            <strong>Nouveau système de sauvegarde :</strong> Utilisez les fonctions optimisées pour exporter, importer et sauvegarder vos données.
                        </div>
                        
                        <!-- BOUTONS SIMPLIFIÉS UTILISANT LE SYSTÈME EXPORT-IMPORT -->
                        <div class="row text-center">
                            <div class="col-md-4 mb-3">
                                <div class="card h-100">
                                    <div class="card-body">
                                        <i class="fas fa-download fa-3x text-primary mb-3"></i>
                                        <h5>Exporter</h5>
                                        <p class="text-muted">Sauvegarde complète en JSON</p>
                                        <button class="btn btn-primary w-100" onclick="exportBackup()">
                                            <i class="fas fa-file-export me-2"></i>Télécharger
                                        </button>
                                    </div>
                                </div>
                            </div>
                            
                            <div class="col-md-4 mb-3">
                                <div class="card h-100">
                                    <div class="card-body">
                                        <i class="fas fa-upload fa-3x text-success mb-3"></i>
                                        <h5>Importer</h5>
                                        <p class="text-muted">Restaurer depuis un fichier</p>
                                        <input type="file" id="backupFileInput" accept=".json" 
                                               class="form-control" onchange="importBackup(event)">
                                        <div class="form-text small">
                                            Fichier .json de sauvegarde
                                        </div>
                                    </div>
                                </div>
                            </div>
                            
                            <div class="col-md-4 mb-3">
                                <div class="card h-100">
                                    <div class="card-body">
                                        <i class="fas fa-envelope fa-3x text-info mb-3"></i>
                                        <h5>Email</h5>
                                        <p class="text-muted">Envoyer par email</p>
                                        <button class="btn btn-info w-100" onclick="sendBackupByEmail()">
                                            <i class="fas fa-paper-plane me-2"></i>Envoyer
                                        </button>
                                    </div>
                                </div>
                            </div>
                        </div>
                        
                        <!-- NOUVELLE SECTION POUR LE SYSTÈME COMPLET -->
                        <div class="row mt-4">
                            <div class="col-12">
                                <div class="card border-primary">
                                    <div class="card-header bg-primary text-white">
                                        <h6 class="mb-0">
                                            <i class="fas fa-cogs me-2"></i>
                                            Système Complet de Sauvegarde
                                        </h6>
                                    </div>
                                    <div class="card-body">
                                        <p class="mb-3">
                                            Accédez à l'interface complète de sauvegarde et restauration avec plus d'options.
                                        </p>
                                        <button class="btn btn-outline-primary" onclick="exportImportManager.showBackupModal()">
                                            <i class="fas fa-tools me-2"></i>Ouvrir le Panneau de Sauvegarde
                                        </button>
                                    </div>
                                </div>
                            </div>
                        </div>
                        
                        <!-- STATISTIQUES SIMPLIFIÉES -->
                        <div class="row mt-4">
                            <div class="col-12">
                                <div class="card">
                                    <div class="card-header">
                                        <h6 class="mb-0">Statistiques des Données</h6>
                                    </div>
                                    <div class="card-body">
                                        <div id="backupStats">
                                            <div class="spinner-border spinner-border-sm" role="status">
                                                <span class="visually-hidden">Chargement...</span>
                                            </div>
                                            Chargement des statistiques...
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    `;
    
    const container = document.getElementById('backup-container');
    if (container) {
        container.innerHTML = backupHTML;
        loadBackupStats();
    }
}

// Charger les statistiques (version simplifiée)
async function loadBackupStats() {
    try {
        const collections = ['users', 'marketplace_posts', 'realestate_posts', 'job_posts', 'job_applications'];
        let statsHTML = '';
        let totalRecords = 0;
        
        for (const collection of collections) {
            try {
                const data = await btpDB.get(collection);
                const count = data?.length || 0;
                totalRecords += count;
                
                statsHTML += `
                    <div class="d-flex justify-content-between border-bottom py-2">
                        <span>${getCollectionLabel(collection)}</span>
                        <span class="badge bg-primary">${count}</span>
                    </div>
                `;
            } catch (error) {
                console.warn(`❌ Erreur statistiques ${collection}:`, error);
            }
        }
        
        const totalStats = `
            <div class="mt-3 p-2 bg-light rounded">
                <div class="d-flex justify-content-between">
                    <strong>Total enregistrements:</strong>
                    <span class="badge bg-success">${totalRecords}</span>
                </div>
                <div class="d-flex justify-content-between mt-1">
                    <strong>Collections:</strong>
                    <span class="badge bg-info">${collections.length}</span>
                </div>
                <div class="mt-2 text-center">
                    <small class="text-muted">
                        <i class="fas fa-info-circle me-1"></i>
                        Système de sauvegarde optimisé
                    </small>
                </div>
            </div>
        `;
        
        const statsContainer = document.getElementById('backupStats');
        if (statsContainer) {
            statsContainer.innerHTML = statsHTML + totalStats;
        }
        
    } catch (error) {
        console.error('❌ Erreur chargement statistiques:', error);
        const statsContainer = document.getElementById('backupStats');
        if (statsContainer) {
            statsContainer.innerHTML = `
                <div class="alert alert-warning">
                    <i class="fas fa-exclamation-triangle me-2"></i>
                    Erreur lors du chargement des statistiques
                </div>
            `;
        }
    }
}

// Fonction utilitaire pour les labels
function getCollectionLabel(collection) {
    const labels = {
        'users': '👥 Utilisateurs',
        'marketplace_posts': '🛍️ Marketplace',
        'realestate_posts': '🏠 Immobilier', 
        'job_posts': '💼 Offres d\'emploi',
        'job_applications': '📨 Candidatures'
    };
    return labels[collection] || collection;
}

// ========== FONCTIONS UTILITAIRES ==========
function checkAdminAccess() {
    console.log('🔐 Vérification accès admin (admin.js):', {
        user: !!appState.currentUser,
        admin: appState.isAdmin,
        userRole: appState.currentUser?.role
    });
    
    // VÉRIFICATION RENFORCÉE - DOUBLE CONTRÔLE
    if (!appState.currentUser) {
        console.warn('❌ Tentative d\'accès admin sans utilisateur connecté');
        showAlert('❌ Vous devez être connecté pour accéder à l\'administration', 'error');
        setTimeout(() => goToSection('home'), 1500);
        return false;
    }
    
    if (!appState.isAdmin) {
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
        loadAdsenseSlots(),
        loadJobApplicationsAdmin()
    ]).finally(() => {
        setTimeout(() => showLoading(false), 500);
    });
}

// ========== INITIALISATION DE L'ADMIN ==========
document.addEventListener('DOMContentLoaded', function() {
    console.log('👑 Initialisation du module admin...');
    
    // Ajouter le bouton de réparation
    setTimeout(() => {
        addRepairButton();
    }, 2000);
    
    // Initialiser les fonctionnalités newsletter lorsque l'admin est chargé
    setTimeout(() => {
        if (document.getElementById('admin-section')?.classList.contains('active')) {
            initNewsletterFeatures();
        }
    }, 1000);
});

// Ajouter le bouton de réparation dans l'interface
function addRepairButton() {
    const adminHeader = document.querySelector('#admin-section .card-header');
    if (adminHeader && !document.getElementById('repair-data-btn')) {
        const repairBtn = document.createElement('button');
        repairBtn.id = 'repair-data-btn';
        repairBtn.className = 'btn btn-warning btn-sm ms-2';
        repairBtn.innerHTML = '<i class="fas fa-tools me-1"></i>Réparer données';
        repairBtn.onclick = repairUserData;
        repairBtn.title = 'Réparer les données utilisateur manquantes';
        adminHeader.appendChild(repairBtn);
    }
}

// Surveiller les changements de section pour initialiser les fonctionnalités newsletter
let currentSection = '';
const observer = new MutationObserver(() => {
    const adminSection = document.getElementById('admin-section');
    if (adminSection && adminSection.classList.contains('active') && currentSection !== 'admin') {
        currentSection = 'admin';
        console.log('📧 Section admin détectée, initialisation newsletter...');
        setTimeout(initNewsletterFeatures, 500);
    }
});

observer.observe(document.body, {
    childList: true,
    subtree: true,
    attributes: true,
    attributeFilter: ['class']
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

// Nouvelles fonctions de modération détaillée
window.approveAdFromModal = approveAdFromModal;
window.rejectAdFromModal = rejectAdFromModal;
window.deleteAnnounceFromModal = deleteAnnounceFromModal;

// Nouvelles fonctions newsletter
window.initNewsletterFeatures = initNewsletterFeatures;
window.showImportRecipientsModal = showImportRecipientsModal;
window.handleFileImport = handleFileImport;
window.handleManualInput = handleManualInput;
window.processRecipientsImport = processRecipientsImport;

// Fonctions candidatures admin
window.loadJobApplicationsAdmin = loadJobApplicationsAdmin;

// Fonctions sauvegarde corrigées
window.exportBackup = exportBackup;
window.importBackup = importBackup;
window.sendBackupByEmail = sendBackupByEmail;
window.showBackupSection = showBackupSection;

// Nouvelles fonctions pour la gestion des utilisateurs
window.saveUserChanges = saveUserChanges;

// Nouvelles fonctions de réparation des données
window.validateAndCleanUser = validateAndCleanUser;
window.repairUserData = repairUserData;

console.log('✅ admin.js COMPLET - Toutes les fonctionnalités intégrées, Détails et Modifier utilisateurs OPÉRATIONNELS, Système de réparation des données activé');