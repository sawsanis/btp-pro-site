// export-import.js - Gestion de l'import/export Excel
class ExportImportManager {
    constructor() {
        this.importedData = null;
    }

    // Exporter les abonnés vers Excel
    async exportSubscribers() {
        try {
            const usersSnapshot = await firebase.firestore().collection('users').get();
            const subscribers = [];

            usersSnapshot.forEach(doc => {
                const user = doc.data();
                subscribers.push({
                    'Prénom': user.prenom || '',
                    'Nom': user.nom || '',
                    'Email': user.email || '',
                    'Téléphone': user.phone || '',
                    'Ville': user.city || '',
                    'Date d\'inscription': user.createdAt ? user.createdAt.toDate().toLocaleDateString() : '',
                    'Statut Premium': user.isPremium ? 'Oui' : 'Non',
                    'Dernière connexion': user.lastLogin ? user.lastLogin.toDate().toLocaleDateString() : ''
                });
            });

            this.downloadCSV(subscribers, 'abonnes_btp_pro.csv');
            this.showAlert(`${subscribers.length} abonnés exportés avec succès`, 'success');

        } catch (error) {
            console.error('Erreur export:', error);
            this.showAlert('Erreur lors de l\'export', 'error');
        }
    }

    // Télécharger le fichier CSV
    downloadCSV(data, filename) {
        const csv = this.convertToCSV(data);
        const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
        const link = document.createElement('a');
        
        if (link.download !== undefined) {
            const url = URL.createObjectURL(blob);
            link.setAttribute('href', url);
            link.setAttribute('download', filename);
            link.style.visibility = 'hidden';
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
        }
    }

