// ========== GESTION DES FREELANCERS CORRIGÉE ==========
async function loadFreelancers() {
    console.log('🎨 Chargement des freelancers...');
    
    try {
        const freelancers = await btpDB.get('freelancers');
        console.log('📦 Freelancers chargés:', freelancers.length);
        
        const container = document.getElementById('freelancers-container');
        
        if (!container) {
            console.warn('❌ Container freelancers non trouvé');
            return;
        }
        
        if (!freelancers || freelancers.length === 0) {
            container.innerHTML = `
                <div class="text-center py-5">
                    <i class="fas fa-paint-brush fa-3x text-muted mb-3"></i>
                    <h5 class="text-muted">Aucun freelancer disponible</h5>
                    <p class="text-muted">Soyez le premier à proposer vos services !</p>
                    ${appState.currentUser ? `
                        <button class="btn btn-primary" onclick="goToSection('publish')">
                            <i class="fas fa-plus me-2"></i>Proposer mes services
                        </button>
                    ` : `
                        <button class="btn btn-primary" onclick="showLoginModal()">
                            <i class="fas fa-sign-in-alt me-2"></i>Connectez-vous pour proposer vos services
                        </button>
                    `}
                </div>
            `;
            return;
        }
        
        const approvedFreelancers = freelancers.filter(freelancer => 
            freelancer.status === 'approuve' || freelancer.status === 'approved' || !freelancer.status
        );
        
        console.log('✅ Freelancers approuvés:', approvedFreelancers.length);
        
        if (approvedFreelancers.length === 0) {
            container.innerHTML = `
                <div class="text-center py-5">
                    <i class="fas fa-paint-brush fa-3x text-muted mb-3"></i>
                    <h5 class="text-muted">Aucun freelancer disponible</h5>
                    <p class="text-muted">Soyez le premier à proposer vos services !</p>
                    <button class="btn btn-primary" onclick="goToSection('publish')">
                        <i class="fas fa-plus me-2"></i>Proposer mes services
                    </button>
                </div>
            `;
            return;
        }
        
        // Utiliser la pagination si disponible
        if (typeof setupPagination === 'function') {
            setupPagination('freelancers-container', approvedFreelancers, displayFreelancers);
            console.log(`✅ ${approvedFreelancers.length} freelancers chargés avec pagination`);
        } else {
            displayFreelancers(approvedFreelancers);
        }
        
    } catch (error) {
        console.error('❌ Erreur chargement freelancers:', error);
        const container = document.getElementById('freelancers-container');
        if (container) {
            container.innerHTML = `
                <div class="col-12 text-center">
                    <p class="text-danger">
                        <i class="fas fa-exclamation-triangle me-2"></i>
                        Erreur lors du chargement des freelancers
                    </p>
                    <button class="btn btn-info btn-sm" onclick="loadFreelancers()">
                        <i class="fas fa-redo me-1"></i>Réessayer
                    </button>
                </div>
            `;
        }
    }
}

async function filterFreelancers() {
    console.log('🔍 Filtrage des freelancers...');
    
    try {
        const specialty = document.getElementById('freelancerSpecialtyFilter')?.value;
        const city = document.getElementById('freelancerCityFilter')?.value;
        const sort = document.getElementById('freelancerSort')?.value;
        
        const freelancers = await btpDB.get('freelancers');
        let filteredFreelancers = freelancers.filter(freelancer => {
            if (specialty && freelancer.specialty !== specialty) return false;
            if (city && freelancer.ville !== city) return false;
            return freelancer.status === 'approuve' || freelancer.status === 'approved' || !freelancer.status;
        });
        
        // Trier les résultats
        if (sort === 'rating') {
            filteredFreelancers.sort((a, b) => (b.rating || 0) - (a.rating || 0));
        } else if (sort === 'premium') {
            filteredFreelancers.sort((a, b) => (b.isPremium ? 1 : 0) - (a.isPremium ? 1 : 0));
        } else {
            // Plus récent d'abord
            filteredFreelancers.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
        }
        
        if (typeof setupPagination === 'function') {
            setupPagination('freelancers-container', filteredFreelancers, displayFreelancers);
        } else {
            displayFreelancers(filteredFreelancers);
        }
        
    } catch (error) {
        console.error('❌ Erreur filtrage freelancers:', error);
        showAlert('❌ Erreur lors du filtrage', 'error');
    }
}

