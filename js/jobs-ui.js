// ========== JOBS-DATA.JS - GESTION DES DONNÉES EMPLOI ==========

const JobsData = {
    // ========== OPÉRATIONS SUR LES OFFRES D'EMPLOI ==========
    
    async getAllJobPosts() {// ========== JOBS-UI.JS - GESTION DE L'INTERFACE UTILISATEUR EMPLOI ==========

const JobsUI = {
    // ========== AFFICHAGE DES OFFRES D'EMPLOI ==========
    
    displayJobsPosts(posts) {
        const container = document.getElementById('jobs-container');
        
        if (!container) {
            console.warn('❌ Container jobs non trouvé');
            return;
        }
        
        if (!posts || posts.length === 0) {
            container.innerHTML = `
                <div class="col-12 text-center py-5">
                    <i class="fas fa-search fa-3x text-muted mb-3"></i>
                    <p class="text-muted">Aucune offre d\'emploi trouvée</p>
                    <p class="text-muted small">Essayez de modifier vos critères de recherche</p>
                    <button class="btn btn-warning" onclick="clearJobsFilters()">
                        <i class="fas fa-times me-2"></i>Effacer les filtres
                    </button>
                </div>
            `;
            return;
        }
        
        let html = '';
        posts.forEach((post, index) => {
            if (!post || !post.id) return;
            
            const isFavorite = this.isInFavorites(post.id, 'jobs');
            const favoriteBtnClass = isFavorite ? 'text-danger' : 'text-muted';
            const favoriteIcon = isFavorite ? 'fas' : 'far';
            
            const applicationCount = JobsData.getApplicationCountForJob ? 
                JobsData.getApplicationCountForJob(post.id) : 0;
            
            const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
            const phoneDisplay = isMobile && post.phone ? 
                `<a href="tel:${post.phone}" class="btn btn-sm btn-outline-success">
                    <i class="fas fa-phone me-1"></i>Appeler
                </a>` : 
                `<small class="text-muted">${post.phone || 'Non précisé'}</small>`;
            
            html += `
            <div class="col-md-6 col-lg-4 mb-4">
                <div class="card h-100 job-card">
                    <div class="position-relative">
                        <div class="card-img-top bg-light d-flex align-items-center justify-content-center" style="height: 120px;">
                            <i class="fas fa-briefcase fa-2x text-warning"></i>
                        </div>
                        <button class="btn btn-sm btn-light favorite-btn ${favoriteBtnClass}" 
                                onclick="JobsUI.toggleFavorite('${post.id}', 'jobs')"
                                title="${isFavorite ? 'Retirer des favoris' : 'Ajouter aux favoris'}">
                            <i class="${favoriteIcon} fa-heart"></i>
                        </button>
                        ${post.isPremium ? `
                        <div class="position-absolute top-0 start-0 m-2">
                            <span class="badge bg-warning">⭐ Premium</span>
                        </div>
                        ` : ''}
                    </div>
                    <div class="card-body d-flex flex-column">
                        <h5 class="card-title">${post.poste || 'Poste non spécifié'}</h5>
                        <p class="card-text text-muted flex-grow-1">${post.description ? this.truncateText(post.description, 100) : 'Aucune description disponible'}...</p>
                        
                        <div class="mb-3">
                            <span class="badge bg-warning">${getContractLabel(post.contrat)}</span>
                            <span class="badge bg-secondary ms-1">${post.ville || 'Non spécifié'}</span>
                            ${applicationCount > 0 ? `
                            <span class="badge bg-success ms-1" title="${applicationCount} candidature(s)">
                                📬 ${applicationCount}
                            </span>
                            ` : ''}
                        </div>
                        
                        <div class="d-flex justify-content-between align-items-center mt-auto">
                            <div>
                                <strong class="text-primary">${post.salaire || 'Salaire non précisé'}</strong>
                            </div>
                            <small class="text-muted">${this.formatDate(post.createdAt)}</small>
                        </div>
                        
                        <div class="mt-2">
                            <i class="fas fa-phone text-muted me-1"></i>
                            ${phoneDisplay}
                        </div>
                        
                        ${post.experience ? `
                        <div class="mt-2">
                            <i class="fas fa-briefcase text-muted me-1"></i>
                            <small class="text-muted">${post.experience}</small>
                        </div>
                        ` : ''}
                        
                        ${authState.currentUser && (authState.isAdmin || post.userId === authState.currentUser.id) && applicationCount > 0 ? `
                        <div class="candidatures-section mt-3 p-2 bg-light rounded">
                            <div class="d-flex justify-content-between align-items-center">
                                <div>
                                    <i class="fas fa-users text-success me-2"></i>
                                    <strong>${applicationCount} candidature(s)</strong>
                                </div>
                                <button class="btn btn-success btn-sm" onclick="viewJobApplications('${post.id}')">
                                    <i class="fas fa-eye me-1"></i>Voir
                                </button>
                            </div>
                        </div>
                        ` : ''}
                    </div>
                    <div class="card-footer bg-transparent">
                        <div class="d-flex gap-2">
                            <button class="btn btn-warning btn-sm flex-grow-1" onclick="showJobApplicationForm('${post.id}')">
                                <i class="fas fa-paper-plane me-1"></i>Postuler
                            </button>
                            ${this.addRatingButtonToJobCard(post)}
                        </div>
                        
                        ${authState.currentUser && (authState.isAdmin || post.userId === authState.currentUser.id) ? `
                        <div class="admin-actions mt-2 pt-2 border-top">
                            <div class="btn-group btn-group-sm w-100">
                                <button class="btn btn-outline-warning btn-sm" onclick="toggleAnnounceStatus('${post.id}', 'jobs', '${post.status === 'en_pause' ? 'approuve' : 'en_pause'}')" 
                                        title="${post.status === 'en_pause' ? 'Activer' : 'Mettre en pause'}">
                                    <i class="fas fa-${post.status === 'en_pause' ? 'play' : 'pause'}"></i>
                                </button>
                                <button class="btn btn-outline-info btn-sm" onclick="togglePremium('${post.id}', 'jobs', ${!post.isPremium})" 
                                        title="${post.isPremium ? 'Retirer premium' : 'Mettre en avant'}">
                                    <i class="fas fa-${post.isPremium ? 'star' : 'crown'}"></i>
                                </button>
                                <button class="btn btn-outline-danger btn-sm" onclick="deleteAnnounce('${post.id}', 'jobs')" title="Supprimer">
                                    <i class="fas fa-trash"></i>
                                </button>
                            </div>
                        </div>
                        ` : ''}
                    </div>
                </div>
            </div>`;
        });
        
        container.innerHTML = html;
        console.log(`✅ ${posts.length} offres d\'emploi affichées`);
    },

    // ========== SYSTÈME DE NOTATION ==========
    
    showJobRatingForm(jobId, employerId) {
        if (!authState.currentUser) {
            showAlert('🔐 Connectez-vous pour laisser un avis', 'warning');
            showLoginModal();
            return;
        }

        JobsData.checkIfUserAppliedToJob(jobId, authState.currentUser.id).then(hasApplied => {
            if (!hasApplied && !authState.isAdmin) {
                showAlert('❌ Vous devez avoir postulé à cette offre pour pouvoir laisser un avis', 'warning');
                return;
            }
            this.showJobRatingModal(jobId, employerId);
        });
    },

    showJobRatingModal(jobId, employerId) {
        const modalHTML = `
            <div class="modal fade" id="jobRatingModal" tabindex="-1">
                <div class="modal-dialog modal-lg">
                    <div class="modal-content">
                        <div class="modal-header bg-warning text-white">
                            <h5 class="modal-title">
                                <i class="fas fa-star me-2"></i>Noter cette expérience
                            </h5>
                            <button type="button" class="btn-close" data-bs-dismiss="modal"></button>
                        </div>
                        <div class="modal-body">
                            <form id="jobRatingForm" onsubmit="JobsUI.submitJobRating(event, '${jobId}', '${employerId}')">
                                <div class="mb-4 text-center">
                                    <label class="form-label fw-bold">Note globale *</label>
                                    <div class="rating-stars mb-2" id="globalRating">
                                        ${[1,2,3,4,5].map(star => `
                                            <i class="fas fa-star fa-2x rating-star" data-rating="${star}" 
                                               onmouseover="JobsUI.highlightStars(${star})" 
                                               onmouseout="JobsUI.resetStars()"
                                               onclick="JobsUI.setRating(${star})"></i>
                                        `).join('')}
                                    </div>
                                    <input type="hidden" name="rating" id="selectedRating" required>
                                    <div id="ratingText" class="text-muted small">Cliquez sur les étoiles</div>
                                </div>

                                <div class="row mb-4">
                                    <div class="col-md-6">
                                        <label class="form-label">Clarté de l'offre</label>
                                        <div class="category-rating">
                                            ${[1,2,3,4,5].map(star => `
                                                <i class="fas fa-star category-star" data-category="clarity" data-rating="${star}"
                                                   onclick="JobsUI.setCategoryRating('clarity', ${star})"></i>
                                            `).join('')}
                                        </div>
                                    </div>
                                    <div class="col-md-6">
                                        <label class="form-label">Processus de recrutement</label>
                                        <div class="category-rating">
                                            ${[1,2,3,4,5].map(star => `
                                                <i class="fas fa-star category-star" data-category="process" data-rating="${star}"
                                                   onclick="JobsUI.setCategoryRating('process', ${star})"></i>
                                            `).join('')}
                                        </div>
                                    </div>
                                </div>

                                <div class="row mb-4">
                                    <div class="col-md-6">
                                        <label class="form-label">Communication</label>
                                        <div class="category-rating">
                                            ${[1,2,3,4,5].map(star => `
                                                <i class="fas fa-star category-star" data-category="communication" data-rating="${star}"
                                                   onclick="JobsUI.setCategoryRating('communication', ${star})"></i>
                                            `).join('')}
                                        </div>
                                    </div>
                                    <div class="col-md-6">
                                        <label class="form-label">Respect des délais</label>
                                        <div class="category-rating">
                                            ${[1,2,3,4,5].map(star => `
                                                <i class="fas fa-star category-star" data-category="timing" data-rating="${star}"
                                                   onclick="JobsUI.setCategoryRating('timing', ${star})"></i>
                                            `).join('')}
                                        </div>
                                    </div>
                                </div>

                                <div class="mb-3">
                                    <label class="form-label">Votre avis détaillé *</label>
                                    <textarea class="form-control" name="comment" rows="4" 
                                              placeholder="Partagez votre expérience avec ce recruteur... (minimum 20 caractères)"
                                              required minlength="20"></textarea>
                                </div>

                                <div class="mb-3">
                                    <label class="form-label">Type d'expérience</label>
                                    <select class="form-select" name="experience_type" required>
                                        <option value="">Choisir...</option>
                                        <option value="entretien">Entretien uniquement</option>
                                        <option value="candidature">Candidature déposée</option>
                                        <option value="embauche">Embauche effective</option>
                                        <option value="stage">Stage/Alternance</option>
                                    </select>
                                </div>

                                <div class="form-check mb-3">
                                    <input class="form-check-input" type="checkbox" name="is_anonymous" id="anonymousCheck">
                                    <label class="form-check-label" for="anonymousCheck">
                                        Publier cet avis de manière anonyme
                                    </label>
                                </div>

                                <div class="alert alert-info">
                                    <i class="fas fa-info-circle me-2"></i>
                                    Votre avis aidera d'autres professionnels du BTP à identifier les meilleures opportunités.
                                </div>

                                <div class="d-flex gap-2">
                                    <button type="submit" class="btn btn-warning flex-grow-1">
                                        <i class="fas fa-paper-plane me-2"></i>Publier mon avis
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
        `;

        const existingModal = document.getElementById('jobRatingModal');
        if (existingModal) existingModal.remove();

        document.body.insertAdjacentHTML('beforeend', modalHTML);
        
        const modal = new bootstrap.Modal(document.getElementById('jobRatingModal'));
        modal.show();

        this.initializeRatingStars();
    },

    // ========== GESTION DES ÉTOILES DE NOTATION ==========
    
    initializeRatingStars() {
        window.currentRating = 0;
        window.categoryRatings = {
            clarity: 0,
            process: 0,
            communication: 0,
            timing: 0
        };
    },

    highlightStars(rating) {
        const stars = document.querySelectorAll('#globalRating .rating-star');
        stars.forEach((star, index) => {
            if (index < rating) {
                star.classList.add('text-warning');
                star.classList.remove('text-muted');
            } else {
                star.classList.remove('text-warning');
                star.classList.add('text-muted');
            }
        });
    },

    resetStars() {
        const stars = document.querySelectorAll('#globalRating .rating-star');
        stars.forEach((star, index) => {
            if (index < window.currentRating) {
                star.classList.add('text-warning');
                star.classList.remove('text-muted');
            } else {
                star.classList.remove('text-warning');
                star.classList.add('text-muted');
            }
        });
    },

    setRating(rating) {
        window.currentRating = rating;
        document.getElementById('selectedRating').value = rating;
        
        const ratingText = document.getElementById('ratingText');
        const texts = {
            1: 'Médiocre - Très déçu',
            2: 'Passable - Peu satisfait', 
            3: 'Moyen - Correct',
            4: 'Bon - Satisfait',
            5: 'Excellent - Très satisfait'
        };
        ratingText.textContent = texts[rating] || 'Cliquez sur les étoiles';
        ratingText.className = 'small ' + (rating >= 4 ? 'text-success' : rating >= 3 ? 'text-warning' : 'text-danger');
        
        this.resetStars();
    },

    setCategoryRating(category, rating) {
        window.categoryRatings[category] = rating;
        
        const stars = document.querySelectorAll(`.category-star[data-category="${category}"]`);
        stars.forEach((star, index) => {
            if (index < rating) {
                star.classList.add('text-warning');
                star.classList.remove('text-muted');
            } else {
                star.classList.remove('text-warning');
                star.classList.add('text-muted');
            }
        });
    },

    async submitJobRating(event, jobId, employerId) {
        event.preventDefault();
        
        const form = event.target;
        const formData = new FormData(form);
        const rating = parseInt(document.getElementById('selectedRating').value);

        if (rating === 0) {
            showAlert('❌ Veuillez donner une note globale', 'error');
            return;
        }

        // Vérifier que toutes les catégories sont notées
        const missingCategories = Object.keys(window.categoryRatings).filter(cat => window.categoryRatings[cat] === 0);
        if (missingCategories.length > 0) {
            showAlert('❌ Veuillez noter toutes les catégories', 'error');
            return;
        }

        showLoading(true);

        try {
            const ratingData = {
                jobId: jobId,
                employerId: employerId,
                reviewerId: authState.currentUser.id,
                reviewerName: formData.get('is_anonymous') ? 'Anonyme' : `${authState.currentUser.prenom} ${authState.currentUser.nom}`,
                reviewerEmail: authState.currentUser.email,
                rating: rating,
                categoryRatings: window.categoryRatings,
                comment: formData.get('comment').trim(),
                experienceType: formData.get('experience_type'),
                isAnonymous: formData.get('is_anonymous') === 'on',
                status: 'en_attente', // Modération des avis
                createdAt: new Date().toISOString(),
                updatedAt: new Date().toISOString()
            };

            await JobsData.createRating(ratingData);

            // Mettre à jour la note moyenne du recruteur
            await JobsData.updateEmployerRating(employerId);

            showAlert('✅ Votre avis a été soumis avec succès ! Il sera visible après modération.', 'success');

            const modal = bootstrap.Modal.getInstance(document.getElementById('jobRatingModal'));
            if (modal) modal.hide();

            // Recharger les avis
            this.loadJobRatings(jobId);

        } catch (error) {
            console.error('❌ Erreur soumission avis:', error);
            showAlert('❌ Erreur lors de la soumission de votre avis', 'error');
        } finally {
            showLoading(false);
        }
    },

    // ========== AFFICHAGE DES AVIS ==========
    
    async loadJobRatings(jobId) {
        try {
            const ratings = await JobsData.getRatingsForJob(jobId);
            this.displayJobRatings(ratings);
        } catch (error) {
            console.error('Erreur chargement avis:', error);
        }
    },

    displayJobRatings(ratings) {
        const container = document.getElementById('jobRatingsContainer');
        if (!container) return;

        if (!ratings || ratings.length === 0) {
            container.innerHTML = `
                <div class="text-center py-4">
                    <i class="fas fa-star fa-2x text-muted mb-3"></i>
                    <p class="text-muted">Aucun avis pour le moment</p>
                    <p class="text-muted small">Soyez le premier à partager votre expérience</p>
                </div>
            `;
            return;
        }

        // Calculer la note moyenne
        const averageRating = ratings.reduce((sum, rating) => sum + rating.rating, 0) / ratings.length;

        let html = `
            <div class="rating-summary mb-4 p-4 bg-light rounded">
                <div class="row align-items-center">
                    <div class="col-md-4 text-center">
                        <div class="display-4 fw-bold text-warning">${averageRating.toFixed(1)}</div>
                        <div class="mb-2">
                            ${this.generateStarRating(averageRating)}
                        </div>
                        <div class="text-muted small">${ratings.length} avis</div>
                    </div>
                    <div class="col-md-8">
                        ${this.generateRatingDistribution(ratings)}
                    </div>
                </div>
            </div>

            <div class="ratings-list">
                <h5 class="mb-3">Avis des candidats</h5>
        `;

        ratings.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
              .forEach(rating => {
            html += `
                <div class="rating-item border-bottom pb-3 mb-3">
                    <div class="d-flex justify-content-between align-items-start mb-2">
                        <div>
                            <strong>${rating.reviewerName}</strong>
                            <span class="badge bg-secondary ms-2">${this.getExperienceTypeLabel(rating.experienceType)}</span>
                        </div>
                        <small class="text-muted">${this.formatDate(rating.createdAt)}</small>
                    </div>
                    
                    <div class="mb-2">
                        ${this.generateStarRating(rating.rating)}
                    </div>

                    <div class="category-ratings mb-2">
                        <div class="row small text-muted">
                            <div class="col-6">Clarté: ${this.generateSmallStars(rating.categoryRatings.clarity)}</div>
                            <div class="col-6">Processus: ${this.generateSmallStars(rating.categoryRatings.process)}</div>
                            <div class="col-6">Communication: ${this.generateSmallStars(rating.categoryRatings.communication)}</div>
                            <div class="col-6">Délais: ${this.generateSmallStars(rating.categoryRatings.timing)}</div>
                        </div>
                    </div>

                    <p class="mb-0">${rating.comment}</p>
                </div>
            `;
        });

        html += `</div>`;
        container.innerHTML = html;
    },

    // ========== FONCTIONS UTILITAIRES POUR L'INTERFACE ==========
    
    generateRatingDistribution(ratings) {
        const distribution = {5: 0, 4: 0, 3: 0, 2: 0, 1: 0};
        
        ratings.forEach(rating => {
            distribution[rating.rating]++;
        });

        let html = '';
        [5,4,3,2,1].forEach(stars => {
            const count = distribution[stars];
            const percentage = ratings.length > 0 ? (count / ratings.length) * 100 : 0;
            
            html += `
                <div class="rating-bar mb-2">
                    <div class="d-flex justify-content-between align-items-center">
                        <span class="small">${stars} étoiles</span>
                        <div class="progress flex-grow-1 mx-2" style="height: 8px;">
                            <div class="progress-bar bg-warning" style="width: ${percentage}%"></div>
                        </div>
                        <span class="small text-muted">${count}</span>
                    </div>
                </div>
            `;
        });

        return html;
    },

    generateStarRating(rating) {
        let html = '';
        for (let i = 1; i <= 5; i++) {
            if (i <= Math.floor(rating)) {
                html += '<i class="fas fa-star text-warning"></i>';
            } else if (i === Math.ceil(rating) && rating % 1 !== 0) {
                html += '<i class="fas fa-star-half-alt text-warning"></i>';
            } else {
                html += '<i class="far fa-star text-warning"></i>';
            }
        }
        return html;
    },

    generateSmallStars(rating) {
        let html = '';
        for (let i = 1; i <= 5; i++) {
            html += i <= rating ? 
                '<i class="fas fa-star text-warning small"></i>' : 
                '<i class="far fa-star text-warning small"></i>';
        }
        return html;
    },

    getExperienceTypeLabel(type) {
        const labels = {
            'entretien': 'Entretien',
            'candidature': 'Candidature',
            'embauche': 'Embauche',
            'stage': 'Stage/Alternance'
        };
        return labels[type] || type;
    },

    addRatingButtonToJobCard(post) {
        if (!authState.currentUser || authState.currentUser.id === post.userId) {
            return ''; // Ne pas afficher pour le propriétaire ou non connecté
        }

        return `
            <button class="btn btn-outline-warning btn-sm mt-2" 
                    onclick="showJobRatingForm('${post.id}', '${post.userId}')"
                    title="Noter cette offre">
                <i class="fas fa-star me-1"></i>Noter
            </button>
        `;
    },

    // ========== FONCTIONS UTILITAIRES GÉNÉRALES ==========
    
    isInFavorites(itemId, type) {
        // Fonction de compatibilité avec l'ancien système
        try {
            const favorites = JSON.parse(localStorage.getItem('btp_pro_favorites')) || {};
            return favorites[type] && favorites[type].includes(itemId);
        } catch (error) {
            return false;
        }
    },

    toggleFavorite(itemId, type) {
        // Fonction de compatibilité avec l'ancien système
        try {
            const favorites = JSON.parse(localStorage.getItem('btp_pro_favorites')) || {};
            if (!favorites[type]) favorites[type] = [];
            
            const index = favorites[type].indexOf(itemId);
            if (index > -1) {
                favorites[type].splice(index, 1);
                showAlert('❤️ Retiré des favoris', 'info');
            } else {
                favorites[type].push(itemId);
                showAlert('❤️ Ajouté aux favoris', 'success');
            }
            
            localStorage.setItem('btp_pro_favorites', JSON.stringify(favorites));
            
            // Recharger l'affichage
            if (typeof loadJobsAnnounces === 'function') {
                loadJobsAnnounces();
            }
        } catch (error) {
            console.error('Erreur gestion favoris:', error);
        }
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
            year: 'numeric'
        });
    }
};

