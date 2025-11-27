// export-import.js - Gestion de l'import/export Excel AVEC MOTS DE PASSE
class ExportImportManager {
    constructor() {
        this.importedData = null;
        this.initializeEventListeners();
    }

    // Initialiser les écouteurs d'événements
    initializeEventListeners() {
        document.addEventListener('DOMContentLoaded', () => {
            // Écouteurs pour les boutons d'export
            const exportButtons = document.querySelectorAll('[data-export]');
            exportButtons.forEach(btn => {
                btn.addEventListener('click', (e) => {
                    const type = e.target.getAttribute('data-export');
                    this.handleExport(type);
                });
            });

            // Écouteur pour l'import
            const importBtn = document.querySelector('[data-import]');
            if (importBtn) {
                importBtn.addEventListener('click', () => {
                    this.showImportModal();
                });
            }

            // 🔥 NOUVEAU: Bouton de sauvegarde complète avec mots de passe
            const backupBtn = document.getElementById('backupDataBtn');
            if (backupBtn) {
                backupBtn.addEventListener('click', () => {
                    this.exportCompleteBackup();
                });
            }

            // 🔥 NOUVEAU: Bouton de migration serveur
            const migrateBtn = document.getElementById('migrateServerBtn');
            if (migrateBtn) {
                migrateBtn.addEventListener('click', () => {
                    this.migrateToNewServer();
                });
            }
        });
    }

    // Gérer les différents types d'export
    async handleExport(type) {
        try {
            this.showAlert('Export en cours...', 'info');
            
            switch(type) {
                case 'subscribers':
                    await this.exportSubscribers();
                    break;
                case 'products':
                    await this.exportProducts();
                    break;
                case 'realestate':
                    await this.exportRealEstate();
                    break;
                case 'jobs':
                    await this.exportJobs();
                    break;
                case 'freelancers':
                    await this.exportFreelancers();
                    break;
                case 'professionals':
                    await this.exportProfessionals();
                    break;
                case 'complete-backup':
                    await this.exportCompleteBackup();
                    break;
                default:
                    await this.exportSubscribers();
            }
        } catch (error) {
            console.error('Erreur export:', error);
            this.showAlert('Erreur lors de l\'export: ' + error.message, 'error');
        }
    }

    // 🔥 NOUVELLE FONCTION: Export de sauvegarde complète avec mots de passe
    async exportCompleteBackup() {
        try {
            if (!checkAdminAccess()) return;

            this.showAlert('🔄 Préparation de la sauvegarde complète...', 'info');

            // Utiliser la fonction de database.js qui inclut les mots de passe
            const backupData = await btpDB.exportCompleteData();

            if (!backupData || Object.keys(backupData).length === 0) {
                throw new Error('Aucune donnée à sauvegarder');
            }

            // 🔥 VÉRIFICATION DES MOTS DE PASSE
            let passwordStats = { total: 0, withPassword: 0, withoutPassword: 0 };
            if (backupData.users && backupData.users.length > 0) {
                passwordStats.total = backupData.users.length;
                passwordStats.withPassword = backupData.users.filter(user => user.password).length;
                passwordStats.withoutPassword = backupData.users.filter(user => !user.password).length;
                
                console.log('🔐 Statistiques mots de passe:', passwordStats);
            }

            const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
            const fileName = `btp-pro-sauvegarde-complete-${timestamp}.json`;

            const blob = new Blob([JSON.stringify(backupData, null, 2)], { type: 'application/json' });
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = fileName;
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            URL.revokeObjectURL(url);

            // Afficher le résumé avec statistiques des mots de passe
            this.showBackupSummary(backupData, fileName, passwordStats);

            console.log('✅ Sauvegarde complète terminée:', fileName);

        } catch (error) {
            console.error('❌ Erreur sauvegarde complète:', error);
            this.showAlert('❌ Erreur lors de la sauvegarde: ' + error.message, 'error');
        }
    }

    // 🔥 NOUVELLE FONCTION: Afficher le résumé de sauvegarde
    showBackupSummary(backupData, fileName, passwordStats) {
        const stats = this.calculateBackupStats(backupData);
        
        const summaryHTML = `
            <div class="alert alert-success">
                <h5><i class="fas fa-shield-check me-2"></i>Sauvegarde complète réussie !</h5>
                <p><strong>Fichier:</strong> ${fileName}</p>
                
                <div class="row mt-3">
                    <div class="col-md-6">
                        <h6>📊 Données sauvegardées:</h6>
                        <ul class="list-unstyled">
                            <li>👥 Utilisateurs: <strong>${stats.users}</strong></li>
                            <li>🛒 Marketplace: <strong>${stats.marketplace}</strong></li>
                            <li>🏠 Immobilier: <strong>${stats.realestate}</strong></li>
                            <li>💼 Emplois: <strong>${stats.jobs}</strong></li>
                            <li>🎨 Freelance: <strong>${stats.freelancers}</strong></li>
                            <li>👷 Professionnels: <strong>${stats.professionals}</strong></li>
                            <li>💬 Forum: <strong>${stats.forum_topics + stats.forum_replies} messages</strong></li>
                        </ul>
                    </div>
                    <div class="col-md-6">
                        <h6>🔐 État des mots de passe:</h6>
                        <ul class="list-unstyled">
                            <li>✅ Avec mot de passe: <strong>${passwordStats.withPassword}</strong></li>
                            <li>⚠️ Sans mot de passe: <strong>${passwordStats.withoutPassword}</strong></li>
                            <li>📈 Couverture: <strong>${passwordStats.total > 0 ? Math.round((passwordStats.withPassword / passwordStats.total) * 100) : 0}%</strong></li>
                        </ul>
                        ${passwordStats.withoutPassword > 0 ? 
                            '<div class="alert alert-warning mt-2"><small><i class="fas fa-exclamation-triangle me-1"></i>Certains utilisateurs n\'ont pas de mot de passe.</small></div>' : 
                            '<div class="alert alert-success mt-2"><small><i class="fas fa-shield-check me-1"></i>Tous les utilisateurs ont un mot de passe.</small></div>'
                        }
                    </div>
                </div>
                
                <div class="mt-3">
                    <small class="text-muted">
                        <i class="fas fa-info-circle me-1"></i>
                        Cette sauvegarde inclut <strong>TOUS les mots de passe utilisateur</strong> pour permettre une migration complète.
                    </small>
                </div>
            </div>
        `;

        this.showAlert(summaryHTML, 'success', 10000);
    }