function displayFreelancers(freelancers) {
    const container = document.getElementById('freelancers-container');
    
    if (!container) {
        console.warn('❌ Container freelancers non trouvé');
        return;
    }
    
    if (!freelancers || freelancers.length === 0) {
        container.innerHTML = `
            <div class="col-12 text-center">
                <i class="fas fa-search fa-3x text-muted mb-3"></i>
                <p class="text-muted">Aucun freelancer trouvé</p>
                <button class="btn btn-primary" onclick="goToSection('publish')">
                    <i class="fas fa-plus me-2"></i>Proposer mes services
                </button>
            </div>
        `;
        return;
    }
    
    let html = '';
    freelancers.forEach((freelancer, index) => {
        // ✅ CORRECTION : Vérifier si le freelancer a des notes réelles
        const hasRealRatings = freelancer.rating && freelancer.rating > 0 && freelancer.reviewCount && freelancer.reviewCount > 0;
        const ratingStars = hasRealRatings ? generateRatingStars(freelancer.rating) : '';
        const isFavorite = isInFavorites(freelancer.id, 'freelancers');
        
        // ✅ AJOUT : Bouton de notation
        const ratingButton = addFreelancerRatingButton(freelancer);
        
        html += `
        <div class="col-md-6 col-lg-4 mb-4">
            <div class="card h-100">
                <div class="card-header d-flex justify-content-between align-items-center">
                    <span class="badge bg-${getSpecialtyColor(freelancer.specialty)}">
                        ${getSpecialtyLabel(freelancer.specialty)}
                    </span>
                    <button class="btn btn-sm btn-outline-${isFavorite ? 'danger' : 'secondary'}" 
                            onclick="toggleFavorite('${freelancer.id}', 'freelancers')"
                            title="${isFavorite ? 'Retirer des favoris' : 'Ajouter aux favoris'}">
                        <i class="fas fa-heart"></i>
                    </button>
                </div>
                <div class="card-body d-flex flex-column">
                    <h5 class="card-title">${freelancer.title || 'Service sans titre'}</h5>
                    <p class="card-text text-muted flex-grow-1">${freelancer.description ? truncateText(freelancer.description, 100) : 'Aucune description disponible'}</p>
                    
                    <div class="freelancer-info mb-3">
                        <div class="mb-2">
                            <i class="fas fa-map-marker-alt text-primary me-1"></i>
                            <small class="text-muted">${freelancer.ville || 'Non spécifiée'}</small>
                        </div>
                        <div class="mb-2">
                            <i class="fas fa-money-bill-wave text-success me-1"></i>
                            <small class="text-muted">${freelancer.tarif || 'Tarif non spécifié'}</small>
                        </div>
                        <div class="mb-2">
                            <i class="fas fa-briefcase text-info me-1"></i>
                            <small class="text-muted">${freelancer.experience || 'Expérience non spécifiée'}</small>
                        </div>
                        ${hasRealRatings ? `
                        <div class="mb-2">
                            <i class="fas fa-star text-warning me-1"></i>
                            <small class="text-muted">
                                ${ratingStars} (${freelancer.reviewCount} avis)
                            </small>
                        </div>
                        ` : `
                        <div class="mb-2">
                            <i class="fas fa-star text-muted me-1"></i>
                            <small class="text-muted">Aucun avis</small>
                        </div>
                        `}
                    </div>
                    
                    <!-- BOUTONS ADMIN -->
                    ${appState.currentUser && appState.isAdmin ? `
                    <div class="admin-actions mt-2">
                        <div class="btn-group btn-group-sm w-100">
                            <button class="btn btn-warning btn-sm" onclick="toggleAnnounceStatus('${freelancer.id}', 'freelancers', '${freelancer.status === 'en_pause' ? 'approuve' : 'en_pause'}')" 
                                    title="${freelancer.status === 'en_pause' ? 'Activer' : 'Mettre en pause'}">
                                <i class="fas fa-${freelancer.status === 'en_pause' ? 'play' : 'pause'}"></i>
                            </button>
                            <button class="btn btn-info btn-sm" onclick="togglePremium('${freelancer.id}', 'freelancers', ${!freelancer.isPremium})" 
                                    title="${freelancer.isPremium ? 'Retirer premium' : 'Mettre en avant'}">
                                <i class="fas fa-${freelancer.isPremium ? 'star' : 'crown'}"></i>
                            </button>
                            <button class="btn btn-danger btn-sm" onclick="deleteAnnounce('${freelancer.id}', 'freelancers')" title="Supprimer">
                                <i class="fas fa-trash"></i>
                            </button>
                        </div>
                    </div>
                    ` : ''}
                </div>
                
                <!-- SECTION CONTACTS + NOTATION -->
                <div class="card-footer bg-transparent">
                    <div class="d-flex gap-2">
                        <button class="btn btn-primary btn-sm flex-grow-1" onclick="showFreelancerContactForm('${freelancer.id}')">
                            <i class="fas fa-envelope me-1"></i>Contacter
                        </button>
                        ${ratingButton}
                    </div>
                    
                    <!-- CONTACTS DIRECTS EXISTANTS -->
                    <div class="direct-contact-info mt-3">
                        <h6 class="mb-2">📞 Contacter le freelancer :</h6>
                        ${freelancer.phone ? `
                        <div class="contact-method">
                            <i class="fas fa-phone text-success"></i>
                            <div>
                                <div class="contact-value">
                                    <a href="tel:${freelancer.phone}">${freelancer.phone}</a>
                                </div>
                                <div class="contact-label">Téléphone</div>
                            </div>
                        </div>
                        ` : ''}
                        ${freelancer.userEmail ? `
                        <div class="contact-method">
                            <i class="fas fa-envelope text-primary"></i>
                            <div>
                                <div class="contact-value">
                                    <a href="mailto:${freelancer.userEmail}">${freelancer.userEmail}</a>
                                </div>
                                <div class="contact-label">Email</div>
                            </div>
                        </div>
                        ` : ''}
                        ${freelancer.portfolio ? `
                        <div class="contact-method">
                            <i class="fas fa-globe text-info"></i>
                            <div>
                                <div class="contact-value">
                                    <a href="${freelancer.portfolio}" target="_blank" rel="noopener">Portfolio</a>
                                </div>
                                <div class="contact-label">Site web</div>
                            </div>
                        </div>
                        ` : ''}
                        ${freelancer.userName ? `
                        <div class="mt-2 pt-2 border-top">
                            <small class="text-muted">
                                <i class="fas fa-user"></i> Freelancer : ${freelancer.userName}
                            </small>
                        </div>
                        ` : ''}
                    </div>
                </div>
            </div>
        </div>`;
    });
    
    container.innerHTML = html;
    console.log(`✅ ${freelancers.length} freelancers affichés (compteurs d'avis corrigés)`);
}