// Export global
window.JobsUI = JobsUI;
console.log('✅ jobs-ui.js CHARGÉ - Module interface utilisateur initialisé');
        try {
            const posts = await btpDB.get('job_posts');
            return posts || [];
        } catch (error) {
            console.error('❌ Erreur récupération offres:', error);
            return [];
        }
    },

    async getApprovedJobPosts() {
        try {
            const posts = await this.getAllJobPosts();
            return posts.filter(post => 
                post && (post.status === 'approuve' || post.status === 'approved' || !post.status)
            );
        } catch (error) {
            console.error('❌ Erreur récupération offres approuvées:', error);
            return [];
        }
    },

    async getJobPostById(jobId) {
        try {
            const posts = await this.getAllJobPosts();
            return posts.find(post => post.id === jobId);
        } catch (error) {
            console.error('❌ Erreur récupération offre:', error);
            return null;
        }
    },

    async createJobPost(jobData) {
        try {
            const newJob = await btpDB.post('job_posts', jobData);
            console.log('✅ Offre créée:', newJob.id);
            return newJob;
        } catch (error) {
            console.error('❌ Erreur création offre:', error);
            throw error;
        }
    },

    async updateJobPost(jobId, updates) {
        try {
            const updatedJob = await btpDB.put('job_posts', jobId, updates);
            console.log('✅ Offre mise à jour:', jobId);
            return updatedJob;
        } catch (error) {
            console.error('❌ Erreur mise à jour offre:', error);
            throw error;
        }
    },

    async deleteJobPost(jobId) {
        try {
            await btpDB.delete('job_posts', jobId);
            console.log('✅ Offre supprimée:', jobId);
            return true;
        } catch (error) {
            console.error('❌ Erreur suppression offre:', error);
            throw error;
        }
    },

    // ========== OPÉRATIONS SUR LES CANDIDATURES ==========
    
    async getAllApplications() {
        try {
            const applications = await btpDB.get('job_applications');
            return applications || [];
        } catch (error) {
            console.error('❌ Erreur récupération candidatures:', error);
            return [];
        }
    },

    async getApplicationsForJob(jobId) {
        try {
            const applications = await this.getAllApplications();
            return applications.filter(app => app.jobId === jobId);
        } catch (error) {
            console.error('❌ Erreur récupération candidatures offre:', error);
            return [];
        }
    },

    async getUserApplications(userId) {
        try {
            const applications = await this.getAllApplications();
            return applications.filter(app => app.candidateId === userId);
        } catch (error) {
            console.error('❌ Erreur récupération candidatures utilisateur:', error);
            return [];
        }
    },

    async createApplication(applicationData) {
        try {
            const newApplication = await btpDB.post('job_applications', applicationData);
            console.log('✅ Candidature créée:', newApplication.id);
            return newApplication;
        } catch (error) {
            console.error('❌ Erreur création candidature:', error);
            throw error;
        }
    },

    async updateApplication(applicationId, updates) {
        try {
            const updatedApplication = await btpDB.put('job_applications', applicationId, updates);
            console.log('✅ Candidature mise à jour:', applicationId);
            return updatedApplication;
        } catch (error) {
            console.error('❌ Erreur mise à jour candidature:', error);
            throw error;
        }
    },

    async getApplicationCountForJob(jobId) {
        try {
            const applications = await this.getApplicationsForJob(jobId);
            return applications.length;
        } catch (error) {
            console.error('❌ Erreur comptage candidatures:', error);
            return 0;
        }
    },

    // ========== OPÉRATIONS SUR LES NOTATIONS ==========
    
    async getAllRatings() {
        try {
            const ratings = await btpDB.get('job_ratings');
            return ratings || [];
        } catch (error) {
            console.error('❌ Erreur récupération notations:', error);
            return [];
        }
    },

    async getRatingsForJob(jobId) {
        try {
            const ratings = await this.getAllRatings();
            return ratings.filter(rating => rating.jobId === jobId && rating.status === 'approuve');
        } catch (error) {
            console.error('❌ Erreur récupération notations offre:', error);
            return [];
        }
    },

    async createRating(ratingData) {
        try {
            const newRating = await btpDB.post('job_ratings', ratingData);
            console.log('✅ Notation créée:', newRating.id);
            return newRating;
        } catch (error) {
            console.error('❌ Erreur création notation:', error);
            throw error;
        }
    },

    async updateEmployerRating(employerId) {
        try {
            const ratings = await this.getAllRatings();
            const employerRatings = ratings.filter(r => 
                r.employerId === employerId && r.status === 'approuve'
            );

            if (employerRatings.length > 0) {
                const totalRating = employerRatings.reduce((sum, rating) => sum + rating.rating, 0);
                const averageRating = totalRating / employerRatings.length;

                const employers = await btpDB.get('employer_profiles');
                let employerProfile = employers.find(emp => emp.userId === employerId);

                if (!employerProfile) {
                    employerProfile = {
                        userId: employerId,
                        rating: averageRating,
                        ratingCount: employerRatings.length,
                        createdAt: new Date().toISOString()
                    };
                    await btpDB.post('employer_profiles', employerProfile);
                } else {
                    employerProfile.rating = averageRating;
                    employerProfile.ratingCount = employerRatings.length;
                    employerProfile.updatedAt = new Date().toISOString();
                    await btpDB.put('employer_profiles', employerProfile.id, employerProfile);
                }
                
                return averageRating;
            }
            return 0;
        } catch (error) {
            console.error('❌ Erreur mise à jour note employeur:', error);
            throw error;
        }
    },

    // ========== OPÉRATIONS SUR LES NOTIFICATIONS ==========
    
    async createNotification(notificationData) {
        try {
            const newNotification = await btpDB.post('notifications', notificationData);
            console.log('✅ Notification créée:', newNotification.id);
            return newNotification;
        } catch (error) {
            console.error('❌ Erreur création notification:', error);
            throw error;
        }
    },

    async getUnreadNotifications(userId) {
        try {
            const notifications = await btpDB.get('notifications');
            return notifications.filter(notif => 
                notif.recipientId === userId && !notif.isRead
            );
        } catch (error) {
            console.error('❌ Erreur récupération notifications:', error);
            return [];
        }
    },

    // ========== STATISTIQUES ET ANALYTIQUES ==========
    
    async getJobsStats() {
        try {
            const [posts, applications, ratings] = await Promise.all([
                this.getAllJobPosts(),
                this.getAllApplications(),
                this.getAllRatings()
            ]);

            const approvedPosts = posts.filter(post => 
                post.status === 'approuve' || post.status === 'approved' || !post.status
            );

            return {
                totalJobs: posts.length,
                approvedJobs: approvedPosts.length,
                pendingJobs: posts.filter(p => p.status === 'en_attente').length,
                totalApplications: applications.length,
                totalRatings: ratings.length,
                averageRating: ratings.length > 0 ? 
                    ratings.reduce((sum, r) => sum + r.rating, 0) / ratings.length : 0
            };
        } catch (error) {
            console.error('❌ Erreur calcul statistiques:', error);
            return {};
        }
    },

    // ========== FONCTIONS DE VALIDATION ==========
    
    async checkIfUserAppliedToJob(jobId, userId) {
        try {
            const applications = await this.getApplicationsForJob(jobId);
            return applications.some(app => app.candidateId === userId);
        } catch (error) {
            console.error('❌ Erreur vérification candidature:', error);
            return false;
        }
    },

    async checkIfUserIsEmployer(userId) {
        try {
            const posts = await this.getAllJobPosts();
            return posts.some(post => post.userId === userId);
        } catch (error) {
            console.error('❌ Erreur vérification employeur:', error);
            return false;
        }
    },

    // ========== FONCTIONS DE FILTRAGE ==========
    
    async filterJobPosts(filters = {}) {
        try {
            const posts = await this.getApprovedJobPosts();
            
            return posts.filter(post => {
                if (filters.type && post.contrat !== filters.type) return false;
                if (filters.city && post.ville !== filters.city) return false;
                if (filters.experience && !this.checkExperienceMatch(post.experience, filters.experience)) return false;
                return true;
            });
        } catch (error) {
            console.error('❌ Erreur filtrage offres:', error);
            return [];
        }
    },

    checkExperienceMatch(postExperience, filterExperience) {
        if (!postExperience || !filterExperience) return true;
        
        const postExp = this.extractYearsFromExperience(postExperience);
        const [minFilter, maxFilter] = filterExperience.split('-').map(exp => {
            const value = parseInt(exp.replace('+', ''));
            return isNaN(value) ? 0 : value;
        });
        
        if (filterExperience.endsWith('+')) {
            return postExp >= minFilter;
        } else if (maxFilter) {
            return postExp >= minFilter && postExp <= maxFilter;
        }
        
        return true;
    },

    extractYearsFromExperience(experienceText) {
        if (!experienceText) return 0;
        const matches = experienceText.match(/\d+/g);
        return matches && matches.length > 0 ? parseInt(matches[0]) : 0;
    }
};

