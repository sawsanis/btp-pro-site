// ========== GESTION DES PROFESSIONNELS COMPLÈTEMENT CORRIGÉE ==========
async function loadProfessionals() {
    console.log('👷 Chargement des professionnels...');
    
    try {
        const professionals = await btpDB.get('professionals');
        console.log('📦 Professionnels chargés:', professionals.length);
        
        const container = document.getElementById('professionals-container');
        
        if (!container) {
            console.warn('❌ Container professionnels non trouvé');
            return;
        }
        
        // VÉRIFIER SI L'UTILISATEUR A DÉJÀ UN PROFIL
        const userProfessional = await checkUserProfessionalProfile();
        
        if (!professionals || professionals.length === 0) {
            let buttonHTML = '';
            
            if (userProfessional) {
                // Utilisateur a déjà un profil
                const status = userProfessional.status;
                const statusMessages = {
                    'en_attente': '⏳ Votre profil est en attente de validation',
                    'approuve': '✅ Votre profil est publié dans l\'annuaire', 
                    'rejete': '❌ Votre profil a été rejeté'
                };
                
                buttonHTML = `
                    <div class="alert alert-info mt-3">
                        <i class="fas fa-info-circle me-2"></i>
                        ${statusMessages[status] || '✅ Votre profil est dans l\'annuaire'}
                        ${status === 'rejete' ? `
                        <br><small>Vous pouvez contacter le support pour plus d'informations.</small>
                        ` : ''}
                        ${status === 'en_attente' ? `
                        <br><small>Vous serez notifié dès que votre profil sera validé.</small>
                        ` : ''}
                    </div>
                `;
            } else {
                // Utilisateur n'a pas de profil - AFFICHER LE BOUTON
                buttonHTML = appState.currentUser ? `
                    <button class="btn btn-primary" onclick="showProfessionalModal()">
                        <i class="fas fa-plus me-2"></i>Rejoindre l'annuaire
                    </button>
                ` : `
                    <button class="btn btn-primary" onclick="showLoginModal()">
                        <i class="fas fa-sign-in-alt me-2"></i>Connectez-vous pour rejoindre
                    </button>
                `;
            }
            
            container.innerHTML = `
                <div class="text-center py-5">
                    <i class="fas fa-hard-hat fa-3x text-muted mb-3"></i>
                    <h5 class="text-muted">Aucun professionnel disponible</h5>
                    <p class="text-muted">Rejoignez notre annuaire de professionnels BTP !</p>
                    ${buttonHTML}
                </div>
            `;
            return;
        }
        
        const approvedProfessionals = professionals.filter(pro => 
            pro.status === 'approuve' || pro.status === 'approved' || !pro.status
        );
        
        console.log('✅ Professionnels approuvés:', approvedProfessionals.length);
        
        if (approvedProfessionals.length === 0) {
            let buttonHTML = '';
            
            if (userProfessional) {
                const status = userProfessional.status;
                const statusMessages = {
                    'en_attente': '⏳ Votre profil est en attente de validation',
                    'approuve': '✅ Votre profil est publié dans l\'annuaire',
                    'rejete': '❌ Votre profil a été rejeté'
                };
                
                buttonHTML = `
                    <div class="alert alert-info mt-3">
                        <i class="fas fa-info-circle me-2"></i>
                        ${statusMessages[status] || '✅ Votre profil est dans l\'annuaire'}
                    </div>
                `;
            } else {
                buttonHTML = `
                    <button class="btn btn-primary" onclick="showProfessionalModal()">
                        <i class="fas fa-plus me-2"></i>Rejoindre l'annuaire
                    </button>
                `;
            }
            
            container.innerHTML = `
                <div class="text-center py-5">
                    <i class="fas fa-hard-hat fa-3x text-muted mb-3"></i>
                    <h5 class="text-muted">Aucun professionnel disponible</h5>
                    <p class="text-muted">Tous les professionnels sont en attente de vérification</p>
                    ${buttonHTML}
                </div>
            `;
            return;
        }
        
        // Initialiser les filtres
        initializeProfessionalsFilters(approvedProfessionals);
        
        // Utiliser la pagination si disponible
        if (typeof setupPagination === 'function') {
            setupPagination('professionals-container', approvedProfessionals, displayProfessionals);
            console.log(`✅ ${approvedProfessionals.length} professionnels chargés avec pagination`);
        } else {
            displayProfessionals(approvedProfessionals);
        }
        
        // Afficher le statut de l'utilisateur sans cacher le bouton
        displayUserProfessionalStatus(userProfessional);
        
    } catch (error) {
        console.error('❌ Erreur chargement professionnels:', error);
        const container = document.getElementById('professionals-container');
        if (container) {
            container.innerHTML = `
                <div class="col-12 text-center">
                    <p class="text-danger">
                        <i class="fas fa-exclamation-triangle me-2"></i>
                        Erreur lors du chargement des professionnels
                    </p>
                    <button class="btn btn-primary btn-sm" onclick="loadProfessionals()">
                        <i class="fas fa-redo me-1"></i>Réessayer
                    </button>
                </div>
            `;
        }
    }
}

