// ========== FONCTIONS D'AUTHENTIFICATION ==========
let loginModal, registerModal;

function showLoginModal() {
    loginModal.show();
}

function showRegisterModal() {
    registerModal.show();
}

function switchToRegister() {
    loginModal.hide();
    registerModal.show();
}

function switchToLogin() {
    registerModal.hide();
    loginModal.show();
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
                showAlert('❌ Votre compte a été suspendu', 'error');
                return;
            }
            
            appState.currentUser = user;
            appState.isAdmin = user.role === 'admin';
            
            updateUIAfterAuth();
            loginModal.hide();
            showAlert(`✅ Bienvenue ${user.prenom} !`, 'success');
            
            // Incrémenter le compteur de visites
            btpDB.incrementUserVisit(user.id);
            
        } else {
            showAlert('❌ Email ou mot de passe incorrect', 'error');
        }
    } catch (error) {
        console.error('Erreur connexion:', error);
        showAlert('❌ Erreur lors de la connexion', 'error');
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
            prenom,
            nom,
            email,
            phone,
            password
        };
        
        const newUser = await btpDB.registerUser(userData);
        
        appState.currentUser = newUser;
        appState.isAdmin = false;
        
        updateUIAfterAuth();
        registerModal.hide();
        showAlert(`✅ Compte créé avec succès ! Bienvenue ${prenom}`, 'success');
        
    } catch (error) {
        console.error('Erreur inscription:', error);
        showAlert(`❌ ${error.message}`, 'error');
    } finally {
        showLoading(false);
    }
}

function updateUIAfterAuth() {
    // Masquer les boutons d'authentification
    document.getElementById('auth-buttons').classList.add('d-none');
    
    // Afficher le menu utilisateur
    const userMenu = document.getElementById('user-menu');
    userMenu.classList.remove('d-none');
    
    // Mettre à jour les informations utilisateur
    document.getElementById('user-name').textContent = `${appState.currentUser.prenom} ${appState.currentUser.nom}`;
    document.getElementById('user-initials').textContent = 
        `${appState.currentUser.prenom.charAt(0)}${appState.currentUser.nom.charAt(0)}`.toUpperCase();
    
    // Afficher le badge admin si nécessaire
    const adminBadge = document.getElementById('admin-badge');
    const adminMenuItem = document.getElementById('admin-menu-item');
    const adminNavItem = document.getElementById('admin-nav-item');
    
    if (appState.isAdmin) {
        adminBadge.classList.remove('d-none');
        adminMenuItem.classList.remove('d-none');
        adminNavItem.classList.remove('d-none');
    } else {
        adminBadge.classList.add('d-none');
        adminMenuItem.classList.add('d-none');
        adminNavItem.classList.add('d-none');
    }
}

function logout() {
    if (firebaseOnline) {
        auth.signOut();
    }
    
    appState.currentUser = null;
    appState.isAdmin = false;
    
    // Réinitialiser l'UI
    document.getElementById('auth-buttons').classList.remove('d-none');
    document.getElementById('user-menu').classList.add('d-none');
    
    showAlert('👋 À bientôt !', 'success');
    goToSection('home');
}