// Export global
window.JobsData = JobsData;
console.log('✅ jobs-data.js CHARGÉ - Module de données emploi initialisé');
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
// ========== CONFIGURATION FIREBASE ==========
const firebaseConfig = {
    apiKey: "AIzaSyBFD2STC7CkKBqzyOzEbZlIcu0afBFaWX4",
    authDomain: "btp-pro-maroc.firebaseapp.com",
    projectId: "btp-pro-maroc",
    storageBucket: "btp-pro-maroc.firebasestorage.app",
    messagingSenderId: "970736503225",
    appId: "1:970736503225:web:37becb129d6716fae28e68"
};

// ========== INITIALISATION FIREBASE ==========
let firebaseApp, firestore, auth;
let firebaseOnline = false;

// Vérifier si Firebase est disponible
if (typeof firebase !== 'undefined') {
    try {
        if (firebase.apps.length === 0) {
            // Initialiser Firebase
            firebaseApp = firebase.initializeApp(firebaseConfig);
            console.log('✅ Firebase initialisé avec succès');
        } else {
            // Firebase déjà initialisé
            firebaseApp = firebase.app();
            console.log('✅ Firebase déjà initialisé');
        }
        
        firestore = firebase.firestore();
        auth = firebase.auth();
        firebaseOnline = true;
        
        // Configurer la persistance des données
        firestore.enablePersistence()
            .then(() => console.log('✅ Persistance Firebase activée'))
            .catch(err => console.warn('⚠️ Persistance Firebase non disponible:', err));
            
    } catch (error) {
        console.warn('❌ Firebase non disponible, utilisation du localStorage:', error);
        firebaseOnline = false;
    }
} else {
    console.warn('❌ Firebase SDK non chargé, utilisation du localStorage');
    firebaseOnline = false;
}

// ========== BASE DE DONNÉES AVEC FALLBACK ==========
class BTPDatabase {
    constructor() {
        this.localStorageKey = 'btp_pro_local_db';
        this.init();
    }

    init() {
        console.log('🗄️ Initialisation de la base de données...');
        
        if (!localStorage.getItem(this.localStorageKey)) {
            this.initializeLocalData();
        }
        
        // Synchroniser avec Firebase si disponible
        if (firebaseOnline) {
            this.syncWithFirebase();
        }
        
        console.log('✅ Base de données initialisée');
    }

    async syncWithFirebase() {
        if (!firebaseOnline) return;
        
        try {
            console.log('🔄 Synchronisation avec Firebase...');
            
            // Synchroniser les utilisateurs
            const usersSnapshot = await firestore.collection('users').get();
            if (!usersSnapshot.empty) {
                const firebaseUsers = usersSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
                const localData = this.getLocalData();
                localData.users = this.mergeArrays(localData.users, firebaseUsers);
                this.saveLocalData(localData);
            }
            
            console.log('✅ Synchronisation Firebase terminée');
        } catch (error) {
            console.warn('⚠️ Erreur synchronisation Firebase:', error);
        }
    }

    initializeLocalData() {
        console.log('📦 Initialisation des données de démonstration...');
        
        const initialData = {
            users: [
                {
                    id: "1",
                    prenom: "Admin",
                    nom: "BTP",
                    email: "admin@btp.ma",
                    password: "admin123",
                    phone: "+212 6 00 00 00 00",
                    role: "admin",
                    isVerified: true,
                    isBlocked: false,
                    hasPremium: true,
                    visitCount: 15,
                    lastVisit: new Date().toISOString(),
                    createdAt: new Date('2024-01-01').toISOString(),
                    updatedAt: new Date().toISOString()
                },
                {
                    id: "2",
                    prenom: "Abderrahmane",
                    nom: "Lyaakobi",
                    email: "lyaakobi@hotmail.com",
                    password: "@nisawsan1",
                    phone: "+212 6 63 06 62 25",
                    role: "user",
                    isVerified: true,
                    isBlocked: false,
                    hasPremium: true,
                    visitCount: 8,
                    lastVisit: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
                    createdAt: new Date('2024-01-15').toISOString(),
                    updatedAt: new Date().toISOString()
                },
                {
                    id: "3",
                    prenom: "Younes",
                    nom: "Hachimi",
                    email: "y.hachimi.yh@gmail.com",
                    password: "@younes1",
                    phone: "+212 6 12 34 56 78",
                    role: "user",
                    isVerified: true,
                    isBlocked: false,
                    hasPremium: true,
                    visitCount: 12,
                    lastVisit: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString(),
                    createdAt: new Date('2024-01-20').toISOString(),
                    updatedAt: new Date().toISOString()
                }
            ],
            marketplace_posts: [
                {
                    id: "1",
                    title: "Ciment CPJ45 Lafarge",
                    description: "Sac de 50kg - Qualité Premium - Livraison possible dans Casablanca et régions",
                    price: 85,
                    unit: "sac",
                    category: "ciment",
                    city: "Casablanca",
                    phone: "+212 6 63 06 62 25",
                    status: 'approuve',
                    userId: "2",
                    userName: "Abderrahmane Lyaakobi",
                    userEmail: "lyaakobi@hotmail.com",
                    isPremium: false,
                    photos: [],
                    viewCount: 45,
                    contactCount: 12,
                    createdAt: new Date(Date.now() - 35 * 24 * 60 * 60 * 1000).toISOString(),
                    updatedAt: new Date().toISOString()
                }
            ],
            realestate_posts: [
                {
                    id: "1",
                    title: "Villa Moderne 220m² - Marrakech Gueliz",
                    description: "Superbe villa moderne située dans le quartier résidentiel de Gueliz. 4 chambres, 3 salles de bain, salon spacieux, cuisine équipée, garage pour 2 voitures, jardin aménagé. Proche de toutes les commodités.",
                    price: 2800000,
                    type: "villa",
                    transaction: "vente",
                    surface: 220,
                    rooms: 4,
                    bathrooms: 3,
                    address: "Gueliz, Marrakech",
                    city: "Marrakech",
                    phone: "+212 6 63 06 62 25",
                    status: 'approuve',
                    userId: "2",
                    userName: "Abderrahmane Lyaakobi",
                    userEmail: "lyaakobi@hotmail.com",
                    isPremium: true,
                    photos: [],
                    viewCount: 156,
                    contactCount: 34,
                    createdAt: new Date(Date.now() - 40 * 24 * 60 * 60 * 1000).toISOString(),
                    updatedAt: new Date().toISOString()
                }
            ],
            job_posts: [
                {
                    id: "1",
                    poste: "Chef de Chantier BTP Expérimenté",
                    description: "Nous recherchons un chef de chantier expérimenté pour superviser nos projets de construction. Missions: management d'équipe, suivi de chantier, respect des délais et budget, coordination avec les sous-traitants.",
                    salaire: "15 000 - 18 000 MAD/mois",
                    contrat: "cdi",
                    ville: "Casablanca",
                    experience: "5+ ans dans le BTP",
                    competences: "Management, Lecture de plans, Suivi de chantier, Sécurité",
                    phone: "+212 6 63 06 62 25",
                    status: 'approuve',
                    userId: "2",
                    userName: "Abderrahmane Lyaakobi",
                    userEmail: "lyaakobi@hotmail.com",
                    isPremium: true,
                    viewCount: 89,
                    contactCount: 15,
                    createdAt: new Date().toISOString(),
                    updatedAt: new Date().toISOString()
                },
                {
                    id: "2",
                    poste: "Ouvrier Spécialisé Maçonnerie",
                    description: "Recherche ouvrier qualifié pour chantier résidentiel. Expérience en gros œuvre et second œuvre requise. Poste en CDD avec possibilité de CDI.",
                    salaire: "8 000 - 10 000 MAD/mois",
                    contrat: "cdd",
                    ville: "Rabat",
                    experience: "2+ ans en maçonnerie",
                    competences: "Maçonnerie, Enduit, Carrelage",
                    phone: "+212 6 87 65 43 21",
                    status: 'en_attente',
                    userId: "1",
                    userName: "Admin BTP",
                    userEmail: "admin@btp.ma",
                    isPremium: false,
                    viewCount: 45,
                    contactCount: 8,
                    createdAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString(),
                    updatedAt: new Date().toISOString()
                }
            ],
            freelancers: [
                {
                    id: "1",
                    title: "Infographiste 3D BTP - Rendu Photoréaliste",
                    description: "Création de rendus 3D photoréalistes pour projets BTP, visualisations architecturales et conception de plans techniques. Logiciels: 3DS Max, V-Ray, AutoCAD, SketchUp. Plus de 50 projets réalisés.",
                    specialty: "infographie",
                    tarif: "500-1000 MAD/jour",
                    ville: "Casablanca",
                    experience: "5+ ans",
                    portfolio: "https://portfolio-lyaakobi.com",
                    phone: "+212 6 63 06 62 25",
                    status: 'approuve',
                    userId: "2",
                    userName: "Abderrahmane Lyaakobi",
                    userEmail: "lyaakobi@hotmail.com",
                    rating: 4.8,
                    reviewCount: 12,
                    isPremium: true,
                    viewCount: 234,
                    contactCount: 45,
                    createdAt: new Date(Date.now() - 45 * 24 * 60 * 60 * 1000).toISOString(),
                    updatedAt: new Date().toISOString()
                }
            ],
            professionals: [
                {
                    id: "1",
                    company: "Maçonnerie Lyaakobi",
                    specialty: "maçonnerie",
                    experience: 15,
                    city: "Casablanca",
                    description: "Entreprise familiale spécialisée en gros œuvre et fondations. 15 ans d'expérience dans le secteur BTP marocain. Travaux de qualité garantis: maçonnerie traditionnelle, béton armé, fondations profondes.",
                    phone: "+212 6 63 06 62 25",
                    email: "contact@maconnerie-lyaakobi.ma",
                    website: "https://maconnerie-lyaakobi.ma",
                    rating: 4.8,
                    reviewCount: 124,
                    userId: "2",
                    status: 'approuve',
                    isVerified: true,
                    viewCount: 567,
                    contactCount: 89,
                    createdAt: new Date(Date.now() - 60 * 24 * 60 * 60 * 1000).toISOString(),
                    updatedAt: new Date().toISOString()
                }
            ],

            // ========== COLLECTIONS AJOUTÉES POUR LE SYSTÈME EMPLOI ==========
            
            job_applications: [
                {
                    id: "1",
                    jobId: "1",
                    candidateId: "3",
                    candidateName: "Younes Hachimi",
                    candidateEmail: "y.hachimi.yh@gmail.com",
                    candidatePhone: "+212 6 12 34 56 78",
                    cvFileName: "CV_Younes_Hachimi.pdf",
                    lettreMotivation: "Je suis très intéressé par ce poste de chef de chantier. Avec mes 8 ans d'expérience dans le BTP marocain, je suis convaincu que je peux apporter une réelle valeur à votre entreprise.",
                    experience: "8 ans dans le BTP",
                    disponibilite: "immediate",
                    status: "en_attente",
                    createdAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
                    updatedAt: new Date().toISOString()
                },
                {
                    id: "2",
                    jobId: "1",
                    candidateId: "2",
                    candidateName: "Abderrahmane Lyaakobi",
                    candidateEmail: "lyaakobi@hotmail.com",
                    candidatePhone: "+212 6 63 06 62 25",
                    cvFileName: "CV_Lyaakobi.pdf",
                    lettreMotivation: "En tant que professionnel du BTP avec 15 ans d'expérience, je suis intéressé par ce poste de chef de chantier pour relever de nouveaux défis.",
                    experience: "15 ans en maçonnerie et gestion de chantier",
                    disponibilite: "15j",
                    status: "en_cours",
                    createdAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString(),
                    updatedAt: new Date().toISOString()
                }
            ],

            job_ratings: [
                {
                    id: "1",
                    jobId: "1",
                    employerId: "2",
                    reviewerId: "3",
                    reviewerName: "Younes Hachimi",
                    reviewerEmail: "y.hachimi.yh@gmail.com",
                    rating: 5,
                    categoryRatings: {
                        clarity: 5,
                        process: 4,
                        communication: 5,
                        timing: 4
                    },
                    comment: "Processus de recrutement très professionnel. L'annonceur a été très réactif et les informations sur le poste étaient claires et détaillées.",
                    experienceType: "entretien",
                    isAnonymous: false,
                    status: "approuve",
                    createdAt: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(),
                    updatedAt: new Date().toISOString()
                }
            ],

            employer_profiles: [
                {
                    id: "1",
                    userId: "2",
                    rating: 4.8,
                    ratingCount: 1,
                    totalJobsPosted: 2,
                    responseRate: 100,
                    averageResponseTime: "2 heures",
                    createdAt: new Date().toISOString(),
                    updatedAt: new Date().toISOString()
                }
            ],

            notifications: [
                {
                    id: "1",
                    type: "new_application",
                    title: "Nouvelle candidature reçue",
                    message: "📬 Younes Hachimi a postulé à votre offre 'Chef de Chantier BTP Expérimenté'",
                    recipientId: "2",
                    recipientEmail: "lyaakobi@hotmail.com",
                    applicationId: "1",
                    jobId: "1",
                    isRead: false,
                    createdAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString()
                },
                {
                    id: "2",
                    type: "application_status",
                    title: "Statut de candidature mis à jour",
                    message: "✅ Votre candidature pour 'Chef de Chantier BTP' est maintenant en cours d'examen",
                    recipientId: "3",
                    recipientEmail: "y.hachimi.yh@gmail.com",
                    applicationId: "1",
                    jobId: "1",
                    isRead: true,
                    createdAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString()
                }
            ],

            messages: [],

            forum_topics: [],

            adsense_slots: [
                {
                    id: 'header_ad',
                    name: 'Bannière en-tête',
                    code: '<!-- Code Adsense pour bannière en-tête -->',
                    position: 'header',
                    isActive: true,
                    createdAt: new Date().toISOString(),
                    updatedAt: new Date().toISOString()
                }
            ],

            premium_features: [
                {
                    id: 'stats_advanced',
                    name: 'Statistiques avancées',
                    description: 'Accès aux données détaillées de performance'
                }
            ]
        };
        
        this.saveLocalData(initialData);
        console.log('✅ Données de démonstration initialisées avec collections emploi');
    }

