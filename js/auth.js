// ========== GESTION AUTHENTIFICATION ==========
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
            
            // Mettre à jour l'état global
            appState.currentUser = user;
            appState.isAdmin = user.role === 'admin';
            
            // Sauvegarder en localStorage
            localStorage.setItem('currentUser', JSON.stringify(user));
            if (appState.isAdmin) {
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
            
            // Rediriger vers l'accueil après connexion
            setTimeout(() => {
                goToSection('home');
            }, 500);
            
        } else {
            showAlert('❌ Email ou mot de passe incorrect', 'error');
        }
        
    } catch (error) {
        console.error('Erreur connexion:', error);
        
        // Gestion spécifique des erreurs Firebase en local
        if (error.message && error.message.includes('auth/')) {
            if (error.message.includes('auth/invalid-credential')) {
                showAlert('❌ Email ou mot de passe incorrect', 'error');
            } else if (error.message.includes('auth/network-request-failed')) {
                showAlert('❌ Problème de connexion réseau. Vérifiez votre connexion internet.', 'error');
            } else {
                showAlert('❌ Erreur d\'authentification: ' + error.message, 'error');
            }
        } else {
            showAlert('❌ Erreur lors de la connexion', 'error');
        }
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
            password: password
        };
        
        const newUser = await btpDB.registerUser(userData);
        
        // Mettre à jour l'état global
        appState.currentUser = newUser;
        appState.isAdmin = false;
        
        // Sauvegarder en localStorage
        localStorage.setItem('currentUser', JSON.stringify(newUser));
        localStorage.removeItem('btp_pro_admin'); // S'assurer qu'il n'est pas admin
        
        showAlert('✅ Inscription réussie ! Bienvenue sur BTP Pro 🇲🇦', 'success');
        
        // Fermer le modal
        const registerModal = bootstrap.Modal.getInstance(document.getElementById('registerModal'));
        if (registerModal) {
            registerModal.hide();
        }
        
        // Mettre à jour l'interface
        updateAuthUI();
        
        // Rediriger vers la page d'accueil
        setTimeout(() => {
            goToSection('home');
        }, 1000);
        
    } catch (error) {
        console.error('Erreur inscription:', error);
        
        // Gestion spécifique des erreurs Firebase en local
        if (error.message && error.message.includes('auth/')) {
            if (error.message.includes('auth/email-already-in-use')) {
                showAlert('❌ Cet email est déjà utilisé', 'error');
            } else if (error.message.includes('auth/weak-password')) {
                showAlert('❌ Le mot de passe est trop faible', 'error');
            } else if (error.message.includes('auth/network-request-failed')) {
                showAlert('❌ Problème de connexion réseau. Vérifiez votre connexion internet.', 'error');
            } else {
                showAlert('❌ Erreur d\'inscription: ' + error.message, 'error');
            }
        } else if (error.message.includes('déjà utilisé')) {
            showAlert('❌ Cet email est déjà utilisé', 'error');
        } else {
            showAlert('❌ Erreur lors de l\'inscription', 'error');
        }
    } finally {
        showLoading(false);
    }
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
        user: !!appState.currentUser,
        admin: appState.isAdmin
    });
    
    if (appState.currentUser) {
        // FORCER l'affichage correct
        if (authButtons) {
            authButtons.style.display = 'none';
            authButtons.classList.add('d-none');
        }
        
        if (userMenu) {
            userMenu.style.display = 'flex';
            userMenu.classList.remove('d-none');
        }
        
        // Mettre à jour les infos utilisateur
        const fullName = `${appState.currentUser.prenom} ${appState.currentUser.nom}`;
        if (userName) userName.textContent = fullName;
        if (userInitials) {
            const initials = (appState.currentUser.prenom?.[0] || '') + (appState.currentUser.nom?.[0] || '');
            userInitials.textContent = initials.toUpperCase() || 'U';
        }
        
        // Gérer l'affichage admin
        const isAdmin = appState.currentUser.role === 'admin';
        appState.isAdmin = isAdmin;
        
        console.log('🔍 Vérification statut admin:', {
            userRole: appState.currentUser.role,
            isAdmin: isAdmin
        });
        
        if (isAdmin) {
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
            if (isAdmin) {
                becomeProfessionalBtn.style.display = 'none';
            } else {
                becomeProfessionalBtn.style.display = 'block';
            }
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
        
        // Afficher le bouton "Devenir Professionnel"
        if (becomeProfessionalBtn) {
            becomeProfessionalBtn.style.display = 'block';
        }
        
        // RÉINITIALISER COMPLÈTEMENT L'ÉTAT ADMIN
        appState.isAdmin = false;
        localStorage.removeItem('btp_pro_admin');
    }
    
    // Forcer le rafraîchissement des écouteurs d'événements
    setTimeout(() => {
        if (typeof initializeEventListeners === 'function') {
            initializeEventListeners();
        }
    }, 100);
}