    // 🔥 NOUVELLE FONCTION: Calculer les statistiques de sauvegarde
    calculateBackupStats(backupData) {
        return {
            users: backupData.users?.length || 0,
            marketplace: backupData.marketplace_posts?.length || 0,
            realestate: backupData.realestate_posts?.length || 0,
            jobs: backupData.job_posts?.length || 0,
            freelancers: backupData.freelancers?.length || 0,
            professionals: backupData.professionals?.length || 0,
            forum_topics: backupData.forum_topics?.length || 0,
            forum_replies: backupData.forum_replies?.length || 0
        };
    }

    // 🔥 NOUVELLE FONCTION: Migration vers nouveau serveur
    async migrateToNewServer() {
        try {
            if (!checkAdminAccess()) return;

            this.showAlert('🚀 Préparation de la migration...', 'info');

            const migrationResult = await btpDB.migrateToNewServer();

            if (migrationResult) {
                this.showMigrationSummary(migrationResult);
            }

        } catch (error) {
            console.error('❌ Erreur migration:', error);
            this.showAlert('❌ Erreur lors de la migration: ' + error.message, 'error');
        }
    }

    // 🔥 NOUVELLE FONCTION: Afficher le résumé de migration
    showMigrationSummary(migrationResult) {
        const { fileName, stats, passwordStatus } = migrationResult;

        const summaryHTML = `
            <div class="alert alert-success">
                <h5><i class="fas fa-server me-2"></i>Fichier de migration généré !</h5>
                <p><strong>Fichier:</strong> ${fileName}</p>
                
                <div class="row mt-3">
                    <div class="col-md-6">
                        <h6>📦 Données exportées:</h6>
                        <ul class="list-unstyled">
                            <li>👥 Utilisateurs: <strong>${stats.users}</strong></li>
                            <li>🛒 Marketplace: <strong>${stats.marketplace}</strong></li>
                            <li>🏠 Immobilier: <strong>${stats.realestate}</strong></li>
                            <li>💼 Emplois: <strong>${stats.jobs}</strong></li>
                            <li>🎨 Freelance: <strong>${stats.freelancers}</strong></li>
                            <li>👷 Professionnels: <strong>${stats.professionals}</strong></li>
                            <li>💬 Forum: <strong>${stats.forum_topics + stats.forum_replies} messages</strong></li>
                        </ul>
                    </div>
                    <div class="col-md-6">
                        <h6>🔐 Prêt pour migration:</h6>
                        <ul class="list-unstyled">
                            <li>✅ Utilisateurs avec mot de passe: <strong>${passwordStatus.usersWithPasswords}</strong></li>
                            <li>⚠️ Utilisateurs sans mot de passe: <strong>${passwordStatus.usersWithoutPasswords}</strong></li>
                            <li>📈 Taux de réussite: <strong>${Math.round((passwordStatus.usersWithPasswords / passwordStatus.totalUsers) * 100)}%</strong></li>
                        </ul>
                    </div>
                </div>
                
                <div class="mt-3">
                    <h6>📋 Instructions de migration:</h6>
                    <ol class="small">
                        <li>Téléchargez le fichier <strong>${fileName}</strong></li>
                        <li>Sur le nouveau serveur, allez dans l'administration</li>
                        <li>Utilisez la fonction "Importer des données"</li>
                        <li>Sélectionnez ce fichier de migration</li>
                        <li>Confirmez l'import</li>
                    </ol>
                </div>

                <div class="alert alert-info mt-2">
                    <i class="fas fa-info-circle me-2"></i>
                    <strong>Les mots de passe sont inclus</strong> - Les utilisateurs pourront se connecter immédiatement sur le nouveau serveur.
                </div>
            </div>
        `;

        this.showAlert(summaryHTML, 'success', 15000);
    }

    // EXporter les abonnés vers Excel - CORRIGÉ POUR INCLURE MOTS DE PASSE
    async exportSubscribers() {
        try {
            console.log('Début export abonnés...');
            
            // Utiliser la base de données locale qui contient les mots de passe
            const users = await btpDB.get('users');

            console.log('Nombre d\'utilisateurs trouvés:', users.length);

            if (users.length === 0) {
                this.showAlert('Aucun abonné à exporter', 'warning');
                return;
            }

            const subscribers = [];

            users.forEach(user => {
                try {
                    console.log('Utilisateur trouvé:', user.email);
                    
                    const userData = {
                        'ID': user.id,
                        'Prénom': user.prenom || user.firstName || '',
                        'Nom': user.nom || user.lastName || '',
                        'Email': user.email || '',
                        'Téléphone': user.telephone || user.phone || user.tel || '',
                        'Ville': user.ville || user.city || user.location || '',
                        'Entreprise': user.entreprise || user.company || '',
                        'Métier': user.metier || user.job || user.profession || '',
                        'Date d\'inscription': user.createdAt ? this.formatDate(user.createdAt) : '',
                        'Dernière connexion': user.lastVisit ? this.formatDate(user.lastVisit) : '',
                        'Statut Premium': user.hasPremium ? 'Oui' : 'Non',
                        'Email vérifié': user.isVerified ? 'Oui' : 'Non',
                        'Statut': user.status || 'active',
                        'Source': user.source || 'inscription',
                        // 🔥 CORRECTION: INCLURE LE MOT DE PASSE
                        'Mot de passe': user.password || ''
                    };
                    
                    subscribers.push(userData);
                } catch (userError) {
                    console.error('Erreur traitement utilisateur:', user.id, userError);
                }
            });

            console.log('Abonnés préparés pour export:', subscribers.length);

            if (subscribers.length === 0) {
                this.showAlert('Aucune donnée valide à exporter', 'warning');
                return;
            }

            await this.downloadCSV(subscribers, `abonnes_btp_pro_${this.getTimestamp()}.csv`);
            
            // 🔥 AFFICHER LES STATISTIQUES DES MOTS DE PASSE
            const usersWithPasswords = subscribers.filter(user => user['Mot de passe']).length;
            const statsMessage = `${subscribers.length} abonnés exportés avec succès (${usersWithPasswords} avec mot de passe)`;
            this.showAlert(statsMessage, 'success');

        } catch (error) {
            console.error('Erreur export abonnés:', error);
            this.showAlert('Erreur lors de l\'export des abonnés: ' + error.message, 'error');
        }
    }