    // ========== OPÉRATIONS CRUD ==========
    async get(collection) {
        try {
            // TOUJOURS utiliser localStorage en premier pour éviter les problèmes de synchronisation
            const localData = this.getLocalData();
            const data = localData[collection] || [];
            
            // Vérifier Firebase en arrière-plan mais ne pas bloquer l'affichage
            if (firebaseOnline) {
                this.syncCollectionFromFirebase(collection).catch(error => {
                    console.warn(`⚠️ Sync Firebase ${collection} échouée:`, error);
                });
            }
            
            return data;
            
        } catch (error) {
            console.error(`❌ Erreur critique chargement ${collection}:`, error);
            return [];
        }
    }

    async syncCollectionFromFirebase(collection) {
        if (!firebaseOnline) return;
        
        try {
            const snapshot = await firestore.collection(collection).get();
            if (!snapshot.empty) {
                const firebaseData = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
                const localData = this.getLocalData();
                localData[collection] = this.mergeArrays(localData[collection], firebaseData);
                this.saveLocalData(localData);
            }
        } catch (error) {
            console.warn(`⚠️ Erreur sync Firebase ${collection}:`, error);
        }
    }

    async post(collection, data) {
        const item = {
            id: Date.now().toString(),
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
            ...data
        };

        // Sauvegarde locale IMMÉDIATE pour affichage instantané
        const localData = this.getLocalData();
        if (!localData[collection]) localData[collection] = [];
        localData[collection].push(item);
        this.saveLocalData(localData);

        console.log(`✅ ${collection} créé localement:`, item.id);

        // Synchronisation Firebase en arrière-plan
        if (firebaseOnline) {
            this.syncToFirebase(collection, item).catch(error => {
                console.warn(`⚠️ Sync Firebase ${collection} échouée:`, error);
            });
        }

        return item;
    }

    async syncToFirebase(collection, item) {
        if (!firebaseOnline) return;
        
        try {
            await firestore.collection(collection).doc(item.id.toString()).set(item);
            console.log(`☁️ ${collection} synchronisé vers Firebase:`, item.id);
        } catch (error) {
            console.warn(`⚠️ Erreur sync vers Firebase ${collection}:`, error);
        }
    }

    async put(collection, id, data) {
        // Mise à jour locale IMMÉDIATE
        const localData = this.getLocalData();
        const index = localData[collection].findIndex(item => item.id == id);
        
        if (index !== -1) {
            localData[collection][index] = { 
                ...localData[collection][index], 
                ...data,
                updatedAt: new Date().toISOString()
            };
            this.saveLocalData(localData);
            console.log(`✅ ${collection} mis à jour localement:`, id);

            // Synchronisation Firebase en arrière-plan
            if (firebaseOnline) {
                this.updateInFirebase(collection, id, data).catch(error => {
                    console.warn(`⚠️ Update Firebase ${collection} échouée:`, error);
                });
            }

            return localData[collection][index];
        }
        
        console.warn(`❌ ${collection} non trouvé:`, id);
        return null;
    }

    async updateInFirebase(collection, id, data) {
        if (!firebaseOnline) return;
        
        try {
            await firestore.collection(collection).doc(id.toString()).update(data);
            console.log(`☁️ ${collection} mis à jour dans Firebase:`, id);
        } catch (error) {
            console.warn(`⚠️ Erreur update Firebase ${collection}:`, error);
        }
    }

    async delete(collection, id) {
        // Suppression locale IMMÉDIATE
        const localData = this.getLocalData();
        if (localData[collection]) {
            const initialLength = localData[collection].length;
            localData[collection] = localData[collection].filter(item => item.id != id);
            this.saveLocalData(localData);
            console.log(`✅ ${collection} supprimé localement:`, id);

            // Synchronisation Firebase en arrière-plan
            if (firebaseOnline) {
                this.deleteFromFirebase(collection, id).catch(error => {
                    console.warn(`⚠️ Delete Firebase ${collection} échouée:`, error);
                });
            }

            return initialLength !== localData[collection].length;
        }
        
        return false;
    }

    async deleteFromFirebase(collection, id) {
        if (!firebaseOnline) return;
        
        try {
            await firestore.collection(collection).doc(id.toString()).delete();
            console.log(`☁️ ${collection} supprimé de Firebase:`, id);
        } catch (error) {
            console.warn(`⚠️ Erreur delete Firebase ${collection}:`, error);
        }
    }

    // ========== AUTHENTIFICATION SÉCURISÉE ==========
    async authenticateUser(email, password) {
        console.log('🔐 Tentative de connexion:', email);
        
        // OPTION 1: Firebase Auth (SÉCURISÉ - Production)
        if (firebaseOnline) {
            try {
                console.log('🔥 Authentification Firebase...');
                const userCredential = await auth.signInWithEmailAndPassword(email, password);
                const user = userCredential.user;
                
                console.log('✅ Firebase Auth réussi:', user.uid);
                
                // Récupérer le profil depuis Firestore
                const userDoc = await firestore.collection('users').doc(user.uid).get();
                if (userDoc.exists) {
                    const userData = { id: user.uid, ...userDoc.data() };
                    localStorage.setItem('currentUser', JSON.stringify(userData));
                    console.log('✅ Utilisateur Firebase chargé');
                    return userData;
                }
            } catch (error) {
                console.log('❌ Erreur Firebase Auth:', error.message);
                // Continuer avec le mode local
            }
        }
        
        // OPTION 2: Mode développement LOCAL (Sécurisé)
        console.log('🔄 Mode développement local');
        
        const localData = this.getLocalData();
        const users = localData.users || [];
        
        console.log('👥 Utilisateurs disponibles:', users.map(u => u.email));
        
        // Recherche de l'utilisateur
        const user = users.find(u => u.email === email);
        
        if (user) {
            // Vérification du mot de passe
            if (user.password === password) {
                console.log('✅ Connexion locale réussie');
                
                // 🔒 NE PAS sauvegarder le mot de passe dans la session
                const userSession = { ...user };
                delete userSession.password;
                
                localStorage.setItem('currentUser', JSON.stringify(userSession));
                return userSession;
            } else {
                console.log('❌ Mot de passe incorrect');
            }
        } else {
            console.log('❌ Utilisateur non trouvé');
        }
        
        return null;
    }

    async registerUser(userData) {
        const users = await this.get('users');
        
        // Vérification email unique
        if (users.find(u => u.email === userData.email)) {
            throw new Error('Cet email est déjà utilisé');
        }

        if (firebaseOnline) {
            try {
                // Créer l'utilisateur dans Firebase Auth
                const userCredential = await auth.createUserWithEmailAndPassword(
                    userData.email, 
                    userData.password
                );
                
                const user = userCredential.user;
                
                // Sauvegarder les données dans Firestore
                const newUser = {
                    ...userData,
                    id: user.uid,
                    role: 'user',
                    isVerified: false,
                    isBlocked: false,
                    hasPremium: false,
                    visitCount: 0,
                    lastVisit: new Date().toISOString(),
                    createdAt: new Date().toISOString(),
                    updatedAt: new Date().toISOString()
                };
                
                await firestore.collection('users').doc(user.uid).set(newUser);
                
                // Sauvegarder en localStorage pour la session
                localStorage.setItem('currentUser', JSON.stringify(newUser));
                return newUser;
                
            } catch (error) {
                console.warn('⚠️ Erreur Firebase register, fallback localStorage:', error);
                // Continuer avec localStorage
            }
        }

        // Fallback localStorage
        const newUser = {
            id: Date.now().toString(),
            ...userData,
            role: 'user',
            isVerified: false,
            isBlocked: false,
            hasPremium: false,
            visitCount: 0,
            lastVisit: new Date().toISOString(),
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString()
        };

        const localData = this.getLocalData();
        localData.users.push(newUser);
        this.saveLocalData(localData);

        // Sauvegarder en localStorage pour la session
        localStorage.setItem('currentUser', JSON.stringify(newUser));

        return newUser;
    }

    // ========== NOUVELLES FONCTIONS POUR GESTION PROFIL ==========
    
    // Fonction pour récupérer le profil utilisateur complet
    async getUserProfile(userId) {
        try {
            const users = await this.get('users');
            const user = users.find(u => u.id == userId);
            
            if (user) {
                // 🔒 NE PAS renvoyer le mot de passe
                const userProfile = { ...user };
                delete userProfile.password;
                return userProfile;
            }
            
            return null;
        } catch (error) {
            console.error('❌ Erreur récupération profil utilisateur:', error);
            return null;
        }
    }

    // Fonction pour mettre à jour le profil utilisateur
    async updateUserProfile(userId, profileData) {
        try {
            const users = await this.get('users');
            const userIndex = users.findIndex(u => u.id == userId);
            
            if (userIndex !== -1) {
                // Conserver les données sensibles existantes
                const existingUser = users[userIndex];
                const updatedUser = {
                    ...existingUser,
                    ...profileData,
                    updatedAt: new Date().toISOString()
                };
                
                // Mettre à jour dans la base
                await this.put('users', userId, updatedUser);
                
                // Mettre à jour l'utilisateur courant dans localStorage
                const currentUser = this.getCurrentUser();
                if (currentUser && currentUser.id == userId) {
                    const updatedCurrentUser = { ...currentUser, ...profileData };
                    localStorage.setItem('currentUser', JSON.stringify(updatedCurrentUser));
                }
                
                console.log('✅ Profil utilisateur mis à jour:', userId);
                return updatedUser;
            }
            
            throw new Error('Utilisateur non trouvé');
        } catch (error) {
            console.error('❌ Erreur mise à jour profil:', error);
            throw error;
        }
    }

    // Fonction pour changer le mot de passe
    async changeUserPassword(userId, currentPassword, newPassword) {
        try {
            const users = await this.get('users');
            const userIndex = users.findIndex(u => u.id == userId);
            
            if (userIndex !== -1) {
                const user = users[userIndex];
                
                // Vérifier l'ancien mot de passe
                if (user.password !== currentPassword) {
                    throw new Error('Mot de passe actuel incorrect');
                }
                
                // Mettre à jour le mot de passe
                const updatedUser = {
                    ...user,
                    password: newPassword,
                    updatedAt: new Date().toISOString()
                };
                
                await this.put('users', userId, updatedUser);
                
                console.log('✅ Mot de passe changé avec succès:', userId);
                return true;
            }
            
            throw new Error('Utilisateur non trouvé');
        } catch (error) {
            console.error('❌ Erreur changement mot de passe:', error);
            throw error;
        }
    }

    // Fonction pour vérifier si l'email est déjà utilisé (sauf par l'utilisateur courant)
    async isEmailAvailable(email, excludeUserId = null) {
        try {
            const users = await this.get('users');
            const existingUser = users.find(u => u.email === email && u.id != excludeUserId);
            return !existingUser;
        } catch (error) {
            console.error('❌ Erreur vérification email:', error);
            return false;
        }
    }

    async incrementUserVisit(userId) {
        const users = await this.get('users');
        const userIndex = users.findIndex(u => u.id == userId);
        
        if (userIndex !== -1) {
            const currentVisits = users[userIndex].visitCount || 0;
            users[userIndex].visitCount = currentVisits + 1;
            users[userIndex].lastVisit = new Date().toISOString();
            users[userIndex].updatedAt = new Date().toISOString();
            
            const localData = this.getLocalData();
            localData.users = users;
            this.saveLocalData(localData);
            
            // Sync avec Firebase
            if (firebaseOnline) {
                this.updateInFirebase('users', userId, {
                    visitCount: users[userIndex].visitCount,
                    lastVisit: users[userIndex].lastVisit,
                    updatedAt: users[userIndex].updatedAt
                });
            }
            
            return users[userIndex].visitCount;
        }
        return 0;
    }

