// ========== GESTION AUTHENTIFICATION UNIFIÉE ET RENFORCÉE ==========
const authState = {
    currentUser: null,
    isAdmin: false,
    isAuthenticated: false
};

// Synchroniser avec appState existant
function syncAuthState() {
    if (typeof appState !== 'undefined') {
        appState.currentUser = authState.currentUser;
        appState.isAdmin = authState.isAdmin;
        appState.isAuthenticated = authState.isAuthenticated;
    }
    
    // Rafraîchir l'interface si l'application est initialisée
    if (typeof btpApp !== 'undefined' && btpApp.refreshAuthState) {
        btpApp.refreshAuthState();
    }
}

async function handleLogin() {
    const email = document.getElementById('loginEmail').value;
    const password = document.getElementById('loginPassword').value;
    
    if (!email || !password) {
        showAlert('❌ Veuillez remplir tous les champs', 'error');
        return;
    }
    
    showLoading(true);
    
    try {
        const user = await btpDB.authenticateUser(email, password);
        
        if (user) {
            if (user.isBlocked) {
                showAlert('❌ Votre compte a été bloqué. Contactez le support.', 'error');
                return;
            }
            
            // 🔥 CORRECTION: Vérification STRICTE du rôle admin
            const userIsAdmin = user.role === 'admin';
            
            // Mettre à jour l'état global UNIFIÉ
            authState.currentUser = user;
            authState.isAdmin = userIsAdmin;
            authState.isAuthenticated = true;
            syncAuthState();
            
            // ✅ SAUVEGARDE UNIFIÉE - UN SEUL POINT DE VÉRITÉ
            localStorage.setItem('btp_pro_user', JSON.stringify({
                id: user.id,
                email: user.email,
                prenom: user.prenom,
                nom: user.nom,
                role: user.role,
                isBlocked: user.isBlocked,
                phone: user.phone || '',
                company: user.company || '',
                address: user.address || '',
                city: user.city || '',
                postalCode: user.postalCode || '',
                website: user.website || '',
                description: user.description || ''
            }));
            
            // 🔥 CORRECTION: Nettoyage STRICT du flag admin
            if (userIsAdmin) {
                localStorage.setItem('btp_pro_admin', 'true');
                console.log('👑 Utilisateur admin détecté - flag admin activé');
            } else {
                localStorage.removeItem('btp_pro_admin');
                console.log('👤 Utilisateur standard - flag admin désactivé');
            }
            
            showAlert('✅ Connexion réussie !', 'success');
            
            // Fermer le modal
            const loginModal = bootstrap.Modal.getInstance(document.getElementById('loginModal'));
            if (loginModal) {
                loginModal.hide();
            }
            
            // Mettre à jour l'interface
            updateAuthUI();
            
            // Rediriger vers l'accueil
            setTimeout(() => {
                goToSection('home');
            }, 500);
            
        } else {
            showAlert('❌ Email ou mot de passe incorrect', 'error');
        }
        
    } catch (error) {
        console.error('Erreur connexion:', error);
        handleAuthError(error);
    } finally {
        showLoading(false);
    }
}

