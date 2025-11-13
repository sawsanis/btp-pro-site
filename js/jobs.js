// ========== FONCTIONS EMPLOI COMPLÈTEMENT CORRIGÉES ==========
let isLoadingJobs = false;

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

function displayJobsPosts(posts) {
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
        
        const isFavorite = isInFavorites(post.id, 'jobs');
        const favoriteBtnClass = isFavorite ? 'text-danger' : 'text-muted';
        const favoriteIcon = isFavorite ? 'fas' : 'far';
        
        // Récupérer le nombre de candidatures pour cette offre
        const applicationCount = getApplicationCountForJob(post.id);
        
        // ✅ Détection mobile vs desktop pour le lien téléphone
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
                            onclick="toggleFavorite('${post.id}', 'jobs')"
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
                    <p class="card-text text-muted flex-grow-1">${post.description ? truncateText(post.description, 100) : 'Aucune description disponible'}...</p>
                    
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
                        <small class="text-muted">${formatDate(post.createdAt)}</small>
                    </div>
                    
                    <!-- Affichage téléphone adaptatif -->
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
                    
                    <!-- ✅ OPTION 1 : BOUTON VOIR CANDIDATURES TOUJOURS VISIBLE -->
                    ${appState.currentUser && (appState.isAdmin || post.userId === appState.currentUser.id) && applicationCount > 0 ? `
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
                        ${addRatingButtonToJobCard(post)}
                    </div>
                    
                    <!-- Actions Admin/Annonceur -->
                    ${appState.currentUser && (appState.isAdmin || post.userId === appState.currentUser.id) ? `
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
}

// ========== SYSTÈME DE NOTATION ET AVIS POUR LES EMPLOIS ==========

// Fonction pour afficher le formulaire d'avis
function showJobRatingForm(jobId, employerId) {
    if (!appState.currentUser) {
        showAlert('🔐 Connectez-vous pour laisser un avis', 'warning');
        showLoginModal();
        return;
    }

    // Vérifier si l'utilisateur a déjà postulé à cette offre
    checkIfUserAppliedToJob(jobId).then(hasApplied => {
        if (!hasApplied && !appState.isAdmin) {
            showAlert('❌ Vous devez avoir postulé à cette offre pour pouvoir laisser un avis', 'warning');
            return;
        }
        showJobRatingModal(jobId, employerId);
    });
}

// Vérifier si l'utilisateur a postulé à l'offre
async function checkIfUserAppliedToJob(jobId) {
    try {
        const applications = await btpDB.get('job_applications');
        return applications.some(app => 
            app.jobId === jobId && app.candidateId === appState.currentUser.id
        );
    } catch (error) {
        console.error('Erreur vérification candidature:', error);
        return false;
    }
}

// Modal de notation
function showJobRatingModal(jobId, employerId) {
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
                        <form id="jobRatingForm" onsubmit="submitJobRating(event, '${jobId}', '${employerId}')">
                            <!-- Note globale -->
                            <div class="mb-4 text-center">
                                <label class="form-label fw-bold">Note globale *</label>
                                <div class="rating-stars mb-2" id="globalRating">
                                    ${[1,2,3,4,5].map(star => `
                                        <i class="fas fa-star fa-2x rating-star" data-rating="${star}" 
                                           onmouseover="highlightStars(${star})" 
                                           onmouseout="resetStars()"
                                           onclick="setRating(${star})"></i>
                                    `).join('')}
                                </div>
                                <input type="hidden" name="rating" id="selectedRating" required>
                                <div id="ratingText" class="text-muted small">Cliquez sur les étoiles</div>
                            </div>

                            <!-- Catégories de notation -->
                            <div class="row mb-4">
                                <div class="col-md-6">
                                    <label class="form-label">Clarté de l'offre</label>
                                    <div class="category-rating">
                                        ${[1,2,3,4,5].map(star => `
                                            <i class="fas fa-star category-star" data-category="clarity" data-rating="${star}"
                                               onclick="setCategoryRating('clarity', ${star})"></i>
                                        `).join('')}
                                    </div>
                                </div>
                                <div class="col-md-6">
                                    <label class="form-label">Processus de recrutement</label>
                                    <div class="category-rating">
                                        ${[1,2,3,4,5].map(star => `
                                            <i class="fas fa-star category-star" data-category="process" data-rating="${star}"
                                               onclick="setCategoryRating('process', ${star})"></i>
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
                                               onclick="setCategoryRating('communication', ${star})"></i>
                                        `).join('')}
                                    </div>
                                </div>
                                <div class="col-md-6">
                                    <label class="form-label">Respect des délais</label>
                                    <div class="category-rating">
                                        ${[1,2,3,4,5].map(star => `
                                            <i class="fas fa-star category-star" data-category="timing" data-rating="${star}"
                                               onclick="setCategoryRating('timing', ${star})"></i>
                                        `).join('')}
                                    </div>
                                </div>
                            </div>

                            <!-- Commentaire -->
                            <div class="mb-3">
                                <label class="form-label">Votre avis détaillé *</label>
                                <textarea class="form-control" name="comment" rows="4" 
                                          placeholder="Partagez votre expérience avec ce recruteur... (minimum 20 caractères)"
                                          required minlength="20"></textarea>
                            </div>

                            <!-- Type d'expérience -->
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

                            <!-- Anonymat -->
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

    // Initialiser les étoiles
    initializeRatingStars();
}

// Système de notation par étoiles
function initializeRatingStars() {
    window.currentRating = 0;
    window.categoryRatings = {
        clarity: 0,
        process: 0,
        communication: 0,
        timing: 0
    };
}

function highlightStars(rating) {
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
}

function resetStars() {
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
}

function setRating(rating) {
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
    
    resetStars();
}

function setCategoryRating(category, rating) {
    window.categoryRatings[category] = rating;
    
    // Mettre à jour l'affichage des étoiles de la catégorie
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
}

// Soumission de l'avis
async function submitJobRating(event, jobId, employerId) {
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
            reviewerId: appState.currentUser.id,
            reviewerName: formData.get('is_anonymous') ? 'Anonyme' : `${appState.currentUser.prenom} ${appState.currentUser.nom}`,
            reviewerEmail: appState.currentUser.email,
            rating: rating,
            categoryRatings: window.categoryRatings,
            comment: formData.get('comment').trim(),
            experienceType: formData.get('experience_type'),
            isAnonymous: formData.get('is_anonymous') === 'on',
            status: 'en_attente', // Modération des avis
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString()
        };

        await btpDB.post('job_ratings', ratingData);

        // Mettre à jour la note moyenne du recruteur
        await updateEmployerRating(employerId);

        showAlert('✅ Votre avis a été soumis avec succès ! Il sera visible après modération.', 'success');

        const modal = bootstrap.Modal.getInstance(document.getElementById('jobRatingModal'));
        if (modal) modal.hide();

        // Recharger les avis
        loadJobRatings(jobId);

    } catch (error) {
        console.error('❌ Erreur soumission avis:', error);
        showAlert('❌ Erreur lors de la soumission de votre avis', 'error');
    } finally {
        showLoading(false);
    }
}

