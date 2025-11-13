// Gestion du profil utilisateur et des coordonnées
class UserProfile {
    constructor() {
        this.initProfile();
    }

    async initProfile() {
        // Charger les données du profil
        await this.loadUserProfile();
        this.setupEventListeners();
    }

    async loadUserProfile() {
        try {
            const user = await auth.getCurrentUser();
            if (user) {
                const userData = await database.getUserProfile(user.uid);
                this.populateProfileForm(userData);
            }
        } catch (error) {
            console.error('Erreur chargement profil:', error);
        }
    }

    populateProfileForm(userData) {
        // Remplir le formulaire avec les données existantes
        document.getElementById('profile-email').value = userData.email || '';
        document.getElementById('profile-phone').value = userData.phone || '';
        document.getElementById('profile-company').value = userData.company || '';
        document.getElementById('profile-address').value = userData.address || '';
        // ... autres champs
    }

    setupEventListeners() {
        // Sauvegarde des modifications
        document.getElementById('save-profile-btn').addEventListener('click', () => this.saveProfile());
        
        // Changement de mot de passe
        document.getElementById('change-password-btn').addEventListener('click', () => this.changePassword());
    }

    async saveProfile() {
        try {
            const user = await auth.getCurrentUser();
            const profileData = {
                email: document.getElementById('profile-email').value,
                phone: document.getElementById('profile-phone').value,
                company: document.getElementById('profile-company').value,
                address: document.getElementById('profile-address').value,
                updatedAt: new Date().toISOString()
            };

            await database.updateUserProfile(user.uid, profileData);
            utils.showNotification('Profil mis à jour avec succès', 'success');
        } catch (error) {
            console.error('Erreur sauvegarde profil:', error);
            utils.showNotification('Erreur lors de la mise à jour', 'error');
        }
    }

    async changePassword() {
        const currentPassword = document.getElementById('current-password').value;
        const newPassword = document.getElementById('new-password').value;
        const confirmPassword = document.getElementById('confirm-password').value;

        if (newPassword !== confirmPassword) {
            utils.showNotification('Les mots de passe ne correspondent pas', 'error');
            return;
        }

        try {
            await auth.updatePassword(currentPassword, newPassword);
            utils.showNotification('Mot de passe modifié avec succès', 'success');
            this.clearPasswordForm();
        } catch (error) {
            console.error('Erreur changement mot de passe:', error);
            utils.showNotification('Erreur lors du changement de mot de passe', 'error');
        }
    }

    clearPasswordForm() {
        document.getElementById('current-password').value = '';
        document.getElementById('new-password').value = '';
        document.getElementById('confirm-password').value = '';
    }
}