async function handleRegister() {
    const prenom = document.getElementById('registerPrenom').value;
    const nom = document.getElementById('registerNom').value;
    const email = document.getElementById('registerEmail').value;
    const phone = document.getElementById('registerPhone').value;
    const password = document.getElementById('registerPassword').value;
    const confirmPassword = document.getElementById('registerConfirmPassword').value;
    
    // Validation
    if (!prenom || !nom || !email || !password || !confirmPassword) {
        showAlert('❌ Veuillez remplir tous les champs obligatoires', 'error');
        return;
    }
    
    if (!validateEmail(email)) {
        showAlert('❌ Format d\'email invalide', 'error');
        return;
    }
    
    if (password !== confirmPassword) {
        showAlert('❌ Les mots de passe ne correspondent pas', 'error');
        return;
    }
    
    if (password.length < 6) {
        showAlert('❌ Le mot de passe doit contenir au moins 6 caractères', 'error');
        return;
    }
    
    showLoading(true);
    
    try {
        const userData = {
            prenom: prenom.trim(),
            nom: nom.trim(),
            email: email.toLowerCase().trim(),
            phone: phone?.trim() || '',
            password: password,
            role: 'user', // 🔥 TOUJOURS 'user' pour les nouvelles inscriptions
            isBlocked: false,
            createdAt: new Date().toISOString(),
            // 🔥 CORRECTION: Initialiser TOUS les champs de profil
            company: '',
            address: '',
            city: '',
            postalCode: '',
            website: '',
            description: '',
            isVerified: false,
            hasPremium: false,
            visitCount: 0,
            lastVisit: new Date().toISOString()
        };
        
        const newUser = await btpDB.registerUser(userData);
        
        // Mettre à jour l'état global UNIFIÉ
        authState.currentUser = newUser;
        authState.isAdmin = false; // 🔥 FORCÉ à false pour les nouveaux utilisateurs
        authState.isAuthenticated = true;
        syncAuthState();
        
        // ✅ SAUVEGARDE UNIFIÉE
        localStorage.setItem('btp_pro_user', JSON.stringify({
            id: newUser.id,
            email: newUser.email,
            prenom: newUser.prenom,
            nom: newUser.nom,
            role: newUser.role,
            isBlocked: newUser.isBlocked,
            phone: newUser.phone || '',
            company: newUser.company || '',
            address: newUser.address || '',
            city: newUser.city || '',
            postalCode: newUser.postalCode || '',
            website: newUser.website || '',
            description: newUser.description || ''
        }));
        
        // 🔥 CORRECTION: Nettoyage GARANTI du flag admin
        localStorage.removeItem('btp_pro_admin');
        
        showAlert('✅ Inscription réussie ! Bienvenue sur BTP Pro 🇲🇦', 'success');
        
        // Fermer le modal
        const registerModal = bootstrap.Modal.getInstance(document.getElementById('registerModal'));
        if (registerModal) {
            registerModal.hide();
        }
        
        // Mettre à jour l'interface
        updateAuthUI();
        
        // Rediriger vers l'accueil
        setTimeout(() => {
            goToSection('home');
        }, 1000);
        
    } catch (error) {
        console.error('Erreur inscription:', error);
        handleAuthError(error);
    } finally {
        showLoading(false);
    }
}

// ========== RÉINITIALISATION MOT DE PASSE ==========
async function resetPassword(email) {
    if (!email) {
        showAlert('❌ Veuillez saisir votre email', 'error');
        return;
    }
    
    if (!validateEmail(email)) {
        showAlert('❌ Format d\'email invalide', 'error');
        return;
    }
    
    showLoading(true);
    
    try {
        const users = await btpDB.get('users');
        const user = users.find(u => u.email === email);
        
        if (!user) {
            showAlert('❌ Aucun compte trouvé avec cet email', 'error');
            return;
        }
        
        // Générer un nouveau mot de passe temporaire
        const temporaryPassword = generateTemporaryPassword();
        
        // Mettre à jour le mot de passe dans la base
        await btpDB.put('users', user.id, {
            password: temporaryPassword,
            updatedAt: new Date().toISOString()
        });
        
        // Afficher le mot de passe temporaire (dans un environnement réel, on l'enverrait par email)
        showAlert(`🔑 Mot de passe temporaire généré : <strong>${temporaryPassword}</strong><br><br>Veuillez le communiquer à l'adhérent et lui demander de le changer après connexion.`, 'info', 10000);
        
        console.log(`✅ Mot de passe réinitialisé pour ${email}: ${temporaryPassword}`);
        
    } catch (error) {
        console.error('❌ Erreur réinitialisation mot de passe:', error);
        showAlert('❌ Erreur lors de la réinitialisation du mot de passe', 'error');
    } finally {
        showLoading(false);
    }
}