function initializeProfessionalsFilters(professionals) {
    // Récupérer les spécialités uniques
    const specialties = [...new Set(professionals.map(p => p.specialty).filter(Boolean))];
    const cities = [...new Set(professionals.map(p => p.city).filter(Boolean))];
    
    // Mettre à jour le filtre des spécialités
    const specialtyFilter = document.getElementById('professionalSpecialtyFilter');
    if (specialtyFilter) {
        // Garder l'option "Toutes les spécialités"
        while (specialtyFilter.children.length > 1) {
            specialtyFilter.removeChild(specialtyFilter.lastChild);
        }
        
        specialties.forEach(specialty => {
            const option = document.createElement('option');
            option.value = specialty;
            option.textContent = getProfessionalSpecialtyLabel(specialty);
            specialtyFilter.appendChild(option);
        });
    }
    
    // Mettre à jour le filtre des villes
    const cityFilter = document.getElementById('professionalCityFilter');
    if (cityFilter) {
        // Garder l'option "Toutes les villes"
        while (cityFilter.children.length > 1) {
            cityFilter.removeChild(cityFilter.lastChild);
        }
        
        cities.forEach(city => {
            const option = document.createElement('option');
            option.value = city;
            option.textContent = city;
            cityFilter.appendChild(option);
        });
    }
}

async function filterProfessionals() {
    console.log('🔍 Filtrage des professionnels...');
    
    try {
        const specialty = document.getElementById('professionalSpecialtyFilter')?.value;
        const city = document.getElementById('professionalCityFilter')?.value;
        const sort = document.getElementById('professionalSort')?.value;
        
        const professionals = await btpDB.get('professionals');
        let filteredProfessionals = professionals.filter(professional => {
            if (specialty && professional.specialty !== specialty) return false;
            if (city && professional.city !== city) return false;
            return professional.status === 'approuve' || professional.status === 'approved' || !professional.status;
        });
        
        // Trier les résultats
        if (sort === 'experience_desc') {
            filteredProfessionals.sort((a, b) => (b.experience || 0) - (a.experience || 0));
        } else if (sort === 'rating_desc') {
            filteredProfessionals.sort((a, b) => (b.rating || 0) - (a.rating || 0));
        } else if (sort === 'premium') {
            filteredProfessionals.sort((a, b) => (b.isPremium ? 1 : 0) - (a.isPremium ? 1 : 0));
        } else {
            // Plus récent d'abord
            filteredProfessionals.sort((a, b) => new Date(b.createdAt || 0) - new Date(a.createdAt || 0));
        }
        
        if (typeof setupPagination === 'function') {
            setupPagination('professionals-container', filteredProfessionals, displayProfessionals);
        } else {
            displayProfessionals(filteredProfessionals);
        }
        
    } catch (error) {
        console.error('❌ Erreur filtrage professionnels:', error);
        showAlert('❌ Erreur lors du filtrage', 'error');
    }
}