    // Exporter les produits
    async exportProducts() {
        try {
            const products = await btpDB.get('marketplace_posts');

            const exportData = [];

            products.forEach(product => {
                exportData.push({
                    'ID': product.id,
                    'Titre': product.title || '',
                    'Description': product.description || '',
                    'Prix': product.price || '',
                    'Catégorie': product.category || '',
                    'Sous-catégorie': product.subcategory || '',
                    'Ville': product.city || product.location || '',
                    'Vendeur': product.userName || product.vendor || '',
                    'Email vendeur': product.userEmail || product.vendorEmail || '',
                    'Téléphone vendeur': product.phone || product.vendorPhone || '',
                    'Date publication': product.createdAt ? this.formatDate(product.createdAt) : '',
                    'Statut': product.status || 'active',
                    'Type': product.type || 'vente'
                });
            });

            await this.downloadCSV(exportData, `produits_btp_pro_${this.getTimestamp()}.csv`);
            this.showAlert(`${exportData.length} produits exportés avec succès`, 'success');

        } catch (error) {
            console.error('Erreur export produits:', error);
            this.showAlert('Erreur lors de l\'export des produits', 'error');
        }
    }

    // Exporter les biens immobiliers
    async exportRealEstate() {
        try {
            const properties = await btpDB.get('realestate_posts');

            const exportData = [];

            properties.forEach(property => {
                exportData.push({
                    'ID': property.id,
                    'Titre': property.title || '',
                    'Type': property.type || '',
                    'Prix': property.price || '',
                    'Surface': property.surface || '',
                    'Ville': property.city || property.location || '',
                    'Région': property.region || '',
                    'Chambres': property.rooms || property.bedrooms || '',
                    'Salles de bain': property.bathrooms || '',
                    'Description': property.description || '',
                    'Date publication': property.createdAt ? this.formatDate(property.createdAt) : '',
                    'Statut': property.status || 'active',
                    'Transaction': property.transaction || 'vente'
                });
            });

            await this.downloadCSV(exportData, `immobilier_btp_pro_${this.getTimestamp()}.csv`);
            this.showAlert(`${exportData.length} biens immobiliers exportés avec succès`, 'success');

        } catch (error) {
            console.error('Erreur export immobilier:', error);
            this.showAlert('Erreur lors de l\'export des biens immobiliers', 'error');
        }
    }

    // Exporter les offres d'emploi
    async exportJobs() {
        try {
            const jobs = await btpDB.get('job_posts');

            const exportData = [];

            jobs.forEach(job => {
                exportData.push({
                    'ID': job.id,
                    'Titre': job.poste || job.title || '',
                    'Entreprise': job.company || job.entreprise || '',
                    'Type': job.contrat || job.type || job.contractType || '',
                    'Salaire': job.salaire || job.salary || '',
                    'Ville': job.ville || job.location || job.city || '',
                    'Région': job.region || '',
                    'Description': job.description || '',
                    'Email contact': job.userEmail || job.contactEmail || job.email || '',
                    'Téléphone contact': job.phone || job.contactPhone || '',
                    'Date publication': job.createdAt ? this.formatDate(job.createdAt) : '',
                    'Date expiration': job.expiryDate ? this.formatDate(job.expiryDate) : '',
                    'Statut': job.status || 'active'
                });
            });

            await this.downloadCSV(exportData, `emplois_btp_pro_${this.getTimestamp()}.csv`);
            this.showAlert(`${exportData.length} offres d\'emploi exportées avec succès`, 'success');

        } catch (error) {
            console.error('Erreur export emplois:', error);
            this.showAlert('Erreur lors de l\'export des offres d\'emploi', 'error');
        }
    }

    // Exporter les freelancers
    async exportFreelancers() {
        try {
            const freelancers = await btpDB.get('freelancers');

            const exportData = [];

            freelancers.forEach(freelancer => {
                exportData.push({
                    'ID': freelancer.id,
                    'Prénom': freelancer.prenom || freelancer.firstName || '',
                    'Nom': freelancer.nom || freelancer.lastName || '',
                    'Email': freelancer.userEmail || freelancer.email || '',
                    'Téléphone': freelancer.telephone || freelancer.phone || '',
                    'Ville': freelancer.ville || freelancer.city || freelancer.location || '',
                    'Métier': freelancer.metier || freelancer.job || '',
                    'Spécialité': freelancer.specialty || freelancer.specialite || '',
                    'Expérience': freelancer.experience || '',
                    'Taux journalier': freelancer.tarif || freelancer.dailyRate || '',
                    'Description': freelancer.description || '',
                    'Compétences': freelancer.skills ? freelancer.skills.join(', ') : '',
                    'Date inscription': freelancer.createdAt ? this.formatDate(freelancer.createdAt) : '',
                    'Statut': freelancer.status || 'active'
                });
            });

            await this.downloadCSV(exportData, `freelancers_btp_pro_${this.getTimestamp()}.csv`);
            this.showAlert(`${exportData.length} freelancers exportés avec succès`, 'success');

        } catch (error) {
            console.error('Erreur export freelancers:', error);
            this.showAlert('Erreur lors de l\'export des freelancers', 'error');
        }
    }