// Mettre à jour la note moyenne du recruteur
async function updateEmployerRating(employerId) {
    try {
        const ratings = await btpDB.get('job_ratings');
        const employerRatings = ratings.filter(r => 
            r.employerId === employerId && r.status === 'approuve'
        );

        if (employerRatings.length > 0) {
            const totalRating = employerRatings.reduce((sum, rating) => sum + rating.rating, 0);
            const averageRating = totalRating / employerRatings.length;

            // Mettre à jour le profil employeur
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
        }
    } catch (error) {
        console.error('Erreur mise à jour note employeur:', error);
    }
}

// Charger et afficher les avis pour une offre
async function loadJobRatings(jobId) {
    try {
        const ratings = await btpDB.get('job_ratings');
        const jobRatings = ratings.filter(r => 
            r.jobId === jobId && r.status === 'approuve'
        );

        displayJobRatings(jobRatings);
    } catch (error) {
        console.error('Erreur chargement avis:', error);
    }
}

// Afficher les avis
function displayJobRatings(ratings) {
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
                        ${generateStarRating(averageRating)}
                    </div>
                    <div class="text-muted small">${ratings.length} avis</div>
                </div>
                <div class="col-md-8">
                    ${generateRatingDistribution(ratings)}
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
                        <span class="badge bg-secondary ms-2">${getExperienceTypeLabel(rating.experienceType)}</span>
                    </div>
                    <small class="text-muted">${formatDate(rating.createdAt)}</small>
                </div>
                
                <div class="mb-2">
                    ${generateStarRating(rating.rating)}
                </div>

                <div class="category-ratings mb-2">
                    <div class="row small text-muted">
                        <div class="col-6">Clarté: ${generateSmallStars(rating.categoryRatings.clarity)}</div>
                        <div class="col-6">Processus: ${generateSmallStars(rating.categoryRatings.process)}</div>
                        <div class="col-6">Communication: ${generateSmallStars(rating.categoryRatings.communication)}</div>
                        <div class="col-6">Délais: ${generateSmallStars(rating.categoryRatings.timing)}</div>
                    </div>
                </div>

                <p class="mb-0">${rating.comment}</p>
            </div>
        `;
    });

    html += `</div>`;
    container.innerHTML = html;
}

// Générer la distribution des notes
function generateRatingDistribution(ratings) {
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
}

// Générer des étoiles pour l'affichage
function generateStarRating(rating) {
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
}

function generateSmallStars(rating) {
    let html = '';
    for (let i = 1; i <= 5; i++) {
        html += i <= rating ? 
            '<i class="fas fa-star text-warning small"></i>' : 
            '<i class="far fa-star text-warning small"></i>';
    }
    return html;
}

function getExperienceTypeLabel(type) {
    const labels = {
        'entretien': 'Entretien',
        'candidature': 'Candidature',
        'embauche': 'Embauche',
        'stage': 'Stage/Alternance'
    };
    return labels[type] || type;
}

// Afficher le bouton de notation dans les cartes d'emploi
function addRatingButtonToJobCard(post) {
    if (!appState.currentUser || appState.currentUser.id === post.userId) {
        return ''; // Ne pas afficher pour le propriétaire ou non connecté
    }

    return `
        <button class="btn btn-outline-warning btn-sm mt-2" 
                onclick="showJobRatingForm('${post.id}', '${post.userId}')"
                title="Noter cette offre">
            <i class="fas fa-star me-1"></i>Noter
        </button>
    `;
}

// ========== FONCTIONS POUR LES CANDIDATURES ==========

// Compteur de candidatures par offre
function getApplicationCountForJob(jobId) {
    return window.jobApplicationsCount && window.jobApplicationsCount[jobId] || 0;
}

// Fonction pour voir les candidatures d'une offre spécifique
async function viewJobApplications(jobId) {
    console.log('👀 Voir candidatures pour l\'offre:', jobId);
    
    try {
        const [applications, jobs] = await Promise.all([
            btpDB.get('job_applications'),
            btpDB.get('job_posts')
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
        
        showJobApplicationsModal(job, jobApplications);
        
    } catch (error) {
        console.error('❌ Erreur chargement candidatures:', error);
        showAlert('❌ Erreur lors du chargement des candidatures', 'error');
    }
}

// Modal pour afficher les candidatures d'une offre
function showJobApplicationsModal(job, applications) {
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
                            ${appState.isAdmin ? 
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
                                            ${appState.isAdmin ? `<br><small class="text-muted">ID: ${app.candidateId}</small>` : ''}
                                        </td>
                                        <td>${app.candidateEmail}</td>
                                        <td>${app.candidatePhone}</td>
                                        <td>${app.experience || 'Non précisée'}</td>
                                        <td>
                                            <small class="text-muted">
                                                ${formatDate(app.createdAt)}
                                            </small>
                                        </td>
                                        <td>
                                            <span class="badge ${getStatusBadgeClass(app.status)}">
                                                ${getStatusLabel(app.status)}
                                            </span>
                                        </td>
                                        <td>
                                            <div class="btn-group btn-group-sm">
                                                <button class="btn btn-outline-primary" onclick="viewApplicationDetails('${app.id}')" title="Voir détails">
                                                    <i class="fas fa-eye"></i>
                                                </button>
                                                <button class="btn btn-outline-success" onclick="changeApplicationStatus('${app.id}', 'en_cours')" title="En cours">
                                                    <i class="fas fa-play"></i>
                                                </button>
                                                <button class="btn btn-outline-warning" onclick="changeApplicationStatus('${app.id}', 'en_attente')" title="En attente">
                                                    <i class="fas fa-pause"></i>
                                                </button>
                                                <button class="btn btn-outline-danger" onclick="changeApplicationStatus('${app.id}', 'rejete')" title="Rejeter">
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
                        <button type="button" class="btn btn-warning" onclick="exportApplicationsToCSV('${job.id}')">
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
}

// Fonction pour exporter les candidatures en CSV
function exportApplicationsToCSV(jobId) {
    showAlert('📊 Fonction d\'export CSV à implémenter', 'info');
}

// ========== FORMULAIRE DE POSTULATION ==========

function showJobApplicationForm(jobId) {
    if (!appState.currentUser) {
        showAlert('🔐 Connectez-vous pour postuler à cette offre', 'warning');
        showLoginModal();
        return;
    }
    
    btpDB.get('job_posts').then(posts => {
        const job = posts.find(p => p.id == jobId);
        if (job) {
            showJobApplicationModal(job);
        }
    }).catch(error => {
        console.error('Erreur récupération offre:', error);
        showAlert('❌ Erreur lors de la postulation', 'error');
    });
}

function showJobApplicationModal(job) {
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
                            
                            <form id="jobApplicationForm" onsubmit="submitJobApplication(event, '${job.id}')">
                                <!-- Informations personnelles -->
                                <div class="row mb-3">
                                    <div class="col-md-6">
                                        <label class="form-label">Prénom *</label>
                                        <input type="text" class="form-control" name="prenom" 
                                               value="${appState.currentUser.prenom}" required>
                                    </div>
                                    <div class="col-md-6">
                                        <label class="form-label">Nom *</label>
                                        <input type="text" class="form-control" name="nom" 
                                               value="${appState.currentUser.nom}" required>
                                    </div>
                                </div>
                                
                                <div class="row mb-3">
                                    <div class="col-md-6">
                                        <label class="form-label">Email *</label>
                                        <input type="email" class="form-control" name="email" 
                                               value="${appState.currentUser.email}" required>
                                    </div>
                                    <div class="col-md-6">
                                        <label class="form-label">Téléphone *</label>
                                        <input type="tel" class="form-control" name="telephone" 
                                               value="${appState.currentUser.phone || ''}" required 
                                               placeholder="+212 XX XX XX XX">
                                    </div>
                                </div>
                                
                                <!-- Upload CV (OPTIONNEL) -->
                                <div class="mb-3">
                                    <label class="form-label">CV (PDF, DOC, DOCX) - Optionnel</label>
                                    <div class="cv-upload-area" id="cvUploadArea" onclick="document.getElementById('cvFile').click()">
                                        <i class="fas fa-cloud-upload-alt fa-2x text-muted mb-3"></i>
                                        <h5>Cliquez pour télécharger votre CV</h5>
                                        <p class="text-muted">Glissez-déposez ou cliquez pour sélectionner</p>
                                        <small class="text-muted">Max. 5MB - Formats: PDF, DOC, DOCX</small>
                                    </div>
                                    <input type="file" id="cvFile" accept=".pdf,.doc,.docx" 
                                           style="display: none" onchange="handleCVUpload(this)">
                                    <div class="cv-preview mt-2" id="cvPreview" style="display: none;">
                                        <div class="cv-file-info">
                                            <i class="fas fa-file-pdf text-danger"></i>
                                            <span id="cvFileName">Mon_CV.pdf</span>
                                            <button type="button" class="btn btn-sm btn-outline-danger ms-2" onclick="removeCV()">
                                                <i class="fas fa-times"></i>
                                            </button>
                                        </div>
                                    </div>
                                </div>
                                
                                <!-- Lettre de motivation -->
                                <div class="mb-3">
                                    <label class="form-label">Lettre de motivation</label>
                                    <textarea class="form-control" name="lettre_motivation" rows="4" 
                                              placeholder="Présentez-vous et expliquez pourquoi vous êtes le candidat idéal pour ce poste..."></textarea>
                                </div>
                                
                                <!-- Informations supplémentaires -->
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
}

function handleCVUpload(input) {
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
}

function removeCV() {
    const cvFileInput = document.getElementById('cvFile');
    const cvPreview = document.getElementById('cvPreview');
    const cvUploadArea = document.getElementById('cvUploadArea');
    
    cvFileInput.value = '';
    cvPreview.style.display = 'none';
    cvUploadArea.style.display = 'block';
}

async function submitJobApplication(event, jobId) {
    event.preventDefault();
    
    const form = event.target;
    const formData = new FormData(form);
    const cvFile = document.getElementById('cvFile').files[0];
    
    // ✅ CV OPTIONNEL - PAS DE VALIDATION OBLIGATOIRE
    
    showLoading(true);
    
    try {
        const jobs = await btpDB.get('job_posts');
        const jobPost = jobs.find(job => job.id === jobId);
        
        if (!jobPost) {
            throw new Error('Offre d\'emploi non trouvée');
        }
        
        const applicationData = {
            jobId: jobId,
            candidateId: appState.currentUser.id,
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
        
        const savedApplication = await btpDB.post('job_applications', applicationData);
        
        // 🔔 NOTIFICATION À L'ANNONCEUR
        await notifyJobPoster(savedApplication, jobPost);
        
        showAlert('✅ Votre candidature a été envoyée avec succès !', 'success');
        
        const modal = bootstrap.Modal.getInstance(document.getElementById('jobApplicationModal'));
        if (modal) modal.hide();
        
    } catch (error) {
        console.error('❌ Erreur envoi candidature:', error);
        showAlert('❌ Erreur lors de l\'envoi de votre candidature', 'error');
    } finally {
        showLoading(false);
    }
}

// ========== SYSTÈME DE NOTIFICATION POUR LES ANNONCEURS ==========

async function notifyJobPoster(applicationData, jobPost) {
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
        
        await btpDB.post('notifications', notification);
        
        await updateNotificationBadge();
        
        await sendEmailNotification(jobPost.userEmail, applicationData, jobPost);
        
        console.log('✅ Notification envoyée avec succès');
        
    } catch (error) {
        console.error('❌ Erreur envoi notification:', error);
    }
}

async function sendEmailNotification(employerEmail, applicationData, jobPost) {
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
                    ${applicationData.disponibilite ? `<p><strong>Disponibilité:</strong> ${getDisponibilityLabel(applicationData.disponibilite)}</p>` : ''}
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
}

// ========== SYSTÈME DE BADGE INDICATEUR ==========

async function updateNotificationBadge() {
    console.log('🔄 Mise à jour du badge de notification...');
    
    if (!appState.currentUser) {
        hideNotificationBadge();
        return;
    }
    
    try {
        const isEmployer = await checkIfUserIsEmployer();
        const isAdmin = appState.isAdmin;
        
        if (!isEmployer && !isAdmin) {
            hideNotificationBadge();
            return;
        }
        
        const notifications = await btpDB.get('notifications');
        const unreadNotifications = notifications.filter(notif => 
            notif.recipientId === appState.currentUser.id && !notif.isRead
        );
        
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
            hideNotificationBadge();
        }
        
    } catch (error) {
        console.error('❌ Erreur mise à jour badge:', error);
        hideNotificationBadge();
    }
}

function hideNotificationBadge() {
    const badge = document.getElementById('notification-badge');
    if (badge) {
        badge.classList.add('d-none');
    }
}

async function checkIfUserIsEmployer() {
    try {
        const jobs = await btpDB.get('job_posts');
        const userJobs = jobs.filter(job => job.userId === appState.currentUser.id);
        return userJobs.length > 0;
    } catch (error) {
        console.error('❌ Erreur vérification employeur:', error);
        return false;
    }
}

// ========== GESTION DES CANDIDATURES POUR LES ANNONCEURS ET ADMIN ==========

async function loadJobApplications() {
    console.log('📋 Chargement des candidatures...');
    
    if (!appState.currentUser) {
        showAlert('🔐 Connectez-vous pour accéder à vos candidatures', 'warning');
        return;
    }
    
    try {
        const [applications, jobs] = await Promise.all([
            btpDB.get('job_applications'),
            btpDB.get('job_posts')
        ]);
        
        // Mettre à jour le compteur global pour l'affichage
        window.jobApplicationsCount = {};
        applications.forEach(app => {
            window.jobApplicationsCount[app.jobId] = (window.jobApplicationsCount[app.jobId] || 0) + 1;
        });
        
        let userApplications = [];
        let displayJobs = [];
        
        // ✅ SI ADMIN : VOIR TOUTES LES CANDIDATURES
        if (appState.isAdmin) {
            userApplications = applications; // Toutes les candidatures
            displayJobs = jobs; // Toutes les offres
            console.log('👑 ADMIN: Accès à toutes les candidatures', userApplications.length);
        } 
        // ✅ SI ANNONCEUR : VOIR SES CANDIDATURES
        else {
            const userJobs = jobs.filter(job => job.userId === appState.currentUser.id);
            const userJobIds = userJobs.map(job => job.id);
            userApplications = applications.filter(app => userJobIds.includes(app.jobId));
            displayJobs = userJobs;
            console.log('👤 ANNONCEUR: Accès à ses candidatures', userApplications.length);
        }
        
        console.log('📊 Candidatures récupérées:', userApplications.length);
        
        displayJobApplications(userApplications, displayJobs);
        
    } catch (error) {
        console.error('❌ Erreur chargement candidatures:', error);
        showAlert('❌ Erreur lors du chargement des candidatures', 'error');
    }
}

function displayJobApplications(applications, jobs) {
    const container = document.getElementById('applications-container');
    
    if (!container) {
        console.warn('❌ Container applications non trouvé');
        return;
    }
    
    // ✅ Afficher le badge ADMIN si nécessaire
    const adminBadge = appState.isAdmin ? '<span class="badge bg-danger ms-2">Vue Admin</span>' : '';
    
    if (!applications || applications.length === 0) {
        container.innerHTML = `
            <div class="col-12 text-center py-5">
                <i class="fas fa-file-alt fa-3x text-muted mb-3"></i>
                <h5 class="text-muted">Aucune candidature reçue</h5>
                <p class="text-muted">Les candidatures aux offres d'emploi apparaîtront ici</p>
                ${appState.isAdmin ? '<p class="text-info small">👑 Vous voyez toutes les candidatures en tant qu\'administrateur</p>' : ''}
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
                ${appState.isAdmin ? '- Vue globale' : '- Vos offres'}
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
                                ${appState.isAdmin ? `<small class="text-muted">(ID: ${app.candidateId})</small>` : ''}
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
                                Disponibilité: ${getDisponibilityLabel(app.disponibilite)}
                            </p>
                            ` : ''}
                            <p class="mb-1">
                                <i class="fas fa-file text-muted me-1"></i>
                                CV: ${app.cvFileName}
                            </p>
                            ${app.lettreMotivation ? `
                            <p class="mb-2 mt-2">
                                <strong>Lettre de motivation:</strong><br>
                                ${truncateText(app.lettreMotivation, 150)}
                            </p>
                            ` : ''}
                            <small class="text-muted">
                                <i class="fas fa-clock me-1"></i>
                                Postulé le ${formatDate(app.createdAt)}
                            </small>
                        </div>
                        <div class="col-md-4 text-end">
                            <div class="btn-group-vertical w-100">
                                <button class="btn btn-outline-primary btn-sm mb-2" onclick="viewApplicationDetails('${app.id}')">
                                    <i class="fas fa-eye me-1"></i>Voir détails
                                </button>
                                <button class="btn btn-outline-success btn-sm mb-2" onclick="changeApplicationStatus('${app.id}', 'en_cours')">
                                    <i class="fas fa-play me-1"></i>En cours
                                </button>
                                <button class="btn btn-outline-warning btn-sm mb-2" onclick="changeApplicationStatus('${app.id}', 'en_attente')">
                                    <i class="fas fa-pause me-1"></i>En attente
                                </button>
                                <button class="btn btn-outline-danger btn-sm" onclick="changeApplicationStatus('${app.id}', 'rejete')">
                                    <i class="fas fa-times me-1"></i>Rejeter
                                </button>
                            </div>
                            ${app.status !== 'en_attente' ? `
                            <div class="mt-2">
                                <span class="badge ${getStatusBadgeClass(app.status)}">${getStatusLabel(app.status)}</span>
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
}