function generateTemporaryPassword() {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    let password = '';
    for (let i = 0; i < 8; i++) {
        password += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return password;
}

function showResetPasswordModal() {
    if (!checkAdminAccess()) {
        showAlert('🔐 Accès réservé aux administrateurs', 'error');
        return;
    }
    
    const modalHTML = `
        <div class="modal fade" id="resetPasswordModal" tabindex="-1">
            <div class="modal-dialog">
                <div class="modal-content">
                    <div class="modal-header bg-warning text-white">
                        <h5 class="modal-title">
                            <i class="fas fa-key me-2"></i>
                            Réinitialiser un mot de passe
                        </h5>
                        <button type="button" class="btn-close" data-bs-dismiss="modal"></button>
                    </div>
                    <div class="modal-body">
                        <div class="alert alert-info">
                            <i class="fas fa-info-circle me-2"></i>
                            Cette fonction génère un mot de passe temporaire pour un adhérent qui aurait perdu son mot de passe.
                        </div>
                        <div class="mb-3">
                            <label for="resetPasswordEmail" class="form-label">Email de l'adhérent *</label>
                            <input type="email" class="form-control" id="resetPasswordEmail" placeholder="email@exemple.com" required>
                        </div>
                        <div class="form-text">
                            Un mot de passe temporaire sera généré et affiché à l'écran.
                        </div>
                    </div>
                    <div class="modal-footer">
                        <button type="button" class="btn btn-secondary" data-bs-dismiss="modal">
                            <i class="fas fa-times me-2"></i>Annuler
                        </button>
                        <button type="button" class="btn btn-warning" onclick="handleResetPassword()">
                            <i class="fas fa-key me-2"></i>Générer un mot de passe temporaire
                        </button>
                    </div>
                </div>
            </div>
        </div>
    `;

    // Supprimer le modal existant
    const existingModal = document.getElementById('resetPasswordModal');
    if (existingModal) existingModal.remove();

    // Ajouter le nouveau modal
    document.body.insertAdjacentHTML('beforeend', modalHTML);
    
    // Afficher le modal
    const modal = new bootstrap.Modal(document.getElementById('resetPasswordModal'));
    modal.show();
}

async function handleResetPassword() {
    const email = document.getElementById('resetPasswordEmail')?.value.trim();
    await resetPassword(email);
}

// ✅ FONCTION UNIFIÉE POUR LA PUBLICATION - VERSION RENFORCÉE
function checkAuthForPublish() {
    console.log('🔍 Vérification auth pour publication...');
    
    // Vérifier d'abord dans authState (source de vérité)
    if (authState.currentUser && authState.isAuthenticated) {
        console.log('✅ Utilisateur authentifié via authState');
        return true;
    }
    
    // Vérifier dans le localStorage unifié
    const savedUser = localStorage.getItem('btp_pro_user');
    if (savedUser) {
        try {
            const user = JSON.parse(savedUser);
            if (user && !user.isBlocked) {
                console.log('✅ Utilisateur restauré depuis localStorage');
                authState.currentUser = user;
                authState.isAdmin = user.role === 'admin';
                authState.isAuthenticated = true;
                syncAuthState();
                return true;
            }
        } catch (error) {
            console.error('❌ Erreur restauration utilisateur:', error);
        }
    }
    
    // Si aucun utilisateur trouvé
    console.log('❌ Aucun utilisateur authentifié');
    showAlert('🔐 Connectez-vous pour publier une annonce', 'warning');
    showLoginModal();
    return false;
}

// Version simplifiée de checkAuth
function checkAuth() {
    return authState.isAuthenticated && !!authState.currentUser;
}

// ✅ FONCTION DE VÉRIFICATION ADMIN RENFORCÉE
function checkAdminAccess() {
    if (!authState.currentUser) {
        console.warn('❌ Tentative d\'accès admin sans utilisateur connecté');
        showAlert('❌ Vous devez être connecté pour accéder à l\'administration', 'error');
        setTimeout(() => goToSection('home'), 1000);
        return false;
    }
    
    if (!authState.isAdmin) {
        console.warn('❌ Tentative d\'accès admin sans permission administrateur');
        showAlert('❌ Accès réservé aux administrateurs', 'error');
        setTimeout(() => goToSection('home'), 1000);
        return false;
    }
    
    return true;
}

function updateAuthUI() {
    const authButtons = document.getElementById('auth-buttons');
    const userMenu = document.getElementById('user-menu');
    const userName = document.getElementById('user-name');
    const userInitials = document.getElementById('user-initials');
    const adminBadge = document.getElementById('admin-badge');
    const adminNavItem = document.getElementById('admin-nav-item');
    const adminMenuItem = document.getElementById('admin-menu-item');
    const becomeProfessionalBtn = document.getElementById('becomeProfessionalBtn');
    
    console.log('🔄 Mise à jour interface auth:', {
        user: authState.currentUser?.email,
        isAdmin: authState.isAdmin,
        isAuthenticated: authState.isAuthenticated
    });
    
    if (authState.currentUser && authState.isAuthenticated) {
        // Masquer boutons connexion, afficher menu utilisateur
        if (authButtons) {
            authButtons.style.display = 'none';
            authButtons.classList.add('d-none');
        }
        
        if (userMenu) {
            userMenu.style.display = 'flex';
            userMenu.classList.remove('d-none');
        }
        
        // Mettre à jour les infos utilisateur
        const fullName = `${authState.currentUser.prenom} ${authState.currentUser.nom}`;
        if (userName) userName.textContent = fullName;
        if (userInitials) {
            const initials = (authState.currentUser.prenom?.[0] || '') + (authState.currentUser.nom?.[0] || '');
            userInitials.textContent = initials.toUpperCase() || 'U';
        }
        
        // 🔥 CORRECTION: Gestion STRICTE de l'affichage admin
        const shouldShowAdmin = authState.isAdmin;
        
        console.log('🔐 Vérification affichage admin:', {
            shouldShowAdmin: shouldShowAdmin,
            userRole: authState.currentUser.role,
            authStateIsAdmin: authState.isAdmin
        });
        
        if (shouldShowAdmin) {
            // AFFICHER les éléments admin
            if (adminBadge) {
                adminBadge.style.display = 'inline-block';
                adminBadge.classList.remove('d-none');
                adminBadge.textContent = 'ADMIN';
                console.log('✅ Badge admin affiché');
            }
            if (adminNavItem) {
                adminNavItem.style.display = 'block';
                adminNavItem.classList.remove('d-none');
                console.log('✅ Navigation admin affichée');
            }
            if (adminMenuItem) {
                adminMenuItem.style.display = 'block';
                adminMenuItem.classList.remove('d-none');
                console.log('✅ Menu admin affiché');
            }
        } else {
            // MASQUER COMPLÈTEMENT les éléments admin
            if (adminBadge) {
                adminBadge.style.display = 'none';
                adminBadge.classList.add('d-none');
                adminBadge.textContent = '';
            }
            if (adminNavItem) {
                adminNavItem.style.display = 'none';
                adminNavItem.classList.add('d-none');
            }
            if (adminMenuItem) {
                adminMenuItem.style.display = 'none';
                adminMenuItem.classList.add('d-none');
            }
            console.log('❌ Éléments admin masqués - utilisateur non admin');
        }
        
        // Gérer le bouton "Devenir Professionnel"
        if (becomeProfessionalBtn) {
            becomeProfessionalBtn.style.display = authState.isAdmin ? 'none' : 'block';
        }
        
    } else {
        // Afficher les boutons de connexion
        if (authButtons) {
            authButtons.style.display = 'flex';
            authButtons.classList.remove('d-none');
        }
        
        // Masquer le menu utilisateur
        if (userMenu) {
            userMenu.style.display = 'none';
            userMenu.classList.add('d-none');
        }
        
        // 🔥 CORRECTION: Masquer ABSOLUMENT tous les éléments admin
        const adminElements = [adminBadge, adminNavItem, adminMenuItem];
        adminElements.forEach(element => {
            if (element) {
                element.style.display = 'none';
                element.classList.add('d-none');
                if (element === adminBadge) {
                    element.textContent = '';
                }
            }
        });
        
        // Afficher le bouton "Devenir Professionnel"
        if (becomeProfessionalBtn) {
            becomeProfessionalBtn.style.display = 'block';
        }
        
        // RÉINITIALISER COMPLÈTEMENT L'ÉTAT ADMIN
        authState.isAdmin = false;
        localStorage.removeItem('btp_pro_admin');
        
        console.log('🚪 Déconnecté - état admin réinitialisé');
    }
}

// FONCTION DE DÉCONNEXION SIMPLIFIÉE ET RENFORCÉE
function logout() {
    console.log('🚪 Déconnexion en cours...');
    
    // Réinitialiser complètement les états
    authState.currentUser = null;
    authState.isAdmin = false;
    authState.isAuthenticated = false;
    syncAuthState();
    
    // ✅ NETTOYAGE COMPLET - UN SEUL POINT DE VÉRITÉ
    localStorage.removeItem('btp_pro_user');
    localStorage.removeItem('currentUser');
    localStorage.removeItem('btp_pro_admin');
    localStorage.removeItem('btp_pro_session');
    
    // Déconnexion Firebase si disponible
    if (typeof btpDB !== 'undefined' && btpDB.logoutUser) {
        btpDB.logoutUser();
    }
    
    // Mettre à jour l'interface
    updateAuthUI();
    
    showAlert('👋 Déconnexion réussie', 'success');
    
    // Rediriger vers l'accueil
    setTimeout(() => {
        goToSection('home');
    }, 500);
    
    console.log('✅ Session COMPLÈTEMENT réinitialisée et nettoyée');
}

// Initialiser l'authentification au chargement - VERSION RENFORCÉE
function initializeAuth() {
    console.log('🔐 Initialisation de l\'authentification RENFORCÉE...');
    
    const savedUser = localStorage.getItem('btp_pro_user');
    const adminFlag = localStorage.getItem('btp_pro_admin');
    
    console.log('📋 État initial RENFORCÉ:', {
        savedUser: !!savedUser,
        adminFlag: adminFlag
    });
    
    if (savedUser) {
        try {
            const user = JSON.parse(savedUser);
            
            if (user && !user.isBlocked) {
                // 🔥 CORRECTION: Vérification STRICTE du rôle admin
                const userIsAdmin = user.role === 'admin';
                
                authState.currentUser = user;
                authState.isAdmin = userIsAdmin;
                authState.isAuthenticated = true;
                syncAuthState();
                
                console.log('✅ Utilisateur restauré:', {
                    email: user.email,
                    role: user.role,
                    isAdmin: userIsAdmin
                });
                
                // 🔥 CORRECTION: Nettoyage du flag admin si incohérent
                if (userIsAdmin && adminFlag !== 'true') {
                    localStorage.setItem('btp_pro_admin', 'true');
                    console.log('🔄 Flag admin corrigé pour utilisateur admin');
                } else if (!userIsAdmin && adminFlag === 'true') {
                    localStorage.removeItem('btp_pro_admin');
                    console.log('🔄 Flag admin supprimé pour utilisateur non admin');
                }
            } else {
                console.log('❌ Utilisateur bloqué ou invalide');
                logout();
            }
        } catch (error) {
            console.error('Erreur restauration utilisateur:', error);
            logout();
        }
    } else {
        // S'assurer que tout est réinitialisé
        authState.currentUser = null;
        authState.isAdmin = false;
        authState.isAuthenticated = false;
        syncAuthState();
        
        // 🔥 CORRECTION: Nettoyage GARANTI du flag admin
        localStorage.removeItem('btp_pro_admin');
    }
    
    updateAuthUI();
}

// Gestion des erreurs d'authentification
function handleAuthError(error) {
    if (error.message && error.message.includes('auth/')) {
        if (error.message.includes('auth/invalid-credential')) {
            showAlert('❌ Email ou mot de passe incorrect', 'error');
        } else if (error.message.includes('auth/email-already-in-use')) {
            showAlert('❌ Cet email est déjà utilisé', 'error');
        } else if (error.message.includes('auth/weak-password')) {
            showAlert('❌ Le mot de passe est trop faible', 'error');
        } else if (error.message.includes('auth/network-request-failed')) {
            showAlert('❌ Problème de connexion réseau. Vérifiez votre connexion internet.', 'error');
        } else {
            showAlert('❌ Erreur d\'authentification: ' + error.message, 'error');
        }
    } else if (error.message.includes('déjà utilisé')) {
        showAlert('❌ Cet email est déjà utilisé', 'error');
    } else {
        showAlert('❌ Erreur lors de l\'authentification', 'error');
    }
}

// ========== FONCTIONS MODALES ==========
function showLoginModal() {
    const loginModal = new bootstrap.Modal(document.getElementById('loginModal'));
    document.getElementById('loginEmail').value = '';
    document.getElementById('loginPassword').value = '';
    loginModal.show();
}

function showRegisterModal() {
    const registerModal = new bootstrap.Modal(document.getElementById('registerModal'));
    document.getElementById('registerPrenom').value = '';
    document.getElementById('registerNom').value = '';
    document.getElementById('registerEmail').value = '';
    document.getElementById('registerPhone').value = '';
    document.getElementById('registerPassword').value = '';
    document.getElementById('registerConfirmPassword').value = '';
    registerModal.show();
}

function switchToRegister() {
    const loginModal = bootstrap.Modal.getInstance(document.getElementById('loginModal'));
    const registerModal = new bootstrap.Modal(document.getElementById('registerModal'));
    if (loginModal) loginModal.hide();
    setTimeout(() => registerModal.show(), 300);
}

function switchToLogin() {
    const registerModal = bootstrap.Modal.getInstance(document.getElementById('registerModal'));
    const loginModal = new bootstrap.Modal(document.getElementById('loginModal'));
    if (registerModal) registerModal.hide();
    setTimeout(() => loginModal.show(), 300);
}

// ========== VALIDATION ==========
function validateEmail(email) {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
}

function validateEmailField(input) {
    const email = input.value;
    const errorDiv = document.getElementById('emailError');
    
    if (!validateEmail(email)) {
        input.classList.add('is-invalid');
        if (errorDiv) errorDiv.style.display = 'block';
        return false;
    } else {
        input.classList.remove('is-invalid');
        input.classList.add('is-valid');
        if (errorDiv) errorDiv.style.display = 'none';
        return true;
    }
}

// ========== FONCTIONS POUR GESTION PROFIL - CORRIGÉES ==========

// 🔥 CORRECTION : LES DEUX PROFILS FONCTIONNENT
function showProfileModal() {
    if (!checkAuth()) {
        showAlert('🔐 Connectez-vous pour accéder à votre profil', 'warning');
        showLoginModal();
        return;
    }
    
    const profileModal = new bootstrap.Modal(document.getElementById('profileModal'));
    
    // 🔥 CORRECTION : Charger les données AVANT d'afficher le modal
    loadProfileData();
    
    profileModal.show();
}

// ✅ FONCTION saveProfile OPTIMISÉE ET CORRIGÉE
async function saveProfile(event) {
    if (event) event.preventDefault();
    
    if (!checkAuth()) {
        showAlert('❌ Vous devez être connecté pour sauvegarder le profil', 'error');
        return;
    }
    
    console.log('💾 Sauvegarde du profil en cours...', authState.currentUser);
    
    // Récupérer TOUS les champs du profil
    const profileData = {
        email: document.getElementById('profileEmail')?.value || '',
        phone: document.getElementById('profilePhone')?.value || '',
        company: document.getElementById('profileCompany')?.value || '',
        address: document.getElementById('profileAddress')?.value || '',
        city: document.getElementById('profileCity')?.value || '',
        postalCode: document.getElementById('profilePostalCode')?.value || '',
        website: document.getElementById('profileWebsite')?.value || '',
        description: document.getElementById('profileDescription')?.value || '',
        updatedAt: new Date().toISOString()
    };
    
    // Validation basique
    if (!profileData.email) {
        showAlert('❌ L\'email est obligatoire', 'error');
        return;
    }
    
    if (!validateEmail(profileData.email)) {
        showAlert('❌ Format d\'email invalide', 'error');
        return;
    }
    
    showLoading(true);
    
    try {
        // 🔥 CORRECTION : Mettre à jour dans la base de données avec TOUTES les données
        const updatedUser = await btpDB.updateUserProfile(authState.currentUser.id, profileData);
        
        if (updatedUser) {
            // 🔥 CORRECTION : Mettre à jour l'état local COMPLET
            authState.currentUser = { 
                ...authState.currentUser, 
                ...profileData 
            };
            
            // 🔥 CORRECTION : Sauvegarder dans localStorage avec TOUTES les données
            localStorage.setItem('btp_pro_user', JSON.stringify(authState.currentUser));
            
            console.log('✅ Profil sauvegardé:', authState.currentUser);
            showAlert('✅ Profil mis à jour avec succès', 'success');
            
            // Mettre à jour l'affichage du nom dans l'interface
            updateAuthUI();
            
            // Rafraîchir également le profil principal si il est ouvert
            if (typeof userProfileInstance !== 'undefined' && userProfileInstance) {
                userProfileInstance.loadUserProfile();
            }
            
            // Fermer le modal après un délai
            setTimeout(() => {
                const profileModal = bootstrap.Modal.getInstance(document.getElementById('profileModal'));
                if (profileModal) {
                    profileModal.hide();
                }
            }, 1500);
        } else {
            throw new Error('Échec de la mise à jour du profil');
        }
        
    } catch (error) {
        console.error('❌ Erreur mise à jour profil:', error);
        showAlert('❌ Erreur lors de la mise à jour du profil: ' + error.message, 'error');
    } finally {
        showLoading(false);
    }
}

// 🔥 FONCTION loadProfileData CORRIGÉE - Chargement COMPLET des données
function loadProfileData() {
    if (!authState.currentUser) {
        console.log('❌ Aucun utilisateur connecté pour charger le profil');
        return;
    }
    
    console.log('📥 Chargement des données profil (auth.js):', authState.currentUser);
    
    // Mapping des champs avec valeurs par défaut
    const fieldMappings = {
        'profileEmail': authState.currentUser.email || '',
        'profilePhone': authState.currentUser.phone || '',
        'profileCompany': authState.currentUser.company || '',
        'profileAddress': authState.currentUser.address || '',
        'profileCity': authState.currentUser.city || '',
        'profilePostalCode': authState.currentUser.postalCode || '',
        'profileWebsite': authState.currentUser.website || '',
        'profileDescription': authState.currentUser.description || ''
    };
    
    // Remplir tous les champs
    let filledFields = 0;
    for (const [fieldId, value] of Object.entries(fieldMappings)) {
        const element = document.getElementById(fieldId);
        if (element) {
            element.value = value;
            filledFields++;
            console.log(`✅ Champ ${fieldId} rempli:`, value);
        } else {
            console.warn(`❌ Champ non trouvé: ${fieldId}`);
        }
    }
    
    console.log(`📊 Formulaire auth.js rempli: ${filledFields} champs sur ${Object.keys(fieldMappings).length}`);
    
    // Afficher les informations de débogage
    const emptyFields = Object.values(fieldMappings).filter(val => !val).length;
    console.log(`📊 Statistiques profil auth.js: ${emptyFields} champs vides sur ${Object.keys(fieldMappings).length}`);
}

// 🔥 FONCTION changePassword CORRIGÉE - Gère les deux formulaires
async function changePassword(event) {
    if (event) event.preventDefault();
    
    if (!checkAuth()) {
        showAlert('❌ Vous devez être connecté pour changer le mot de passe', 'error');
        return;
    }
    
    // 🔥 CORRECTION : Chercher les DEUX formulaires possibles
    let currentPassword, newPassword, confirmNewPassword;
    let formFound = false;
    
    // Essayer le premier formulaire (modal profil)
    const form1 = document.getElementById('changePasswordForm');
    if (form1) {
        currentPassword = document.getElementById('currentPassword')?.value;
        newPassword = document.getElementById('newPassword')?.value;
        confirmNewPassword = document.getElementById('confirmNewPassword')?.value;
        formFound = true;
    }
    
    // Si non trouvé, essayer le deuxième formulaire (section mon compte)
    if (!formFound) {
        const form2 = document.getElementById('changePasswordForm2');
        if (form2) {
            currentPassword = document.getElementById('currentPassword2')?.value;
            newPassword = document.getElementById('newPassword2')?.value;
            confirmNewPassword = document.getElementById('confirmNewPassword2')?.value;
            formFound = true;
        }
    }
    
    // Si aucun formulaire trouvé
    if (!formFound) {
        console.error('❌ Formulaire changement mot de passe non trouvé');
        showAlert('❌ Erreur: Formulaire non trouvé', 'error');
        return;
    }
    
    // Validation renforcée
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
        // Mettre à jour le mot de passe dans la base
        await btpDB.updateUserPassword(authState.currentUser.id, currentPassword, newPassword);
        
        showAlert('✅ Mot de passe changé avec succès', 'success');
        
        // 🔥 CORRECTION : Réinitialiser les DEUX formulaires
        if (form1) {
            form1.reset();
        }
        
        const form2 = document.getElementById('changePasswordForm2');
        if (form2) {
            form2.reset();
        }
        
        // Fermer le modal si ouvert
        const passwordModal = bootstrap.Modal.getInstance(document.getElementById('passwordModal'));
        if (passwordModal) {
            passwordModal.hide();
        }
        
    } catch (error) {
        console.error('❌ Erreur changement mot de passe:', error);
        showAlert(`❌ Erreur: ${error.message || 'Impossible de changer le mot de passe'}`, 'error');
    } finally {
        showLoading(false);
    }
}