    // ========== MÉTHODES UTILITAIRES ==========
    getLocalData() {
        try {
            const data = JSON.parse(localStorage.getItem(this.localStorageKey)) || {};
            return data;
        } catch (error) {
            console.error('❌ Erreur lecture localStorage:', error);
            return {};
        }
    }

    saveLocalData(data) {
        try {
            localStorage.setItem(this.localStorageKey, JSON.stringify(data));
        } catch (error) {
            console.error('❌ Erreur sauvegarde localStorage:', error);
        }
    }

    mergeArrays(localArray, firebaseArray) {
        if (!localArray || localArray.length === 0) return firebaseArray;
        if (!firebaseArray || firebaseArray.length === 0) return localArray;
        
        const merged = [...localArray];
        
        firebaseArray.forEach(fbItem => {
            const existingIndex = merged.findIndex(localItem => localItem.id === fbItem.id);
            if (existingIndex === -1) {
                merged.push(fbItem);
            } else {
                // Fusionner en gardant les données les plus récentes
                const localItem = merged[existingIndex];
                const localDate = new Date(localItem.updatedAt || localItem.createdAt);
                const fbDate = new Date(fbItem.updatedAt || fbItem.createdAt);
                
                if (fbDate > localDate) {
                    merged[existingIndex] = fbItem;
                }
            }
        });
        
        return merged;
    }

    // Récupérer l'utilisateur actuel
    getCurrentUser() {
        try {
            const userData = localStorage.getItem('currentUser');
            return userData ? JSON.parse(userData) : null;
        } catch (error) {
            console.error('❌ Erreur lecture utilisateur actuel:', error);
            return null;
        }
    }

    // Déconnexion
    logoutUser() {
        localStorage.removeItem('currentUser');
        if (firebaseOnline && auth) {
            auth.signOut().catch(error => {
                console.warn('⚠️ Erreur déconnexion Firebase:', error);
            });
        }
    }

    // Vérifier si l'utilisateur est admin
    isUserAdmin() {
        const user = this.getCurrentUser();
        return user && user.role === 'admin';
    }

    // Méthode pour vider le cache local (débogage)
    clearLocalData() {
        localStorage.removeItem(this.localStorageKey);
        localStorage.removeItem('currentUser');
        this.initializeLocalData();
        console.log('🗑️ Données locales réinitialisées');
    }

    // Statistiques globales
    async getStats() {
        try {
            const [
                users, 
                marketplace, 
                realestate, 
                jobs, 
                freelancers, 
                professionals
            ] = await Promise.all([
                this.get('users'),
                this.get('marketplace_posts'),
                this.get('realestate_posts'),
                this.get('job_posts'),
                this.get('freelancers'),
                this.get('professionals')
            ]);

            return {
                users: users.length,
                marketplace: marketplace.length,
                realestate: realestate.length,
                jobs: jobs.length,
                freelancers: freelancers.length,
                professionals: professionals.length,
                totalAnnounces: marketplace.length + realestate.length + jobs.length + freelancers.length + professionals.length
            };
        } catch (error) {
            console.error('Erreur calcul statistiques:', error);
            return {};
        }
    }
}

// ========== INITIALISATION ==========
const btpDB = new BTPDatabase();
window.btpDB = btpDB;

console.log('✅ database.js CORRIGÉ - Collections emploi AJOUTÉES avec données de démonstration');
// ========== GESTION AUTHENTIFICATION UNIFIÉE ET RENFORCÉE ==========
const authState = {
    currentUser: null,
    isAdmin: false,
    isAuthenticated: false
};

// Synchroniser avec appState existant
function syncAuthState() {
    if (typeof appState !== 'undefined') {
        appState.currentUser = authState.currentUser;
        appState.isAdmin = authState.isAdmin;
        appState.isAuthenticated = authState.isAuthenticated;
    }
    
    // Rafraîchir l'interface si l'application est initialisée
    if (typeof btpApp !== 'undefined' && btpApp.refreshAuthState) {
        btpApp.refreshAuthState();
    }
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
                showAlert('❌ Votre compte a été bloqué. Contactez le support.', 'error');
                return;
            }
            
            // Mettre à jour l'état global UNIFIÉ
            authState.currentUser = user;
            authState.isAdmin = user.role === 'admin';
            authState.isAuthenticated = true;
            syncAuthState();
            
            // ✅ SAUVEGARDE UNIFIÉE - UN SEUL POINT DE VÉRITÉ
            localStorage.setItem('btp_pro_user', JSON.stringify({
                id: user.id,
                email: user.email,
                prenom: user.prenom,
                nom: user.nom,
                role: user.role,
                isBlocked: user.isBlocked,
                phone: user.phone || '',
                company: user.company || '',
                address: user.address || '',
                city: user.city || '',
                postalCode: user.postalCode || ''
            }));
            
            // Sauvegarde de compatibilité
            if (authState.isAdmin) {
                localStorage.setItem('btp_pro_admin', 'true');
            } else {
                localStorage.removeItem('btp_pro_admin');
            }
            
            showAlert('✅ Connexion réussie !', 'success');
            
            // Fermer le modal
            const loginModal = bootstrap.Modal.getInstance(document.getElementById('loginModal'));
            if (loginModal) {
                loginModal.hide();
            }
            
            // Mettre à jour l'interface
            updateAuthUI();
            
            // Rediriger vers l'accueil
            setTimeout(() => {
                goToSection('home');
            }, 500);
            
        } else {
            showAlert('❌ Email ou mot de passe incorrect', 'error');
        }
        
    } catch (error) {
        console.error('Erreur connexion:', error);
        handleAuthError(error);
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
            prenom: prenom.trim(),
            nom: nom.trim(),
            email: email.toLowerCase().trim(),
            phone: phone?.trim() || '',
            password: password,
            role: 'user',
            isBlocked: false,
            createdAt: new Date().toISOString()
        };
        
        const newUser = await btpDB.registerUser(userData);
        
        // Mettre à jour l'état global UNIFIÉ
        authState.currentUser = newUser;
        authState.isAdmin = false;
        authState.isAuthenticated = true;
        syncAuthState();
        
        // ✅ SAUVEGARDE UNIFIÉE
        localStorage.setItem('btp_pro_user', JSON.stringify({
            id: newUser.id,
            email: newUser.email,
            prenom: newUser.prenom,
            nom: newUser.nom,
            role: newUser.role,
            isBlocked: newUser.isBlocked,
            phone: newUser.phone || '',
            company: newUser.company || '',
            address: newUser.address || '',
            city: newUser.city || '',
            postalCode: newUser.postalCode || ''
        }));
        
        // Nettoyer l'ancien système
        localStorage.removeItem('btp_pro_admin');
        
        showAlert('✅ Inscription réussie ! Bienvenue sur BTP Pro 🇲🇦', 'success');
        
        // Fermer le modal
        const registerModal = bootstrap.Modal.getInstance(document.getElementById('registerModal'));
        if (registerModal) {
            registerModal.hide();
        }
        
        // Mettre à jour l'interface
        updateAuthUI();
        
        // Rediriger vers l'accueil
        setTimeout(() => {
            goToSection('home');
        }, 1000);
        
    } catch (error) {
        console.error('Erreur inscription:', error);
        handleAuthError(error);
    } finally {
        showLoading(false);
    }
}

// ✅ FONCTION UNIFIÉE POUR LA PUBLICATION - VERSION RENFORCÉE
function checkAuthForPublish() {
    console.log('🔍 Vérification auth pour publication...');
    
    // Vérifier d'abord dans authState (source de vérité)
    if (authState.currentUser && authState.isAuthenticated) {
        console.log('✅ Utilisateur authentifié via authState');
        return true;
    }
    
    // Vérifier dans le localStorage unifié
    const savedUser = localStorage.getItem('btp_pro_user');
    if (savedUser) {
        try {
            const user = JSON.parse(savedUser);
            if (user && !user.isBlocked) {
                console.log('✅ Utilisateur restauré depuis localStorage');
                authState.currentUser = user;
                authState.isAdmin = user.role === 'admin';
                authState.isAuthenticated = true;
                syncAuthState();
                return true;
            }
        } catch (error) {
            console.error('❌ Erreur restauration utilisateur:', error);
        }
    }
    
    // Si aucun utilisateur trouvé
    console.log('❌ Aucun utilisateur authentifié');
    showAlert('🔐 Connectez-vous pour publier une annonce', 'warning');
    showLoginModal();
    return false;
}

// Version simplifiée de checkAuth
function checkAuth() {
    return authState.isAuthenticated && !!authState.currentUser;
}

// ✅ FONCTION DE VÉRIFICATION ADMIN RENFORCÉE
function checkAdminAccess() {
    if (!authState.currentUser) {
        console.warn('❌ Tentative d\'accès admin sans utilisateur connecté');
        showAlert('❌ Vous devez être connecté pour accéder à l\'administration', 'error');
        setTimeout(() => goToSection('home'), 1000);
        return false;
    }
    
    if (!authState.isAdmin) {
        console.warn('❌ Tentative d\'accès admin sans permission administrateur');
        showAlert('❌ Accès réservé aux administrateurs', 'error');
        setTimeout(() => goToSection('home'), 1000);
        return false;
    }
    
    return true;
}

function updateAuthUI() {
    const authButtons = document.getElementById('auth-buttons');
    const userMenu = document.getElementById('user-menu');
    const userName = document.getElementById('user-name');
    const userInitials = document.getElementById('user-initials');
    const adminBadge = document.getElementById('admin-badge');
    const adminNavItem = document.getElementById('admin-nav-item');
    const adminMenuItem = document.getElementById('admin-menu-item');
    const becomeProfessionalBtn = document.getElementById('becomeProfessionalBtn');
    
    console.log('🔄 Mise à jour interface auth:', authState);
    
    if (authState.currentUser && authState.isAuthenticated) {
        // Masquer boutons connexion, afficher menu utilisateur
        if (authButtons) {
            authButtons.style.display = 'none';
            authButtons.classList.add('d-none');
        }
        
        if (userMenu) {
            userMenu.style.display = 'flex';
            userMenu.classList.remove('d-none');
        }
        
        // Mettre à jour les infos utilisateur
        const fullName = `${authState.currentUser.prenom} ${authState.currentUser.nom}`;
        if (userName) userName.textContent = fullName;
        if (userInitials) {
            const initials = (authState.currentUser.prenom?.[0] || '') + (authState.currentUser.nom?.[0] || '');
            userInitials.textContent = initials.toUpperCase() || 'U';
        }
        
        // Gérer l'affichage admin
        if (authState.isAdmin) {
            if (adminBadge) {
                adminBadge.style.display = 'inline-block';
                adminBadge.classList.remove('d-none');
                adminBadge.textContent = 'ADMIN';
            }
            if (adminNavItem) {
                adminNavItem.style.display = 'block';
                adminNavItem.classList.remove('d-none');
            }
            if (adminMenuItem) {
                adminMenuItem.style.display = 'block';
                adminMenuItem.classList.remove('d-none');
            }
            localStorage.setItem('btp_pro_admin', 'true');
        } else {
            if (adminBadge) {
                adminBadge.style.display = 'none';
                adminBadge.classList.add('d-none');
            }
            if (adminNavItem) {
                adminNavItem.style.display = 'none';
                adminNavItem.classList.add('d-none');
            }
            if (adminMenuItem) {
                adminMenuItem.style.display = 'none';
                adminMenuItem.classList.add('d-none');
            }
            localStorage.removeItem('btp_pro_admin');
        }
        
        // Gérer le bouton "Devenir Professionnel"
        if (becomeProfessionalBtn) {
            becomeProfessionalBtn.style.display = authState.isAdmin ? 'none' : 'block';
        }
        
    } else {
        // Afficher les boutons de connexion
        if (authButtons) {
            authButtons.style.display = 'flex';
            authButtons.classList.remove('d-none');
        }
        
        // Masquer le menu utilisateur
        if (userMenu) {
            userMenu.style.display = 'none';
            userMenu.classList.add('d-none');
        }
        
        // Masquer tous les éléments admin
        const adminElements = [adminBadge, adminNavItem, adminMenuItem];
        adminElements.forEach(element => {
            if (element) {
                element.style.display = 'none';
                element.classList.add('d-none');
            }
        });
        
        // Afficher le bouton "Devenir Professionnel"
        if (becomeProfessionalBtn) {
            becomeProfessionalBtn.style.display = 'block';
        }
        
        // RÉINITIALISER COMPLÈTEMENT L'ÉTAT ADMIN
        authState.isAdmin = false;
        localStorage.removeItem('btp_pro_admin');
    }
}

// FONCTION DE DÉCONNEXION SIMPLIFIÉE ET RENFORCÉE
function logout() {
    console.log('🚪 Déconnexion en cours...');
    
    // Réinitialiser complètement les états
    authState.currentUser = null;
    authState.isAdmin = false;
    authState.isAuthenticated = false;
    syncAuthState();
    
    // ✅ NETTOYAGE COMPLET - UN SEUL POINT DE VÉRITÉ
    localStorage.removeItem('btp_pro_user');
    localStorage.removeItem('currentUser');
    localStorage.removeItem('btp_pro_admin');
    localStorage.removeItem('btp_pro_session');
    
    // Déconnexion Firebase si disponible
    if (typeof btpDB !== 'undefined' && btpDB.logoutUser) {
        btpDB.logoutUser();
    }
    
    // Mettre à jour l'interface
    updateAuthUI();
    
    showAlert('👋 Déconnexion réussie', 'success');
    
    // Rediriger vers l'accueil
    setTimeout(() => {
        goToSection('home');
    }, 500);
    
    console.log('✅ Session COMPLÈTEMENT réinitialisée et nettoyée');
}