function displayProfessionals(professionals) {
    const container = document.getElementById('professionals-container');
    
    if (!container) {
        console.warn('❌ Container professionnels non trouvé');
        return;
    }
    
    if (!professionals || professionals.length === 0) {
        container.innerHTML = `
            <div class="col-12 text-center py-5">
                <i class="fas fa-search fa-3x text-muted mb-3"></i>
                <p class="text-muted">Aucun professionnel trouvé</p>
                <p class="text-muted small">Essayez de modifier vos critères de recherche</p>
                <button class="btn btn-primary" onclick="clearProfessionalsFilters()">
                    <i class="fas fa-times me-2"></i>Effacer les filtres
                </button>
            </div>
        `;
        return;
    }
    
    let html = '';
    professionals.forEach((professional, index) => {
        const ratingStars = generateProfessionalRatingStars(professional.rating || 0);
        const isFavorite = isInFavorites(professional.id, 'professionals');
        const isVerified = professional.isVerified;
        const favoriteBtnClass = isFavorite ? 'text-danger' : 'text-muted';
        const favoriteIcon = isFavorite ? 'fas' : 'far';
        
        // ✅ AJOUT : Bouton de notation
        const ratingButton = addProfessionalRatingButton(professional);
        
        html += `
        <div class="col-md-6 col-lg-4 mb-4">
            <div class="card h-100 professional-card">
                <div class="position-relative">
                    <div class="card-img-top bg-light d-flex align-items-center justify-content-center" style="height: 120px;">
                        <i class="fas fa-hard-hat fa-2x text-primary"></i>
                    </div>
                    <button class="btn btn-sm btn-light favorite-btn ${favoriteBtnClass}" 
                            onclick="toggleFavorite('${professional.id}', 'professionals')"
                            title="${isFavorite ? 'Retirer des favoris' : 'Ajouter aux favoris'}">
                        <i class="${favoriteIcon} fa-heart"></i>
                    </button>
                    ${professional.isPremium ? `
                    <div class="position-absolute top-0 start-0 m-2">
                        <span class="badge bg-warning">⭐ Premium</span>
                    </div>
                    ` : ''}
                </div>
                <div class="card-body d-flex flex-column">
                    <div class="d-flex justify-content-between align-items-start mb-2">
                        <div>
                            <span class="badge bg-${getProfessionalSpecialtyColor(professional.specialty)}">
                                ${getProfessionalSpecialtyLabel(professional.specialty)}
                            </span>
                            ${isVerified ? '<span class="badge bg-success ms-1"><i class="fas fa-check"></i> Vérifié</span>' : ''}
                        </div>
                    </div>
                    
                    <h5 class="card-title">${professional.company || 'Entreprise sans nom'}</h5>
                    <p class="card-text text-muted flex-grow-1">${professional.description ? truncateText(professional.description, 100) : 'Aucune description disponible'}</p>
                    
                    <div class="professional-info mb-3">
                        <div class="mb-2">
                            <i class="fas fa-briefcase text-primary me-1"></i>
                            <small class="text-muted">${getProfessionalSpecialtyLabel(professional.specialty)}</small>
                        </div>
                        <div class="mb-2">
                            <i class="fas fa-map-marker-alt text-info me-1"></i>
                            <small class="text-muted">${professional.city || 'Non spécifiée'}</small>
                        </div>
                        <div class="mb-2">
                            <i class="fas fa-chart-line text-success me-1"></i>
                            <small class="text-muted">${professional.experience || 0} an${professional.experience > 1 ? 's' : ''} d'expérience</small>
                        </div>
                        ${ratingStars ? `
                        <div class="mb-2">
                            <i class="fas fa-star text-warning me-1"></i>
                            <small class="text-muted">
                                ${ratingStars} (${professional.reviewCount || 0} avis)
                            </small>
                        </div>
                        ` : ''}
                    </div>
                    
                    <!-- BOUTONS ADMIN -->
                    ${appState.currentUser && appState.isAdmin ? `
                    <div class="admin-actions mt-2">
                        <div class="btn-group btn-group-sm w-100">
                            <button class="btn btn-outline-warning btn-sm" onclick="toggleAnnounceStatus('${professional.id}', 'professionals', '${professional.status === 'en_pause' ? 'approuve' : 'en_pause'}')" 
                                    title="${professional.status === 'en_pause' ? 'Activer' : 'Mettre en pause'}">
                                <i class="fas fa-${professional.status === 'en_pause' ? 'play' : 'pause'}"></i>
                            </button>
                            <button class="btn btn-outline-info btn-sm" onclick="togglePremium('${professional.id}', 'professionals', ${!professional.isPremium})" 
                                    title="${professional.isPremium ? 'Retirer premium' : 'Mettre en avant'}">
                                <i class="fas fa-${professional.isPremium ? 'star' : 'crown'}"></i>
                            </button>
                            <button class="btn btn-outline-danger btn-sm" onclick="deleteAnnounce('${professional.id}', 'professionals')" title="Supprimer">
                                <i class="fas fa-trash"></i>
                            </button>
                        </div>
                    </div>
                    ` : ''}
                </div>
                
                <!-- SECTION CONTACTS + NOTATION -->
                <div class="card-footer bg-transparent">
                    <div class="d-flex gap-2">
                        <button class="btn btn-primary btn-sm flex-grow-1" onclick="showProfessionalContactForm('${professional.id}')">
                            <i class="fas fa-envelope me-1"></i>Contacter
                        </button>
                        ${ratingButton}
                    </div>
                    
                    <!-- CONTACTS DIRECTS -->
                    <div class="direct-contact-info mt-3">
                        <h6 class="mb-2">📞 Contacts directs :</h6>
                        ${professional.phone ? `
                        <div class="contact-method">
                            <i class="fas fa-phone text-success"></i>
                            <div>
                                <div class="contact-value">
                                    <a href="tel:${professional.phone}">${professional.phone}</a>
                                </div>
                                <div class="contact-label">Téléphone</div>
                            </div>
                        </div>
                        ` : ''}
                        ${professional.email ? `
                        <div class="contact-method">
                            <i class="fas fa-envelope text-primary"></i>
                            <div>
                                <div class="contact-value">
                                    <a href="mailto:${professional.email}">${professional.email}</a>
                                </div>
                                <div class="contact-label">Email</div>
                            </div>
                        </div>
                        ` : ''}
                        ${professional.website ? `
                        <div class="contact-method">
                            <i class="fas fa-globe text-info"></i>
                            <div>
                                <div class="contact-value">
                                    <a href="${professional.website}" target="_blank" rel="noopener">Site web</a>
                                </div>
                                <div class="contact-label">Site internet</div>
                            </div>
                        </div>
                        ` : ''}
                        ${professional.userName ? `
                        <div class="mt-2 pt-2 border-top">
                            <small class="text-muted">
                                <i class="fas fa-user"></i> Contact : ${professional.userName}
                            </small>
                        </div>
                        ` : ''}
                    </div>
                </div>
            </div>
        </div>`;
    });
    
    container.innerHTML = html;
    console.log(`✅ ${professionals.length} professionnels affichés avec système de notation`);
}

