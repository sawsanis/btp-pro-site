// newsletter.js - Système de newsletter et communication (Version complète corrigée)
class NewsletterManager {
    constructor() {
        this.templates = {
            welcome: {
                id: 'welcome',
                name: 'Email de bienvenue',
                subject: 'Bienvenue sur BTP Pro Maroc 🇲🇦',
                content: `Cher(e) {name},

Bienvenue sur BTP Pro Maroc, la plateforme de référence des professionnels du BTP marocain !

Nous sommes ravis de vous compter parmi nous.

Cordialement,
L'équipe BTP Pro Maroc
🇲🇦`
            },
            premium_promo: {
                id: 'premium_promo',
                name: 'Promotion Premium',
                subject: '🚀 Passez à la version Premium - Offre spéciale !',
                content: `Cher(e) {name},

Ne manquez pas notre offre spéciale Premium ! 

Avec l'abonnement Premium, bénéficiez de :
⭐ Annonces illimitées
⭐ Mise en avant de vos annonces
⭐ Statistiques détaillées

Profitez de 30% de réduction pour votre premier mois !

Cordialement,
L'équipe BTP Pro Maroc
🇲🇦`
            },
            announcement: {
                id: 'announcement',
                name: 'Annonce générale',
                subject: '📢 Nouvelle fonctionnalité sur BTP Pro Maroc',
                content: `Cher(e) {name},

Nous avons le plaisir de vous annoncer une nouvelle fonctionnalité sur notre plateforme !

Restez connecté pour découvrir les prochaines améliorations.

Cordialement,
L'équipe BTP Pro Maroc
🇲🇦`
            }
        };
        this.currentRecipients = [];
        this.importedRecipients = [];
        this.currentRecipientType = 'all';
    }

    // Afficher le modal de newsletter
    showNewsletterModal(type) {
        this.currentRecipientType = type;
        let title = '';
        let defaultTemplate = '';

        switch(type) {
            case 'all':
                title = 'Envoyer un email à tous les abonnés';
                defaultTemplate = 'premium_promo';
                break;
            case 'new':
                title = 'Email de bienvenue aux nouveaux abonnés';
                defaultTemplate = 'welcome';
                break;
            case 'premium':
                title = 'Promotion Premium aux abonnés standard';
                defaultTemplate = 'premium_promo';
                break;
            case 'import':
                title = 'Envoyer à des destinataires importés';
                defaultTemplate = 'premium_promo';
                break;
            case 'announcement':
                title = 'Annonce générale';
                defaultTemplate = 'announcement';
                break;
        }

        const modalHTML = `
            <div class="modal fade" id="newsletterModal" tabindex="-1">
                <div class="modal-dialog modal-lg">
                    <div class="modal-content">
                        <div class="modal-header bg-primary text-white">
                            <h5 class="modal-title">
                                <i class="fas fa-paper-plane me-2"></i>${title}
                            </h5>
                            <button type="button" class="btn-close btn-close-white" data-bs-dismiss="modal"></button>
                        </div>
                        <div class="modal-body">
                            <form id="newsletterForm">
                                <div class="mb-3">
                                    <label class="form-label">Sélectionner un template</label>
                                    <select class="form-select" id="templateSelect" onchange="newsletterManager.loadTemplate(this.value)">
                                        <option value="">Choisir un template...</option>
                                        ${Object.values(this.templates).map(template => 
                                            `<option value="${template.id}" ${template.id === defaultTemplate ? 'selected' : ''}>${template.name}</option>`
                                        ).join('')}
                                        <option value="custom">Créer un email personnalisé</option>
                                    </select>
                                </div>
                                
                                ${type === 'import' ? `
                                <div class="mb-3">
                                    <label class="form-label">Importer des destinataires</label>
                                    <div class="input-group">
                                        <input type="file" class="form-control" id="recipientsFile" accept=".csv,.xlsx,.xls">
                                        <button class="btn btn-outline-primary" type="button" onclick="newsletterManager.importRecipientsFromFile()">
                                            <i class="fas fa-upload me-1"></i>Importer
                                        </button>
                                    </div>
                                    <div class="form-text">
                                        Format CSV avec colonnes: Email, Prénom, Nom, Ville
                                    </div>
                                    <div id="importedRecipientsPreview" class="mt-2 d-none">
                                        <small class="text-success" id="importedCount">0 destinataires importés</small>
                                    </div>
                                </div>
                                ` : ''}
                                
                                <div class="mb-3">
                                    <label class="form-label">Sujet *</label>
                                    <input type="text" class="form-control" id="newsletterSubject" required>
                                </div>
                                <div class="mb-3">
                                    <label class="form-label">Contenu *</label>
                                    <textarea class="form-control" id="newsletterContent" rows="12" required></textarea>
                                    <div class="form-text">
                                        Variables disponibles: <code>{name}</code>, <code>{email}</code>, <code>{city}</code>
                                    </div>
                                </div>
                                <div class="mb-3">
                                    <label class="form-label">Destinataires</label>
                                    <div id="recipientsInfo" class="alert alert-info">
                                        <i class="fas fa-info-circle me-2"></i>
                                        <span id="recipientsCount">Chargement des destinataires...</span>
                                    </div>
                                </div>
                            </form>
                        </div>
                        <div class="modal-footer">
                            <button type="button" class="btn btn-secondary" data-bs-dismiss="modal">
                                <i class="fas fa-times me-1"></i>Annuler
                            </button>
                            <button type="button" class="btn btn-primary" onclick="newsletterManager.sendNewsletter()" id="sendNewsletterBtn">
                                <i class="fas fa-paper-plane me-2"></i>Envoyer l'email
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        `;

        // Ajouter le modal au DOM s'il n'existe pas
        const existingModal = document.getElementById('newsletterModal');
        if (existingModal) {
            existingModal.remove();
        }

        document.body.insertAdjacentHTML('beforeend', modalHTML);

        const modal = new bootstrap.Modal(document.getElementById('newsletterModal'));
        modal.show();

        // Charger les informations des destinataires
        this.loadRecipientsInfo(type);
        
        // Charger le template par défaut
        if (defaultTemplate) {
            this.loadTemplate(defaultTemplate);
        }
    }

