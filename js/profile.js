// ========== GESTION DU PROFIL UTILISATEUR CORRIGÉE ==========
class UserProfile {
    constructor() {
        this.initProfile();
    }

    async initProfile() {
        console.log('👤 Initialisation du gestionnaire de profil...');
        
        // Vérifier si l'utilisateur est connecté
        if (!authState.currentUser || !authState.isAuthenticated) {
            console.log('❌ Utilisateur non connecté - profil non initialisé');
            return;
        }
        
        // Charger les données du profil
        await this.loadUserProfile();
        this.setupEventListeners();
        
        console.log('✅ Gestionnaire de profil initialisé');
    }

    async loadUserProfile() {
        try {
            console.log('📥 Chargement des données du profil...');
            
            if (!authState.currentUser) {
                console.log('❌ Aucun utilisateur connecté');
                return;
            }
            
            // 🔥 CORRECTION: Récupérer les données COMPLÈTES du profil
            const userData = await btpDB.getUserProfile(authState.currentUser.id);
            
            if (userData) {
                console.log('✅ Données profil récupérées:', userData);
                this.populateProfileForm(userData);
            } else {
                console.warn('⚠️ Aucune donnée profil trouvée, utilisation données de base');
                // Utiliser les données de base de l'utilisateur connecté
                this.populateProfileForm(authState.currentUser);
            }
            
        } catch (error) {
            console.error('❌ Erreur chargement profil:', error);
            // En cas d'erreur, utiliser les données de base
            if (authState.currentUser) {
                this.populateProfileForm(authState.currentUser);
            }
        }
    }

    populateProfileForm(userData) {
        console.log('📝 Remplissage du formulaire de profil:', userData);
        
        // 🔥 CORRECTION: Mapping COMPLET avec tous les champs disponibles
        const fieldMappings = {
            // Champs principaux
            'profileFullName': `${userData.prenom || ''} ${userData.nom || ''}`.trim(),
            'profileEmail': userData.email || '',
            'profilePhone': userData.phone || '',
            'profileRegistrationDate': userData.createdAt ? new Date(userData.createdAt).toLocaleDateString('fr-FR') : 'Date inconnue',
            
            // Champs supplémentaires du profil
            'profileCompany': userData.company || '',
            'profileAddress': userData.address || '',
            'profileCity': userData.city || '',
            'profilePostalCode': userData.postalCode || '',
            'profileWebsite': userData.website || '',
            'profileDescription': userData.description || '',
            
            // Champs affichage seulement (non éditables)
            'profileRole': userData.role === 'admin' ? 'Administrateur' : 'Utilisateur',
            'profileStatus': userData.isBlocked ? '🚫 Bloqué' : '✅ Actif',
            'profilePremium': userData.hasPremium ? '⭐ Premium' : 'Basic',
            'profileVisits': userData.visitCount || 0
        };
        
        // Remplir tous les champs
        let filledFields = 0;
        let missingFields = [];
        
        for (const [fieldId, value] of Object.entries(fieldMappings)) {
            const element = document.getElementById(fieldId);
            if (element) {
                if (element.tagName === 'INPUT' || element.tagName === 'TEXTAREA') {
                    element.value = value;
                } else {
                    element.textContent = value;
                }
                filledFields++;
                console.log(`✅ Champ ${fieldId} rempli:`, value);
            } else {
                missingFields.push(fieldId);
                console.warn(`❌ Champ non trouvé: ${fieldId}`);
            }
        }
        
        console.log(`📊 Formulaire rempli: ${filledFields} champs sur ${Object.keys(fieldMappings).length}`);
        console.log(`❌ Champs manquants:`, missingFields);
        
        // Mettre à jour l'affichage du résumé
        this.updateProfileSummary(userData);
    }