// Initialiser l'authentification au chargement - VERSION RENFORCÉE
function initializeAuth() {
    console.log('🔐 Initialisation de l\'authentification RENFORCÉE...');
    
    const savedUser = localStorage.getItem('btp_pro_user');
    const adminFlag = localStorage.getItem('btp_pro_admin');
    
    console.log('📋 État initial RENFORCÉ:', {
        savedUser: !!savedUser,
        adminFlag: adminFlag
    });
    
    if (savedUser) {
        try {
            const user = JSON.parse(savedUser);
            
            if (user && !user.isBlocked) {
                authState.currentUser = user;
                authState.isAdmin = user.role === 'admin';
                authState.isAuthenticated = true;
                syncAuthState();
                
                console.log('✅ Utilisateur restauré:', user.email);
            } else {
                console.log('❌ Utilisateur bloqué ou invalide');
                logout();
            }
        } catch (error) {
            console.error('Erreur restauration utilisateur:', error);
            logout();
        }
    } else {
        // S'assurer que tout est réinitialisé
        authState.currentUser = null;
        authState.isAdmin = false;
        authState.isAuthenticated = false;
        syncAuthState();
    }
    
    updateAuthUI();
}

// Gestion des erreurs d'authentification
function handleAuthError(error) {
    if (error.message && error.message.includes('auth/')) {
        if (error.message.includes('auth/invalid-credential')) {
            showAlert('❌ Email ou mot de passe incorrect', 'error');
        } else if (error.message.includes('auth/email-already-in-use')) {
            showAlert('❌ Cet email est déjà utilisé', 'error');
        } else if (error.message.includes('auth/weak-password')) {
            showAlert('❌ Le mot de passe est trop faible', 'error');
        } else if (error.message.includes('auth/network-request-failed')) {
            showAlert('❌ Problème de connexion réseau. Vérifiez votre connexion internet.', 'error');
        } else {
            showAlert('❌ Erreur d\'authentification: ' + error.message, 'error');
        }
    } else if (error.message.includes('déjà utilisé')) {
        showAlert('❌ Cet email est déjà utilisé', 'error');
    } else {
        showAlert('❌ Erreur lors de l\'authentification', 'error');
    }
}

// ========== FONCTIONS MODALES ==========
function showLoginModal() {
    const loginModal = new bootstrap.Modal(document.getElementById('loginModal'));
    document.getElementById('loginEmail').value = '';
    document.getElementById('loginPassword').value = '';
    loginModal.show();
}

function showRegisterModal() {
    const registerModal = new bootstrap.Modal(document.getElementById('registerModal'));
    document.getElementById('registerPrenom').value = '';
    document.getElementById('registerNom').value = '';
    document.getElementById('registerEmail').value = '';
    document.getElementById('registerPhone').value = '';
    document.getElementById('registerPassword').value = '';
    document.getElementById('registerConfirmPassword').value = '';
    registerModal.show();
}

function switchToRegister() {
    const loginModal = bootstrap.Modal.getInstance(document.getElementById('loginModal'));
    const registerModal = new bootstrap.Modal(document.getElementById('registerModal'));
    if (loginModal) loginModal.hide();
    setTimeout(() => registerModal.show(), 300);
}

function switchToLogin() {
    const registerModal = bootstrap.Modal.getInstance(document.getElementById('registerModal'));
    const loginModal = new bootstrap.Modal(document.getElementById('loginModal'));
    if (registerModal) registerModal.hide();
    setTimeout(() => loginModal.show(), 300);
}

// ========== VALIDATION ==========
function validateEmail(email) {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
}

function validateEmailField(input) {
    const email = input.value;
    const errorDiv = document.getElementById('emailError');
    
    if (!validateEmail(email)) {
        input.classList.add('is-invalid');
        if (errorDiv) errorDiv.style.display = 'block';
        return false;
    } else {
        input.classList.remove('is-invalid');
        input.classList.add('is-valid');
        if (errorDiv) errorDiv.style.display = 'none';
        return true;
    }
}

// ========== FONCTIONS POUR GESTION PROFIL ==========
function showProfileModal() {
    if (!checkAuth()) {
        showAlert('🔐 Connectez-vous pour accéder à votre profil', 'warning');
        showLoginModal();
        return;
    }
    
    const profileModal = new bootstrap.Modal(document.getElementById('profileModal'));
    
    // Remplir le formulaire avec les données actuelles
    loadProfileData();
    
    profileModal.show();
}

// ✅ FONCTION saveProfile OPTIMISÉE
async function saveProfile(event) {
    event.preventDefault();
    
    if (!checkAuth()) return;
    
    const email = document.getElementById('profileEmail').value;
    const phone = document.getElementById('profilePhone').value;
    const company = document.getElementById('profileCompany').value;
    const address = document.getElementById('profileAddress').value;
    const city = document.getElementById('profileCity').value;
    const postalCode = document.getElementById('profilePostalCode').value;
    
    // Validation basique
    if (!email) {
        showAlert('❌ L\'email est obligatoire', 'error');
        return;
    }
    
    if (!validateEmail(email)) {
        showAlert('❌ Format d\'email invalide', 'error');
        return;
    }
    
    showLoading(true);
    
    try {
        const profileData = {
            email: email.trim(),
            phone: phone?.trim() || '',
            company: company?.trim() || '',
            address: address?.trim() || '',
            city: city?.trim() || '',
            postalCode: postalCode?.trim() || '',
            updatedAt: new Date().toISOString()
        };
        
        // Mettre à jour dans la base de données
        await btpDB.put('users', authState.currentUser.id, profileData);
        
        // Mettre à jour l'état local
        authState.currentUser = { ...authState.currentUser, ...profileData };
        localStorage.setItem('btp_pro_user', JSON.stringify(authState.currentUser));
        
        showAlert('✅ Profil mis à jour avec succès', 'success');
        
        // Fermer le modal après un délai
        setTimeout(() => {
            const profileModal = bootstrap.Modal.getInstance(document.getElementById('profileModal'));
            if (profileModal) {
                profileModal.hide();
            }
        }, 1000);
        
    } catch (error) {
        console.error('Erreur mise à jour profil:', error);
        showAlert('❌ Erreur lors de la mise à jour du profil', 'error');
    } finally {
        showLoading(false);
    }
}

// Fonction pour charger les données du profil
function loadProfileData() {
    if (!authState.currentUser) return;
    
    // Remplir les champs avec les données utilisateur
    document.getElementById('profileEmail').value = authState.currentUser.email || '';
    document.getElementById('profilePhone').value = authState.currentUser.phone || '';
    document.getElementById('profileCompany').value = authState.currentUser.company || '';
    document.getElementById('profileAddress').value = authState.currentUser.address || '';
    document.getElementById('profileCity').value = authState.currentUser.city || '';
    document.getElementById('profilePostalCode').value = authState.currentUser.postalCode || '';
}

// Fonction pour changer le mot de passe - VERSION AMÉLIORÉE
async function changePassword(event) {
    event.preventDefault();
    
    if (!checkAuth()) return;
    
    const currentPassword = document.getElementById('currentPassword').value;
    const newPassword = document.getElementById('newPassword').value;
    const confirmNewPassword = document.getElementById('confirmNewPassword').value;
    
    // Validation
    if (!currentPassword || !newPassword || !confirmNewPassword) {
        showAlert('❌ Veuillez remplir tous les champs', 'error');
        return;
    }
    
    if (newPassword !== confirmNewPassword) {
        showAlert('❌ Les nouveaux mots de passe ne correspondent pas', 'error');
        return;
    }
    
    if (newPassword.length < 6) {
        showAlert('❌ Le nouveau mot de passe doit contenir au moins 6 caractères', 'error');
        return;
    }
    
    // Vérifier l'ancien mot de passe (si stocké localement)
    if (authState.currentUser.password && authState.currentUser.password !== currentPassword) {
        showAlert('❌ Mot de passe actuel incorrect', 'error');
        return;
    }
    
    showLoading(true);
    
    try {
        // Mettre à jour le mot de passe
        await btpDB.put('users', authState.currentUser.id, {
            password: newPassword,
            updatedAt: new Date().toISOString()
        });
        
        // Mettre à jour l'état local
        authState.currentUser.password = newPassword;
        localStorage.setItem('btp_pro_user', JSON.stringify(authState.currentUser));
        
        showAlert('✅ Mot de passe changé avec succès', 'success');
        
        // Réinitialiser le formulaire
        document.getElementById('changePasswordForm').reset();
        
        // Fermer le modal après un délai
        setTimeout(() => {
            const passwordModal = bootstrap.Modal.getInstance(document.getElementById('changePasswordModal'));
            if (passwordModal) {
                passwordModal.hide();
            }
        }, 1000);
        
    } catch (error) {
        console.error('Erreur changement mot de passe:', error);
        showAlert('❌ Erreur lors du changement de mot de passe', 'error');
    } finally {
        showLoading(false);
    }
}

// Fonction pour afficher le modal de changement de mot de passe
function showChangePasswordModal() {
    if (!checkAuth()) {
        showAlert('🔐 Connectez-vous pour changer votre mot de passe', 'warning');
        showLoginModal();
        return;
    }
    
    const passwordModal = new bootstrap.Modal(document.getElementById('changePasswordModal'));
    
    // Réinitialiser le formulaire
    document.getElementById('currentPassword').value = '';
    document.getElementById('newPassword').value = '';
    document.getElementById('confirmNewPassword').value = '';
    
    passwordModal.show();
}

// ========== INITIALISATION RENFORCÉE ==========
document.addEventListener('DOMContentLoaded', function() {
    console.log('🚀 Initialisation de l\'authentification UNIFIÉE RENFORCÉE...');
    initializeAuth();
    initializeAuthEventListeners();
});

function initializeAuthEventListeners() {
    // Écouteurs pour les formulaires
    const profileForm = document.getElementById('profileForm');
    if (profileForm) {
        profileForm.addEventListener('submit', saveProfile);
    }
    
    const changePasswordForm = document.getElementById('changePasswordForm');
    if (changePasswordForm) {
        changePasswordForm.addEventListener('submit', changePassword);
    }
    
    // Validation email en temps réel
    const emailFields = document.querySelectorAll('input[type="email"]');
    emailFields.forEach(field => {
        field.addEventListener('blur', function() {
            validateEmailField(this);
        });
    });
}

// ========== EXPORT DES FONCTIONS ==========
window.handleLogin = handleLogin;
window.handleRegister = handleRegister;
window.updateAuthUI = updateAuthUI;
window.logout = logout;
window.showLoginModal = showLoginModal;
window.showRegisterModal = showRegisterModal;
window.switchToRegister = switchToRegister;
window.switchToLogin = switchToLogin;
window.checkAuth = checkAuth;
window.checkAuthForPublish = checkAuthForPublish;
window.checkAdminAccess = checkAdminAccess;
window.validateEmail = validateEmail;
window.validateEmailField = validateEmailField;

// ✅ EXPORT DES FONCTIONS PROFIL
window.showProfileModal = showProfileModal;
window.showChangePasswordModal = showChangePasswordModal;
window.saveProfile = saveProfile;
window.changePassword = changePassword;
window.loadProfileData = loadProfileData;

console.log('✅ auth.js CORRIGÉ - Compatible avec la nouvelle structure modulaire');
// ========== JOBS-UI.JS - GESTION DE L'INTERFACE UTILISATEUR EMPLOI ==========