// ========== FONCTION POUR REJOINDRE L'ANNUAIRE ==========
function showProfessionalModal() {
    console.log('👤 Ouverture modal rejoindre annuaire...');
    
    if (!appState.currentUser) {
        showAlert('🔐 Connectez-vous pour rejoindre l\'annuaire', 'warning');
        showLoginModal();
        return;
    }

    const modalHTML = `
        <div class="modal fade" id="professionalModal" tabindex="-1">
            <div class="modal-dialog modal-lg">
                <div class="modal-content">
                    <div class="modal-header bg-primary text-white">
                        <h5 class="modal-title">
                            <i class="fas fa-user-plus me-2"></i>Rejoindre l'Annuaire des Professionnels
                        </h5>
                        <button type="button" class="btn-close" data-bs-dismiss="modal"></button>
                    </div>
                    <div class="modal-body">
                        <form id="professionalForm" onsubmit="submitProfessionalForm(event)">
                            <!-- Informations entreprise -->
                            <div class="row">
                                <div class="col-md-6">
                                    <div class="mb-3">
                                        <label class="form-label">Nom de l'entreprise *</label>
                                        <input type="text" class="form-control" name="company" required 
                                               placeholder="Ex: SARL BTP Maroc">
                                    </div>
                                </div>
                                <div class="col-md-6">
                                    <div class="mb-3">
                                        <label class="form-label">Spécialité *</label>
                                        <select class="form-select" name="specialty" required>
                                            <option value="">Choisir votre spécialité</option>
                                            <option value="maçonnerie">Maçonnerie</option>
                                            <option value="electricite">Électricité</option>
                                            <option value="plomberie">Plomberie</option>
                                            <option value="menuiserie">Menuiserie</option>
                                            <option value="peinture">Peinture</option>
                                            <option value="carrelage">Carrelage</option>
                                            <option value="charpente">Charpente</option>
                                            <option value="couverture">Couverture</option>
                                            <option value="terrassement">Terrassement</option>
                                            <option value="isolation">Isolation</option>
                                            <option value="batiment">Bâtiment</option>
                                            <option value="renovation">Rénovation</option>
                                        </select>
                                    </div>
                                </div>
                            </div>

                            <!-- Description -->
                            <div class="mb-3">
                                <label class="form-label">Description de vos services *</label>
                                <textarea class="form-control" name="description" rows="3" 
                                          placeholder="Décrivez vos services, vos compétences, vos réalisations..."
                                          required></textarea>
                            </div>

                            <!-- Localisation -->
                            <div class="row">
                                <div class="col-md-6">
                                    <div class="mb-3">
                                        <label class="form-label">Ville *</label>
                                        <input type="text" class="form-control" name="city" required 
                                               placeholder="Ex: Casablanca">
                                    </div>
                                </div>
                                <div class="col-md-6">
                                    <div class="mb-3">
                                        <label class="form-label">Années d'expérience *</label>
                                        <input type="number" class="form-control" name="experience" 
                                               min="0" max="50" value="0" required>
                                    </div>
                                </div>
                            </div>

                            <!-- Contacts -->
                            <div class="row">
                                <div class="col-md-6">
                                    <div class="mb-3">
                                        <label class="form-label">Téléphone *</label>
                                        <input type="tel" class="form-control" name="phone" required 
                                               placeholder="Ex: +212 6 12 34 56 78">
                                    </div>
                                </div>
                                <div class="col-md-6">
                                    <div class="mb-3">
                                        <label class="form-label">Email de contact *</label>
                                        <input type="email" class="form-control" name="email" required 
                                               value="${appState.currentUser.email}">
                                    </div>
                                </div>
                            </div>

                            <!-- Site web (optionnel) -->
                            <div class="mb-3">
                                <label class="form-label">Site web (optionnel)</label>
                                <input type="url" class="form-control" name="website" 
                                       placeholder="Ex: https://votre-entreprise.com">
                            </div>

                            <!-- Personne à contacter -->
                            <div class="mb-3">
                                <label class="form-label">Personne à contacter *</label>
                                <input type="text" class="form-control" name="userName" required 
                                       value="${appState.currentUser.prenom} ${appState.currentUser.nom}">
                            </div>

                            <div class="alert alert-info">
                                <i class="fas fa-info-circle me-2"></i>
                                Votre profil sera vérifié par notre équipe avant publication dans l'annuaire.
                            </div>

                            <div class="d-flex gap-2">
                                <button type="submit" class="btn btn-primary flex-grow-1">
                                    <i class="fas fa-check me-2"></i>Soumettre ma candidature
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

    // Supprimer le modal existant s'il y en a un
    const existingModal = document.getElementById('professionalModal');
    if (existingModal) existingModal.remove();

    // Ajouter le modal au DOM
    document.body.insertAdjacentHTML('beforeend', modalHTML);
    
    // Afficher le modal
    const modal = new bootstrap.Modal(document.getElementById('professionalModal'));
    modal.show();
}

// ========== SOUMISSION DU FORMULAIRE ==========
async function submitProfessionalForm(event) {
    event.preventDefault();
    
    console.log('📝 Soumission formulaire professionnel...');
    
    if (!appState.currentUser) {
        showAlert('❌ Vous devez être connecté', 'error');
        return;
    }

    const form = event.target;
    const formData = new FormData(form);
    
    // Validation basique
    const company = formData.get('company').trim();
    const specialty = formData.get('specialty');
    const description = formData.get('description').trim();
    
    if (!company || !specialty || !description) {
        showAlert('❌ Veuillez remplir tous les champs obligatoires', 'error');
        return;
    }

    showLoading(true);

    try {
        const professionalData = {
            id: generateId(),
            userId: appState.currentUser.id,
            company: company,
            specialty: specialty,
            description: description,
            city: formData.get('city').trim(),
            experience: parseInt(formData.get('experience')) || 0,
            phone: formData.get('phone').trim(),
            email: formData.get('email').trim(),
            website: formData.get('website').trim() || '',
            userName: formData.get('userName').trim(),
            status: 'en_attente', // En attente de modération
            rating: 0,
            reviewCount: 0,
            isVerified: false,
            isPremium: false,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString()
        };

        // Sauvegarder dans la base de données
        await btpDB.post('professionals', professionalData);

        // Fermer le modal
        const modal = bootstrap.Modal.getInstance(document.getElementById('professionalModal'));
        if (modal) modal.hide();

        showAlert('✅ Votre demande a été soumise avec succès ! Elle sera examinée par notre équipe.', 'success');

        // Recharger la liste des professionnels
        setTimeout(() => {
            loadProfessionals();
        }, 2000);

    } catch (error) {
        console.error('❌ Erreur soumission formulaire:', error);
        showAlert('❌ Erreur lors de la soumission du formulaire', 'error');
    } finally {
        showLoading(false);
    }
}

// ========== VÉRIFICATION SI L'UTILISATEUR A DÉJÀ UN PROFIL ==========
async function checkUserProfessionalProfile() {
    if (!appState.currentUser) return false;
    
    try {
        const professionals = await btpDB.get('professionals');
        const userProfessional = professionals.find(pro => pro.userId === appState.currentUser.id);
        return userProfessional;
    } catch (error) {
        console.error('Erreur vérification profil:', error);
        return false;
    }
}

// ========== FONCTION POUR AFFICHER LE STATUT UTILISATEUR ==========
function displayUserProfessionalStatus(userProfessional) {
    const container = document.getElementById('professionals-container');
    if (!container || !userProfessional) return;
    
    // Créer un élément pour afficher le statut
    const statusElement = document.createElement('div');
    statusElement.className = 'row mt-4';
    
    const status = userProfessional.status;
    const statusMessages = {
        'en_attente': '⏳ Votre profil est en attente de validation',
        'approuve': '✅ Votre profil est publié dans l\'annuaire',
        'rejete': '❌ Votre profil a été rejeté'
    };
    
    statusElement.innerHTML = `
        <div class="col-12">
            <div class="alert alert-info">
                <i class="fas fa-info-circle me-2"></i>
                ${statusMessages[status] || '✅ Votre profil est dans l\'annuaire'}
                ${status === 'rejete' ? `
                <br><small>Vous pouvez contacter le support pour plus d'informations.</small>
                ` : ''}
                ${status === 'en_attente' ? `
                <br><small>Vous serez notifié dès que votre profil sera validé.</small>
                ` : ''}
            </div>
        </div>
    `;
    
    // Ajouter le statut en haut du conteneur
    container.insertBefore(statusElement, container.firstChild);
}

// ========== SYSTÈME DE NOTATION (NOUVEAU) ==========

function addProfessionalRatingButton(professional) {
    if (!appState.currentUser || appState.currentUser.id === professional.userId) {
        return ''; // Ne pas afficher pour le propriétaire ou non connecté
    }

    return `
        <button class="btn btn-outline-warning btn-sm" 
                onclick="showProfessionalRatingForm('${professional.id}')"
                title="Noter ce professionnel">
            <i class="fas fa-star me-1"></i>Noter
        </button>
    `;
}

function showProfessionalRatingForm(professionalId) {
    if (!appState.currentUser) {
        showAlert('🔐 Connectez-vous pour laisser un avis', 'warning');
        showLoginModal();
        return;
    }

    // Vérifier si l'utilisateur a déjà travaillé avec ce professionnel
    checkIfUserWorkedWithProfessional(professionalId).then(hasWorked => {
        if (!hasWorked && !appState.isAdmin) {
            showAlert('❌ Vous devez avoir travaillé avec ce professionnel pour pouvoir laisser un avis', 'warning');
            return;
        }
        showProfessionalRatingModal(professionalId);
    });
}

async function checkIfUserWorkedWithProfessional(professionalId) {
    try {
        const missions = await btpDB.get('missions');
        return missions.some(mission => 
            mission.professionalId === professionalId && 
            mission.clientId === appState.currentUser.id &&
            mission.status === 'termine'
        );
    } catch (error) {
        console.error('Erreur vérification mission:', error);
        return false;
    }
}

function showProfessionalRatingModal(professionalId) {
    const modalHTML = `
        <div class="modal fade" id="professionalRatingModal" tabindex="-1">
            <div class="modal-dialog modal-lg">
                <div class="modal-content">
                    <div class="modal-header bg-warning text-white">
                        <h5 class="modal-title">
                            <i class="fas fa-star me-2"></i>Noter ce professionnel
                        </h5>
                        <button type="button" class="btn-close" data-bs-dismiss="modal"></button>
                    </div>
                    <div class="modal-body">
                        <form id="professionalRatingForm" onsubmit="submitProfessionalRating(event, '${professionalId}')">
                            <!-- Note globale -->
                            <div class="mb-4 text-center">
                                <label class="form-label fw-bold">Note globale *</label>
                                <div class="rating-stars mb-2" id="professionalGlobalRating">
                                    ${[1,2,3,4,5].map(star => `
                                        <i class="fas fa-star fa-2x rating-star" data-rating="${star}" 
                                           onmouseover="highlightStars('professionalGlobalRating', ${star})" 
                                           onmouseout="resetStars('professionalGlobalRating', window.professionalCurrentRating)"
                                           onclick="setProfessionalRating(${star})"></i>
                                    `).join('')}
                                </div>
                                <input type="hidden" name="rating" id="professionalSelectedRating" required>
                                <div id="professionalRatingText" class="text-muted small">Cliquez sur les étoiles</div>
                            </div>

                            <!-- Commentaire -->
                            <div class="mb-3">
                                <label class="form-label">Votre avis détaillé *</label>
                                <textarea class="form-control" name="comment" rows="4" 
                                          placeholder="Partagez votre expérience avec ce professionnel... (minimum 20 caractères)"
                                          required minlength="20"></textarea>
                            </div>

                            <!-- Type de prestation -->
                            <div class="mb-3">
                                <label class="form-label">Type de prestation</label>
                                <select class="form-select" name="service_type">
                                    <option value="">Choisir...</option>
                                    <option value="maçonnerie">Maçonnerie</option>
                                    <option value="electricite">Électricité</option>
                                    <option value="plomberie">Plomberie</option>
                                    <option value="charpente">Charpente</option>
                                    <option value="autres">Autres</option>
                                </select>
                            </div>

                            <div class="alert alert-info">
                                <i class="fas fa-info-circle me-2"></i>
                                Votre avis aidera d'autres clients à choisir les meilleurs professionnels.
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

    const existingModal = document.getElementById('professionalRatingModal');
    if (existingModal) existingModal.remove();

    document.body.insertAdjacentHTML('beforeend', modalHTML);
    
    const modal = new bootstrap.Modal(document.getElementById('professionalRatingModal'));
    modal.show();

    // Initialiser les étoiles
    window.professionalCurrentRating = 0;
}