// ========== SYSTÈME DE NOTATION ==========

function addFreelancerRatingButton(freelancer) {
    if (!appState.currentUser || appState.currentUser.id === freelancer.userId) {
        return ''; // Ne pas afficher pour le propriétaire ou non connecté
    }

    return `
        <button class="btn btn-outline-warning btn-sm" 
                onclick="showFreelancerRatingForm('${freelancer.id}')"
                title="Noter ce freelancer">
            <i class="fas fa-star me-1"></i>Noter
        </button>
    `;
}

function showFreelancerRatingForm(freelancerId) {
    if (!appState.currentUser) {
        showAlert('🔐 Connectez-vous pour laisser un avis', 'warning');
        showLoginModal();
        return;
    }

    // Vérifier si l'utilisateur a déjà travaillé avec ce freelancer
    checkIfUserWorkedWithFreelancer(freelancerId).then(hasWorked => {
        if (!hasWorked && !appState.isAdmin) {
            showAlert('❌ Vous devez avoir travaillé avec ce freelancer pour pouvoir laisser un avis', 'warning');
            return;
        }
        showFreelancerRatingModal(freelancerId);
    });
}

async function checkIfUserWorkedWithFreelancer(freelancerId) {
    try {
        const missions = await btpDB.get('missions');
        return missions.some(mission => 
            mission.freelancerId === freelancerId && 
            mission.clientId === appState.currentUser.id &&
            mission.status === 'termine'
        );
    } catch (error) {
        console.error('Erreur vérification mission:', error);
        return false;
    }
}