const JobsUI = {
    // ========== AFFICHAGE DES OFFRES D'EMPLOI ==========
    
    displayJobsPosts(posts) {
        const container = document.getElementById('jobs-container');
        
        if (!container) {
            console.warn('❌ Container jobs non trouvé');
            return;
        }
        
        if (!posts || posts.length === 0) {
            container.innerHTML = `
                <div class="col-12 text-center py-5">
                    <i class="fas fa-search fa-3x text-muted mb-3"></i>
                    <p class="text-muted">Aucune offre d\'emploi trouvée</p>
                    <p class="text-muted small">Essayez de modifier vos critères de recherche</p>
                    <button class="btn btn-warning" onclick="clearJobsFilters()">
                        <i class="fas fa-times me-2"></i>Effacer les filtres
                    </button>
                </div>
            `;
            return;
        }
        
        let html = '';
        posts.forEach((post, index) => {
            if (!post || !post.id) return;
            
            const isFavorite = this.isInFavorites(post.id, 'jobs');
            const favoriteBtnClass = isFavorite ? 'text-danger' : 'text-muted';
            const favoriteIcon = isFavorite ? 'fas' : 'far';
            
            const applicationCount = JobsData.getApplicationCountForJob ? 
                JobsData.getApplicationCountForJob(post.id) : 0;
            
            const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
            const phoneDisplay = isMobile && post.phone ? 
                `<a href="tel:${post.phone}" class="btn btn-sm btn-outline-success">
                    <i class="fas fa-phone me-1"></i>Appeler
                </a>` : 
                `<small class="text-muted">${post.phone || 'Non précisé'}</small>`;
            
            html += `
            <div class="col-md-6 col-lg-4 mb-4">
                <div class="card h-100 job-card">
                    <div class="position-relative">
                        <div class="card-img-top bg-light d-flex align-items-center justify-content-center" style="height: 120px;">
                            <i class="fas fa-briefcase fa-2x text-warning"></i>
                        </div>
                        <button class="btn btn-sm btn-light favorite-btn ${favoriteBtnClass}" 
                                onclick="JobsUI.toggleFavorite('${post.id}', 'jobs')"
                                title="${isFavorite ? 'Retirer des favoris' : 'Ajouter aux favoris'}">
                            <i class="${favoriteIcon} fa-heart"></i>
                        </button>
                        ${post.isPremium ? `
                        <div class="position-absolute top-0 start-0 m-2">
                            <span class="badge bg-warning">⭐ Premium</span>
                        </div>
                        ` : ''}
                    </div>
                    <div class="card-body d-flex flex-column">
                        <h5 class="card-title">${post.poste || 'Poste non spécifié'}</h5>
                        <p class="card-text text-muted flex-grow-1">${post.description ? this.truncateText(post.description, 100) : 'Aucune description disponible'}...</p>
                        
                        <div class="mb-3">
                            <span class="badge bg-warning">${getContractLabel(post.contrat)}</span>
                            <span class="badge bg-secondary ms-1">${post.ville || 'Non spécifié'}</span>
                            ${applicationCount > 0 ? `
                            <span class="badge bg-success ms-1" title="${applicationCount} candidature(s)">
                                📬 ${applicationCount}
                            </span>
                            ` : ''}
                        </div>
                        
                        <div class="d-flex justify-content-between align-items-center mt-auto">
                            <div>
                                <strong class="text-primary">${post.salaire || 'Salaire non précisé'}</strong>
                            </div>
                            <small class="text-muted">${this.formatDate(post.createdAt)}</small>
                        </div>
                        
                        <div class="mt-2">
                            <i class="fas fa-phone text-muted me-1"></i>
                            ${phoneDisplay}
                        </div>
                        
                        ${post.experience ? `
                        <div class="mt-2">
                            <i class="fas fa-briefcase text-muted me-1"></i>
                            <small class="text-muted">${post.experience}</small>
                        </div>
                        ` : ''}
                        
                        ${authState.currentUser && (authState.isAdmin || post.userId === authState.currentUser.id) && applicationCount > 0 ? `
                        <div class="candidatures-section mt-3 p-2 bg-light rounded">
                            <div class="d-flex justify-content-between align-items-center">
                                <div>
                                    <i class="fas fa-users text-success me-2"></i>
                                    <strong>${applicationCount} candidature(s)</strong>
                                </div>
                                <button class="btn btn-success btn-sm" onclick="viewJobApplications('${post.id}')">
                                    <i class="fas fa-eye me-1"></i>Voir
                                </button>
                            </div>
                        </div>
                        ` : ''}
                    </div>
                    <div class="card-footer bg-transparent">
                        <div class="d-flex gap-2">
                            <button class="btn btn-warning btn-sm flex-grow-1" onclick="showJobApplicationForm('${post.id}')">
                                <i class="fas fa-paper-plane me-1"></i>Postuler
                            </button>
                            ${this.addRatingButtonToJobCard(post)}
                        </div>
                        
                        ${authState.currentUser && (authState.isAdmin || post.userId === authState.currentUser.id) ? `
                        <div class="admin-actions mt-2 pt-2 border-top">
                            <div class="btn-group btn-group-sm w-100">
                                <button class="btn btn-outline-warning btn-sm" onclick="toggleAnnounceStatus('${post.id}', 'jobs', '${post.status === 'en_pause' ? 'approuve' : 'en_pause'}')" 
                                        title="${post.status === 'en_pause' ? 'Activer' : 'Mettre en pause'}">
                                    <i class="fas fa-${post.status === 'en_pause' ? 'play' : 'pause'}"></i>
                                </button>
                                <button class="btn btn-outline-info btn-sm" onclick="togglePremium('${post.id}', 'jobs', ${!post.isPremium})" 
                                        title="${post.isPremium ? 'Retirer premium' : 'Mettre en avant'}">
                                    <i class="fas fa-${post.isPremium ? 'star' : 'crown'}"></i>
                                </button>
                                <button class="btn btn-outline-danger btn-sm" onclick="deleteAnnounce('${post.id}', 'jobs')" title="Supprimer">
                                    <i class="fas fa-trash"></i>
                                </button>
                            </div>
                        </div>
                        ` : ''}
                    </div>
                </div>
            </div>`;
        });
        
        container.innerHTML = html;
        console.log(`✅ ${posts.length} offres d\'emploi affichées`);
    },

    // ========== SYSTÈME DE NOTATION ==========
    
    showJobRatingForm(jobId, employerId) {
        if (!authState.currentUser) {
            showAlert('🔐 Connectez-vous pour laisser un avis', 'warning');
            showLoginModal();
            return;
        }

        JobsData.checkIfUserAppliedToJob(jobId, authState.currentUser.id).then(hasApplied => {
            if (!hasApplied && !authState.isAdmin) {
                showAlert('❌ Vous devez avoir postulé à cette offre pour pouvoir laisser un avis', 'warning');
                return;
            }
            this.showJobRatingModal(jobId, employerId);
        });
    },

    showJobRatingModal(jobId, employerId) {
        const modalHTML = `
            <div class="modal fade" id="jobRatingModal" tabindex="-1">
                <div class="modal-dialog modal-lg">
                    <div class="modal-content">
                        <div class="modal-header bg-warning text-white">
                            <h5 class="modal-title">
                                <i class="fas fa-star me-2"></i>Noter cette expérience
                            </h5>
                            <button type="button" class="btn-close" data-bs-dismiss="modal"></button>
                        </div>
                        <div class="modal-body">
                            <form id="jobRatingForm" onsubmit="JobsUI.submitJobRating(event, '${jobId}', '${employerId}')">
                                <div class="mb-4 text-center">
                                    <label class="form-label fw-bold">Note globale *</label>
                                    <div class="rating-stars mb-2" id="globalRating">
                                        ${[1,2,3,4,5].map(star => `
                                            <i class="fas fa-star fa-2x rating-star" data-rating="${star}" 
                                               onmouseover="JobsUI.highlightStars(${star})" 
                                               onmouseout="JobsUI.resetStars()"
                                               onclick="JobsUI.setRating(${star})"></i>
                                        `).join('')}
                                    </div>
                                    <input type="hidden" name="rating" id="selectedRating" required>
                                    <div id="ratingText" class="text-muted small">Cliquez sur les étoiles</div>
                                </div>

                                <div class="row mb-4">
                                    <div class="col-md-6">
                                        <label class="form-label">Clarté de l'offre</label>
                                        <div class="category-rating">
                                            ${[1,2,3,4,5].map(star => `
                                                <i class="fas fa-star category-star" data-category="clarity" data-rating="${star}"
                                                   onclick="JobsUI.setCategoryRating('clarity', ${star})"></i>
                                            `).join('')}
                                        </div>
                                    </div>
                                    <div class="col-md-6">
                                        <label class="form-label">Processus de recrutement</label>
                                        <div class="category-rating">
                                            ${[1,2,3,4,5].map(star => `
                                                <i class="fas fa-star category-star" data-category="process" data-rating="${star}"
                                                   onclick="JobsUI.setCategoryRating('process', ${star})"></i>
                                            `).join('')}
                                        </div>
                                    </div>
                                </div>

                                <div class="row mb-4">
                                    <div class="col-md-6">
                                        <label class="form-label">Communication</label>
                                        <div class="category-rating">
                                            ${[1,2,3,4,5].map(star => `
                                                <i class="fas fa-star category-star" data-category="communication" data-rating="${star}"
                                                   onclick="JobsUI.setCategoryRating('communication', ${star})"></i>
                                            `).join('')}
                                        </div>
                                    </div>
                                    <div class="col-md-6">
                                        <label class="form-label">Respect des délais</label>
                                        <div class="category-rating">
                                            ${[1,2,3,4,5].map(star => `
                                                <i class="fas fa-star category-star" data-category="timing" data-rating="${star}"
                                                   onclick="JobsUI.setCategoryRating('timing', ${star})"></i>
                                            `).join('')}
                                        </div>
                                    </div>
                                </div>

                                <div class="mb-3">
                                    <label class="form-label">Votre avis détaillé *</label>
                                    <textarea class="form-control" name="comment" rows="4" 
                                              placeholder="Partagez votre expérience avec ce recruteur... (minimum 20 caractères)"
                                              required minlength="20"></textarea>
                                </div>

                                <div class="mb-3">
                                    <label class="form-label">Type d'expérience</label>
                                    <select class="form-select" name="experience_type" required>
                                        <option value="">Choisir...</option>
                                        <option value="entretien">Entretien uniquement</option>
                                        <option value="candidature">Candidature déposée</option>
                                        <option value="embauche">Embauche effective</option>
                                        <option value="stage">Stage/Alternance</option>
                                    </select>
                                </div>

                                <div class="form-check mb-3">
                                    <input class="form-check-input" type="checkbox" name="is_anonymous" id="anonymousCheck">
                                    <label class="form-check-label" for="anonymousCheck">
                                        Publier cet avis de manière anonyme
                                    </label>
                                </div>

                                <div class="alert alert-info">
                                    <i class="fas fa-info-circle me-2"></i>
                                    Votre avis aidera d'autres professionnels du BTP à identifier les meilleures opportunités.
                                </div>

                                <div class="d-flex gap-2">
                                    <button type="submit" class="btn btn-warning flex-grow-1">
                                        <i class="fas fa-paper-plane me-2"></i>Publier mon avis
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
        `;

        const existingModal = document.getElementById('jobRatingModal');
        if (existingModal) existingModal.remove();

        document.body.insertAdjacentHTML('beforeend', modalHTML);
        
        const modal = new bootstrap.Modal(document.getElementById('jobRatingModal'));
        modal.show();

        this.initializeRatingStars();
    },

    // ========== GESTION DES ÉTOILES DE NOTATION ==========
    
    initializeRatingStars() {
        window.currentRating = 0;
        window.categoryRatings = {
            clarity: 0,
            process: 0,
            communication: 0,
            timing: 0
        };
    },

    highlightStars(rating) {
        const stars = document.querySelectorAll('#globalRating .rating-star');
        stars.forEach((star, index) => {
            if (index < rating) {
                star.classList.add('text-warning');
                star.classList.remove('text-muted');
            } else {
                star.classList.remove('text-warning');
                star.classList.add('text-muted');
            }
        });
    },

    resetStars() {
        const stars = document.querySelectorAll('#globalRating .rating-star');
        stars.forEach((star, index) => {
            if (index < window.currentRating) {
                star.classList.add('text-warning');
                star.classList.remove('text-muted');
            } else {
                star.classList.remove('text-warning');
                star.classList.add('text-muted');
            }
        });
    },

    setRating(rating) {
        window.currentRating = rating;
        document.getElementById('selectedRating').value = rating;
        
        const ratingText = document.getElementById('ratingText');
        const texts = {
            1: 'Médiocre - Très déçu',
            2: 'Passable - Peu satisfait', 
            3: 'Moyen - Correct',
            4: 'Bon - Satisfait',
            5: 'Excellent - Très satisfait'
        };
        ratingText.textContent = texts[rating] || 'Cliquez sur les étoiles';
        ratingText.className = 'small ' + (rating >= 4 ? 'text-success' : rating >= 3 ? 'text-warning' : 'text-danger');
        
        this.resetStars();
    },

    setCategoryRating(category, rating) {
        window.categoryRatings[category] = rating;
        
        const stars = document.querySelectorAll(`.category-star[data-category="${category}"]`);
        stars.forEach((star, index) => {
            if (index < rating) {
                star.classList.add('text-warning');
                star.classList.remove('text-muted');
            } else {
                star.classList.remove('text-warning');
                star.classList.add('text-muted');
            }
        });
    },

    async submitJobRating(event, jobId, employerId) {
        event.preventDefault();
        
        const form = event.target;
        const formData = new FormData(form);
        const rating = parseInt(document.getElementById('selectedRating').value);

        if (rating === 0) {
            showAlert('❌ Veuillez donner une note globale', 'error');
            return;
        }

        // Vérifier que toutes les catégories sont notées
        const missingCategories = Object.keys(window.categoryRatings).filter(cat => window.categoryRatings[cat] === 0);
        if (missingCategories.length > 0) {
            showAlert('❌ Veuillez noter toutes les catégories', 'error');
            return;
        }

        showLoading(true);

        try {
            const ratingData = {
                jobId: jobId,
                employerId: employerId,
                reviewerId: authState.currentUser.id,
                reviewerName: formData.get('is_anonymous') ? 'Anonyme' : `${authState.currentUser.prenom} ${authState.currentUser.nom}`,
                reviewerEmail: authState.currentUser.email,
                rating: rating,
                categoryRatings: window.categoryRatings,
                comment: formData.get('comment').trim(),
                experienceType: formData.get('experience_type'),
                isAnonymous: formData.get('is_anonymous') === 'on',
                status: 'en_attente', // Modération des avis
                createdAt: new Date().toISOString(),
                updatedAt: new Date().toISOString()
            };

            await JobsData.createRating(ratingData);

            // Mettre à jour la note moyenne du recruteur
            await JobsData.updateEmployerRating(employerId);

            showAlert('✅ Votre avis a été soumis avec succès ! Il sera visible après modération.', 'success');

            const modal = bootstrap.Modal.getInstance(document.getElementById('jobRatingModal'));
            if (modal) modal.hide();

            // Recharger les avis
            this.loadJobRatings(jobId);

        } catch (error) {
            console.error('❌ Erreur soumission avis:', error);
            showAlert('❌ Erreur lors de la soumission de votre avis', 'error');
        } finally {
            showLoading(false);
        }
    },

    // ========== AFFICHAGE DES AVIS ==========
    
    async loadJobRatings(jobId) {
        try {
            const ratings = await JobsData.getRatingsForJob(jobId);
            this.displayJobRatings(ratings);
        } catch (error) {
            console.error('Erreur chargement avis:', error);
        }
    },

    displayJobRatings(ratings) {
        const container = document.getElementById('jobRatingsContainer');
        if (!container) return;

        if (!ratings || ratings.length === 0) {
            container.innerHTML = `
                <div class="text-center py-4">
                    <i class="fas fa-star fa-2x text-muted mb-3"></i>
                    <p class="text-muted">Aucun avis pour le moment</p>
                    <p class="text-muted small">Soyez le premier à partager votre expérience</p>
                </div>
            `;
            return;
        }

        // Calculer la note moyenne
        const averageRating = ratings.reduce((sum, rating) => sum + rating.rating, 0) / ratings.length;

        let html = `
            <div class="rating-summary mb-4 p-4 bg-light rounded">
                <div class="row align-items-center">
                    <div class="col-md-4 text-center">
                        <div class="display-4 fw-bold text-warning">${averageRating.toFixed(1)}</div>
                        <div class="mb-2">
                            ${this.generateStarRating(averageRating)}
                        </div>
                        <div class="text-muted small">${ratings.length} avis</div>
                    </div>
                    <div class="col-md-8">
                        ${this.generateRatingDistribution(ratings)}
                    </div>
                </div>
            </div>

            <div class="ratings-list">
                <h5 class="mb-3">Avis des candidats</h5>
        `;

        ratings.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
              .forEach(rating => {
            html += `
                <div class="rating-item border-bottom pb-3 mb-3">
                    <div class="d-flex justify-content-between align-items-start mb-2">
                        <div>
                            <strong>${rating.reviewerName}</strong>
                            <span class="badge bg-secondary ms-2">${this.getExperienceTypeLabel(rating.experienceType)}</span>
                        </div>
                        <small class="text-muted">${this.formatDate(rating.createdAt)}</small>
                    </div>
                    
                    <div class="mb-2">
                        ${this.generateStarRating(rating.rating)}
                    </div>

                    <div class="category-ratings mb-2">
                        <div class="row small text-muted">
                            <div class="col-6">Clarté: ${this.generateSmallStars(rating.categoryRatings.clarity)}</div>
                            <div class="col-6">Processus: ${this.generateSmallStars(rating.categoryRatings.process)}</div>
                            <div class="col-6">Communication: ${this.generateSmallStars(rating.categoryRatings.communication)}</div>
                            <div class="col-6">Délais: ${this.generateSmallStars(rating.categoryRatings.timing)}</div>
                        </div>
                    </div>

                    <p class="mb-0">${rating.comment}</p>
                </div>
            `;
        });

        html += `</div>`;
        container.innerHTML = html;
    },

    // ========== FONCTIONS UTILITAIRES POUR L'INTERFACE ==========
    
    generateRatingDistribution(ratings) {
        const distribution = {5: 0, 4: 0, 3: 0, 2: 0, 1: 0};
        
        ratings.forEach(rating => {
            distribution[rating.rating]++;
        });

        let html = '';
        [5,4,3,2,1].forEach(stars => {
            const count = distribution[stars];
            const percentage = ratings.length > 0 ? (count / ratings.length) * 100 : 0;
            
            html += `
                <div class="rating-bar mb-2">
                    <div class="d-flex justify-content-between align-items-center">
                        <span class="small">${stars} étoiles</span>
                        <div class="progress flex-grow-1 mx-2" style="height: 8px;">
                            <div class="progress-bar bg-warning" style="width: ${percentage}%"></div>
                        </div>
                        <span class="small text-muted">${count}</span>
                    </div>
                </div>
            `;
        });

        return html;
    },

    generateStarRating(rating) {
        let html = '';
        for (let i = 1; i <= 5; i++) {
            if (i <= Math.floor(rating)) {
                html += '<i class="fas fa-star text-warning"></i>';
            } else if (i === Math.ceil(rating) && rating % 1 !== 0) {
                html += '<i class="fas fa-star-half-alt text-warning"></i>';
            } else {
                html += '<i class="far fa-star text-warning"></i>';
            }
        }
        return html;
    },

    generateSmallStars(rating) {
        let html = '';
        for (let i = 1; i <= 5; i++) {
            html += i <= rating ? 
                '<i class="fas fa-star text-warning small"></i>' : 
                '<i class="far fa-star text-warning small"></i>';
        }
        return html;
    },

    getExperienceTypeLabel(type) {
        const labels = {
            'entretien': 'Entretien',
            'candidature': 'Candidature',
            'embauche': 'Embauche',
            'stage': 'Stage/Alternance'
        };
        return labels[type] || type;
    },

    addRatingButtonToJobCard(post) {
        if (!authState.currentUser || authState.currentUser.id === post.userId) {
            return ''; // Ne pas afficher pour le propriétaire ou non connecté
        }

        return `
            <button class="btn btn-outline-warning btn-sm mt-2" 
                    onclick="showJobRatingForm('${post.id}', '${post.userId}')"
                    title="Noter cette offre">
                <i class="fas fa-star me-1"></i>Noter
            </button>
        `;
    },

    // ========== FONCTIONS UTILITAIRES GÉNÉRALES ==========
    
    isInFavorites(itemId, type) {
        // Fonction de compatibilité avec l'ancien système
        try {
            const favorites = JSON.parse(localStorage.getItem('btp_pro_favorites')) || {};
            return favorites[type] && favorites[type].includes(itemId);
        } catch (error) {
            return false;
        }
    },

    toggleFavorite(itemId, type) {
        // Fonction de compatibilité avec l'ancien système
        try {
            const favorites = JSON.parse(localStorage.getItem('btp_pro_favorites')) || {};
            if (!favorites[type]) favorites[type] = [];
            
            const index = favorites[type].indexOf(itemId);
            if (index > -1) {
                favorites[type].splice(index, 1);
                showAlert('❤️ Retiré des favoris', 'info');
            } else {
                favorites[type].push(itemId);
                showAlert('❤️ Ajouté aux favoris', 'success');
            }
            
            localStorage.setItem('btp_pro_favorites', JSON.stringify(favorites));
            
            // Recharger l'affichage
            if (typeof loadJobsAnnounces === 'function') {
                loadJobsAnnounces();
            }
        } catch (error) {
            console.error('Erreur gestion favoris:', error);
        }
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
            year: 'numeric'
        });
    }
};