    // Exporter les professionnels
    async exportProfessionals() {
        try {
            const professionals = await btpDB.get('professionals');

            const exportData = [];

            professionals.forEach(professional => {
                exportData.push({
                    'ID': professional.id,
                    'Nom entreprise': professional.company || professional.entreprise || '',
                    'SIRET': professional.siret || '',
                    'Email': professional.email || '',
                    'Téléphone': professional.phone || professional.telephone || '',
                    'Adresse': professional.address || '',
                    'Ville': professional.city || '',
                    'Code postal': professional.postalCode || '',
                    'Site web': professional.website || '',
                    'Spécialité': professional.specialty || professional.specialite || '',
                    'Description': professional.description || '',
                    'Date inscription': professional.createdAt ? this.formatDate(professional.createdAt) : '',
                    'Statut': professional.status || 'active',
                    'Premium': professional.isPremium ? 'Oui' : 'Non'
                });
            });

            await this.downloadCSV(exportData, `professionnels_btp_pro_${this.getTimestamp()}.csv`);
            this.showAlert(`${exportData.length} professionnels exportés avec succès`, 'success');

        } catch (error) {
            console.error('Erreur export professionnels:', error);
            this.showAlert('Erreur lors de l\'export des professionnels', 'error');
        }
    }

    // Télécharger le fichier CSV
    async downloadCSV(data, filename) {
        return new Promise((resolve) => {
            try {
                const csv = this.convertToCSV(data);
                const blob = new Blob(['\uFEFF' + csv], { type: 'text/csv;charset=utf-8;' });
                const link = document.createElement('a');
                
                if (link.download !== undefined) {
                    const url = URL.createObjectURL(blob);
                    link.setAttribute('href', url);
                    link.setAttribute('download', filename);
                    link.style.visibility = 'hidden';
                    document.body.appendChild(link);
                    link.click();
                    document.body.removeChild(link);
                    URL.revokeObjectURL(url);
                    console.log('Fichier téléchargé:', filename);
                    resolve();
                } else {
                    this.showAlert('Votre navigateur ne supporte pas le téléchargement', 'error');
                    resolve();
                }
            } catch (error) {
                console.error('Erreur téléchargement CSV:', error);
                this.showAlert('Erreur lors du téléchargement du fichier', 'error');
                resolve();
            }
        });
    }

    // Convertir les données en CSV
    convertToCSV(objArray) {
        if (!objArray || objArray.length === 0) {
            return 'Aucune donnée à exporter';
        }

        const array = typeof objArray !== 'object' ? JSON.parse(objArray) : objArray;
        let str = '';
        
        // Headers
        const headers = Object.keys(array[0]);
        str += headers.join(';') + '\r\n';
        
        // Data
        for (let i = 0; i < array.length; i++) {
            let line = '';
            for (const key in array[i]) {
                if (line !== '') line += ';';
                line += this.escapeCSV(array[i][key]);
            }
            str += line + '\r\n';
        }
        
        return str;
    }