// FONCTION DE DÉCONNEXION CORRIGÉE - VERSION RENFORCÉE
function logout() {
    console.log('🚪 Déconnexion en cours...');
    
    // Réinitialiser complètement la session
    appState.currentUser = null;
    appState.isAdmin = false;
    
    // NETTOYAGE COMPLET DU LOCALSTORAGE
    localStorage.removeItem('currentUser');
    localStorage.removeItem('btp_pro_admin');
    localStorage.removeItem('btp_pro_session');
    
    // Déconnexion Firebase si disponible
    if (typeof btpDB !== 'undefined' && btpDB.logoutUser) {
        btpDB.logoutUser();
    }
    
    // Mettre à jour l'interface IMMÉDIATEMENT
    updateAuthUI();
    
    showAlert('👋 Déconnexion réussie', 'success');
    
    // Rediriger vers l'accueil IMMÉDIATEMENT
    setTimeout(() => {
        goToSection('home');
        // FORCER LE RECHARGEMENT DE LA PAGE POUR NETTOYER LE CACHE
        setTimeout(() => {
            window.location.reload();
        }, 100);
    }, 500);
    
    console.log('✅ Session COMPLÈTEMENT réinitialisée et nettoyée');
}

// Vérifier l'état admin au chargement - VERSION RENFORCÉE
function checkAdminStatus() {
    try {
        const currentUser = JSON.parse(localStorage.getItem('currentUser'));
        const adminFlag = localStorage.getItem('btp_pro_admin');
        
        console.log('🔍 Vérification statut admin au chargement:', {
            currentUser: !!currentUser,
            adminFlag: adminFlag,
            userRole: currentUser?.role
        });
        
        // VÉRIFICATION RENFORCÉE : l'utilisateur doit exister ET être admin
        if (currentUser && currentUser.role === 'admin') {
            appState.currentUser = currentUser;
            appState.isAdmin = true;
            localStorage.setItem('btp_pro_admin', 'true');
            console.log('✅ Statut admin confirmé - Accès autorisé');
        } else {
            // SI PAS ADMIN, RÉINITIALISER COMPLÈTEMENT
            appState.isAdmin = false;
            localStorage.removeItem('btp_pro_admin');
            console.log('❌ Statut admin refusé - Réinitialisation complète');
        }
    } catch (error) {
        console.error('Erreur vérification statut admin:', error);
        // EN CAS D'ERREUR, TOUT RÉINITIALISER
        appState.isAdmin = false;
        localStorage.removeItem('btp_pro_admin');
    }
}

// Fonction pour vérifier les permissions admin - VERSION RENFORCÉE
function checkAdminAccess() {
    if (!appState.currentUser) {
        console.warn('❌ Tentative d\'accès admin sans utilisateur connecté');
        showAlert('❌ Vous devez être connecté pour accéder à l\'administration', 'error');
        setTimeout(() => goToSection('home'), 1000);
        return false;
    }
    
    if (!appState.isAdmin) {
        console.warn('❌ Tentative d\'accès admin sans permission administrateur');
        showAlert('❌ Accès réservé aux administrateurs', 'error');
        setTimeout(() => goToSection('home'), 1000);
        return false;
    }
    
    return true;
}