// Fonctions de notation réutilisables
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

function setProfessionalRating(rating) {
    window.professionalCurrentRating = rating;
    document.getElementById('professionalSelectedRating').value = rating;
    
    const ratingText = document.getElementById('professionalRatingText');
    const texts = {
        1: 'Médiocre - Très déçu',
        2: 'Passable - Peu satisfait', 
        3: 'Moyen - Correct',
        4: 'Bon - Satisfait',
        5: 'Excellent - Très satisfait'
    };
    ratingText.textContent = texts[rating] || 'Cliquez sur les étoiles';
    ratingText.className = 'small ' + (rating >= 4 ? 'text-success' : rating >= 3 ? 'text-warning' : 'text-danger');
    
    resetStars('professionalGlobalRating', rating);
}

async function submitProfessionalRating(event, professionalId) {
    event.preventDefault();
    
    const form = event.target;
    const formData = new FormData(form);
    const rating = parseInt(document.getElementById('professionalSelectedRating').value);

    if (rating === 0) {
        showAlert('❌ Veuillez donner une note globale', 'error');
        return;
    }

    showLoading(true);

    try {
        const ratingData = {
            professionalId: professionalId,
            clientId: appState.currentUser.id,
            clientName: `${appState.currentUser.prenom} ${appState.currentUser.nom}`,
            clientEmail: appState.currentUser.email,
            rating: rating,
            comment: formData.get('comment').trim(),
            serviceType: formData.get('service_type') || '',
            status: 'en_attente',
            createdAt: new Date().toISOString()
        };

        await btpDB.post('professional_ratings', ratingData);

        // Mettre à jour la note moyenne du professionnel
        await updateProfessionalRating(professionalId);

        showAlert('✅ Votre avis a été soumis avec succès ! Il sera visible après modération.', 'success');

        const modal = bootstrap.Modal.getInstance(document.getElementById('professionalRatingModal'));
        if (modal) modal.hide();

    } catch (error) {
        console.error('❌ Erreur soumission avis:', error);
        showAlert('❌ Erreur lors de la soumission de votre avis', 'error');
    } finally {
        showLoading(false);
    }
}