function showFreelancerRatingModal(freelancerId) {
    const modalHTML = `
        <div class="modal fade" id="freelancerRatingModal" tabindex="-1">
            <div class="modal-dialog modal-lg">
                <div class="modal-content">
                    <div class="modal-header bg-warning text-white">
                        <h5 class="modal-title">
                            <i class="fas fa-star me-2"></i>Noter ce freelancer
                        </h5>
                        <button type="button" class="btn-close" data-bs-dismiss="modal"></button>
                    </div>
                    <div class="modal-body">
                        <form id="freelancerRatingForm" onsubmit="submitFreelancerRating(event, '${freelancerId}')">
                            <!-- Note globale -->
                            <div class="mb-4 text-center">
                                <label class="form-label fw-bold">Note globale *</label>
                                <div class="rating-stars mb-2" id="freelancerGlobalRating">
                                    ${[1,2,3,4,5].map(star => `
                                        <i class="fas fa-star fa-2x rating-star" data-rating="${star}" 
                                           onmouseover="highlightStars('freelancerGlobalRating', ${star})" 
                                           onmouseout="resetStars('freelancerGlobalRating', window.freelancerCurrentRating)"
                                           onclick="setFreelancerRating(${star})"></i>
                                    `).join('')}
                                </div>
                                <input type="hidden" name="rating" id="freelancerSelectedRating" required>
                                <div id="freelancerRatingText" class="text-muted small">Cliquez sur les étoiles</div>
                            </div>

                            <!-- Commentaire -->
                            <div class="mb-3">
                                <label class="form-label">Votre avis détaillé *</label>
                                <textarea class="form-control" name="comment" rows="4" 
                                          placeholder="Partagez votre expérience avec ce freelancer... (minimum 20 caractères)"
                                          required minlength="20"></textarea>
                            </div>

                            <!-- Type de mission -->
                            <div class="mb-3">
                                <label class="form-label">Type de mission</label>
                                <select class="form-select" name="mission_type">
                                    <option value="">Choisir...</option>
                                    <option value="infographie">Infographie 3D</option>
                                    <option value="photographie">Photographie</option>
                                    <option value="dessin">Dessin technique</option>
                                    <option value="conception">Conception</option>
                                    <option value="architecture">Architecture</option>
                                    <option value="autres">Autres</option>
                                </select>
                            </div>

                            <div class="alert alert-info">
                                <i class="fas fa-info-circle me-2"></i>
                                Votre avis aidera d'autres clients à choisir les meilleurs freelancers.
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

    const existingModal = document.getElementById('freelancerRatingModal');
    if (existingModal) existingModal.remove();

    document.body.insertAdjacentHTML('beforeend', modalHTML);
    
    const modal = new bootstrap.Modal(document.getElementById('freelancerRatingModal'));
    modal.show();

    // Initialiser les étoiles
    window.freelancerCurrentRating = 0;
}

function setFreelancerRating(rating) {
    window.freelancerCurrentRating = rating;
    document.getElementById('freelancerSelectedRating').value = rating;
    
    const ratingText = document.getElementById('freelancerRatingText');
    const texts = {
        1: 'Médiocre - Très déçu',
        2: 'Passable - Peu satisfait', 
        3: 'Moyen - Correct',
        4: 'Bon - Satisfait',
        5: 'Excellent - Très satisfait'
    };
    ratingText.textContent = texts[rating] || 'Cliquez sur les étoiles';
    ratingText.className = 'small ' + (rating >= 4 ? 'text-success' : rating >= 3 ? 'text-warning' : 'text-danger');
    
    resetStars('freelancerGlobalRating', rating);
}

async function submitFreelancerRating(event, freelancerId) {
    event.preventDefault();
    
    const form = event.target;
    const formData = new FormData(form);
    const rating = parseInt(document.getElementById('freelancerSelectedRating').value);

    if (rating === 0) {
        showAlert('❌ Veuillez donner une note globale', 'error');
        return;
    }

    showLoading(true);

    try {
        const ratingData = {
            freelancerId: freelancerId,
            clientId: appState.currentUser.id,
            clientName: `${appState.currentUser.prenom} ${appState.currentUser.nom}`,
            clientEmail: appState.currentUser.email,
            rating: rating,
            comment: formData.get('comment').trim(),
            missionType: formData.get('mission_type') || '',
            status: 'en_attente',
            createdAt: new Date().toISOString()
        };

        await btpDB.post('freelancer_ratings', ratingData);

        // Mettre à jour la note moyenne du freelancer
        await updateFreelancerRating(freelancerId);

        showAlert('✅ Votre avis a été soumis avec succès ! Il sera visible après modération.', 'success');

        const modal = bootstrap.Modal.getInstance(document.getElementById('freelancerRatingModal'));
        if (modal) modal.hide();

    } catch (error) {
        console.error('❌ Erreur soumission avis:', error);
        showAlert('❌ Erreur lors de la soumission de votre avis', 'error');
    } finally {
        showLoading(false);
    }
}

// ✅ CORRECTION : Fonction de mise à jour des notes avec compteurs réels
async function updateFreelancerRating(freelancerId) {
    try {
        const ratings = await btpDB.get('freelancer_ratings');
        const freelancerRatings = ratings.filter(r => 
            r.freelancerId === freelancerId && r.status === 'approuve'
        );

        // ✅ CORRECTION : Toujours calculer même si 0 avis
        const totalRating = freelancerRatings.reduce((sum, rating) => sum + rating.rating, 0);
        const averageRating = freelancerRatings.length > 0 ? totalRating / freelancerRatings.length : 0;

        // Mettre à jour le profil freelancer
        const freelancers = await btpDB.get('freelancers');
        let freelancer = freelancers.find(f => f.id === freelancerId);

        if (freelancer) {
            freelancer.rating = averageRating;
            freelancer.reviewCount = freelancerRatings.length; // ✅ CORRECTION : Utiliser la longueur réelle
            await btpDB.put('freelancers', freelancer.id, freelancer);
        }
    } catch (error) {
        console.error('Erreur mise à jour note:', error);
    }
}

// ✅ FONCTION POUR CORRIGER LES COMPTEURS EXISTANTS
async function fixFreelancerRatingsCount() {
    try {
        const freelancers = await btpDB.get('freelancers');
        const ratings = await btpDB.get('freelancer_ratings');
        
        let correctedCount = 0;
        
        for (let freelancer of freelancers) {
            const freelancerRatings = ratings.filter(r => 
                r.freelancerId === freelancer.id && r.status === 'approuve'
            );
            
            // Recalculer les valeurs réelles
            const realReviewCount = freelancerRatings.length;
            const totalRating = freelancerRatings.reduce((sum, rating) => sum + rating.rating, 0);
            const realRating = realReviewCount > 0 ? totalRating / realReviewCount : 0;
            
            // Mettre à jour si différent
            if (freelancer.reviewCount !== realReviewCount || freelancer.rating !== realRating) {
                freelancer.reviewCount = realReviewCount;
                freelancer.rating = realRating;
                await btpDB.put('freelancers', freelancer.id, freelancer);
                console.log(`✅ Corrigé: ${freelancer.title} - ${realReviewCount} avis, note: ${realRating}`);
                correctedCount++;
            }
        }
        
        showAlert(`✅ ${correctedCount} compteurs d'avis corrigés avec succès !`, 'success');
        
        // Recharger l'affichage
        loadFreelancers();
        
    } catch (error) {
        console.error('❌ Erreur correction compteurs:', error);
        showAlert('❌ Erreur lors de la correction des compteurs', 'error');
    }
}