    // Échapper les caractères spéciaux pour CSV
    escapeCSV(value) {
        if (value === null || value === undefined) return '';
        const string = String(value);
        if (string.includes(';') || string.includes('"') || string.includes('\n') || string.includes('\r')) {
            return '"' + string.replace(/"/g, '""') + '"';
        }
        return string;
    }

    // Formater une date
    formatDate(date) {
        if (!date) return '';
        
        let dateObj;
        try {
            if (date.toDate) {
                dateObj = date.toDate();
            } else if (date instanceof Date) {
                dateObj = date;
            } else {
                dateObj = new Date(date);
            }
            
            return dateObj.toLocaleDateString('fr-FR', {
                year: 'numeric',
                month: '2-digit',
                day: '2-digit',
                hour: '2-digit',
                minute: '2-digit'
            });
        } catch (error) {
            console.error('Erreur format date:', date, error);
            return '';
        }
    }

    // Obtenir un timestamp pour les noms de fichiers
    getTimestamp() {
        const now = new Date();
        return now.toISOString().slice(0, 19).replace(/:/g, '-').replace('T', '_');
    }

    // Afficher le modal d'import
    showImportModal() {
        const modalHTML = `
            <div class="modal fade" id="importModal" tabindex="-1">
                <div class="modal-dialog modal-lg">
                    <div class="modal-content">
                        <div class="modal-header">
                            <h5 class="modal-title">
                                <i class="fas fa-upload me-2"></i>Importer des données
                            </h5>
                            <button type="button" class="btn-close" data-bs-dismiss="modal"></button>
                        </div>
                        <div class="modal-body">
                            <div class="row">
                                <div class="col-md-6">
                                    <div class="mb-3">
                                        <label class="form-label">Type d'import</label>
                                        <select class="form-select" id="importType">
                                            <option value="subscribers">Abonnés</option>
                                            <option value="products">Produits</option>
                                            <option value="realestate">Immobilier</option>
                                            <option value="jobs">Offres d'emploi</option>
                                            <!-- 🔥 NOUVEAU: Import de sauvegarde complète -->
                                            <option value="complete-backup">Sauvegarde complète</option>
                                        </select>
                                    </div>
                                </div>
                                <div class="col-md-6">
                                    <div class="mb-3">
                                        <label class="form-label">Télécharger le modèle</label>
                                        <div>
                                            <button type="button" class="btn btn-outline-primary btn-sm w-100" onclick="exportImportManager.downloadTemplate()">
                                                <i class="fas fa-download me-1"></i>Télécharger le modèle
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            <div class="alert alert-info">
                                <i class="fas fa-info-circle me-2"></i>
                                <span id="importInstructions">
                                    Format attendu: CSV avec séparateur point-virgule (;)
                                </span>
                            </div>

                            <div class="mb-3">
                                <label class="form-label">Fichier à importer *</label>
                                <input type="file" class="form-control" id="importFile" accept=".csv,.json" required>
                                <div class="form-text">
                                    <span id="fileFormats">
                                        Formats acceptés: CSV (.csv) - Max 1000 lignes
                                    </span>
                                </div>
                            </div>

                            <div id="importPreview" class="d-none">
                                <h6>Aperçu des données:</h6>
                                <div class="table-responsive" style="max-height: 300px;">
                                    <table class="table table-sm table-striped">
                                        <thead id="importPreviewHeader" class="table-light sticky-top"></thead>
                                        <tbody id="importPreviewBody"></tbody>
                                    </table>
                                </div>
                                <div class="alert alert-warning mt-2">
                                    <i class="fas fa-exclamation-triangle me-2"></i>
                                    <span id="importStats">Vérifiez les données avant import</span>
                                </div>
                            </div>
                        </div>
                        <div class="modal-footer">
                            <button type="button" class="btn btn-secondary" data-bs-dismiss="modal">Annuler</button>
                            <button type="button" class="btn btn-primary" id="confirmImportBtn" disabled onclick="exportImportManager.confirmImport()">
                                <i class="fas fa-upload me-2"></i>Importer les données
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        `;

        if (!document.getElementById('importModal')) {
            document.body.insertAdjacentHTML('beforeend', modalHTML);
        }

        const modal = new bootstrap.Modal(document.getElementById('importModal'));
        modal.show();

        // Reset et écouter les changements
        this.setupImportModalListeners();
    }

    // Configurer les écouteurs du modal d'import
    setupImportModalListeners() {
        document.getElementById('importFile').value = '';
        document.getElementById('importPreview').classList.add('d-none');
        document.getElementById('confirmImportBtn').disabled = true;
        
        // Écouter le changement de type d'import
        document.getElementById('importType').addEventListener('change', (e) => {
            this.updateImportInstructions(e.target.value);
        });
        
        document.getElementById('importFile').addEventListener('change', (event) => {
            this.handleFileImport(event);
        });

        // Initialiser les instructions
        this.updateImportInstructions('subscribers');
    }

    // 🔥 NOUVELLE FONCTION: Mettre à jour les instructions d'import
    updateImportInstructions(importType) {
        const instructions = document.getElementById('importInstructions');
        const fileFormats = document.getElementById('fileFormats');
        
        if (importType === 'complete-backup') {
            instructions.innerHTML = 'Format attendu: Fichier JSON de sauvegarde BTP Pro (inclut les mots de passe)';
            fileFormats.innerHTML = 'Format accepté: JSON (.json) - Fichier de sauvegarde complète';
        } else {
            instructions.innerHTML = 'Format attendu: CSV avec séparateur point-virgule (;)';
            fileFormats.innerHTML = 'Formats acceptés: CSV (.csv) - Max 1000 lignes';
        }
    }

    // Télécharger le modèle Excel
    downloadTemplate() {
        const importType = document.getElementById('importType')?.value || 'subscribers';
        
        // Si c'est une sauvegarde complète, on ne peut pas fournir de modèle
        if (importType === 'complete-backup') {
            this.showAlert('Pour la sauvegarde complète, utilisez la fonction "Sauvegarde complète" pour générer un fichier.', 'info');
            return;
        }

        let templateData = [];

        switch(importType) {
            case 'subscribers':
                templateData = [
                    {
                        'Prénom': 'Jean',
                        'Nom': 'Dupont',
                        'Email': 'jean.dupont@email.com',
                        'Téléphone': '+212612345678',
                        'Ville': 'Casablanca',
                        'Entreprise': 'BTP Maroc',
                        'Métier': 'Architecte',
                        'Mot de passe': 'motdepasse123' // 🔥 INCLURE LE MOT DE PASSE DANS LE MODÈLE
                    }
                ];
                break;
            case 'products':
                templateData = [
                    {
                        'Titre': 'Ciment haute qualité',
                        'Description': 'Ciment pour construction',
                        'Prix': '450',
                        'Catégorie': 'Matériaux',
                        'Ville': 'Casablanca'
                    }
                ];
                break;
            case 'realestate':
                templateData = [
                    {
                        'Titre': 'Villa moderne',
                        'Type': 'Villa',
                        'Prix': '2500000',
                        'Surface': '200',
                        'Ville': 'Marrakech',
                        'Chambres': '4'
                    }
                ];
                break;
            case 'jobs':
                templateData = [
                    {
                        'Titre': 'Chef de chantier',
                        'Entreprise': 'BTP Pro',
                        'Type': 'CDI',
                        'Salaire': '15000',
                        'Ville': 'Rabat',
                        'Description': 'Poste de chef de chantier expérimenté'
                    }
                ];
                break;
        }

        this.downloadCSV(templateData, `modele_import_${importType}.csv`);
    }

    // Gérer l'import de fichier
    async handleFileImport(event) {
        const file = event.target.files[0];
        if (!file) return;

        try {
            this.showAlert('Lecture du fichier en cours...', 'info');
            
            const importType = document.getElementById('importType').value;
            
            if (importType === 'complete-backup') {
                await this.handleBackupImport(file);
            } else {
                await this.handleCSVImport(file);
            }

        } catch (error) {
            console.error('Erreur import:', error);
            this.showAlert('Erreur lors de la lecture du fichier: ' + error.message, 'error');
        }
    }

    // 🔥 NOUVELLE FONCTION: Gérer l'import de sauvegarde complète
    async handleBackupImport(file) {
        const data = await this.readFile(file);
        const backupData = JSON.parse(data);
        
        // Valider la structure de la sauvegarde
        if (!this.validateBackupData(backupData)) {
            throw new Error('Format de sauvegarde invalide');
        }

        this.importedData = backupData;
        this.showBackupImportPreview(backupData);
        document.getElementById('confirmImportBtn').disabled = false;
    }

    // 🔥 NOUVELLE FONCTION: Valider les données de sauvegarde
    validateBackupData(backupData) {
        if (!backupData || typeof backupData !== 'object') {
            return false;
        }

        // Vérifier la présence des collections essentielles
        if (!backupData.users || !Array.isArray(backupData.users)) {
            return false;
        }

        // Vérifier les mots de passe
        console.log('🔐 Validation sauvegarde - Utilisateurs avec mots de passe:',
            backupData.users.filter(user => user.password).length
        );

        return true;
    }

    // 🔥 NOUVELLE FONCTION: Afficher l'aperçu de sauvegarde
    showBackupImportPreview(backupData) {
        const preview = document.getElementById('importPreview');
        const headerContainer = document.getElementById('importPreviewHeader');
        const bodyContainer = document.getElementById('importPreviewBody');
        const statsContainer = document.getElementById('importStats');

        const stats = this.calculateBackupStats(backupData);
        const usersWithPasswords = backupData.users ? backupData.users.filter(user => user.password).length : 0;

        // Headers pour l'aperçu de sauvegarde
        headerContainer.innerHTML = `
            <tr>
                <th>Collection</th>
                <th>Nombre</th>
                <th>Détails</th>
            </tr>
        `;

        // Body
        bodyContainer.innerHTML = `
            <tr>
                <td><strong>Utilisateurs</strong></td>
                <td>${stats.users}</td>
                <td>${usersWithPasswords} avec mot de passe</td>
            </tr>
            <tr>
                <td>Marketplace</td>
                <td>${stats.marketplace}</td>
                <td>Annonces produits</td>
            </tr>
            <tr>
                <td>Immobilier</td>
                <td>${stats.realestate}</td>
                <td>Biens immobiliers</td>
            </tr>
            <tr>
                <td>Emplois</td>
                <td>${stats.jobs}</td>
                <td>Offres d'emploi</td>
            </tr>
            <tr>
                <td>Freelance</td>
                <td>${stats.freelancers}</td>
                <td>Profils freelancers</td>
            </tr>
            <tr>
                <td>Professionnels</td>
                <td>${stats.professionals}</td>
                <td>Entreprises</td>
            </tr>
        `;

        // Stats
        statsContainer.innerHTML = `
            ${stats.users} utilisateurs • 
            ${usersWithPasswords} avec mots de passe •
            Total: ${Object.values(stats).reduce((sum, val) => sum + val, 0)} enregistrements
        `;

        preview.classList.remove('d-none');
    }

    // Gérer l'import CSV standard
    async handleCSVImport(file) {
        const data = await this.readFile(file);
        this.importedData = this.parseCSV(data);
        
        if (this.importedData.length === 0) {
            throw new Error('Aucune donnée valide trouvée dans le fichier');
        }

        if (this.importedData.length > 1000) {
            this.showAlert('Limite de 1000 lignes dépassée. Seules les 1000 premières lignes seront importées.', 'warning');
            this.importedData = this.importedData.slice(0, 1000);
        }

        this.showImportPreview(this.importedData);
        document.getElementById('confirmImportBtn').disabled = false;
    }

    // Lire le fichier
    readFile(file) {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            
            reader.onload = function(e) {
                resolve(e.target.result);
            };
            
            reader.onerror = function(e) {
                reject(new Error('Erreur de lecture du fichier'));
            };

            reader.readAsText(file, 'UTF-8');
        });
    }

    // Parser CSV
    parseCSV(csvText) {
        const lines = csvText.split('\n')
            .map(line => line.trim())
            .filter(line => line.length > 0);

        if (lines.length < 2) {
            throw new Error('Fichier CSV vide ou invalide');
        }

        const headers = lines[0].split(';').map(h => h.trim().replace(/"/g, ''));
        const data = [];

        for (let i = 1; i < lines.length; i++) {
            const values = this.parseCSVLine(lines[i]);
            const row = {};
            
            headers.forEach((header, index) => {
                row[header] = values[index] || '';
            });

            // Ne pas ajouter les lignes vides
            if (Object.values(row).some(value => value.trim() !== '')) {
                data.push(row);
            }
        }

        return data;
    }

    // Parser une ligne CSV correctement
    parseCSVLine(line) {
        const values = [];
        let current = '';
        let inQuotes = false;

        for (let i = 0; i < line.length; i++) {
            const char = line[i];
            const nextChar = line[i + 1];

            if (char === '"') {
                if (inQuotes && nextChar === '"') {
                    current += '"';
                    i++; // Skip next quote
                } else {
                    inQuotes = !inQuotes;
                }
            } else if (char === ';' && !inQuotes) {
                values.push(current);
                current = '';
            } else {
                current += char;
            }
        }

        values.push(current);
        return values.map(v => v.trim().replace(/^"|"$/g, ''));
    }

    // Afficher l'aperçu de l'import
    showImportPreview(data) {
        const preview = document.getElementById('importPreview');
        const headerContainer = document.getElementById('importPreviewHeader');
        const bodyContainer = document.getElementById('importPreviewBody');
        const statsContainer = document.getElementById('importStats');

        if (!data || data.length === 0) {
            preview.classList.add('d-none');
            return;
        }

        // Headers
        const headers = Object.keys(data[0]);
        headerContainer.innerHTML = `
            <tr>
                ${headers.map(header => `<th>${header}</th>`).join('')}
            </tr>
        `;

        // Body (limité à 10 lignes pour l'aperçu)
        const previewData = data.slice(0, 10);
        bodyContainer.innerHTML = previewData.map(row => `
            <tr>
                ${headers.map(header => `<td>${row[header] || ''}</td>`).join('')}
            </tr>
        `).join('');

        // Stats
        const totalRows = data.length;
        const previewRows = previewData.length;
        statsContainer.innerHTML = `
            ${totalRows} enregistrements trouvés • 
            ${previewRows} affichés en aperçu •
            ${totalRows > 1000 ? '⚠️ Limité à 1000 lignes' : ''}
        `;

        preview.classList.remove('d-none');
    }

    // Confirmer l'import
    async confirmImport() {
        if (!this.importedData) {
            this.showAlert('Aucune donnée à importer', 'error');
            return;
        }

        const importBtn = document.getElementById('confirmImportBtn');
        const originalText = importBtn.innerHTML;
        importBtn.disabled = true;

        try {
            const importType = document.getElementById('importType').value;
            let results;

            if (importType === 'complete-backup') {
                // 🔥 IMPORT DE SAUVEGARDE COMPLÈTE
                importBtn.innerHTML = '<i class="fas fa-spinner fa-spin me-2"></i>Sauvegarde en cours...';
                
                if (!confirm('⚠️ IMPORTANT: Cette opération va ÉCRASER toutes les données existantes. Une sauvegarde automatique sera créée. Continuer ?')) {
                    return;
                }

                await btpDB.importCompleteData(this.importedData);
                results = { 
                    importedCount: Object.values(this.calculateBackupStats(this.importedData)).reduce((sum, val) => sum + val, 0),
                    updatedCount: 0,
                    errorCount: 0,
                    errors: []
                };
            } else {
                // Import CSV standard
                importBtn.innerHTML = '<i class="fas fa-spinner fa-spin me-2"></i>Import en cours...';
                
                switch(importType) {
                    case 'subscribers':
                        results = await this.importSubscribers();
                        break;
                    case 'products':
                        results = await this.importProducts();
                        break;
                    case 'realestate':
                        results = await this.importRealEstate();
                        break;
                    case 'jobs':
                        results = await this.importJobs();
                        break;
                    default:
                        results = await this.importSubscribers();
                }
            }

            this.showImportResults(results);
            bootstrap.Modal.getInstance(document.getElementById('importModal')).hide();

        } catch (error) {
            console.error('Erreur import général:', error);
            this.showAlert('❌ Erreur lors de l\'import: ' + error.message, 'error');
        } finally {
            importBtn.innerHTML = originalText;
            importBtn.disabled = false;
        }
    }

    // Importer les abonnés - CORRIGÉ POUR GÉRER LES MOTS DE PASSE
    async importSubscribers() {
        let importedCount = 0;
        let updatedCount = 0;
        let errorCount = 0;
        const errors = [];

        for (const [index, row] of this.importedData.entries()) {
            try {
                if (!row['Email']) {
                    errorCount++;
                    errors.push(`Ligne ${index + 2}: Email manquant`);
                    continue;
                }

                const email = row['Email'].toLowerCase().trim();
                
                if (!this.isValidEmail(email)) {
                    errorCount++;
                    errors.push(`Ligne ${index + 2}: Email invalide - ${email}`);
                    continue;
                }

                // Vérifier si l'utilisateur existe déjà
                const existingUser = await this.findUserByEmail(email);
                
                if (existingUser) {
                    // Mettre à jour l'utilisateur existant
                    await this.updateUser(existingUser.id, row);
                    updatedCount++;
                } else {
                    // Créer un nouvel utilisateur
                    await this.createUser(row);
                    importedCount++;
                }

            } catch (error) {
                console.error(`Erreur import ligne ${index + 2}:`, error);
                errorCount++;
                errors.push(`Ligne ${index + 2}: ${error.message}`);
            }
        }

        return { importedCount, updatedCount, errorCount, errors };
    }

    // Importer les produits
    async importProducts() {
        let importedCount = 0;
        let errorCount = 0;
        const errors = [];

        for (const [index, row] of this.importedData.entries()) {
            try {
                if (!row['Titre'] || !row['Prix']) {
                    errorCount++;
                    errors.push(`Ligne ${index + 2}: Titre ou prix manquant`);
                    continue;
                }

                const productData = {
                    title: row['Titre'],
                    description: row['Description'] || '',
                    price: parseFloat(row['Prix']) || 0,
                    category: row['Catégorie'] || '',
                    city: row['Ville'] || '',
                    status: 'active',
                    createdAt: new Date(),
                    updatedAt: new Date()
                };

                await btpDB.post('marketplace_posts', productData);
                importedCount++;

            } catch (error) {
                console.error(`Erreur import produit ligne ${index + 2}:`, error);
                errorCount++;
                errors.push(`Ligne ${index + 2}: ${error.message}`);
            }
        }

        return { importedCount, updatedCount: 0, errorCount, errors };
    }

    // Importer l'immobilier
    async importRealEstate() {
        let importedCount = 0;
        let errorCount = 0;
        const errors = [];

        for (const [index, row] of this.importedData.entries()) {
            try {
                if (!row['Titre'] || !row['Type']) {
                    errorCount++;
                    errors.push(`Ligne ${index + 2}: Titre ou type manquant`);
                    continue;
                }

                const propertyData = {
                    title: row['Titre'],
                    type: row['Type'],
                    price: parseFloat(row['Prix']) || 0,
                    surface: parseInt(row['Surface']) || 0,
                    city: row['Ville'] || '',
                    rooms: parseInt(row['Chambres']) || 0,
                    description: row['Description'] || '',
                    status: 'active',
                    createdAt: new Date(),
                    updatedAt: new Date()
                };

                await btpDB.post('realestate_posts', propertyData);
                importedCount++;

            } catch (error) {
                console.error(`Erreur import immobilier ligne ${index + 2}:`, error);
                errorCount++;
                errors.push(`Ligne ${index + 2}: ${error.message}`);
            }
        }

        return { importedCount, updatedCount: 0, errorCount, errors };
    }

    // Importer les emplois
    async importJobs() {
        let importedCount = 0;
        let errorCount = 0;
        const errors = [];

        for (const [index, row] of this.importedData.entries()) {
            try {
                if (!row['Titre'] || !row['Entreprise']) {
                    errorCount++;
                    errors.push(`Ligne ${index + 2}: Titre ou entreprise manquant`);
                    continue;
                }

                const jobData = {
                    poste: row['Titre'],
                    company: row['Entreprise'],
                    contrat: row['Type'] || 'CDI',
                    salaire: row['Salaire'] || '',
                    ville: row['Ville'] || '',
                    description: row['Description'] || '',
                    status: 'active',
                    createdAt: new Date(),
                    updatedAt: new Date()
                };

                await btpDB.post('job_posts', jobData);
                importedCount++;

            } catch (error) {
                console.error(`Erreur import emploi ligne ${index + 2}:`, error);
                errorCount++;
                errors.push(`Ligne ${index + 2}: ${error.message}`);
            }
        }

        return { importedCount, updatedCount: 0, errorCount, errors };
    }

    // Afficher les résultats de l'import
    showImportResults(results) {
        const { importedCount, updatedCount, errorCount, errors } = results;
        
        let message = `Import terminé: `;
        const parts = [];
        
        if (importedCount > 0) parts.push(`${importedCount} nouveaux`);
        if (updatedCount > 0) parts.push(`${updatedCount} mis à jour`);
        if (errorCount > 0) parts.push(`${errorCount} erreurs`);
        
        message += parts.join(', ');

        const type = errorCount === 0 ? 'success' : errorCount === this.importedData.length ? 'error' : 'warning';
        
        if (errors.length > 0) {
            message += `<br><small>Erreurs: ${errors.slice(0, 5).join(', ')}${errors.length > 5 ? '...' : ''}</small>`;
        }

        this.showAlert(message, type);
    }

    // Valider un email
    isValidEmail(email) {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        return emailRegex.test(email);
    }

    // Trouver un utilisateur par email - CORRIGÉ POUR BASE LOCALE
    async findUserByEmail(email) {
        try {
            const users = await btpDB.get('users');
            return users.find(user => user.email.toLowerCase() === email.toLowerCase()) || null;
        } catch (error) {
            console.error('Erreur recherche utilisateur:', error);
            return null;
        }
    }

    // Mettre à jour un utilisateur existant - CORRIGÉ POUR BASE LOCALE
    async updateUser(userId, data) {
        const updateData = {
            prenom: data['Prénom'] || '',
            nom: data['Nom'] || '',
            telephone: data['Téléphone'] || '',
            ville: data['Ville'] || '',
            entreprise: data['Entreprise'] || '',
            metier: data['Métier'] || '',
            // 🔥 CORRECTION: Mettre à jour le mot de passe si fourni
            ...(data['Mot de passe'] && { password: data['Mot de passe'] }),
            updatedAt: new Date().toISOString()
        };

        // Nettoyer les données (supprimer les champs vides)
        Object.keys(updateData).forEach(key => {
            if (updateData[key] === '') {
                delete updateData[key];
            }
        });

        await btpDB.put('users', userId, updateData);
    }

    // Créer un nouvel utilisateur - CORRIGÉ POUR BASE LOCALE
    async createUser(data) {
        const userData = {
            prenom: data['Prénom'] || '',
            nom: data['Nom'] || '',
            email: data['Email'].toLowerCase(),
            // 🔥 CORRECTION: INCLURE LE MOT DE PASSE
            password: data['Mot de passe'] || 'btp123', // Mot de passe par défaut
            telephone: data['Téléphone'] || '',
            ville: data['Ville'] || '',
            entreprise: data['Entreprise'] || '',
            metier: data['Métier'] || '',
            hasPremium: false,
            isVerified: false,
            status: 'active',
            source: 'import_csv',
            createdAt: new Date().toISOString(),
            lastVisit: new Date().toISOString(),
            updatedAt: new Date().toISOString()
        };

        await btpDB.post('users', userData);
    }

    // Afficher une alerte
    showAlert(message, type = 'info') {
        // Supprimer les alertes existantes
        const existingAlerts = document.querySelectorAll('.alert.position-fixed');
        existingAlerts.forEach(alert => alert.remove());

        const alertClass = type === 'error' ? 'alert-danger' : 
                          type === 'success' ? 'alert-success' : 
                          type === 'warning' ? 'alert-warning' : 'alert-info';
        
        const icon = type === 'success' ? 'check' : 
                    type === 'error' ? 'exclamation-triangle' : 
                    type === 'warning' ? 'exclamation-circle' : 'info-circle';

        const alertHTML = `
            <div class="alert ${alertClass} alert-dismissible fade show position-fixed top-0 start-50 translate-middle-x mt-3" style="z-index: 1060; min-width: 300px;">
                <div class="d-flex align-items-center">
                    <i class="fas fa-${icon} me-2"></i>
                    <div>${message}</div>
                    <button type="button" class="btn-close ms-2" data-bs-dismiss="alert"></button>
                </div>
            </div>
        `;
        
        document.body.insertAdjacentHTML('beforeend', alertHTML);
        
        // Auto-fermeture après 5 secondes (sauf pour les succès importants)
        const duration = type === 'success' && message.includes('Sauvegarde') ? 10000 : 5000;
        setTimeout(() => {
            const alert = document.querySelector('.alert.position-fixed');
            if (alert) {
                const bsAlert = new bootstrap.Alert(alert);
                bsAlert.close();
            }
        }, duration);
    }
}

// Initialiser le manager d'import/export
const exportImportManager = new ExportImportManager();

// 🔥 EXPORTER LES FONCTIONS POUR L'ADMINISTRATION
window.exportCompleteBackup = () => exportImportManager.exportCompleteBackup();
window.migrateToNewServer = () => exportImportManager.migrateToNewServer();

console.log('✅ export-import.js CORRIGÉ - Sauvegarde avec mots de passe activée');