    // Importer des destinataires depuis un fichier
    importRecipientsFromFile() {
        const fileInput = document.getElementById('recipientsFile');
        const file = fileInput.files[0];
        
        if (!file) {
            this.showAlert('Veuillez sélectionner un fichier', 'error');
            return;
        }

        this.readCSVFile(file).then(recipients => {
            this.importedRecipients = recipients;
            document.getElementById('importedCount').textContent = 
                `${recipients.length} destinataires importés`;
            document.getElementById('importedRecipientsPreview').classList.remove('d-none');
            
            this.currentRecipients = recipients;
            document.getElementById('recipientsCount').textContent = 
                `Email sera envoyé à ${recipients.length} destinataires importés`;
                
            this.showAlert(`${recipients.length} destinataires importés avec succès`, 'success');
        }).catch(error => {
            console.error('Erreur import:', error);
            this.showAlert('Erreur lors de l\'import du fichier: ' + error.message, 'error');
        });
    }

    // Lire un fichier CSV
    readCSVFile(file) {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            
            reader.onload = (e) => {
                try {
                    const csvText = e.target.result;
                    const lines = csvText.split('\n').filter(line => line.trim());
                    
                    if (lines.length < 2) {
                        reject(new Error('Fichier CSV vide ou invalide'));
                        return;
                    }

                    // Détecter les headers
                    const headers = lines[0].split(',').map(h => h.trim().toLowerCase());
                    const emailIndex = headers.findIndex(h => h.includes('email'));
                    const prenomIndex = headers.findIndex(h => h.includes('prénom') || h.includes('prenom'));
                    const nomIndex = headers.findIndex(h => h.includes('nom'));
                    const villeIndex = headers.findIndex(h => h.includes('ville'));

                    if (emailIndex === -1) {
                        reject(new Error('Colonne "Email" non trouvée dans le fichier'));
                        return;
                    }

                    const recipients = [];
                    
                    for (let i = 1; i < lines.length; i++) {
                        const values = lines[i].split(',').map(v => v.trim());
                        const email = values[emailIndex];
                        
                        if (email && this.isValidEmail(email)) {
                            recipients.push({
                                email: email,
                                prenom: prenomIndex !== -1 ? values[prenomIndex] || '' : '',
                                nom: nomIndex !== -1 ? values[nomIndex] || '' : '',
                                city: villeIndex !== -1 ? values[villeIndex] || '' : ''
                            });
                        }
                    }

                    if (recipients.length === 0) {
                        reject(new Error('Aucun email valide trouvé dans le fichier'));
                        return;
                    }

                    resolve(recipients);
                } catch (error) {
                    reject(error);
                }
            };
            
            reader.onerror = () => reject(new Error('Erreur de lecture du fichier'));
            reader.readAsText(file);
        });
    }

    // Valider un email
    isValidEmail(email) {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        return emailRegex.test(email);
    }

    // Charger un template d'email
    loadTemplate(templateId) {
        if (templateId === 'custom') {
            document.getElementById('newsletterSubject').value = '';
            document.getElementById('newsletterContent').value = '';
            return;
        }

        const template = this.templates[templateId];
        if (template) {
            document.getElementById('newsletterSubject').value = template.subject;
            document.getElementById('newsletterContent').value = template.content;
        }
    }

    // Charger les informations des destinataires
    async loadRecipientsInfo(type) {
        try {
            let message = '';
            let count = 0;

            if (type === 'import') {
                message = 'Importez un fichier CSV pour ajouter des destinataires';
                count = 0;
            } else {
                // Utiliser btpDB au lieu de Firebase directement
                const users = await btpDB.get('users');
                let recipients = [];

                if (users && Array.isArray(users)) {
                    users.forEach(user => {
                        if (this.filterRecipient(user, type)) {
                            recipients.push(user);
                            count++;
                        }
                    });
                }

                switch(type) {
                    case 'all':
                        message = `Email sera envoyé à ${count} utilisateurs`;
                        break;
                    case 'new':
                        const oneWeekAgo = new Date();
                        oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);
                        const newUsers = recipients.filter(user => 
                            user.createdAt && new Date(user.createdAt) > oneWeekAgo
                        );
                        message = `Email sera envoyé à ${newUsers.length} nouveaux utilisateurs (7 derniers jours)`;
                        count = newUsers.length;
                        break;
                    case 'premium':
                        const standardUsers = recipients.filter(user => !user.hasPremium);
                        message = `Email sera envoyé à ${standardUsers.length} utilisateurs standard (non Premium)`;
                        count = standardUsers.length;
                        break;
                    case 'announcement':
                        message = `Email sera envoyé à ${count} utilisateurs`;
                        break;
                }

                this.currentRecipients = recipients;
            }

            document.getElementById('recipientsCount').textContent = message;

        } catch (error) {
            console.error('Erreur chargement destinataires:', error);
            document.getElementById('recipientsCount').textContent = 'Erreur lors du chargement des destinataires';
            document.getElementById('recipientsCount').className = 'text-danger';
        }
    }

    // Filtrer les destinataires selon le type
    filterRecipient(user, type) {
        if (!user || user.isBlocked) return false;
        if (!user.email || !user.email.includes('@')) return false;

        switch(type) {
            case 'all':
                return true;
            case 'new':
                const oneWeekAgo = new Date();
                oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);
                return user.createdAt && new Date(user.createdAt) > oneWeekAgo;
            case 'premium':
                return !user.hasPremium;
            case 'announcement':
                return true;
            default:
                return true;
        }
    }

    // Envoyer la newsletter
    async sendNewsletter() {
        const subject = document.getElementById('newsletterSubject').value;
        const content = document.getElementById('newsletterContent').value;

        if (!subject || !content) {
            this.showAlert('Veuillez remplir tous les champs', 'error');
            return;
        }

        if (!this.currentRecipients || this.currentRecipients.length === 0) {
            this.showAlert('Aucun destinataire trouvé', 'error');
            return;
        }

        const sendBtn = document.getElementById('sendNewsletterBtn');
        const originalText = sendBtn.innerHTML;
        sendBtn.innerHTML = '<i class="fas fa-spinner fa-spin me-2"></i>Envoi en cours...';
        sendBtn.disabled = true;

        try {
            // Enregistrer l'email dans l'historique
            const emailRecord = {
                subject,
                content,
                recipientType: this.currentRecipientType,
                recipientsCount: this.currentRecipients.length,
                sentAt: new Date().toISOString(),
                sentBy: (window.appState && window.appState.currentUser) ? window.appState.currentUser.id : 'system',
                status: 'sent'
            };

            // Sauvegarder dans btpDB
            await btpDB.post('newsletter_history', emailRecord);

            // Simuler l'envoi
            let sentCount = 0;
            const errors = [];

            for (const user of this.currentRecipients) {
                try {
                    // Remplacer les variables dans le contenu
                    const personalizedContent = content
                        .replace(/{name}/g, user.prenom || 'Utilisateur')
                        .replace(/{email}/g, user.email || '')
                        .replace(/{city}/g, user.city || '');

                    // Simulation d'envoi d'email
                    console.log(`📧 Email envoyé à ${user.email}:`, {
                        subject,
                        content: personalizedContent.substring(0, 100) + '...'
                    });

                    sentCount++;

                } catch (error) {
                    console.error(`❌ Erreur envoi à ${user.email}:`, error);
                    errors.push(user.email);
                }
            }

            if (errors.length > 0) {
                this.showAlert(
                    `Email envoyé à ${sentCount} destinataires, ${errors.length} erreurs`, 
                    'warning'
                );
            } else {
                this.showAlert(`✅ Email envoyé avec succès à ${sentCount} destinataires`, 'success');
            }

            // Recharger l'historique
            this.loadNewsletterHistory();

            // Fermer le modal
            const modal = bootstrap.Modal.getInstance(document.getElementById('newsletterModal'));
            if (modal) {
                modal.hide();
            }

        } catch (error) {
            console.error('❌ Erreur envoi newsletter:', error);
            this.showAlert('Erreur lors de l\'envoi de l\'email: ' + error.message, 'error');
        } finally {
            sendBtn.innerHTML = originalText;
            sendBtn.disabled = false;
        }
    }

    // Charger l'historique des newsletters (CORRECTION FIREBASE)
    async loadNewsletterHistory() {
        try {
            console.log('📋 Chargement historique newsletters...');
            
            const historyContainer = document.getElementById('newsletter-history-container');
            if (!historyContainer) {
                console.log('❌ Container historique non trouvé');
                return;
            }

            // Afficher le chargement immédiatement
            historyContainer.innerHTML = `
                <div class="text-center py-4">
                    <div class="spinner-border text-primary" role="status">
                        <span class="visually-hidden">Chargement...</span>
                    </div>
                    <p class="text-muted mt-2">Chargement de l'historique...</p>
                </div>
            `;

            // CORRECTION : Gestion des erreurs Firebase
            let history;
            try {
                history = await btpDB.get('newsletter_history');
            } catch (firebaseError) {
                console.error('❌ Erreur Firebase:', firebaseError);
                // Si Firebase échoue, utiliser le localStorage comme fallback
                const localHistory = localStorage.getItem('newsletter_history');
                history = localHistory ? JSON.parse(localHistory) : [];
                
                if (history.length > 0) {
                    console.log('✅ Historique récupéré depuis localStorage');
                }
            }
            
            if (!history || history.length === 0) {
                historyContainer.innerHTML = `
                    <div class="text-center py-4">
                        <i class="fas fa-envelope fa-3x text-muted mb-3"></i>
                        <p class="text-muted">Aucun email envoyé pour le moment</p>
                        <small class="text-info">
                            Les emails envoyés apparaîtront ici automatiquement
                        </small>
                    </div>
                `;
                return;
            }

            // Trier par date (plus récent d'abord)
            const sortedHistory = history.sort((a, b) => 
                new Date(b.sentAt) - new Date(a.sentAt)
            ).slice(0, 10); // Limiter aux 10 derniers

            let historyHTML = '';
            sortedHistory.forEach((email, index) => {
                const sentDate = email.sentAt ? new Date(email.sentAt) : new Date();
                
                historyHTML += `
                    <div class="card mb-3">
                        <div class="card-body">
                            <div class="d-flex justify-content-between align-items-start">
                                <div class="flex-grow-1">
                                    <h6 class="mb-1">${email.subject || 'Sans sujet'}</h6>
                                    <p class="text-muted mb-2 small">${(email.content || '').substring(0, 150)}...</p>
                                    <div class="d-flex flex-wrap gap-3">
                                        <small class="text-muted">
                                            <i class="fas fa-users me-1"></i>${email.recipientsCount || 0} destinataires
                                        </small>
                                        <small class="text-muted">
                                            <i class="fas fa-calendar me-1"></i>${sentDate.toLocaleDateString('fr-FR')}
                                        </small>
                                        <small class="text-muted">
                                            <i class="fas fa-clock me-1"></i>${sentDate.toLocaleTimeString('fr-FR')}
                                        </small>
                                    </div>
                                </div>
                                <span class="badge bg-secondary ms-2">${email.recipientType || 'Général'}</span>
                            </div>
                        </div>
                    </div>
                `;
            });

            historyContainer.innerHTML = historyHTML;
            console.log('✅ Historique chargé avec succès');

        } catch (error) {
            console.error('❌ Erreur chargement historique:', error);
            const historyContainer = document.getElementById('newsletter-history-container');
            if (historyContainer) {
                historyContainer.innerHTML = `
                    <div class="alert alert-danger">
                        <i class="fas fa-exclamation-triangle me-2"></i>
                        Erreur lors du chargement de l'historique
                        <br>
                        <small class="text-muted">${error.message}</small>
                        <br>
                        <button class="btn btn-sm btn-primary mt-2" onclick="newsletterManager.loadNewsletterHistory()">
                            <i class="fas fa-redo me-1"></i>Réessayer
                        </button>
                    </div>
                `;
            }
        }
    }

    // Afficher une alerte
    showAlert(message, type = 'info') {
        const alertClass = type === 'error' ? 'alert-danger' : 
                          type === 'success' ? 'alert-success' : 
                          type === 'warning' ? 'alert-warning' : 'alert-info';
        
        // Supprimer les alertes existantes
        const existingAlerts = document.querySelectorAll('.alert.position-fixed');
        existingAlerts.forEach(alert => alert.remove());
        
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

// ========== FONCTIONS DE CHARGEMENT CORRIGÉES ==========

// Charger les abonnés newsletter (CORRIGÉ)
async function loadNewsletterSubscribers() {
    if (!checkAdminAccess()) return;
    
    console.log('👥 Chargement des abonnés newsletter...');
    
    try {
        const users = await btpDB.get('users');
        const subscribersContainer = document.getElementById('newsletter-subscribers-container');
        
        if (!subscribersContainer) {
            console.warn('❌ Container abonnés newsletter non trouvé');
            return;
        }
        
        // Afficher le chargement immédiatement
        subscribersContainer.innerHTML = `
            <div class="text-center py-4">
                <div class="spinner-border text-primary" role="status">
                    <span class="visually-hidden">Chargement...</span>
                </div>
                <p class="text-muted mt-2">Chargement des abonnés...</p>
            </div>
        `;
        
        // Filtrer les utilisateurs avec email valide
        const validSubscribers = users ? users.filter(user => 
            user && 
            user.email && 
            user.email.includes('@') && 
            !user.isBlocked
        ) : [];
        
        let html = '';
        
        if (validSubscribers.length === 0) {
            html = `
                <div class="text-center py-4">
                    <i class="fas fa-users fa-3x text-muted mb-3"></i>
                    <p class="text-muted">Aucun abonné newsletter</p>
                </div>
            `;
        } else {
            html = `
                <div class="d-flex justify-content-between align-items-center mb-3">
                    <h6 class="mb-0">
                        <i class="fas fa-users me-2 text-primary"></i>
                        ${validSubscribers.length} Abonnés
                    </h6>
                    <div class="text-muted small">
                        Dernière mise à jour: ${new Date().toLocaleDateString('fr-FR')}
                    </div>
                </div>
                
                <div class="table-responsive">
                    <table class="table table-sm table-striped">
                        <thead>
                            <tr>
                                <th>Nom</th>
                                <th>Email</th>
                                <th>Ville</th>
                                <th>Inscription</th>
                                <th>Statut</th>
                            </tr>
                        </thead>
                        <tbody>
                            ${validSubscribers.slice(0, 50).map(user => `
                                <tr>
                                    <td>
                                        <strong>${user.prenom || ''} ${user.nom || ''}</strong>
                                    </td>
                                    <td>
                                        <small>${user.email}</small>
                                        ${user.emailVerified ? 
                                            '<span class="badge bg-success ms-1" title="Email vérifié">✓</span>' : 
                                            '<span class="badge bg-warning ms-1" title="Email non vérifié">?</span>'
                                        }
                                    </td>
                                    <td>
                                        <small>${user.city || 'Non renseignée'}</small>
                                    </td>
                                    <td>
                                        <small class="text-muted">
                                            ${user.createdAt ? new Date(user.createdAt).toLocaleDateString('fr-FR') : 'Inconnue'}
                                        </small>
                                    </td>
                                    <td>
                                        ${user.hasPremium ? 
                                            '<span class="badge bg-warning">⭐ Premium</span>' : 
                                            '<span class="badge bg-secondary">Standard</span>'
                                        }
                                    </td>
                                </tr>
                            `).join('')}
                        </tbody>
                    </table>
                </div>
                ${validSubscribers.length > 50 ? `
                    <div class="text-center mt-3">
                        <small class="text-muted">
                            Affichage des 50 premiers abonnés sur ${validSubscribers.length} au total
                        </small>
                    </div>
                ` : ''}
            `;
        }
        
        subscribersContainer.innerHTML = html;
        console.log(`✅ ${validSubscribers.length} abonnés newsletter chargés`);
        
    } catch (error) {
        console.error('❌ Erreur chargement abonnés:', error);
        const subscribersContainer = document.getElementById('newsletter-subscribers-container');
        if (subscribersContainer) {
            subscribersContainer.innerHTML = `
                <div class="alert alert-danger">
                    <i class="fas fa-exclamation-triangle me-2"></i>
                    Erreur lors du chargement des abonnés
                    <br>
                    <small class="text-muted">${error.message}</small>
                    <br>
                    <button class="btn btn-sm btn-primary mt-2" onclick="loadNewsletterSubscribers()">
                        <i class="fas fa-redo me-1"></i>Réessayer
                    </button>
                </div>
            `;
        }
    }
}

// Initialiser les fonctionnalités newsletter
function initNewsletterFeatures() {
    if (!checkAdminAccess()) return;
    
    console.log('📧 Initialisation des fonctionnalités newsletter...');
    
    try {
        loadNewsletterSubscribers();
        newsletterManager.loadNewsletterHistory();
    } catch (error) {
        console.error('❌ Erreur initialisation newsletter:', error);
    }
}

// ========== FONCTIONS GLOBALES POUR L'INTERFACE ==========

// Fonction pour afficher le modal newsletter
function showNewsletterModal(type) {
    if (typeof newsletterManager !== 'undefined') {
        newsletterManager.showNewsletterModal(type);
    } else {
        console.error('❌ NewsletterManager non initialisé');
        showAlert('Erreur: Système de newsletter non disponible', 'error');
    }
}

// Vérifier l'accès admin (fonction de secours)
function checkAdminAccess() {
    // Vérifier si appState existe
    if (typeof window.appState !== 'undefined' && window.appState.currentUser && window.appState.isAdmin) {
        return true;
    }
    
    // Vérifier dans localStorage
    const userData = localStorage.getItem('btp_user');
    if (userData) {
        try {
            const user = JSON.parse(userData);
            return user.isAdmin === true;
        } catch (e) {
            console.error('Erreur parsing user data:', e);
        }
    }
    
    console.warn('⚠️ Accès admin refusé');
    return false;
}

// Afficher une alerte (fonction de secours)
function showAlert(message, type = 'info') {
    const alertClass = type === 'error' ? 'alert-danger' : 
                      type === 'success' ? 'alert-success' : 
                      type === 'warning' ? 'alert-warning' : 'alert-info';
    
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

// ========== ÉVÉNEMENTS DE CHARGEMENT ==========

// Initialiser quand la page est prête
document.addEventListener('DOMContentLoaded', function() {
    console.log('📧 Newsletter.js chargé - DOM prêt');
    
    // Initialiser le manager
    window.newsletterManager = new NewsletterManager();
    
    // Vérifier si on est dans l'admin et initialiser
    setTimeout(() => {
        const adminSection = document.getElementById('admin-section');
        const newsletterTab = document.getElementById('newsletter-tab');
        
        if ((adminSection && adminSection.style.display !== 'none') || 
            (newsletterTab && newsletterTab.classList.contains('active'))) {
            console.log('🏗️ Section admin/newsletter active - initialisation');
            initNewsletterFeatures();
        }
    }, 1000);
});

// Surveiller les changements d'onglets
document.addEventListener('click', function(e) {
    if (e.target.matches('[data-bs-toggle="tab"]') || 
        e.target.closest('[data-bs-toggle="tab"]')) {
        const target = e.target.getAttribute('data-bs-target') || 
                      e.target.closest('[data-bs-toggle="tab"]').getAttribute('data-bs-target');
        
        if (target && target.includes('newsletter')) {
            console.log('📧 Onglet newsletter activé');
            setTimeout(initNewsletterFeatures, 300);
        }
    }
});

// ========== EXPORT DES FONCTIONS ==========
window.loadNewsletterSubscribers = loadNewsletterSubscribers;
window.loadNewsletterHistory = function() { 
    if (window.newsletterManager) {
        window.newsletterManager.loadNewsletterHistory(); 
    }
};
window.initNewsletterFeatures = initNewsletterFeatures;
window.showNewsletterModal = showNewsletterModal;
window.newsletterManager = new NewsletterManager();

console.log('✅ newsletter.js COMPLET - Système de newsletter initialisé');