function viewApplicationDetails(applicationId) {
    btpDB.get('job_applications').then(applications => {
        const application = applications.find(app => app.id === applicationId);
        if (application) {
            showApplicationDetailsModal(application);
        }
    });
}

function showApplicationDetailsModal(application) {
    const modalHTML = `
        <div class="modal fade" id="applicationDetailsModal" tabindex="-1">
            <div class="modal-dialog modal-lg">
                <div class="modal-content">
                    <div class="modal-header bg-primary text-white">
                        <h5 class="modal-title">
                            <i class="fas fa-user me-2"></i>Détails de la candidature
                            ${appState.isAdmin ? '<span class="badge bg-danger ms-2">Vue Admin</span>' : ''}
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
                                ${appState.isAdmin ? `<p><strong>ID Candidat:</strong> ${application.candidateId}</p>` : ''}
                                ${application.experience ? `<p><strong>Expérience:</strong> ${application.experience}</p>` : ''}
                                ${application.disponibilite ? `<p><strong>Disponibilité:</strong> ${getDisponibilityLabel(application.disponibilite)}</p>` : ''}
                                <p><strong>CV:</strong> ${application.cvFileName}</p>
                            </div>
                            <div class="col-md-6">
                                <h6>Statut de la candidature</h6>
                                <p><strong>Postulé le:</strong> ${formatDate(application.createdAt)}</p>
                                <p><strong>Statut:</strong> <span class="badge ${getStatusBadgeClass(application.status)}">${getStatusLabel(application.status)}</span></p>
                                
                                <div class="mt-3">
                                    <h6>Actions</h6>
                                    <div class="d-flex gap-2 flex-wrap">
                                        <button class="btn btn-success btn-sm" onclick="changeApplicationStatus('${application.id}', 'en_cours')">
                                            <i class="fas fa-play me-1"></i>En cours
                                        </button>
                                        <button class="btn btn-warning btn-sm" onclick="changeApplicationStatus('${application.id}', 'en_attente')">
                                            <i class="fas fa-pause me-1"></i>En attente
                                        </button>
                                        <button class="btn btn-danger btn-sm" onclick="changeApplicationStatus('${application.id}', 'rejete')">
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
                                <button class="btn btn-outline-primary btn-sm ms-2" onclick="downloadCV('${application.id}')">
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
}

async function changeApplicationStatus(applicationId, newStatus) {
    try {
        await btpDB.put('job_applications', applicationId, { status: newStatus });
        
        showAlert('✅ Statut de la candidature mis à jour', 'success');
        
        loadJobApplications();
        
        const modal = bootstrap.Modal.getInstance(document.getElementById('applicationDetailsModal'));
        if (modal) modal.hide();
        
    } catch (error) {
        console.error('❌ Erreur mise à jour statut:', error);
        showAlert('❌ Erreur lors de la mise à jour du statut', 'error');
    }
}

function downloadCV(applicationId) {
    showAlert('📄 Fonction de téléchargement CV à implémenter', 'info');
}

// ========== GESTION DES ANNONCES EMPLOI ==========
async function handlePublishJob(event) {
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
            userId: appState.currentUser.id,
            userName: `${appState.currentUser.prenom} ${appState.currentUser.nom}`,
            userEmail: appState.currentUser.email,
            status: 'en_attente',
            isPremium: false,
            viewCount: 0,
            contactCount: 0,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString()
        };
        
        const result = await btpDB.post('job_posts', jobData);
        
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

function getDisponibilityLabel(disponibilite) {
    const labels = {
        'immediate': 'Immédiate',
        '15j': '15 jours',
        '1mois': '1 mois',
        '2mois': '2 mois'
    };
    return labels[disponibilite] || disponibilite;
}

function getStatusLabel(status) {
    const labels = {
        'en_attente': 'En attente',
        'en_cours': 'En cours',
        'rejete': 'Rejetée'
    };
    return labels[status] || status;
}

function getStatusBadgeClass(status) {
    const classes = {
        'en_attente': 'bg-secondary',
        'en_cours': 'bg-warning',
        'rejete': 'bg-danger'
    };
    return classes[status] || 'bg-secondary';
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

function clearJobsFilters() {
    document.getElementById('jobTypeFilter').value = '';
    document.getElementById('jobCityFilter').value = '';
    document.getElementById('jobExperienceFilter').value = '';
    document.getElementById('jobSort').value = 'newest';
    filterJobs();
}

// ========== INITIALISATION DU SYSTÈME ==========

function initializeNotificationSystem() {
    if (appState.currentUser) {
        setTimeout(updateNotificationBadge, 1000);
        
        setInterval(async () => {
            if (!appState.currentUser) return;
            
            const isEmployer = await checkIfUserIsEmployer();
            const isAdmin = appState.isAdmin;
            
            if (isEmployer || isAdmin) {
                await updateNotificationBadge();
            }
        }, 30000);
    }
}

// Au chargement de la page
document.addEventListener('DOMContentLoaded', function() {
    initializeNotificationSystem();
});

// ========== EXPORT DES FONCTIONS ==========
window.loadJobsAnnounces = loadJobsAnnounces;
window.filterJobs = filterJobs;
window.handlePublishJob = handlePublishJob;
window.showJobApplicationForm = showJobApplicationForm;
window.handleCVUpload = handleCVUpload;
window.removeCV = removeCV;
window.submitJobApplication = submitJobApplication;
window.clearJobsFilters = clearJobsFilters;
window.getContractLabel = getContractLabel;
window.loadJobApplications = loadJobApplications;
window.viewApplicationDetails = viewApplicationDetails;
window.changeApplicationStatus = changeApplicationStatus;
window.downloadCV = downloadCV;
window.updateNotificationBadge = updateNotificationBadge;
window.viewJobApplications = viewJobApplications;
window.getApplicationCountForJob = getApplicationCountForJob;

// ========== EXPORT DES FONCTIONS RATING ==========
window.showJobRatingForm = showJobRatingForm;
window.highlightStars = highlightStars;
window.resetStars = resetStars;
window.setRating = setRating;
window.setCategoryRating = setCategoryRating;
window.submitJobRating = submitJobRating;
window.loadJobRatings = loadJobRatings;
window.addRatingButtonToJobCard = addRatingButtonToJobCard;

console.log('✅ jobs.js COMPLET - Système de notation et avis implémenté pour les emplois BTP');