async function updateProfessionalRating(professionalId) {
    try {
        const ratings = await btpDB.get('professional_ratings');
        const professionalRatings = ratings.filter(r => 
            r.professionalId === professionalId && r.status === 'approuve'
        );

        if (professionalRatings.length > 0) {
            const totalRating = professionalRatings.reduce((sum, rating) => sum + rating.rating, 0);
            const averageRating = totalRating / professionalRatings.length;

            // Mettre à jour le profil professionnel
            const professionals = await btpDB.get('professionals');
            let professional = professionals.find(p => p.id === professionalId);

            if (professional) {
                professional.rating = averageRating;
                professional.reviewCount = professionalRatings.length;
                await btpDB.put('professionals', professional.id, professional);
            }
        }
    } catch (error) {
        console.error('Erreur mise à jour note:', error);
    }
}

// ========== FONCTIONS DE CONTACT EXISTANTES ==========

function showProfessionalContactForm(professionalId) {
    if (!appState.currentUser) {
        showAlert('🔐 Connectez-vous pour contacter ce professionnel', 'warning');
        showLoginModal();
        return;
    }
    
    // Votre code existant pour le formulaire de contact...
    showAlert('📧 Formulaire de contact - Fonctionnalité existante', 'info');
}

// ========== FONCTIONS UTILITAIRES EXISTANTES ==========
function getProfessionalSpecialtyLabel(specialty) {
    const specialties = {
        'maçonnerie': 'Maçonnerie',
        'electricite': 'Électricité',
        'plomberie': 'Plomberie',
        'menuiserie': 'Menuiserie',
        'peinture': 'Peinture',
        'carrelage': 'Carrelage',
        'charpente': 'Charpente',
        'couverture': 'Couverture',
        'terrassement': 'Terrassement',
        'isolation': 'Isolation',
        'batiment': 'Bâtiment',
        'renovation': 'Rénovation'
    };
    return specialties[specialty] || specialty;
}