    updateProfileSummary(userData) {
        console.log('📋 Mise à jour du résumé du profil');
        
        // Mettre à jour les informations affichées dans le résumé
        const summaryElements = {
            'profile-summary-name': `${userData.prenom || ''} ${userData.nom || ''}`.trim() || 'Non renseigné',
            'profile-summary-email': userData.email || 'Non renseigné',
            'profile-summary-phone': userData.phone || 'Non renseigné',
            'profile-summary-company': userData.company || 'Non renseigné',
            'profile-summary-address': userData.address || 'Non renseigné',
            'profile-summary-city': userData.city || 'Non renseigné',
            'profile-summary-registration': userData.createdAt ? new Date(userData.createdAt).toLocaleDateString('fr-FR') : 'Date inconnue'
        };
        
        for (const [elementId, value] of Object.entries(summaryElements)) {
            const element = document.getElementById(elementId);
            if (element) {
                element.textContent = value;
                console.log(`✅ Résumé ${elementId}:`, value);
            } else {
                console.warn(`❌ Élément résumé non trouvé: ${elementId}`);
            }
        }
        
        // Mettre à jour le badge de complétion du profil
        this.updateProfileCompletion(userData);
    }

    updateProfileCompletion(userData) {
        const requiredFields = ['email', 'phone', 'company', 'address', 'city'];
        const filledFields = requiredFields.filter(field => userData[field] && userData[field].trim() !== '');
        const completionPercentage = Math.round((filledFields.length / requiredFields.length) * 100);
        
        const completionElement = document.getElementById('profile-completion');
        if (completionElement) {
            completionElement.textContent = `${completionPercentage}% complet`;
            
            // Ajouter une classe en fonction du pourcentage
            completionElement.className = 'badge ';
            if (completionPercentage >= 80) {
                completionElement.classList.add('bg-success');
            } else if (completionPercentage >= 50) {
                completionElement.classList.add('bg-warning');
            } else {
                completionElement.classList.add('bg-danger');
            }
        }
        
        console.log(`📊 Profil complété à ${completionPercentage}% (${filledFields.length}/${requiredFields.length} champs remplis)`);
    }

    setupEventListeners() {
        console.log('🎯 Configuration des écouteurs d\'événements...');
        
        // Sauvegarde des modifications
        const saveButton = document.getElementById('save-profile-btn');
        if (saveButton) {
            saveButton.addEventListener('click', () => this.saveProfile());
            console.log('✅ Écouteur sauvegarde profil configuré');
        } else {
            console.warn('❌ Bouton sauvegarde profil non trouvé');
        }
        
        // Changement de mot de passe
        const changePasswordBtn = document.getElementById('change-password-btn');
        if (changePasswordBtn) {
            changePasswordBtn.addEventListener('click', () => this.showChangePasswordModal());
            console.log('✅ Écouteur changement mot de passe configuré');
        }
        
        // Réinitialisation du formulaire
        const resetButton = document.getElementById('reset-profile-btn');
        if (resetButton) {
            resetButton.addEventListener('click', () => this.resetProfileForm());
            console.log('✅ Écouteur réinitialisation configuré');
        }
        
        // Validation en temps réel
        this.setupRealTimeValidation();
    }

    setupRealTimeValidation() {
        // Validation de l'email
        const emailField = document.getElementById('profileEmail');
        if (emailField) {
            emailField.addEventListener('blur', () => {
                this.validateEmailField(emailField);
            });
        }
        
        // Validation du site web
        const websiteField = document.getElementById('profileWebsite');
        if (websiteField) {
            websiteField.addEventListener('blur', () => {
                this.validateWebsiteField(websiteField);
            });
        }
    }

    validateEmailField(field) {
        const email = field.value.trim();
        if (email && !this.isValidEmail(email)) {
            field.classList.add('is-invalid');
            this.showFieldError(field, 'Format d\'email invalide');
            return false;
        } else {
            field.classList.remove('is-invalid');
            field.classList.add('is-valid');
            this.hideFieldError(field);
            return true;
        }
    }