// NOUVELLE FONCTION POUR LA PUBLICATION
function checkAuthForPublish() {
    if (!appState.currentUser) {
        showAlert('🔐 Connectez-vous pour publier une annonce', 'warning');
        showLoginModal();
        return false;
    }
    return true;
}

// Fonction pour vérifier l'authentification (version simplifiée)
function checkAuth() {
    return !!appState.currentUser;
}

// Fonctions modales
function showLoginModal() {
    const loginModal = new bootstrap.Modal(document.getElementById('loginModal'));
    
    // Réinitialiser le formulaire
    document.getElementById('loginEmail').value = '';
    document.getElementById('loginPassword').value = '';
    
    loginModal.show();
}

function showRegisterModal() {
    const registerModal = new bootstrap.Modal(document.getElementById('registerModal'));
    
    // Réinitialiser le formulaire
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
    setTimeout(() => {
        registerModal.show();
    }, 300);
}

function switchToLogin() {
    const registerModal = bootstrap.Modal.getInstance(document.getElementById('registerModal'));
    const loginModal = new bootstrap.Modal(document.getElementById('loginModal'));
    
    if (registerModal) registerModal.hide();
    setTimeout(() => {
        loginModal.show();
    }, 300);
}

// Validation email en temps réel
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

// Validation email
function validateEmail(email) {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
}

// ========== NOUVELLES FONCTIONS POUR GESTION PROFIL ==========

// Fonction pour afficher le modal de profil
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

// Fonction pour charger les données du profil
function loadProfileData() {
    if (!appState.currentUser) return;
    
    // Remplir les champs avec les données utilisateur
    document.getElementById('profileEmail').value = appState.currentUser.email || '';
    document.getElementById('profilePhone').value = appState.currentUser.phone || '';
    document.getElementById('profileCompany').value = appState.currentUser.company || '';
    document.getElementById('profileAddress').value = appState.currentUser.address || '';
    document.getElementById('profileCity').value = appState.currentUser.city || '';
    document.getElementById('profilePostalCode').value = appState.currentUser.postalCode || '';
}

// Fonction pour sauvegarder les modifications du profil
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
        await btpDB.put('users', appState.currentUser.id, profileData);
        
        // Mettre à jour l'état local
        appState.currentUser = { ...appState.currentUser, ...profileData };
        localStorage.setItem('currentUser', JSON.stringify(appState.currentUser));
        
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