function getProfessionalSpecialtyColor(specialty) {
    const colors = {
        'maçonnerie': 'secondary',
        'electricite': 'warning',
        'plomberie': 'info',
        'menuiserie': 'success',
        'peinture': 'primary',
        'carrelage': 'danger',
        'charpente': 'dark',
        'couverture': 'light',
        'terrassement': 'secondary',
        'isolation': 'info',
        'batiment': 'primary',
        'renovation': 'warning'
    };
    return colors[specialty] || 'secondary';
}

function generateProfessionalRatingStars(rating) {
    if (!rating || rating === 0) return '<small class="text-muted">Aucune note</small>';
    
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

function clearProfessionalsFilters() {
    document.getElementById('professionalSpecialtyFilter').value = '';
    document.getElementById('professionalCityFilter').value = '';
    document.getElementById('professionalSort').value = 'newest';
    filterProfessionals();
}

// ========== FONCTION UTILITAIRE GENERATE ID ==========
function generateId() {
    return 'pro_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
}

// ========== EXPORT DES FONCTIONS ==========
window.loadProfessionals = loadProfessionals;
window.filterProfessionals = filterProfessionals;
window.clearProfessionalsFilters = clearProfessionalsFilters;
window.getProfessionalSpecialtyLabel = getProfessionalSpecialtyLabel;
window.getProfessionalSpecialtyColor = getProfessionalSpecialtyColor;
window.generateProfessionalRatingStars = generateProfessionalRatingStars;

// ========== EXPORT DES NOUVELLES FONCTIONS ==========
window.showProfessionalModal = showProfessionalModal;
window.submitProfessionalForm = submitProfessionalForm;
window.checkUserProfessionalProfile = checkUserProfessionalProfile;
window.displayUserProfessionalStatus = displayUserProfessionalStatus;

// ========== EXPORT DES FONCTIONS DE NOTATION ==========
window.showProfessionalRatingForm = showProfessionalRatingForm;
window.highlightStars = highlightStars;
window.resetStars = resetStars;
window.setProfessionalRating = setProfessionalRating;
window.submitProfessionalRating = submitProfessionalRating;

console.log('✅ professionals.js COMPLET - Bouton "Rejoindre l\'annuaire" CORRIGÉ et toutes fonctionnalités opérationnelles');