// 🔥 CORRECTION : Fonction pour afficher le modal de changement de mot de passe
function showChangePasswordModal() {
    // Essayer les deux modals possibles
    const modal1 = document.getElementById('passwordModal');
    const modal2 = document.getElementById('passwordModal2');
    
    const modalToShow = modal1 || modal2;
    
    if (!modalToShow) {
        console.error('❌ Modal changement mot de passe non trouvé');
        showAlert('❌ Erreur: Modal non trouvé', 'error');
        return;
    }
    
    const modal = new bootstrap.Modal(modalToShow);
    modal.show();
}

// ========== INITIALISATION RENFORCÉE ==========
document.addEventListener('DOMContentLoaded', function() {
    console.log('🚀 Initialisation de l\'authentification UNIFIÉE RENFORCÉE...');
    initializeAuth();
    initializeAuthEventListeners();
});

function initializeAuthEventListeners() {
    // Écouteurs pour les formulaires
    const profileForm = document.getElementById('profileForm');
    if (profileForm) {
        profileForm.addEventListener('submit', saveProfile);
        console.log('✅ Écouteur profil auth.js initialisé');
    } else {
        console.warn('❌ Formulaire profil auth.js non trouvé');
    }
    
    const changePasswordForm = document.getElementById('changePasswordForm');
    if (changePasswordForm) {
        changePasswordForm.addEventListener('submit', changePassword);
        console.log('✅ Écouteur mot de passe initialisé');
    }
    
    // Validation email en temps réel
    const emailFields = document.querySelectorAll('input[type="email"]');
    emailFields.forEach(field => {
        field.addEventListener('blur', function() {
            validateEmailField(this);
        });
    });
}

// ========== EXPORT DES FONCTIONS ==========
window.handleLogin = handleLogin;
window.handleRegister = handleRegister;
window.updateAuthUI = updateAuthUI;
window.logout = logout;
window.showLoginModal = showLoginModal;
window.showRegisterModal = showRegisterModal;
window.switchToRegister = switchToRegister;
window.switchToLogin = switchToLogin;
window.checkAuth = checkAuth;
window.checkAuthForPublish = checkAuthForPublish;
window.checkAdminAccess = checkAdminAccess;
window.validateEmail = validateEmail;
window.validateEmailField = validateEmailField;

// ✅ EXPORT DES FONCTIONS PROFIL CORRIGÉES
window.showProfileModal = showProfileModal;
window.showChangePasswordModal = showChangePasswordModal;
window.saveProfile = saveProfile;
window.changePassword = changePassword;
window.loadProfileData = loadProfileData;

// 🔥 NOUVELLES FONCTIONS RÉINITIALISATION MOT DE PASSE
window.showResetPasswordModal = showResetPasswordModal;
window.handleResetPassword = handleResetPassword;
window.resetPassword = resetPassword;

console.log('✅ auth.js CORRIGÉ - Les deux profils fonctionnent maintenant');