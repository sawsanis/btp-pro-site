// ========== JOBS-FORMS.JS - GESTION DES FORMULAIRES EMPLOI ==========

const JobsForms = {
    // ========== FORMULAIRE DE PUBLICATION D'OFFRE ==========
    
    async handlePublishJob(event) {
        event.preventDefault();
        
        if (!checkAuthForPublish()) return;
        
        const form = event.target;
        const formData = new FormData(form);
        const data = Object.fromEntries(formData.entries());
        
        console.log('📝 Données du formulaire emploi:', data);
        
        if (!data.poste || !data.contrat || !data.salaire || !data.ville || !data.description || !data.phone) {
            showAlert('❌ Veuillez remplir tous les champs obligatoires', 'error');
            return;
        }
        
        if (data.poste.length < 3) {
            showAlert('❌ Le nom du poste doit contenir au moins 3 caractères', 'error');
            return;
        }
        
        showLoading(true);
        
        try {
            const jobData = {
                poste: data.poste.trim(),
                contrat: data.contrat,
                salaire: data.salaire.trim(),
                ville: data.ville.trim(),
                experience: data.experience?.trim() || '',
                description: data.description.trim(),
                phone: data.phone.trim(),
                userId: authState.currentUser.id,
                userName: `${authState.currentUser.prenom} ${authState.currentUser.nom}`,
                userEmail: authState.currentUser.email,
                status: 'en_attente',
                isPremium: false,
                viewCount: 0,
                contactCount: 0,
                createdAt: new Date().toISOString(),
                updatedAt: new Date().toISOString()
            };
            
            const result = await JobsData.createJobPost(jobData);
            
            showAlert('✅ Votre offre d\'emploi a été publiée avec succès ! Elle sera visible après modération.', 'success');
            
            form.reset();
            
            setTimeout(() => {
                goToSection('jobs');
            }, 2000);
            
        } catch (error) {
            console.error('❌ Erreur publication emploi:', error);
            showAlert('❌ Erreur lors de la publication: ' + error.message, 'error');
        } finally {
            showLoading(false);
        }
    },

    // ========== FORMULAIRE DE CANDIDATURE ==========
    
    async showJobApplicationForm(jobId) {
        if (!authState.currentUser) {
            showAlert('🔐 Connectez-vous pour postuler à cette offre', 'warning');
            showLoginModal();
            return;
        }
        
        try {
            const job = await JobsData.getJobPostById(jobId);
            if (job) {
                this.showJobApplicationModal(job);
            }
        } catch (error) {
            console.error('Erreur récupération offre:', error);
            showAlert('❌ Erreur lors de la postulation', 'error');
        }
    },

    showJobApplicationModal(job) {
        const modalHTML = `
            <div class="modal fade" id="jobApplicationModal" tabindex="-1">
                <div class="modal-dialog modal-lg">
                    <div class="modal-content">
                        <div class="modal-header bg-warning text-white">
                            <h5 class="modal-title">
                                <i class="fas fa-paper-plane me-2"></i>Postuler à : ${job.poste}
                            </h5>
                            <button type="button" class="btn-close" data-bs-dismiss="modal"></button>
                        </div>
                        <div class="modal-body">
                            <div class="job-application-form">
                                <div class="alert alert-info">
                                    <i class="fas fa-info-circle me-2"></i>
                                    Votre candidature sera envoyée directement au recruteur
                                </div>
                                
                                <form id="jobApplicationForm" onsubmit="JobsForms.submitJobApplication(event, '${job.id}')">
                                    <div class="row mb-3">
                                        <div class="col-md-6">
                                            <label class="form-label">Prénom *</label>
                                            <input type="text" class="form-control" name="prenom" 
                                                   value="${authState.currentUser.prenom}" required>
                                        </div>
                                        <div class="col-md-6">
                                            <label class="form-label">Nom *</label>
                                            <input type="text" class="form-control" name="nom" 
                                                   value="${authState.currentUser.nom}" required>
                                        </div>
                                    </div>
                                    
                                    <div class="row mb-3">
                                        <div class="col-md-6">
                                            <label class="form-label">Email *</label>
                                            <input type="email" class="form-control" name="email" 
                                                   value="${authState.currentUser.email}" required>
                                        </div>
                                        <div class="col-md-6">
                                            <label class="form-label">Téléphone *</label>
                                            <input type="tel" class="form-control" name="telephone" 
                                                   value="${authState.currentUser.phone || ''}" required 
                                                   placeholder="+212 XX XX XX XX">
                                        </div>
                                    </div>
                                    
                                    <div class="mb-3">
                                        <label class="form-label">CV (PDF, DOC, DOCX) - Optionnel</label>
                                        <div class="cv-upload-area" id="cvUploadArea" onclick="document.getElementById('cvFile').click()">
                                            <i class="fas fa-cloud-upload-alt fa-2x text-muted mb-3"></i>
                                            <h5>Cliquez pour télécharger votre CV</h5>
                                            <p class="text-muted">Glissez-déposez ou cliquez pour sélectionner</p>
                                            <small class="text-muted">Max. 5MB - Formats: PDF, DOC, DOCX</small>
                                        </div>
                                        <input type="file" id="cvFile" accept=".pdf,.doc,.docx" 
                                               style="display: none" onchange="JobsForms.handleCVUpload(this)">
                                        <div class="cv-preview mt-2" id="cvPreview" style="display: none;">
                                            <div class="cv-file-info">
                                                <i class="fas fa-file-pdf text-danger"></i>
                                                <span id="cvFileName">Mon_CV.pdf</span>
                                                <button type="button" class="btn btn-sm btn-outline-danger ms-2" onclick="JobsForms.removeCV()">
                                                    <i class="fas fa-times"></i>
                                                </button>
                                            </div>
                                        </div>
                                    </div>
                                    
                                    <div class="mb-3">
                                        <label class="form-label">Lettre de motivation</label>
                                        <textarea class="form-control" name="lettre_motivation" rows="4" 
                                                  placeholder="Présentez-vous et expliquez pourquoi vous êtes le candidat idéal pour ce poste..."></textarea>
                                    </div>
                                    
                                    <div class="row mb-3">
                                        <div class="col-md-6">
                                            <label class="form-label">Expérience professionnelle</label>
                                            <input type="text" class="form-control" name="experience" 
                                                   placeholder="Ex: 5 ans dans le BTP">
                                        </div>
                                        <div class="col-md-6">
                                            <label class="form-label">Disponibilité</label>
                                            <select class="form-select" name="disponibilite">
                                                <option value="">Choisir...</option>
                                                <option value="immediate">Immédiate</option>
                                                <option value="15j">15 jours</option>
                                                <option value="1mois">1 mois</option>
                                                <option value="2mois">2 mois</option>
                                            </select>
                                        </div>
                                    </div>
                                    
                                    <div class="d-flex gap-2">
                                        <button type="submit" class="btn btn-warning flex-grow-1">
                                            <i class="fas fa-paper-plane me-2"></i>Envoyer ma candidature
                                        </button>
                                        <button type="button" class="btn btn-outline-secondary" data-bs-dismiss="modal">
                                            Annuler
                                        </button>
                                    </div>
                                </form>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        `;
        
        const existingModal = document.getElementById('jobApplicationModal');
        if (existingModal) {
            existingModal.remove();
        }
        
        document.body.insertAdjacentHTML('beforeend', modalHTML);
        
        const modal = new bootstrap.Modal(document.getElementById('jobApplicationModal'));
        modal.show();
    },

    async submitJobApplication(event, jobId) {
        event.preventDefault();
        
        const form = event.target;
        const formData = new FormData(form);
        const cvFile = document.getElementById('cvFile').files[0];
        
        showLoading(true);
        
        try {
            const jobPost = await JobsData.getJobPostById(jobId);
            
            if (!jobPost) {
                throw new Error('Offre d\'emploi non trouvée');
            }
            
            const applicationData = {
                jobId: jobId,
                candidateId: authState.currentUser.id,
                candidateName: `${formData.get('prenom')} ${formData.get('nom')}`,
                candidateEmail: formData.get('email'),
                candidatePhone: formData.get('telephone'),
                cvFileName: cvFile ? cvFile.name : 'Aucun CV fourni',
                lettreMotivation: formData.get('lettre_motivation') || '',
                experience: formData.get('experience') || '',
                disponibilite: formData.get('disponibilite') || '',
                status: 'en_attente',
                createdAt: new Date().toISOString()
            };
            
            const savedApplication = await JobsData.createApplication(applicationData);
            
            await this.notifyJobPoster(savedApplication, jobPost);
            
            showAlert('✅ Votre candidature a été envoyée avec succès !', 'success');
            
            const modal = bootstrap.Modal.getInstance(document.getElementById('jobApplicationModal'));
            if (modal) modal.hide();
            
        } catch (error) {
            console.error('❌ Erreur envoi candidature:', error);
            showAlert('❌ Erreur lors de l\'envoi de votre candidature', 'error');
        } finally {
            showLoading(false);
        }
    },

    // ========== GESTION DES FICHIERS CV ==========
    
    handleCVUpload(input) {
        const file = input.files[0];
        if (!file) return;
        
        if (file.size > 5 * 1024 * 1024) {
            showAlert('❌ Le fichier est trop volumineux (max. 5MB)', 'error');
            input.value = '';
            return;
        }
        
        const allowedTypes = ['application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'];
        if (!allowedTypes.includes(file.type)) {
            showAlert('❌ Format de fichier non supporté. Utilisez PDF, DOC ou DOCX.', 'error');
            input.value = '';
            return;
        }
        
        const cvPreview = document.getElementById('cvPreview');
        const cvFileName = document.getElementById('cvFileName');
        const cvUploadArea = document.getElementById('cvUploadArea');
        
        cvFileName.textContent = file.name;
        cvPreview.style.display = 'block';
        cvUploadArea.style.display = 'none';
        
        showAlert('✅ CV téléchargé avec succès', 'success');
    },

    removeCV() {
        const cvFileInput = document.getElementById('cvFile');
        const cvPreview = document.getElementById('cvPreview');
        const cvUploadArea = document.getElementById('cvUploadArea');
        
        cvFileInput.value = '';
        cvPreview.style.display = 'none';
        cvUploadArea.style.display = 'block';
    },

    // ========== NOTIFICATIONS ==========
    
    async notifyJobPoster(applicationData, jobPost) {
        console.log('📧 Notification à l\'annonceur:', jobPost.userEmail);
        
        try {
            if (!jobPost || !jobPost.userId) {
                throw new Error('Données jobPost incomplètes');
            }
            
            const notification = {
                type: 'new_application',
                title: 'Nouvelle candidature reçue',
                message: `📬 ${applicationData.candidateName} a postulé à votre offre "${jobPost.poste}"`,
                recipientId: jobPost.userId,
                recipientEmail: jobPost.userEmail,
                applicationId: applicationData.id,
                jobId: jobPost.id,
                isRead: false,
                createdAt: new Date().toISOString()
            };
            
            await JobsData.createNotification(notification);
            
            await this.updateNotificationBadge();
            
            await this.sendEmailNotification(jobPost.userEmail, applicationData, jobPost);
            
            console.log('✅ Notification envoyée avec succès');
            
        } catch (error) {
            console.error('❌ Erreur envoi notification:', error);
        }
    },

    async sendEmailNotification(employerEmail, applicationData, jobPost) {
        console.log('📧 Préparation email pour:', employerEmail);
        
        const emailData = {
            to: employerEmail,
            subject: `📬 Nouvelle candidature pour "${jobPost.poste}"`,
            html: `
                <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
                    <h2 style="color: #ffc107;">Nouvelle candidature reçue</h2>
                    
                    <div style="background: #f8f9fa; padding: 20px; border-radius: 8px; margin: 20px 0;">
                        <h3 style="color: #333; margin-bottom: 10px;">Détails de l'offre</h3>
                        <p><strong>Poste:</strong> ${jobPost.poste}</p>
                        <p><strong>Lieu:</strong> ${jobPost.ville}</p>
                        <p><strong>Type de contrat:</strong> ${getContractLabel(jobPost.contrat)}</p>
                    </div>
                    
                    <div style="background: #e8f5e8; padding: 20px; border-radius: 8px; margin: 20px 0;">
                        <h3 style="color: #333; margin-bottom: 10px;">Informations du candidat</h3>
                        <p><strong>Nom:</strong> ${applicationData.candidateName}</p>
                        <p><strong>Email:</strong> ${applicationData.candidateEmail}</p>
                        <p><strong>Téléphone:</strong> ${applicationData.candidatePhone}</p>
                        ${applicationData.experience ? `<p><strong>Expérience:</strong> ${applicationData.experience}</p>` : ''}
                        ${applicationData.disponibilite ? `<p><strong>Disponibilité:</strong> ${this.getDisponibilityLabel(applicationData.disponibilite)}</p>` : ''}
                        <p><strong>CV:</strong> ${applicationData.cvFileName}</p>
                    </div>
                    
                    ${applicationData.lettreMotivation ? `
                    <div style="background: #fff3cd; padding: 15px; border-radius: 8px; margin: 20px 0;">
                        <h4 style="color: #333; margin-bottom: 10px;">Lettre de motivation</h4>
                        <p style="font-style: italic;">${applicationData.lettreMotivation}</p>
                    </div>
                    ` : ''}
                    
                    <div style="text-align: center; margin: 30px 0;">
                        <a href="${window.location.origin}#jobs" 
                           style="background: #ffc107; color: white; padding: 12px 30px; text-decoration: none; border-radius: 5px; display: inline-block;">
                           👀 Voir les candidatures
                        </a>
                    </div>
                    
                    <div style="border-top: 1px solid #ddd; padding-top: 20px; margin-top: 20px;">
                        <p style="color: #666; font-size: 12px;">
                            Cette notification a été envoyée automatiquement depuis BTP Pro.
                        </p>
                    </div>
                </div>
            `
        };
        
        console.log('✅ Email simulé envoyé');
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

    async updateNotificationBadge() {
        console.log('🔄 Mise à jour du badge de notification...');
        
        if (!authState.currentUser) {
            this.hideNotificationBadge();
            return;
        }
        
        try {
            const isEmployer = await JobsData.checkIfUserIsEmployer(authState.currentUser.id);
            const isAdmin = authState.isAdmin;
            
            if (!isEmployer && !isAdmin) {
                this.hideNotificationBadge();
                return;
            }
            
            const unreadNotifications = await JobsData.getUnreadNotifications(authState.currentUser.id);
            
            const badge = document.getElementById('notification-badge');
            if (!badge) return;
            
            if (unreadNotifications.length > 0) {
                badge.textContent = unreadNotifications.length;
                badge.classList.remove('d-none');
                
                badge.classList.add('pulse-animation');
                setTimeout(() => {
                    badge.classList.remove('pulse-animation');
                }, 2000);
                
            } else {
                this.hideNotificationBadge();
            }
            
        } catch (error) {
            console.error('❌ Erreur mise à jour badge:', error);
            this.hideNotificationBadge();
        }
    },

    hideNotificationBadge() {
        const badge = document.getElementById('notification-badge');
        if (badge) {
            badge.classList.add('d-none');
        }
    }
};

// Export global
window.JobsForms = JobsForms;
console.log('✅ jobs-forms.js CHARGÉ - Module formulaires emploi initialisé');