// ========== GESTION DES ANNONCES FREELANCE ==========
async function handlePublishFreelance(event) {
    event.preventDefault();
    
    if (!checkAuthForPublish()) return;
    
    const form = event.target;
    const formData = new FormData(form);
    const data = Object.fromEntries(formData.entries());
    
    console.log('📝 Données du formulaire freelance:', data);
    
    // Validation
    if (!data.title || !data.specialty || !data.description || !data.ville) {
        showAlert('❌ Veuillez remplir tous les champs obligatoires', 'error');
        return;
    }
    
    showLoading(true);
    
    try {
        // ✅ CORRECTION : Initialiser les compteurs à 0
        const freelanceData = {
            title: data.title.trim(),
            specialty: data.specialty,
            tarif: data.tarif?.trim() || '',
            ville: data.ville.trim(),
            experience: data.experience?.trim() || '',
            description: data.description.trim(),
            portfolio: data.portfolio?.trim() || '',
            phone: data.phone.trim(),
            userId: appState.currentUser.id,
            userName: `${appState.currentUser.prenom} ${appState.currentUser.nom}`,
            userEmail: appState.currentUser.email,
            status: 'en_attente',
            isPremium: false,
            rating: 0, // ✅ CORRECTION : Initialiser à 0
            reviewCount: 0, // ✅ CORRECTION : Initialiser à 0
            viewCount: 0,
            contactCount: 0,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString()
        };
        
        console.log('💾 Données freelance à sauvegarder:', freelanceData);
        
        const result = await btpDB.post('freelancers', freelanceData);
        
        console.log('✅ Service freelance sauvegardé:', result);
        
        showAlert('✅ Votre service a été publié avec succès ! Il sera visible après modération.', 'success');
        
        // Réinitialiser le formulaire
        form.reset();
        
        // Rediriger vers la section freelancers
        setTimeout(() => {
            goToSection('freelancers');
        }, 2000);
        
    } catch (error) {
        console.error('❌ Erreur publication freelance:', error);
        showAlert('❌ Erreur lors de la publication: ' + error.message, 'error');
    } finally {
        showLoading(false);
    }
}