// Export global
window.JobsUI = JobsUI;
console.log('✅ jobs-ui.js CHARGÉ - Module interface utilisateur initialisé');
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
// ========== JOBS.JS - FICHIER PRINCIPAL RESTRUCTURÉ ==========
// Coordinateur principal - Importe et orchestre tous les modules jobs

let isLoadingJobs = false;

// Importation des fonctions des modules (sera géré par les imports HTML)
// Les fonctions sont accessibles via window.* après chargement des scripts

async function loadJobsAnnounces() {
    if (isLoadingJobs) {
        console.log('⏳ Chargement déjà en cours...');
        return;
    }
    
    console.log('💼 Chargement des offres d\'emploi...');
    isLoadingJobs = true;
    
    try {
        const posts = await btpDB.get('job_posts');
        console.log('📊 Offres d\'emploi récupérées:', posts?.length || 0);
        
        const container = document.getElementById('jobs-container');
        
        if (!container) {
            console.warn('❌ Container jobs non trouvé');
            isLoadingJobs = false;
            return;
        }
        
        if (!posts || !Array.isArray(posts)) {
            console.error('❌ Données posts invalides:', posts);
            container.innerHTML = `
                <div class="col-12 text-center py-5">
                    <i class="fas fa-exclamation-triangle fa-3x text-danger mb-3"></i>
                    <h5 class="text-danger">Erreur de chargement des données</h5>
                    <button class="btn btn-warning btn-sm" onclick="loadJobsAnnounces()">
                        <i class="fas fa-redo me-1"></i>Réessayer
                    </button>
                </div>
            `;
            isLoadingJobs = false;
            return;
        }
        
        if (posts.length === 0) {
            container.innerHTML = `
                <div class="col-12 text-center py-5">
                    <i class="fas fa-briefcase fa-3x text-muted mb-3"></i>
                    <h5 class="text-muted">Aucune offre d\'emploi disponible</h5>
                    <p class="text-muted">Soyez le premier à publier une offre !</p>
                    <button class="btn btn-warning" onclick="goToSection('publish')">
                        <i class="fas fa-plus me-2"></i>Publier la première offre
                    </button>
                </div>
            `;
            isLoadingJobs = false;
            return;
        }
        
        const approvedPosts = posts.filter(post => 
            post && (post.status === 'approuve' || post.status === 'approved' || !post.status)
        );
        
        console.log('✅ Offres d\'emploi approuvées:', approvedPosts.length);
        
        if (approvedPosts.length === 0) {
            container.innerHTML = `
                <div class="col-12 text-center py-5">
                    <i class="fas fa-briefcase fa-3x text-muted mb-3"></i>
                    <h5 class="text-muted">Aucune offre d\'emploi disponible</h5>
                    <p class="text-muted">Toutes les offres sont en attente de modération</p>
                    <button class="btn btn-warning" onclick="goToSection('publish')">
                        <i class="fas fa-plus me-2"></i>Publier une offre
                    </button>
                </div>
            `;
            isLoadingJobs = false;
            return;
        }
        
        initializeJobsFilters(approvedPosts);
        
        if (typeof setupPagination === 'function') {
            setupPagination('jobs-container', approvedPosts, displayJobsPosts);
            console.log(`✅ ${approvedPosts.length} offres chargées avec pagination`);
        } else {
            displayJobsPosts(approvedPosts);
        }
        
    } catch (error) {
        console.error('❌ Erreur chargement emplois:', error);
        const container = document.getElementById('jobs-container');
        if (container) {
            container.innerHTML = `
                <div class="col-12 text-center">
                    <p class="text-danger">
                        <i class="fas fa-exclamation-triangle me-2"></i>
                        Erreur lors du chargement des offres
                    </p>
                    <button class="btn btn-warning btn-sm" onclick="loadJobsAnnounces()">
                        <i class="fas fa-redo me-1"></i>Réessayer
                    </button>
                </div>
            `;
        }
    } finally {
        isLoadingJobs = false;
        console.log('✅ Chargement des emplois terminé');
    }
}

function initializeJobsFilters(posts) {
    if (!posts || !Array.isArray(posts)) return;
    
    const contractTypes = [...new Set(posts.map(p => p?.contrat).filter(Boolean))];
    const cities = [...new Set(posts.map(p => p?.ville).filter(Boolean))];
    
    const contractFilter = document.getElementById('jobTypeFilter');
    if (contractFilter) {
        const firstChild = contractFilter.firstElementChild;
        contractFilter.innerHTML = '';
        if (firstChild) contractFilter.appendChild(firstChild);
        
        contractTypes.forEach(contract => {
            const option = document.createElement('option');
            option.value = contract;
            option.textContent = getContractLabel(contract);
            contractFilter.appendChild(option);
        });
    }
    
    const cityFilter = document.getElementById('jobCityFilter');
    if (cityFilter) {
        const firstChild = cityFilter.firstElementChild;
        cityFilter.innerHTML = '';
        if (firstChild) cityFilter.appendChild(firstChild);
        
        cities.forEach(city => {
            const option = document.createElement('option');
            option.value = city;
            option.textContent = city;
            cityFilter.appendChild(option);
        });
    }
}

async function filterJobs() {
    if (isLoadingJobs) return;
    
    console.log('🔍 Filtrage des offres d\'emploi...');
    
    try {
        const type = document.getElementById('jobTypeFilter')?.value;
        const city = document.getElementById('jobCityFilter')?.value;
        const experience = document.getElementById('jobExperienceFilter')?.value;
        const sort = document.getElementById('jobSort')?.value;
        
        const posts = await btpDB.get('job_posts');
        let filteredPosts = posts.filter(post => {
            if (!post) return false;
            if (type && post.contrat !== type) return false;
            if (city && post.ville !== city) return false;
            if (experience && !checkExperienceMatch(post.experience, experience)) return false;
            return post.status === 'approuve' || post.status === 'approved' || !post.status;
        });
        
        switch(sort) {
            case 'premium':
                filteredPosts.sort((a, b) => (b.isPremium ? 1 : 0) - (a.isPremium ? 1 : 0));
                break;
            default:
                filteredPosts.sort((a, b) => new Date(b.createdAt || 0) - new Date(a.createdAt || 0));
        }
        
        if (typeof setupPagination === 'function') {
            setupPagination('jobs-container', filteredPosts, displayJobsPosts);
        } else {
            displayJobsPosts(filteredPosts);
        }
        
    } catch (error) {
        console.error('❌ Erreur filtrage emplois:', error);
        showAlert('❌ Erreur lors du filtrage', 'error');
    }
}

function clearJobsFilters() {
    document.getElementById('jobTypeFilter').value = '';
    document.getElementById('jobCityFilter').value = '';
    document.getElementById('jobExperienceFilter').value = '';
    document.getElementById('jobSort').value = 'newest';
    filterJobs();
}

// ========== FONCTIONS UTILITAIRES ==========
function getContractLabel(contractType) {
    const contracts = {
        'cdi': 'CDI',
        'cdd': 'CDD',
        'freelance': 'Freelance',
        'stage': 'Stage',
        'alternance': 'Alternance',
        'interim': 'Intérim'
    };
    return contracts[contractType] || contractType;
}

function checkExperienceMatch(postExperience, filterExperience) {
    if (!postExperience || !filterExperience) return true;
    
    const postExp = extractYearsFromExperience(postExperience);
    const [minFilter, maxFilter] = filterExperience.split('-').map(exp => {
        const value = parseInt(exp.replace('+', ''));
        return isNaN(value) ? 0 : value;
    });
    
    if (filterExperience.endsWith('+')) {
        return postExp >= minFilter;
    } else if (maxFilter) {
        return postExp >= minFilter && postExp <= maxFilter;
    }
    
    return true;
}

function extractYearsFromExperience(experienceText) {
    if (!experienceText) return 0;
    const matches = experienceText.match(/\d+/g);
    return matches && matches.length > 0 ? parseInt(matches[0]) : 0;
}

// ========== COORDINATION DES MODULES ==========

// Ces fonctions délègent aux modules spécialisés
function displayJobsPosts(posts) {
    if (typeof JobsUI !== 'undefined' && JobsUI.displayJobsPosts) {
        JobsUI.displayJobsPosts(posts);
    } else {
        console.error('❌ Module JobsUI non chargé');
    }
}

function showJobApplicationForm(jobId) {
    if (typeof JobsForms !== 'undefined' && JobsForms.showJobApplicationForm) {
        JobsForms.showJobApplicationForm(jobId);
    } else {
        console.error('❌ Module JobsForms non chargé');
    }
}

function handlePublishJob(event) {
    if (typeof JobsForms !== 'undefined' && JobsForms.handlePublishJob) {
        JobsForms.handlePublishJob(event);
    } else {
        console.error('❌ Module JobsForms non chargé');
    }
}

function loadJobApplications() {
    if (typeof JobsApplications !== 'undefined' && JobsApplications.loadJobApplications) {
        JobsApplications.loadJobApplications();
    } else {
        console.error('❌ Module JobsApplications non chargé');
    }
}

function showJobRatingForm(jobId, employerId) {
    if (typeof JobsUI !== 'undefined' && JobsUI.showJobRatingForm) {
        JobsUI.showJobRatingForm(jobId, employerId);
    } else {
        console.error('❌ Module JobsUI non chargé');
    }
}

// ========== EXPORT DES FONCTIONS PRINCIPALES ==========
window.loadJobsAnnounces = loadJobsAnnounces;
window.filterJobs = filterJobs;
window.clearJobsFilters = clearJobsFilters;
window.handlePublishJob = handlePublishJob;
window.showJobApplicationForm = showJobApplicationForm;
window.loadJobApplications = loadJobApplications;
window.showJobRatingForm = showJobRatingForm;

// Export des fonctions utilitaires
window.getContractLabel = getContractLabel;

console.log('✅ jobs.js RESTRUCTURÉ - Coordinateur principal chargé');
