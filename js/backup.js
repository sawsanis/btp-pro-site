// backup.js - Version simplifiée qui utilise export-import.js
class BackupManager {
    constructor() {
        console.log('✅ BackupManager initialisé - Utilise le système export-import');
    }

    // Redirige vers le système principal
    showBackupModal() {
        if (typeof exportImportManager !== 'undefined') {
            exportImportManager.showBackupModal();
        } else {
            this.showAlert('❌ Système de sauvegarde non disponible', 'error');
        }
    }

    // Créer une sauvegarde locale
    async createLocalBackup() {
        if (typeof exportImportManager !== 'undefined') {
            await exportImportManager.downloadBackup();
        } else {
            this.showAlert('❌ Système de sauvegarde non disponible', 'error');
        }
    }

    // Envoyer par email
    async sendBackupByEmail() {
        if (typeof exportImportManager !== 'undefined') {
            await exportImportManager.sendBackupByEmail();
        } else {
            this.showAlert('❌ Système d\'envoi email non disponible', 'error');
        }
    }

    // Options pour l'envoi par email (compatibilité)
    showEmailBackupOptions() {
        if (typeof exportImportManager !== 'undefined') {
            this.sendBackupByEmail();
        } else {
            this.showAlert('❌ Système d\'envoi email non disponible', 'error');
        }
    }

    // Options de restauration (compatibilité)
    showRestoreOptions() {
        if (typeof exportImportManager !== 'undefined') {
            exportImportManager.showBackupModal();
        } else {
            this.showAlert('❌ Système de restauration non disponible', 'error');
        }
    }

    // Charger l'historique (vide pour compatibilité)
    async loadBackupHistory() {
        console.log('📊 Historique géré par export-import.js');
    }

    // Télécharger une sauvegarde (compatibilité)
    async downloadBackup(backupId) {
        this.showAlert('ℹ️ Utilisez le système de sauvegarde principal', 'info');
    }

    // Voir les détails (compatibilité)
    viewBackupDetails(backupId) {
        this.showAlert('ℹ️ Détails disponibles dans le système principal', 'info');
    }

    // Sauvegarde automatique (compatibilité)
    async scheduleAutoBackup() {
        console.log('⏰ Sauvegarde automatique gérée par export-import.js');
    }

    // Afficher une alerte
    showAlert(message, type = 'info') {
        const alertClass = type === 'error' ? 'alert-danger' : 
                          type === 'success' ? 'alert-success' : 'alert-info';
        
        const alertHTML = `
            <div class="alert ${alertClass} alert-dismissible fade show position-fixed top-0 start-50 translate-middle-x mt-3" style="z-index: 1060;">
                <i class="fas fa-${type === 'success' ? 'check' : type === 'error' ? 'exclamation-triangle' : 'info'}-circle me-2"></i>
                ${message}
                <button type="button" class="btn-close" data-bs-dismiss="alert"></button>
            </div>
        `;
        
        document.body.insertAdjacentHTML('beforeend', alertHTML);
        
        setTimeout(() => {
            const alert = document.querySelector('.alert.position-fixed');
            if (alert) {
                bootstrap.Alert.getOrCreateInstance(alert).close();
            }
        }, 5000);
    }
}

// Initialiser le manager de sauvegarde
const backupManager = new BackupManager();