// ========== FONCTIONS UTILITAIRES ==========
function getSpecialtyLabel(specialty) {
    const specialties = {
        'infographie': 'Infographie 3D',
        'photographie': 'Photographie',
        'dessin': 'Dessin technique',
        'conception': 'Conception',
        'architecture': 'Architecture'
    };
    return specialties[specialty] || specialty;
}

function getSpecialtyColor(specialty) {
    const colors = {
        'infographie': 'info',
        'photographie': 'primary',
        'dessin': 'success',
        'conception': 'warning',
        'architecture': 'danger'
    };
    return colors[specialty] || 'secondary';
}

function generateRatingStars(rating) {
    if (!rating || rating === 0) return '';
    
    const fullStars = Math.floor(rating);
    const hasHalfStar = rating % 1 >= 0.5;
    
    let stars = '';
    for (let i = 0; i < 5; i++) {
        if (i < fullStars) {
            stars += '<i class="fas fa-star text-warning"></i>';
        } else if (i === fullStars && hasHalfStar) {
            stars += '<i class="fas fa-star-half-alt text-warning"></i>';
        } else {
            stars += '<i class="far fa-star text-warning"></i>';
        }
    }
    return stars;
}

// ========== FONCTIONS DE CONTACT ==========

function showFreelancerContactForm(freelancerId) {
    if (!appState.currentUser) {
        showAlert('🔐 Connectez-vous pour contacter ce freelancer', 'warning');
        showLoginModal();
        return;
    }
    
    // Votre code existant pour le formulaire de contact...
    showAlert('📧 Formulaire de contact - Fonctionnalité existante', 'info');
}

// ========== FONCTIONS GLOBALES POUR LES ÉTOILES ==========
function highlightStars(containerId, rating) {
    const stars = document.querySelectorAll(`#${containerId} .rating-star`);
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

function resetStars(containerId, currentRating) {
    const stars = document.querySelectorAll(`#${containerId} .rating-star`);
    stars.forEach((star, index) => {
        if (index < currentRating) {
            star.classList.add('text-warning');
            star.classList.remove('text-muted');
        } else {
            star.classList.remove('text-warning');
            star.classList.add('text-muted');
        }
    });
}

// ========== EXPORT DES FONCTIONS ==========
window.loadFreelancers = loadFreelancers;
window.filterFreelancers = filterFreelancers;
window.handlePublishFreelance = handlePublishFreelance;

// ========== EXPORT DES FONCTIONS DE NOTATION ==========
window.showFreelancerRatingForm = showFreelancerRatingForm;
window.setFreelancerRating = setFreelancerRating;
window.submitFreelancerRating = submitFreelancerRating;
window.highlightStars = highlightStars;
window.resetStars = resetStars;

// ========== EXPORT FONCTION DE CORRECTION ==========
window.fixFreelancerRatingsCount = fixFreelancerRatingsCount;

console.log('✅ freelancers.js COMPLET - Système de notation ajouté et compteurs corrigés');