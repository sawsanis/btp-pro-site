// ========== JOBS-APPLICATIONS.JS - GESTION DES CANDIDATURES ==========

const JobsApplications = {
    // ========== CHARGEMENT DES CANDIDATURES ==========
    
    async loadJobApplications() {
        console.log('📋 Chargement des candidatures...');
        
        if (!authState.currentUser) {
            showAlert('🔐 Connectez-vous pour accéder à vos candidatures', 'warning');
            return;
        }
        
        try {
            const [applications, jobs] = await Promise.all([
                JobsData.getAllApplications(),
                JobsData.getAllJobPosts()
            ]);
            
            // Mettre à jour le compteur global pour l'affichage
            window.jobApplicationsCount = {};
            applications.forEach(app => {
                window.jobApplicationsCount[app.jobId] = (window.jobApplicationsCount[app.jobId] || 0) + 1;
            });
            
            let userApplications = [];
            let displayJobs = [];
            
            // ✅ SI ADMIN : VOIR TOUTES LES CANDIDATURES
            if (authState.isAdmin) {
                userApplications = applications; // Toutes les candidatures
                displayJobs = jobs; // Toutes les offres
                console.log('👑 ADMIN: Accès à toutes les candidatures', userApplications.length);
            } 
            // ✅ SI ANNONCEUR : VOIR SES CANDIDATURES
            else {
                const userJobs = jobs.filter(job => job.userId === authState.currentUser.id);
                const userJobIds = userJobs.map(job => job.id);
                userApplications = applications.filter(app => userJobIds.includes(app.jobId));
                displayJobs = userJobs;
                console.log('👤 ANNONCEUR: Accès à ses candidatures', userApplications.length);
            }
            
            console.log('📊 Candidatures récupérées:', userApplications.length);
            
            this.displayJobApplications(userApplications, displayJobs);
            
        } catch (error) {
            console.error('❌ Erreur chargement candidatures:', error);
            showAlert('❌ Erreur lors du chargement des candidatures', 'error');
        }
    },

    displayJobApplications(applications, jobs) {
        const container = document.getElementById('applications-container');
        
        if (!container) {
            console.warn('❌ Container applications non trouvé');
            return;
        }
        
        // ✅ Afficher le badge ADMIN si nécessaire
        const adminBadge = authState.isAdmin ? '<span class="badge bg-danger ms-2">Vue Admin</span>' : '';
        
        if (!applications || applications.length === 0) {
            container.innerHTML = `
                <div class="col-12 text-center py-5">
                    <i class="fas fa-file-alt fa-3x text-muted mb-3"></i>
                    <h5 class="text-muted">Aucune candidature reçue</h5>
                    <p class="text-muted">Les candidatures aux offres d'emploi apparaîtront ici</p>
                    ${authState.isAdmin ? '<p class="text-info small">👑 Vous voyez toutes les candidatures en tant qu\'administrateur</p>' : ''}
                </div>
            `;
            return;
        }
        
        let html = `
            <div class="d-flex justify-content-between align-items-center mb-4">
                <h5>
                    <i class="fas fa-users me-2 text-warning"></i>
                    Candidatures reçues
                    ${adminBadge}
                </h5>
                <div class="text-muted small">
                    ${applications.length} candidature(s)
                    ${authState.isAdmin ? '- Vue globale' : '- Vos offres'}
                </div>
            </div>
        `;
        
        const applicationsByJob = {};
        applications.forEach(app => {
            if (!applicationsByJob[app.jobId]) {
                applicationsByJob[app.jobId] = [];
            }
            applicationsByJob[app.jobId].push(app);
        });
        
        Object.keys(applicationsByJob).forEach(jobId => {
            const jobApplications = applicationsByJob[jobId];
            const job = jobs.find(j => j.id === jobId);
            
            // ✅ Si admin et job non trouvé (peut arriver si job supprimé)
            const jobTitle = job ? `${job.poste} - ${job.ville}` : `Offre #${jobId} (supprimée)`;
            const jobAuthor = job ? `par ${job.userName}` : '';
            
            html += `
            <div class="card mb-4">
                <div class="card-header bg-light">
                    <h5 class="mb-0">
                        <i class="fas fa-briefcase me-2 text-warning"></i>
                        ${jobTitle}
                        ${jobAuthor ? `<small class="text-muted">${jobAuthor}</small>` : ''}
                        <span class="badge bg-warning ms-2">${jobApplications.length} candidature(s)</span>
                    </h5>
                </div>
                <div class="card-body">
                    ${jobApplications.map((app, index) => `
                    <div class="application-item border-bottom pb-3 mb-3 ${index === jobApplications.length - 1 ? 'border-bottom-0 mb-0' : ''}">
                        <div class="row align-items-center">
                            <div class="col-md-8">
                                <h6 class="mb-1">
                                    ${app.candidateName}
                                    ${authState.isAdmin ? `<small class="text-muted">(ID: ${app.candidateId})</small>` : ''}
                                </h6>
                                <p class="mb-1">
                                    <i class="fas fa-envelope text-muted me-1"></i>
                                    ${app.candidateEmail}
                                </p>
                                <p class="mb-1">
                                    <i class="fas fa-phone text-muted me-1"></i>
                                    ${app.candidatePhone}
                                </p>
                                ${app.experience ? `
                                <p class="mb-1">
                                    <i class="fas fa-briefcase text-muted me-1"></i>
                                    ${app.experience}
                                </p>
                                ` : ''}
                                ${app.disponibilite ? `
                                <p class="mb-1">
                                    <i class="fas fa-calendar text-muted me-1"></i>
                                    Disponibilité: ${this.getDisponibilityLabel(app.disponibilite)}
                                </p>
                                ` : ''}
                                <p class="mb-1">
                                    <i class="fas fa-file text-muted me-1"></i>
                                    CV: ${app.cvFileName}
                                </p>
                                ${app.lettreMotivation ? `
                                <p class="mb-2 mt-2">
                                    <strong>Lettre de motivation:</strong><br>
                                    ${this.truncateText(app.lettreMotivation, 150)}
                                </p>
                                ` : ''}
                                <small class="text-muted">
                                    <i class="fas fa-clock me-1"></i>
                                    Postulé le ${this.formatDate(app.createdAt)}
                                </small>
                            </div>
                            <div class="col-md-4 text-end">
                                <div class="btn-group-vertical w-100">
                                    <button class="btn btn-outline-primary btn-sm mb-2" onclick="JobsApplications.viewApplicationDetails('${app.id}')">
                                        <i class="fas fa-eye me-1"></i>Voir détails
                                    </button>
                                    <button class="btn btn-outline-success btn-sm mb-2" onclick="JobsApplications.changeApplicationStatus('${app.id}', 'en_cours')">
                                        <i class="fas fa-play me-1"></i>En cours
                                    </button>
                                    <button class="btn btn-outline-warning btn-sm mb-2" onclick="JobsApplications.changeApplicationStatus('${app.id}', 'en_attente')">
                                        <i class="fas fa-pause me-1"></i>En attente
                                    </button>
                                    <button class="btn btn-outline-danger btn-sm" onclick="JobsApplications.changeApplicationStatus('${app.id}', 'rejete')">
                                        <i class="fas fa-times me-1"></i>Rejeter
                                    </button>
                                </div>
                                ${app.status !== 'en_attente' ? `
                                <div class="mt-2">
                                    <span class="badge ${this.getStatusBadgeClass(app.status)}">${this.getStatusLabel(app.status)}</span>
                                </div>
                                ` : ''}
                            </div>
                        </div>
                    </div>
                    `).join('')}
                </div>
            </div>
            `;
        });
        
        container.innerHTML = html;
        console.log(`✅ ${applications.length} candidatures affichées`);
    },

    // ========== GESTION DES CANDIDATURES SPÉCIFIQUES ==========
    
    async viewJobApplications(jobId) {
        console.log('👀 Voir candidatures pour l\'offre:', jobId);
        
        try {
            const [applications, jobs] = await Promise.all([
                JobsData.getAllApplications(),
                JobsData.getAllJobPosts()
            ]);
            
            const job = jobs.find(j => j.id === jobId);
            if (!job) {
                showAlert('❌ Offre non trouvée', 'error');
                return;
            }
            
            const jobApplications = applications.filter(app => app.jobId === jobId);
            
            if (jobApplications.length === 0) {
                showAlert('ℹ️ Aucune candidature pour cette offre', 'info');
                return;
            }
            
            this.showJobApplicationsModal(job, jobApplications);
            
        } catch (error) {
            console.error('❌ Erreur chargement candidatures:', error);
            showAlert('❌ Erreur lors du chargement des candidatures', 'error');
        }
    },

    showJobApplicationsModal(job, applications) {
        const modalHTML = `
            <div class="modal fade" id="jobApplicationsModal" tabindex="-1">
                <div class="modal-dialog modal-xl">
                    <div class="modal-content">
                        <div class="modal-header bg-success text-white">
                            <h5 class="modal-title">
                                <i class="fas fa-users me-2"></i>
                                Candidatures pour : ${job.poste}
                                <span class="badge bg-warning ms-2">${applications.length} candidature(s)</span>
                            </h5>
                            <button type="button" class="btn-close" data-bs-dismiss="modal"></button>
                        </div>
                        <div class="modal-body">
                            <div class="alert alert-info">
                                <i class="fas fa-info-circle me-2"></i>
                                ${authState.isAdmin ? 
                                    '👑 Vue administrateur - Toutes les candidatures' : 
                                    '👤 Vue annonceur - Vos candidatures'}
                            </div>
                            
                            <div class="table-responsive">
                                <table class="table table-hover">
                                    <thead class="table-light">
                                        <tr>
                                            <th>Nom</th>
                                            <th>Email</th>
                                            <th>Téléphone</th>
                                            <th>Expérience</th>
                                            <th>Date</th>
                                            <th>Statut</th>
                                            <th>Actions</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        ${applications.map(app => `
                                        <tr>
                                            <td>
                                                <strong>${app.candidateName}</strong>
                                                ${authState.isAdmin ? `<br><small class="text-muted">ID: ${app.candidateId}</small>` : ''}
                                            </td>
                                            <td>${app.candidateEmail}</td>
                                            <td>${app.candidatePhone}</td>
                                            <td>${app.experience || 'Non précisée'}</td>
                                            <td>
                                                <small class="text-muted">
                                                    ${this.formatDate(app.createdAt)}
                                                </small>
                                            </td>
                                            <td>
                                                <span class="badge ${this.getStatusBadgeClass(app.status)}">
                                                    ${this.getStatusLabel(app.status)}
                                                </span>
                                            </td>
                                            <td>
                                                <div class="btn-group btn-group-sm">
                                                    <button class="btn btn-outline-primary" onclick="JobsApplications.viewApplicationDetails('${app.id}')" title="Voir détails">
                                                        <i class="fas fa-eye"></i>
                                                    </button>
                                                    <button class="btn btn-outline-success" onclick="JobsApplications.changeApplicationStatus('${app.id}', 'en_cours')" title="En cours">
                                                        <i class="fas fa-play"></i>
                                                    </button>
                                                    <button class="btn btn-outline-warning" onclick="JobsApplications.changeApplicationStatus('${app.id}', 'en_attente')" title="En attente">
                                                        <i class="fas fa-pause"></i>
                                                    </button>
                                                    <button class="btn btn-outline-danger" onclick="JobsApplications.changeApplicationStatus('${app.id}', 'rejete')" title="Rejeter">
                                                        <i class="fas fa-times"></i>
                                                    </button>
                                                </div>
                                            </td>
                                        </tr>
                                        `).join('')}
                                    </tbody>
                                </table>
                            </div>
                            
                            ${applications.some(app => app.lettreMotivation) ? `
                            <div class="mt-4">
                                <h6>
                                    <i class="fas fa-envelope me-2"></i>
                                    Lettres de motivation disponibles
                                </h6>
                                <p class="text-muted small">Cliquez sur "Voir détails" pour lire les lettres de motivation</p>
                            </div>
                            ` : ''}
                        </div>
                        <div class="modal-footer">
                            <button type="button" class="btn btn-secondary" data-bs-dismiss="modal">
                                <i class="fas fa-times me-1"></i>Fermer
                            </button>
                            <button type="button" class="btn btn-warning" onclick="JobsApplications.exportApplicationsToCSV('${job.id}')">
                                <i class="fas fa-download me-1"></i>Exporter CSV
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        `;
        
        const existingModal = document.getElementById('jobApplicationsModal');
        if (existingModal) {
            existingModal.remove();
        }
        
        document.body.insertAdjacentHTML('beforeend', modalHTML);
        
        const modal = new bootstrap.Modal(document.getElementById('jobApplicationsModal'));
        modal.show();
    },

    // ========== DÉTAILS DES CANDIDATURES ==========
    
    async viewApplicationDetails(applicationId) {
        try {
            const applications = await JobsData.getAllApplications();
            const application = applications.find(app => app.id === applicationId);
            if (application) {
                this.showApplicationDetailsModal(application);
            }
        } catch (error) {
            console.error('❌ Erreur chargement détails candidature:', error);
            showAlert('❌ Erreur lors du chargement des détails', 'error');
        }
    },

    showApplicationDetailsModal(application) {
        const modalHTML = `
            <div class="modal fade" id="applicationDetailsModal" tabindex="-1">
                <div class="modal-dialog modal-lg">
                    <div class="modal-content">
                        <div class="modal-header bg-primary text-white">
                            <h5 class="modal-title">
                                <i class="fas fa-user me-2"></i>Détails de la candidature
                                ${authState.isAdmin ? '<span class="badge bg-danger ms-2">Vue Admin</span>' : ''}
                            </h5>
                            <button type="button" class="btn-close" data-bs-dismiss="modal"></button>
                        </div>
                        <div class="modal-body">
                            <div class="row">
                                <div class="col-md-6">
                                    <h6>Informations personnelles</h6>
                                    <p><strong>Nom:</strong> ${application.candidateName}</p>
                                    <p><strong>Email:</strong> ${application.candidateEmail}</p>
                                    <p><strong>Téléphone:</strong> ${application.candidatePhone}</p>
                                    ${authState.isAdmin ? `<p><strong>ID Candidat:</strong> ${application.candidateId}</p>` : ''}
                                    ${application.experience ? `<p><strong>Expérience:</strong> ${application.experience}</p>` : ''}
                                    ${application.disponibilite ? `<p><strong>Disponibilité:</strong> ${this.getDisponibilityLabel(application.disponibilite)}</p>` : ''}
                                    <p><strong>CV:</strong> ${application.cvFileName}</p>
                                </div>
                                <div class="col-md-6">
                                    <h6>Statut de la candidature</h6>
                                    <p><strong>Postulé le:</strong> ${this.formatDate(application.createdAt)}</p>
                                    <p><strong>Statut:</strong> <span class="badge ${this.getStatusBadgeClass(application.status)}">${this.getStatusLabel(application.status)}</span></p>
                                    
                                    <div class="mt-3">
                                        <h6>Actions</h6>
                                        <div class="d-flex gap-2 flex-wrap">
                                            <button class="btn btn-success btn-sm" onclick="JobsApplications.changeApplicationStatus('${application.id}', 'en_cours')">
                                                <i class="fas fa-play me-1"></i>En cours
                                            </button>
                                            <button class="btn btn-warning btn-sm" onclick="JobsApplications.changeApplicationStatus('${application.id}', 'en_attente')">
                                                <i class="fas fa-pause me-1"></i>En attente
                                            </button>
                                            <button class="btn btn-danger btn-sm" onclick="JobsApplications.changeApplicationStatus('${application.id}', 'rejete')">
                                                <i class="fas fa-times me-1"></i>Rejeter
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            </div>
                            
                            ${application.lettreMotivation ? `
                            <div class="mt-4">
                                <h6>Lettre de motivation</h6>
                                <div class="border p-3 bg-light rounded">
                                    ${application.lettreMotivation}
                                </div>
                            </div>
                            ` : ''}
                            
                            <div class="mt-4">
                                <h6>CV du candidat</h6>
                                <div class="alert alert-info">
                                    <i class="fas fa-file-pdf me-2 text-danger"></i>
                                    ${application.cvFileName}
                                    ${application.cvFileName !== 'Aucun CV fourni' ? `
                                    <button class="btn btn-outline-primary btn-sm ms-2" onclick="JobsApplications.downloadCV('${application.id}')">
                                        <i class="fas fa-download me-1"></i>Télécharger
                                    </button>
                                    ` : `
                                    <span class="text-muted ms-2">(Aucun CV fourni)</span>
                                    `}
                                </div>
                            </div>
                        </div>
                        <div class="modal-footer">
                            <button type="button" class="btn btn-secondary" data-bs-dismiss="modal">Fermer</button>
                            <a href="mailto:${application.candidateEmail}" class="btn btn-primary">
                                <i class="fas fa-envelope me-1"></i>Contacter
                            </a>
                        </div>
                    </div>
                </div>
            </div>
        `;
        
        const existingModal = document.getElementById('applicationDetailsModal');
        if (existingModal) {
            existingModal.remove();
        }
        
        document.body.insertAdjacentHTML('beforeend', modalHTML);
        
        const modal = new bootstrap.Modal(document.getElementById('applicationDetailsModal'));
        modal.show();
    },

    // ========== GESTION DES STATUTS ==========
    
    async changeApplicationStatus(applicationId, newStatus) {
        try {
            await JobsData.updateApplication(applicationId, { status: newStatus });
            
            showAlert('✅ Statut de la candidature mis à jour', 'success');
            
            // Recharger les candidatures
            this.loadJobApplications();
            
            // Fermer le modal des détails
            const modal = bootstrap.Modal.getInstance(document.getElementById('applicationDetailsModal'));
            if (modal) modal.hide();
            
        } catch (error) {
            console.error('❌ Erreur mise à jour statut:', error);
            showAlert('❌ Erreur lors de la mise à jour du statut', 'error');
        }
    },

    // ========== FONCTIONS UTILITAIRES ==========
    
    getDisponibilityLabel(disponibilite) {
        const labels = {
            'immediate': 'Immédiate',
            '15j': '15 jours',
            '1mois': '1 mois',
            '2mois': '2 mois'
        };
        return labels[disponibilite] || disponibilite;
    },

    getStatusLabel(status) {
        const labels = {
            'en_attente': 'En attente',
            'en_cours': 'En cours',
            'rejete': 'Rejetée'
        };
        return labels[status] || status;
    },

    getStatusBadgeClass(status) {
        const classes = {
            'en_attente': 'bg-secondary',
            'en_cours': 'bg-warning',
            'rejete': 'bg-danger'
        };
        return classes[status] || 'bg-secondary';
    },

    truncateText(text, maxLength) {
        if (!text) return '';
        if (text.length <= maxLength) return text;
        return text.substring(0, maxLength) + '...';
    },

    formatDate(dateString) {
        if (!dateString) return 'Date inconnue';
        const date = new Date(dateString);
        return date.toLocaleDateString('fr-FR', {
            day: '2-digit',
            month: '2-digit',
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });
    },

    downloadCV(applicationId) {
        showAlert('📄 Fonction de téléchargement CV à implémenter', 'info');
    },

    exportApplicationsToCSV(jobId) {
        showAlert('📊 Fonction d\'export CSV à implémenter', 'info');
    }
};

// Export global
window.JobsApplications = JobsApplications;
console.log('✅ jobs-applications.js CHARGÉ - Module candidatures initialisé');