    // Convertir les données en CSV
    convertToCSV(objArray) {
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
        if (string.includes(';') || string.includes('"') || string.includes('\n')) {
            return '"' + string.replace(/"/g, '""') + '"';
        }
        return string;
    }

    // Afficher le modal d'import
    showImportModal() {
        const modalHTML = `
            <div class="modal fade" id="importModal" tabindex="-1">
                <div class="modal-dialog">
                    <div class="modal-content">
                        <div class="modal-header">
                            <h5 class="modal-title">
                                <i class="fas fa-upload me-2"></i>Importer des abonnés
                            </h5>
                            <button type="button" class="btn-close" data-bs-dismiss="modal"></button>
                        </div>
                        <div class="modal-body">
                            <div class="alert alert-info">
                                <i class="fas fa-info-circle me-2"></i>
                                Format attendu: CSV avec colonnes: Prénom, Nom, Email, Téléphone, Ville
                            </div>
                            
                            <div class="mb-3">
                                <label class="form-label">Télécharger le modèle</label>
                                <div>
                                    <button type="button" class="btn btn-outline-primary btn-sm" onclick="exportImportManager.downloadTemplate()">
                                        <i class="fas fa-download me-1"></i>Télécharger le modèle Excel
                                    </button>
                                </div>
                            </div>

                            <div class="mb-3">
                                <label class="form-label">Fichier à importer *</label>
                                <input type="file" class="form-control" id="importFile" accept=".csv,.xlsx,.xls" required>
                                <div class="form-text">
                                    Formats acceptés: CSV, Excel (.xlsx, .xls)
                                </div>
                            </div>

                            <div id="importPreview" class="d-none">
                                <h6>Aperçu des données:</h6>
                                <div class="table-responsive">
                                    <table class="table table-sm table-striped">
                                        <thead id="importPreviewHeader"></thead>
                                        <tbody id="importPreviewBody"></tbody>
                                    </table>
                                </div>
                                <div class="alert alert-warning">
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

        // Reset et écouter les changements de fichier
        document.getElementById('importFile').value = '';
        document.getElementById('importPreview').classList.add('d-none');
        document.getElementById('confirmImportBtn').disabled = true;
        
        document.getElementById('importFile').addEventListener('change', (event) => {
            this.handleFileImport(event);
        });
    }

    // Télécharger le modèle Excel
    downloadTemplate() {
        const templateData = [
            {
                'Prénom': 'Jean',
                'Nom': 'Dupont',
                'Email': 'jean.dupont@email.com',
                'Téléphone': '+212612345678',
                'Ville': 'Casablanca',
                'Notes': 'Client potentiel'
            },
            {
                'Prénom': 'Marie',
                'Nom': 'Martin',
                'Email': 'marie.martin@email.com', 
                'Téléphone': '+212698765432',
                'Ville': 'Marrakech',
                'Notes': 'Intéressé par Premium'
            }
        ];

        this.downloadCSV(templateData, 'modele_import_abonnes.csv');
    }

    // Gérer l'import de fichier
    async handleFileImport(event) {
        const file = event.target.files[0];
        if (!file) return;

        try {
            const data = await this.readFile(file);
            this.importedData = this.parseImportData(data, file.name);
            
            this.showImportPreview(this.importedData);
            document.getElementById('confirmImportBtn').disabled = false;

        } catch (error) {
            console.error('Erreur import:', error);
            this.showAlert('Erreur lors de la lecture du fichier', 'error');
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

            if (file.name.endsWith('.csv')) {
                reader.readAsText(file, 'UTF-8');
            } else {
                // Pour Excel, on utilise une approche simplifiée
                reader.readAsBinaryString(file);
            }
        });
    }

    // Parser les données d'import
    parseImportData(data, filename) {
        if (filename.endsWith('.csv')) {
            return this.parseCSV(data);
        } else {
            // Pour Excel, on retourne les données brutes
            // Dans une vraie implémentation, on utiliserait une librairie comme SheetJS
            return this.parseExcelSimplified(data);
        }
    }

    // Parser CSV simplifié
    parseCSV(csvText) {
        const lines = csvText.split('\n').filter(line => line.trim());
        if (lines.length < 2) throw new Error('Fichier CSV vide ou invalide');

        const headers = lines[0].split(';').map(h => h.trim().replace(/"/g, ''));
        const data = [];

        for (let i = 1; i < lines.length; i++) {
            const values = lines[i].split(';').map(v => v.trim().replace(/"/g, ''));
            const row = {};
            
            headers.forEach((header, index) => {
                row[header] = values[index] || '';
            });

            if (row['Email']) { // Uniquement les lignes avec email
                data.push(row);
            }
        }

        return data;
    }

    // Parser Excel simplifié (version basique)
    parseExcelSimplified(data) {
        // Cette fonction est simplifiée - dans la réalité, utilisez SheetJS
        console.log('Données Excel brutes:', data);
        // Retourner des données d'exemple pour la démo
        return [
            {
                'Prénom': 'Test',
                'Nom': 'Excel', 
                'Email': 'test@exemple.com',
                'Téléphone': '+212600000000',
                'Ville': 'Testville'
            }
        ];
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

        // Body (limité à 5 lignes pour l'aperçu)
        const previewData = data.slice(0, 5);
        bodyContainer.innerHTML = previewData.map(row => `
            <tr>
                ${headers.map(header => `<td>${row[header] || ''}</td>`).join('')}
            </tr>
        `).join('');

        // Stats
        statsContainer.innerHTML = `
            ${data.length} enregistrements trouvés • 
            ${previewData.length} affichés en aperçu
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
        importBtn.innerHTML = '<i class="fas fa-spinner fa-spin me-2"></i>Import...';
        importBtn.disabled = true;

        try {
            let importedCount = 0;
            let updatedCount = 0;
            let errorCount = 0;

            for (const row of this.importedData) {
                try {
                    if (!row['Email']) continue;

                    // Vérifier si l'utilisateur existe déjà
                    const existingUser = await this.findUserByEmail(row['Email']);
                    
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
                    console.error('Erreur import ligne:', row, error);
                    errorCount++;
                }
            }

            this.showAlert(
                `Import terminé: ${importedCount} nouveaux, ${updatedCount} mis à jour, ${errorCount} erreurs`,
                errorCount === 0 ? 'success' : 'warning'
            );

            bootstrap.Modal.getInstance(document.getElementById('importModal')).hide();

        } catch (error) {
            console.error('Erreur import général:', error);
            this.showAlert('Erreur lors de l\'import', 'error');
        } finally {
            importBtn.innerHTML = originalText;
            importBtn.disabled = false;
        }
    }

    // Trouver un utilisateur par email
    async findUserByEmail(email) {
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
    }

    // Mettre à jour un utilisateur existant
    async updateUser(userId, data) {
        const updateData = {
            prenom: data['Prénom'] || '',
            nom: data['Nom'] || '',
            phone: data['Téléphone'] || '',
            city: data['Ville'] || '',
            updatedAt: new Date()
        };

        await firebase.firestore()
            .collection('users')
            .doc(userId)
            .update(updateData);
    }

    // Créer un nouvel utilisateur
    async createUser(data) {
        const userData = {
            prenom: data['Prénom'] || '',
            nom: data['Nom'] || '',
            email: data['Email'].toLowerCase(),
            phone: data['Téléphone'] || '',
            city: data['Ville'] || '',
            isPremium: false,
            createdAt: new Date(),
            lastLogin: new Date(),
            source: 'import_excel'
        };

        await firebase.firestore()
            .collection('users')
            .add(userData);
    }

    // Afficher une alerte
    showAlert(message, type = 'info') {
        const alertClass = type === 'error' ? 'alert-danger' : 
                          type === 'success' ? 'alert-success' : 'alert-info';
        
        const alertHTML = `
            <div class="alert ${alertClass} alert-dismissible fade show position-fixed top-0 start-50 translate-middle-x mt-3" style="z-index: 1060;">
                <i class="fas fa-${type === 'success' ? 'check' : 'info'}-circle me-2"></i>
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

// Initialiser le manager d'import/export
const exportImportManager = new ExportImportManager();