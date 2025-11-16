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