    validateWebsiteField(field) {
        const website = field.value.trim();
        if (website && !this.isValidWebsite(website)) {
            field.classList.add('is-invalid');
            this.showFieldError(field, 'Format de site web invalide');
            return false;
        } else {
            field.classList.remove('is-invalid');
            if (website) field.classList.add('is-valid');
            this.hideFieldError(field);
            return true;
        }
    }

    isValidEmail(email) {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        return emailRegex.test(email);
    }

    isValidWebsite(website) {
        try {
            new URL(website);
            return true;
        } catch {
            return website.includes('.');
        }
    }

    showFieldError(field, message) {
        let errorElement = field.nextElementSibling;
        if (!errorElement || !errorElement.classList.contains('invalid-feedback')) {
            errorElement = document.createElement('div');
            errorElement.className = 'invalid-feedback';
            field.parentNode.appendChild(errorElement);
        }
        errorElement.textContent = message;
        errorElement.style.display = 'block';
    }

    hideFieldError(field) {
        const errorElement = field.nextElementSibling;
        if (errorElement && errorElement.classList.contains('invalid-feedback')) {
            errorElement.style.display = 'none';
        }
    }

    async saveProfile() {
        console.log('💾 Sauvegarde du profil en cours...');
        
        if (!authState.currentUser) {
            showAlert('❌ Vous devez être connecté pour sauvegarder le profil', 'error');
            return;
        }
        
        // Récupérer les données du formulaire
        const profileData = {
            email: document.getElementById('profileEmail')?.value.trim() || '',
            phone: document.getElementById('profilePhone')?.value.trim() || '',
            company: document.getElementById('profileCompany')?.value.trim() || '',
            address: document.getElementById('profileAddress')?.value.trim() || '',
            city: document.getElementById('profileCity')?.value.trim() || '',
            postalCode: document.getElementById('profilePostalCode')?.value.trim() || '',
            website: document.getElementById('profileWebsite')?.value.trim() || '',
            description: document.getElementById('profileDescription')?.value.trim() || '',
            updatedAt: new Date().toISOString()
        };
        
        // Validation
        if (!this.validateProfileData(profileData)) {
            return;
        }
        
        showLoading(true);
        
        try {
            console.log('💾 Données à sauvegarder:', profileData);
            
            // 🔥 CORRECTION: Utiliser la méthode updateUserProfile de la base de données
            const updatedUser = await btpDB.updateUserProfile(authState.currentUser.id, profileData);
            
            if (updatedUser) {
                // Mettre à jour l'état local
                authState.currentUser = { ...authState.currentUser, ...profileData };
                
                // Mettre à jour le localStorage
                localStorage.setItem('btp_pro_user', JSON.stringify(authState.currentUser));
                
                console.log('✅ Profil sauvegardé avec succès');
                showAlert('✅ Profil mis à jour avec succès', 'success');
                
                // Mettre à jour l'interface
                this.updateProfileSummary(authState.currentUser);
                updateAuthUI();
                
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
            console.error('❌ Erreur sauvegarde profil:', error);
            showAlert('❌ Erreur lors de la mise à jour du profil: ' + error.message, 'error');
        } finally {
            showLoading(false);
        }
    }

    validateProfileData(profileData) {
        // Validation de l'email
        if (!profileData.email) {
            showAlert('❌ L\'email est obligatoire', 'error');
            return false;
        }
        
        if (!this.isValidEmail(profileData.email)) {
            showAlert('❌ Format d\'email invalide', 'error');
            return false;
        }
        
        // Validation du téléphone (si renseigné)
        if (profileData.phone && !this.isValidPhone(profileData.phone)) {
            showAlert('❌ Format de téléphone invalide', 'error');
            return false;
        }
        
        // Validation du site web (si renseigné)
        if (profileData.website && !this.isValidWebsite(profileData.website)) {
            showAlert('❌ Format de site web invalide', 'error');
            return false;
        }
        
        return true;
    }

    isValidPhone(phone) {
        // Validation basique du téléphone (accepte les formats internationaux)
        const phoneRegex = /^[\+]?[0-9\s\-\(\)]{8,}$/;
        return phoneRegex.test(phone.replace(/\s/g, ''));
    }

    resetProfileForm() {
        if (confirm('Êtes-vous sûr de vouloir réinitialiser le formulaire ? Toutes les modifications non sauvegardées seront perdues.')) {
            this.loadUserProfile();
            showAlert('🔁 Formulaire réinitialisé', 'info');
        }
    }

    showChangePasswordModal() {
        if (!authState.currentUser) {
            showAlert('🔐 Connectez-vous pour changer votre mot de passe', 'warning');
            showLoginModal();
            return;
        }
        
        // Utiliser la fonction existante de auth.js
        if (typeof showChangePasswordModal === 'function') {
            showChangePasswordModal();
        } else {
            // Fallback si la fonction n'existe pas
            const passwordModal = new bootstrap.Modal(document.getElementById('changePasswordModal'));
            const form = document.getElementById('changePasswordForm');
            if (form) form.reset();
            passwordModal.show();
        }
    }

    async changePassword(currentPassword, newPassword, confirmPassword) {
        if (!authState.currentUser) {
            showAlert('❌ Vous devez être connecté pour changer le mot de passe', 'error');
            return false;
        }
        
        if (newPassword !== confirmPassword) {
            showAlert('❌ Les mots de passe ne correspondent pas', 'error');
            return false;
        }
        
        if (newPassword.length < 6) {
            showAlert('❌ Le nouveau mot de passe doit contenir au moins 6 caractères', 'error');
            return false;
        }
        
        showLoading(true);
        
        try {
            await btpDB.updateUserPassword(authState.currentUser.id, currentPassword, newPassword);
            showAlert('✅ Mot de passe changé avec succès', 'success');
            return true;
        } catch (error) {
            console.error('❌ Erreur changement mot de passe:', error);
            showAlert('❌ Erreur lors du changement de mot de passe: ' + error.message, 'error');
            return false;
        } finally {
            showLoading(false);
        }
    }

    clearPasswordForm() {
        const form = document.getElementById('changePasswordForm');
        if (form) {
            form.reset();
        }
    }

    // Méthode pour afficher les statistiques du profil
    async showProfileStats() {
        if (!authState.currentUser) return;
        
        try {
            const userId = authState.currentUser.id;
            
            // Récupérer les statistiques de l'utilisateur
            const [marketplacePosts, realestatePosts, jobPosts, freelancerPosts, professionalPosts] = await Promise.all([
                btpDB.get('marketplace_posts'),
                btpDB.get('realestate_posts'),
                btpDB.get('job_posts'),
                btpDB.get('freelancers'),
                btpDB.get('professionals')
            ]);
            
            const userMarketplace = marketplacePosts.filter(post => post.userId === userId);
            const userRealestate = realestatePosts.filter(post => post.userId === userId);
            const userJobs = jobPosts.filter(post => post.userId === userId);
            const userFreelancers = freelancerPosts.filter(post => post.userId === userId);
            const userProfessionals = professionalPosts.filter(post => post.userId === userId);
            
            const stats = {
                marketplace: userMarketplace.length,
                realestate: userRealestate.length,
                jobs: userJobs.length,
                freelancers: userFreelancers.length,
                professionals: userProfessionals.length,
                total: userMarketplace.length + userRealestate.length + userJobs.length + userFreelancers.length + userProfessionals.length
            };
            
            this.displayProfileStats(stats);
            
        } catch (error) {
            console.error('❌ Erreur chargement statistiques:', error);
        }
    }

    displayProfileStats(stats) {
        const statsContainer = document.getElementById('profile-stats');
        if (!statsContainer) return;
        
        statsContainer.innerHTML = `
            <div class="row text-center">
                <div class="col-md-2 col-6 mb-3">
                    <div class="card bg-primary text-white">
                        <div class="card-body">
                            <i class="fas fa-shopping-cart fa-2x mb-2"></i>
                            <h4>${stats.marketplace}</h4>
                            <small>Marketplace</small>
                        </div>
                    </div>
                </div>
                <div class="col-md-2 col-6 mb-3">
                    <div class="card bg-success text-white">
                        <div class="card-body">
                            <i class="fas fa-home fa-2x mb-2"></i>
                            <h4>${stats.realestate}</h4>
                            <small>Immobilier</small>
                        </div>
                    </div>
                </div>
                <div class="col-md-2 col-6 mb-3">
                    <div class="card bg-warning text-white">
                        <div class="card-body">
                            <i class="fas fa-briefcase fa-2x mb-2"></i>
                            <h4>${stats.jobs}</h4>
                            <small>Emplois</small>
                        </div>
                    </div>
                </div>
                <div class="col-md-2 col-6 mb-3">
                    <div class="card bg-info text-white">
                        <div class="card-body">
                            <i class="fas fa-paint-brush fa-2x mb-2"></i>
                            <h4>${stats.freelancers}</h4>
                            <small>Freelance</small>
                        </div>
                    </div>
                </div>
                <div class="col-md-2 col-6 mb-3">
                    <div class="card bg-danger text-white">
                        <div class="card-body">
                            <i class="fas fa-hard-hat fa-2x mb-2"></i>
                            <h4>${stats.professionals}</h4>
                            <small>Professionnels</small>
                        </div>
                    </div>
                </div>
                <div class="col-md-2 col-6 mb-3">
                    <div class="card bg-secondary text-white">
                        <div class="card-body">
                            <i class="fas fa-chart-bar fa-2x mb-2"></i>
                            <h4>${stats.total}</h4>
                            <small>Total</small>
                        </div>
                    </div>
                </div>
            </div>
        `;
    }
}

// ========== INITIALISATION AUTOMATIQUE ==========
let userProfileInstance = null;

function initializeUserProfile() {
    console.log('🚀 Initialisation du gestionnaire de profil...');
    
    if (authState.currentUser && authState.isAuthenticated) {
        userProfileInstance = new UserProfile();
    } else {
        console.log('⏳ Utilisateur non connecté - profil initialisé plus tard');
    }
}

// Réinitialiser le profil lors de la connexion/déconnexion
function refreshUserProfile() {
    if (authState.currentUser && authState.isAuthenticated) {
        if (!userProfileInstance) {
            userProfileInstance = new UserProfile();
        } else {
            userProfileInstance.loadUserProfile();
        }
    } else {
        userProfileInstance = null;
    }
}

// ========== FONCTIONS GLOBALES ==========
function showUserProfile() {
    if (!authState.currentUser) {
        showAlert('🔐 Connectez-vous pour accéder à votre profil', 'warning');
        showLoginModal();
        return;
    }
    
    // Initialiser l'instance si nécessaire
    if (!userProfileInstance) {
        userProfileInstance = new UserProfile();
    }
    
    // Charger les données avant d'afficher
    userProfileInstance.loadUserProfile().then(() => {
        const profileModal = new bootstrap.Modal(document.getElementById('profileModal'));
        profileModal.show();
        
        // Afficher les statistiques
        userProfileInstance.showProfileStats();
    });
}

// ========== ÉCOUTEURS D'ÉVÉNEMENTS ==========
document.addEventListener('DOMContentLoaded', function() {
    console.log('📄 DOM chargé - initialisation du profil');
    
    // Initialiser quand l'utilisateur est connecté
    if (authState.currentUser) {
        initializeUserProfile();
    }
    
    // Écouter les changements d'état d'authentification
    document.addEventListener('authStateChanged', function() {
        console.log('🔄 État auth changé - rafraîchissement du profil');
        refreshUserProfile();
    });
});

// ========== EXPORT DES FONCTIONS ==========
window.initializeUserProfile = initializeUserProfile;
window.refreshUserProfile = refreshUserProfile;
window.showUserProfile = showUserProfile;
window.UserProfile = UserProfile;

console.log('✅ profile.js CORRIGÉ - Gestion complète du profil utilisateur');