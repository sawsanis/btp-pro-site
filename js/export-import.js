// export-import.js - Gestion de l'import/export Excel
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
                default:
                    await this.exportSubscribers();
            }
        } catch (error) {
            console.error('Erreur export:', error);
            this.showAlert('Erreur lors de l\'export: ' + error.message, 'error');
        }
    }

    // EXporter les abonnés vers Excel - CORRIGÉ
    async exportSubscribers() {
        try {
            console.log('Début export abonnés...');
            
            const usersSnapshot = await firebase.firestore()
                .collection('users')
                .orderBy('createdAt', 'desc')
                .get();

            console.log('Nombre d\'utilisateurs trouvés:', usersSnapshot.size);

            if (usersSnapshot.empty) {
                this.showAlert('Aucun abonné à exporter', 'warning');
                return;
            }

            const subscribers = [];

            usersSnapshot.forEach(doc => {
                try {
                    const user = doc.data();
                    console.log('Utilisateur trouvé:', user.email);
                    
                    const userData = {
                        'ID': doc.id,
                        'Prénom': user.prenom || user.firstName || '',
                        'Nom': user.nom || user.lastName || '',
                        'Email': user.email || '',
                        'Téléphone': user.telephone || user.phone || user.tel || '',
                        'Ville': user.ville || user.city || user.location || '',
                        'Entreprise': user.entreprise || user.company || '',
                        'Métier': user.metier || user.job || user.profession || '',
                        'Date d\'inscription': user.createdAt ? this.formatDate(user.createdAt) : '',
                        'Dernière connexion': user.lastLogin ? this.formatDate(user.lastLogin) : '',
                        'Statut Premium': user.isPremium ? 'Oui' : 'Non',
                        'Email vérifié': user.emailVerified ? 'Oui' : 'Non',
                        'Statut': user.status || 'active',
                        'Source': user.source || 'inscription'
                    };
                    
                    subscribers.push(userData);
                } catch (userError) {
                    console.error('Erreur traitement utilisateur:', doc.id, userError);
                }
            });

            console.log('Abonnés préparés pour export:', subscribers.length);

            if (subscribers.length === 0) {
                this.showAlert('Aucune donnée valide à exporter', 'warning');
                return;
            }

            await this.downloadCSV(subscribers, `abonnes_btp_pro_${this.getTimestamp()}.csv`);
            this.showAlert(`${subscribers.length} abonnés exportés avec succès`, 'success');

        } catch (error) {
            console.error('Erreur export abonnés:', error);
            this.showAlert('Erreur lors de l\'export des abonnés: ' + error.message, 'error');
        }
    }

    // Exporter les produits
    async exportProducts() {
        try {
            const productsSnapshot = await firebase.firestore()
                .collection('products')
                .orderBy('createdAt', 'desc')
                .get();

            const products = [];

            productsSnapshot.forEach(doc => {
                const product = doc.data();
                products.push({
                    'ID': doc.id,
                    'Titre': product.title || '',
                    'Description': product.description || '',
                    'Prix': product.price || '',
                    'Catégorie': product.category || '',
                    'Sous-catégorie': product.subcategory || '',
                    'Ville': product.city || product.location || '',
                    'Vendeur': product.sellerName || product.vendor || '',
                    'Email vendeur': product.sellerEmail || product.vendorEmail || '',
                    'Téléphone vendeur': product.sellerPhone || product.vendorPhone || '',
                    'Date publication': product.createdAt ? this.formatDate(product.createdAt) : '',
                    'Statut': product.status || 'active',
                    'Type': product.type || 'vente'
                });
            });

            await this.downloadCSV(products, `produits_btp_pro_${this.getTimestamp()}.csv`);
            this.showAlert(`${products.length} produits exportés avec succès`, 'success');

        } catch (error) {
            console.error('Erreur export produits:', error);
            this.showAlert('Erreur lors de l\'export des produits', 'error');
        }
    }

    // Exporter les biens immobiliers
    async exportRealEstate() {
        try {
            const realEstateSnapshot = await firebase.firestore()
                .collection('realestate')
                .orderBy('createdAt', 'desc')
                .get();

            const properties = [];

            realEstateSnapshot.forEach(doc => {
                const property = doc.data();
                properties.push({
                    'ID': doc.id,
                    'Titre': property.title || '',
                    'Type': property.type || '',
                    'Prix': property.price || '',
                    'Surface': property.surface || '',
                    'Ville': property.city || property.location || '',
                    'Région': property.region || '',
                    'Chambres': property.bedrooms || '',
                    'Salles de bain': property.bathrooms || '',
                    'Description': property.description || '',
                    'Date publication': property.createdAt ? this.formatDate(property.createdAt) : '',
                    'Statut': property.status || 'active',
                    'Transaction': property.transactionType || 'vente'
                });
            });

            await this.downloadCSV(properties, `immobilier_btp_pro_${this.getTimestamp()}.csv`);
            this.showAlert(`${properties.length} biens immobiliers exportés avec succès`, 'success');

        } catch (error) {
            console.error('Erreur export immobilier:', error);
            this.showAlert('Erreur lors de l\'export des biens immobiliers', 'error');
        }
    }

    // Exporter les offres d'emploi
    async exportJobs() {
        try {
            const jobsSnapshot = await firebase.firestore()
                .collection('jobs')
                .orderBy('createdAt', 'desc')
                .get();

            const jobs = [];

            jobsSnapshot.forEach(doc => {
                const job = doc.data();
                jobs.push({
                    'ID': doc.id,
                    'Titre': job.title || '',
                    'Entreprise': job.company || job.entreprise || '',
                    'Type': job.type || job.contractType || '',
                    'Salaire': job.salary || job.salaire || '',
                    'Ville': job.location || job.city || '',
                    'Région': job.region || '',
                    'Description': job.description || '',
                    'Email contact': job.contactEmail || job.email || '',
                    'Téléphone contact': job.contactPhone || job.phone || '',
                    'Date publication': job.createdAt ? this.formatDate(job.createdAt) : '',
                    'Date expiration': job.expiryDate ? this.formatDate(job.expiryDate) : '',
                    'Statut': job.status || 'active'
                });
            });

            await this.downloadCSV(jobs, `emplois_btp_pro_${this.getTimestamp()}.csv`);
            this.showAlert(`${jobs.length} offres d\'emploi exportées avec succès`, 'success');

        } catch (error) {
            console.error('Erreur export emplois:', error);
            this.showAlert('Erreur lors de l\'export des offres d\'emploi', 'error');
        }
    }

    // Exporter les freelancers
    async exportFreelancers() {
        try {
            const freelancersSnapshot = await firebase.firestore()
                .collection('freelancers')
                .orderBy('createdAt', 'desc')
                .get();

            const freelancers = [];

            freelancersSnapshot.forEach(doc => {
                const freelancer = doc.data();
                freelancers.push({
                    'ID': doc.id,
                    'Prénom': freelancer.prenom || freelancer.firstName || '',
                    'Nom': freelancer.nom || freelancer.lastName || '',
                    'Email': freelancer.email || '',
                    'Téléphone': freelancer.telephone || freelancer.phone || '',
                    'Ville': freelancer.city || freelancer.location || '',
                    'Métier': freelancer.metier || freelancer.job || '',
                    'Spécialité': freelancer.specialty || freelancer.specialite || '',
                    'Expérience': freelancer.experience || '',
                    'Taux journalier': freelancer.dailyRate || '',
                    'Description': freelancer.description || '',
                    'Compétences': freelancer.skills ? freelancer.skills.join(', ') : '',
                    'Date inscription': freelancer.createdAt ? this.formatDate(freelancer.createdAt) : '',
                    'Statut': freelancer.status || 'active'
                });
            });

            await this.downloadCSV(freelancers, `freelancers_btp_pro_${this.getTimestamp()}.csv`);
            this.showAlert(`${freelancers.length} freelancers exportés avec succès`, 'success');

        } catch (error) {
            console.error('Erreur export freelancers:', error);
            this.showAlert('Erreur lors de l\'export des freelancers', 'error');
        }
    }

    // Exporter les professionnels
    async exportProfessionals() {
        try {
            const professionalsSnapshot = await firebase.firestore()
                .collection('professionals')
                .orderBy('createdAt', 'desc')
                .get();

            const professionals = [];

            professionalsSnapshot.forEach(doc => {
                const professional = doc.data();
                professionals.push({
                    'ID': doc.id,
                    'Nom entreprise': professional.companyName || professional.entreprise || '',
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

            await this.downloadCSV(professionals, `professionnels_btp_pro_${this.getTimestamp()}.csv`);
            this.showAlert(`${professionals.length} professionnels exportés avec succès`, 'success');

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
                                Format attendu: CSV avec séparateur point-virgule (;)
                            </div>

                            <div class="mb-3">
                                <label class="form-label">Fichier à importer *</label>
                                <input type="file" class="form-control" id="importFile" accept=".csv" required>
                                <div class="form-text">
                                    Format accepté: CSV (.csv) - Max 1000 lignes
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
        
        document.getElementById('importFile').addEventListener('change', (event) => {
            this.handleFileImport(event);
        });
    }

    // Télécharger le modèle Excel
    downloadTemplate() {
        const importType = document.getElementById('importType')?.value || 'subscribers';
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
                        'Métier': 'Architecte'
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

        } catch (error) {
            console.error('Erreur import:', error);
            this.showAlert('Erreur lors de la lecture du fichier: ' + error.message, 'error');
        }
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
        if (!this.importedData || this.importedData.length === 0) {
            this.showAlert('Aucune donnée à importer', 'error');
            return;
        }

        const importBtn = document.getElementById('confirmImportBtn');
        const originalText = importBtn.innerHTML;
        importBtn.innerHTML = '<i class="fas fa-spinner fa-spin me-2"></i>Import en cours...';
        importBtn.disabled = true;

        try {
            const importType = document.getElementById('importType').value;
            let results;

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

            this.showImportResults(results);
            bootstrap.Modal.getInstance(document.getElementById('importModal')).hide();

        } catch (error) {
            console.error('Erreur import général:', error);
            this.showAlert('Erreur lors de l\'import: ' + error.message, 'error');
        } finally {
            importBtn.innerHTML = originalText;
            importBtn.disabled = false;
        }
    }

    // Importer les abonnés - CORRIGÉ
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

                await firebase.firestore().collection('products').add(productData);
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
                    bedrooms: parseInt(row['Chambres']) || 0,
                    description: row['Description'] || '',
                    status: 'active',
                    createdAt: new Date(),
                    updatedAt: new Date()
                };

                await firebase.firestore().collection('realestate').add(propertyData);
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
                    title: row['Titre'],
                    company: row['Entreprise'],
                    type: row['Type'] || 'CDI',
                    salary: row['Salaire'] || '',
                    location: row['Ville'] || '',
                    description: row['Description'] || '',
                    contactEmail: row['Email contact'] || '',
                    status: 'active',
                    createdAt: new Date(),
                    updatedAt: new Date()
                };

                await firebase.firestore().collection('jobs').add(jobData);
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

    // Trouver un utilisateur par email - CORRIGÉ
    async findUserByEmail(email) {
        try {
            const snapshot = await firebase.firestore()
                .collection('users')
                .where('email', '==', email.toLowerCase())
                .limit(1)
                .get();

            if (snapshot.empty) return null;

            return {
                id: snapshot.docs[0].id,
                ...snapshot.docs[0].data()
            };
        } catch (error) {
            console.error('Erreur recherche utilisateur:', error);
            return null;
        }
    }

    // Mettre à jour un utilisateur existant - CORRIGÉ
    async updateUser(userId, data) {
        const updateData = {
            prenom: data['Prénom'] || '',
            nom: data['Nom'] || '',
            telephone: data['Téléphone'] || '',
            ville: data['Ville'] || '',
            entreprise: data['Entreprise'] || '',
            metier: data['Métier'] || '',
            updatedAt: new Date()
        };

        // Nettoyer les données (supprimer les champs vides)
        Object.keys(updateData).forEach(key => {
            if (updateData[key] === '') {
                delete updateData[key];
            }
        });

        await firebase.firestore()
            .collection('users')
            .doc(userId)
            .update(updateData);
    }

    // Créer un nouvel utilisateur - CORRIGÉ
    async createUser(data) {
        const userData = {
            prenom: data['Prénom'] || '',
            nom: data['Nom'] || '',
            email: data['Email'].toLowerCase(),
            telephone: data['Téléphone'] || '',
            ville: data['Ville'] || '',
            entreprise: data['Entreprise'] || '',
            metier: data['Métier'] || '',
            isPremium: false,
            emailVerified: false,
            status: 'active',
            source: 'import_csv',
            createdAt: new Date(),
            lastLogin: new Date(),
            updatedAt: new Date()
        };

        await firebase.firestore()
            .collection('users')
            .add(userData);
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
        
        // Auto-fermeture après 5 secondes
        setTimeout(() => {
            const alert = document.querySelector('.alert.position-fixed');
            if (alert) {
                const bsAlert = new bootstrap.Alert(alert);
                bsAlert.close();
            }
        }, 5000);
    }
}

// Initialiser le manager d'import/export
const exportImportManager = new ExportImportManager();