// Fonction pour changer le mot de passe
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
    
    // Vérifier l'ancien mot de passe
    if (appState.currentUser.password !== currentPassword) {
        showAlert('❌ Mot de passe actuel incorrect', 'error');
        return;
    }
    
    showLoading(true);
    
    try {
        // Mettre à jour le mot de passe
        await btpDB.put('users', appState.currentUser.id, {
            password: newPassword,
            updatedAt: new Date().toISOString()
        });
        
        // Mettre à jour l'état local
        appState.currentUser.password = newPassword;
        localStorage.setItem('currentUser', JSON.stringify(appState.currentUser));
        
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
    console.log('🔐 Initialisation de l\'authentification RENFORCÉE...');
    
    // Vérifier si un utilisateur était connecté
    const savedUser = localStorage.getItem('currentUser');
    const adminFlag = localStorage.getItem('btp_pro_admin');
    
    console.log('📋 État initial RENFORCÉ:', {
        savedUser: !!savedUser,
        adminFlag: adminFlag
    });
    
    if (savedUser) {
        try {
            const user = JSON.parse(savedUser);
            
            // Vérifier si l'utilisateur existe toujours dans la base
            if (typeof btpDB !== 'undefined' && btpDB.get) {
                btpDB.get('users').then(users => {
                    const userExists = users.find(u => u.id === user.id || u.email === user.email);
                    
                    if (userExists && !userExists.isBlocked) {
                        appState.currentUser = userExists;
                        
                        // VÉRIFICATION RENFORCÉE DU STATUT ADMIN
                        if (userExists.role === 'admin') {
                            appState.isAdmin = true;
                            localStorage.setItem('btp_pro_admin', 'true');
                            console.log('✅ Administrateur restauré depuis localStorage - Accès autorisé');
                        } else {
                            // SI PAS ADMIN, TOUT RÉINITIALISER
                            appState.isAdmin = false;
                            localStorage.removeItem('btp_pro_admin');
                            console.log('✅ Utilisateur standard restauré - Pas de droits admin');
                        }
                        
                        updateAuthUI();
                        
                    } else {
                        // Utilisateur supprimé ou bloqué, déconnecter COMPLÈTEMENT
                        console.log('❌ Utilisateur non trouvé ou bloqué, DÉCONNEXION COMPLÈTE...');
                        logout(); // Utiliser la fonction logout renforcée
                    }
                }).catch(error => {
                    console.error('Erreur vérification utilisateur:', error);
                    // En cas d'erreur, utiliser les données sauvegardées MAIS RÉINITIALISER ADMIN
                    appState.currentUser = user;
                    appState.isAdmin = false; // FORCER LA RÉINITIALISATION ADMIN
                    localStorage.removeItem('btp_pro_admin');
                    updateAuthUI();
                });
            } else {
                // Si btpDB n'est pas disponible, utiliser les données sauvegardées
                console.warn('⚠️ btpDB non disponible, utilisation des données sauvegardées');
                appState.currentUser = user;
                appState.isAdmin = user.role === 'admin';
                updateAuthUI();
            }
            
        } catch (error) {
            console.error('Erreur restauration utilisateur:', error);
            logout(); // Utiliser la fonction logout renforcée
        }
    } else {
        // Aucun utilisateur connecté, S'ASSURER QUE TOUT EST RÉINITIALISÉ
        appState.currentUser = null;
        appState.isAdmin = false;
        localStorage.removeItem('btp_pro_admin');
        updateAuthUI();
        console.log('🔓 Aucun utilisateur connecté - État complètement réinitialisé');
    }
    
    // Initialiser les écouteurs d'événements pour les formulaires
    initializeAuthEventListeners();
});

function initializeAuthEventListeners() {
    // Écouteur pour le formulaire de profil
    const profileForm = document.getElementById('profileForm');
    if (profileForm) {
        profileForm.addEventListener('submit', saveProfile);
    }
    
    // Écouteur pour le formulaire de changement de mot de passe
    const changePasswordForm = document.getElementById('changePasswordForm');
    if (changePasswordForm) {
        changePasswordForm.addEventListener('submit', changePassword);
    }
    
    // Écouteur pour le formulaire professionnel
    const professionalForm = document.getElementById('professionalForm');
    if (professionalForm) {
        professionalForm.addEventListener('submit', submitProfessionalForm);
    }
    
    // Écouteurs pour les champs de validation en temps réel
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
window.checkAdminStatus = checkAdminStatus;
window.checkAdminAccess = checkAdminAccess;
window.checkAuth = checkAuth;
window.checkAuthForPublish = checkAuthForPublish;
window.validateEmail = validateEmail;
window.validateEmailField = validateEmailField;
window.changePassword = changePassword;
window.showProfessionalModal = showProfessionalModal;
window.submitProfessionalForm = submitProfessionalForm;

// NOUVELLES FONCTIONS POUR GESTION PROFIL
window.showProfileModal = showProfileModal;
window.showChangePasswordModal = showChangePasswordModal;
window.saveProfile = saveProfile;

console.log('✅ auth.js CORRIGÉ - Fonctionnalités profil ajoutées');