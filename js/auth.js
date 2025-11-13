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
            
            // Mettre à jour l'état global UNIFIÉ
            authState.currentUser = user;
            authState.isAdmin = user.role === 'admin';
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
                postalCode: user.postalCode || ''
            }));
            
            // Sauvegarde de compatibilité
            if (authState.isAdmin) {
                localStorage.setItem('btp_pro_admin', 'true');
            } else {
                localStorage.removeItem('btp_pro_admin');
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
            role: 'user',
            isBlocked: false,
            createdAt: new Date().toISOString()
        };
        
        const newUser = await btpDB.registerUser(userData);
        
        // Mettre à jour l'état global UNIFIÉ
        authState.currentUser = newUser;
        authState.isAdmin = false;
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
            postalCode: newUser.postalCode || ''
        }));
        
        // Nettoyer l'ancien système
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
    
    console.log('🔄 Mise à jour interface auth:', authState);
    
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
        
        // Gérer l'affichage admin
        if (authState.isAdmin) {
            if (adminBadge) {
                adminBadge.style.display = 'inline-block';
                adminBadge.classList.remove('d-none');
                adminBadge.textContent = 'ADMIN';
            }
            if (adminNavItem) {
                adminNavItem.style.display = 'block';
                adminNavItem.classList.remove('d-none');
            }
            if (adminMenuItem) {
                adminMenuItem.style.display = 'block';
                adminMenuItem.classList.remove('d-none');
            }
            localStorage.setItem('btp_pro_admin', 'true');
        } else {
            if (adminBadge) {
                adminBadge.style.display = 'none';
                adminBadge.classList.add('d-none');
            }
            if (adminNavItem) {
                adminNavItem.style.display = 'none';
                adminNavItem.classList.add('d-none');
            }
            if (adminMenuItem) {
                adminMenuItem.style.display = 'none';
                adminMenuItem.classList.add('d-none');
            }
            localStorage.removeItem('btp_pro_admin');
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
        
        // Masquer tous les éléments admin
        const adminElements = [adminBadge, adminNavItem, adminMenuItem];
        adminElements.forEach(element => {
            if (element) {
                element.style.display = 'none';
                element.classList.add('d-none');
            }
        });
        
        // Afficher le bouton "Devenir Professionnel"
        if (becomeProfessionalBtn) {
            becomeProfessionalBtn.style.display = 'block';
        }
        
        // RÉINITIALISER COMPLÈTEMENT L'ÉTAT ADMIN
        authState.isAdmin = false;
        localStorage.removeItem('btp_pro_admin');
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
                authState.currentUser = user;
                authState.isAdmin = user.role === 'admin';
                authState.isAuthenticated = true;
                syncAuthState();
                
                console.log('✅ Utilisateur restauré:', user.email);
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

// ========== FONCTIONS POUR GESTION PROFIL ==========
function showProfileModal() {
    if (!checkAuth()) {
        showAlert('🔐 Connectez-vous pour accéder à votre profil', 'warning');
        showLoginModal();
        return;
    }
    
    const profileModal = new bootstrap.Modal(document.getElementById('profileModal'));
    
    // Remplir le formulaire avec les données actuelles
    loadProfileData();
    
    profileModal.show();
}

// ✅ FONCTION saveProfile OPTIMISÉE
async function saveProfile(event) {
    event.preventDefault();
    
    if (!checkAuth()) return;
    
    const email = document.getElementById('profileEmail').value;
    const phone = document.getElementById('profilePhone').value;
    const company = document.getElementById('profileCompany').value;
    const address = document.getElementById('profileAddress').value;
    const city = document.getElementById('profileCity').value;
    const postalCode = document.getElementById('profilePostalCode').value;
    
    // Validation basique
    if (!email) {
        showAlert('❌ L\'email est obligatoire', 'error');
        return;
    }
    
    if (!validateEmail(email)) {
        showAlert('❌ Format d\'email invalide', 'error');
        return;
    }
    
    showLoading(true);
    
    try {
        const profileData = {
            email: email.trim(),
            phone: phone?.trim() || '',
            company: company?.trim() || '',
            address: address?.trim() || '',
            city: city?.trim() || '',
            postalCode: postalCode?.trim() || '',
            updatedAt: new Date().toISOString()
        };
        
        // Mettre à jour dans la base de données
        await btpDB.put('users', authState.currentUser.id, profileData);
        
        // Mettre à jour l'état local
        authState.currentUser = { ...authState.currentUser, ...profileData };
        localStorage.setItem('btp_pro_user', JSON.stringify(authState.currentUser));
        
        showAlert('✅ Profil mis à jour avec succès', 'success');
        
        // Fermer le modal après un délai
        setTimeout(() => {
            const profileModal = bootstrap.Modal.getInstance(document.getElementById('profileModal'));
            if (profileModal) {
                profileModal.hide();
            }
        }, 1000);
        
    } catch (error) {
        console.error('Erreur mise à jour profil:', error);
        showAlert('❌ Erreur lors de la mise à jour du profil', 'error');
    } finally {
        showLoading(false);
    }
}

// Fonction pour charger les données du profil
function loadProfileData() {
    if (!authState.currentUser) return;
    
    // Remplir les champs avec les données utilisateur
    document.getElementById('profileEmail').value = authState.currentUser.email || '';
    document.getElementById('profilePhone').value = authState.currentUser.phone || '';
    document.getElementById('profileCompany').value = authState.currentUser.company || '';
    document.getElementById('profileAddress').value = authState.currentUser.address || '';
    document.getElementById('profileCity').value = authState.currentUser.city || '';
    document.getElementById('profilePostalCode').value = authState.currentUser.postalCode || '';
}

// Fonction pour changer le mot de passe - VERSION AMÉLIORÉE
async function changePassword(event) {
    event.preventDefault();
    
    if (!checkAuth()) return;
    
    const currentPassword = document.getElementById('currentPassword').value;
    const newPassword = document.getElementById('newPassword').value;
    const confirmNewPassword = document.getElementById('confirmNewPassword').value;
    
    // Validation
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
    
    // Vérifier l'ancien mot de passe (si stocké localement)
    if (authState.currentUser.password && authState.currentUser.password !== currentPassword) {
        showAlert('❌ Mot de passe actuel incorrect', 'error');
        return;
    }
    
    showLoading(true);
    
    try {
        // Mettre à jour le mot de passe
        await btpDB.put('users', authState.currentUser.id, {
            password: newPassword,
            updatedAt: new Date().toISOString()
        });
        
        // Mettre à jour l'état local
        authState.currentUser.password = newPassword;
        localStorage.setItem('btp_pro_user', JSON.stringify(authState.currentUser));
        
        showAlert('✅ Mot de passe changé avec succès', 'success');
        
        // Réinitialiser le formulaire
        document.getElementById('changePasswordForm').reset();
        
        // Fermer le modal après un délai
        setTimeout(() => {
            const passwordModal = bootstrap.Modal.getInstance(document.getElementById('changePasswordModal'));
            if (passwordModal) {
                passwordModal.hide();
            }
        }, 1000);
        
    } catch (error) {
        console.error('Erreur changement mot de passe:', error);
        showAlert('❌ Erreur lors du changement de mot de passe', 'error');
    } finally {
        showLoading(false);
    }
}

// Fonction pour afficher le modal de changement de mot de passe
function showChangePasswordModal() {
    if (!checkAuth()) {
        showAlert('🔐 Connectez-vous pour changer votre mot de passe', 'warning');
        showLoginModal();
        return;
    }
    
    const passwordModal = new bootstrap.Modal(document.getElementById('changePasswordModal'));
    
    // Réinitialiser le formulaire
    document.getElementById('currentPassword').value = '';
    document.getElementById('newPassword').value = '';
    document.getElementById('confirmNewPassword').value = '';
    
    passwordModal.show();
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
    }
    
    const changePasswordForm = document.getElementById('changePasswordForm');
    if (changePasswordForm) {
        changePasswordForm.addEventListener('submit', changePassword);
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

// ✅ EXPORT DES FONCTIONS PROFIL
window.showProfileModal = showProfileModal;
window.showChangePasswordModal = showChangePasswordModal;
window.saveProfile = saveProfile;
window.changePassword = changePassword;
window.loadProfileData = loadProfileData;

console.log('✅ auth.js SYNCHRONISÉ - Toutes les fonctionnalités intégrées et optimisées');