// ========== GESTION GLOBALE DE L'APPLICATION ==========
class BTPApp {
    constructor() {
        this.state = {
            currentUser: null,
            isAdmin: false,
            currentSection: 'home'
        };
        this.init();
    }

    init() {
        console.log('🚀 Initialisation BTP Pro...');
        
        // Vérifier d'abord l'authentification
        this.checkAuth();
        
        // Initialiser l'interface
        this.setupEventListeners();
        this.loadSection('home');
        
        // Cacher le loader
        setTimeout(() => {
            const loader = document.querySelector('.loading-overlay');
            if (loader) loader.style.display = 'none';
        }, 1000);
    }

    setupEventListeners() {
        // Navigation principale
        document.addEventListener('click', (e) => {
            const target = e.target;
            
            // Liens de navigation
            if (target.matches('[data-section]') || target.closest('[data-section]')) {
                e.preventDefault();
                const element = target.matches('[data-section]') ? target : target.closest('[data-section]');
                const section = element.getAttribute('data-section');
                this.loadSection(section);
                return;
            }

            // Logo
            if (target.closest('.navbar-brand')) {
                e.preventDefault();
                this.loadSection('home');
                return;
            }

            // Boutons avec actions spécifiques
            if (target.matches('[onclick]')) {
                // Laisser les onclick gérer
                return;
            }
        });

        // Gestion du menu mobile
        const navbarToggler = document.querySelector('.navbar-toggler');
        if (navbarToggler) {
            navbarToggler.addEventListener('click', () => {
                const navbarCollapse = document.querySelector('.navbar-collapse');
                if (navbarCollapse) {
                    navbarCollapse.classList.toggle('show');
                }
            });
        }

        // Fermer le menu mobile quand on clique sur un lien
        document.addEventListener('click', (e) => {
            if (window.innerWidth < 992) {
                const navbarCollapse = document.querySelector('.navbar-collapse.show');
                if (navbarCollapse && e.target.matches('.nav-link')) {
                    navbarCollapse.classList.remove('show');
                }
            }
        });
    }

    loadSection(sectionId) {
        console.log('📂 Chargement section:', sectionId);
        
        // Masquer toutes les sections
        document.querySelectorAll('.section-content').forEach(section => {
            section.classList.remove('active');
            section.style.display = 'none';
        });

        // Afficher la section cible
        const targetSection = document.getElementById(sectionId + '-section');
        if (targetSection) {
            targetSection.classList.add('active');
            targetSection.style.display = 'block';
            this.state.currentSection = sectionId;

            // Fermer le menu mobile
            this.closeMobileMenu();

            // Mettre à jour la navigation active
            this.updateActiveNav(sectionId);

            // Charger les données de la section
            this.loadSectionData(sectionId);

            // Scroll vers le haut
            window.scrollTo(0, 0);
        } else {
            console.warn('❌ Section non trouvée:', sectionId);
        }
    }

    closeMobileMenu() {
        if (window.innerWidth < 992) {
            const navbarCollapse = document.querySelector('.navbar-collapse');
            if (navbarCollapse && navbarCollapse.classList.contains('show')) {
                navbarCollapse.classList.remove('show');
            }
        }
    }

    updateActiveNav(sectionId) {
        // Retirer active de tous les liens
        document.querySelectorAll('.nav-link').forEach(link => {
            link.classList.remove('active');
        });

        // Activer le lien courant
        const activeLink = document.querySelector(`[data-section="${sectionId}"]`);
        if (activeLink) {
            activeLink.classList.add('active');
        }

        // Mettre à jour également les liens du footer
        document.querySelectorAll('footer [data-section]').forEach(link => {
            if (link.getAttribute('data-section') === sectionId) {
                link.classList.add('active');
            } else {
                link.classList.remove('active');
            }
        });
    }

    loadSectionData(sectionId) {
        console.log('📊 Chargement données section:', sectionId);
        
        const sectionLoaders = {
            'home': () => {
                console.log('🏠 Section accueil chargée');
            },
            'marketplace': () => {
                if (window.loadMarketplaceAnnounces) {
                    loadMarketplaceAnnounces();
                } else {
                    console.warn('❌ loadMarketplaceAnnounces non disponible');
                }
            },
            'realestate': () => {
                if (window.loadRealEstateAnnounces) {
                    loadRealEstateAnnounces();
                } else {
                    console.warn('❌ loadRealEstateAnnounces non disponible');
                }
            },
            'jobs': () => {
                if (window.loadJobsAnnounces) {
                    loadJobsAnnounces();
                } else {
                    console.warn('❌ loadJobsAnnounces non disponible');
                }
            },
            'freelancers': () => {
                if (window.loadFreelancers) {
                    loadFreelancers();
                } else {
                    console.warn('❌ loadFreelancers non disponible');
                }
            },
            'professionals': () => {
                if (window.loadProfessionals) {
                    loadProfessionals();
                } else {
                    console.warn('❌ loadProfessionals non disponible');
                }
            },
            'forum': () => {
                if (window.loadForumTopics) {
                    loadForumTopics();
                } else {
                    console.warn('❌ loadForumTopics non disponible');
                }
            },
            'ai': () => {
                console.log('🤖 Section IA chargée');
            },
            'premium': () => {
                console.log('⭐ Section Premium chargée');
            },
            'favorites': () => {
                if (window.loadFavorites) {
                    loadFavorites();
                } else {
                    console.warn('❌ loadFavorites non disponible');
                }
            },
            'publish': () => {
                console.log('📝 Section publication chargée');
                this.initializePublishSection();
            },
            'admin': () => {
                if (this.state.isAdmin && window.refreshAdminData) {
                    refreshAdminData();
                } else if (!this.state.isAdmin) {
                    console.warn('❌ Accès admin refusé');
                    this.loadSection('home');
                }
            },
            'my_account': () => {
                if (window.navigateToAccountSection) {
                    navigateToAccountSection('profile');
                } else {
                    console.warn('❌ navigateToAccountSection non disponible');
                }
            },
            'search': () => {
                if (window.displaySearchResults) {
                    displaySearchResults();
                }
            }
        };

        if (sectionLoaders[sectionId]) {
            try {
                sectionLoaders[sectionId]();
            } catch (error) {
                console.error(`❌ Erreur chargement section ${sectionId}:`, error);
            }
        } else {
            console.warn('❌ Aucun loader défini pour la section:', sectionId);
        }
    }

    initializePublishSection() {
        // Initialiser les sélecteurs de villes si nécessaire
        const citySelects = document.querySelectorAll('select[name="city"]');
        citySelects.forEach(select => {
            if (select.children.length <= 1) {
                this.loadCitiesIntoSelect(select);
            }
        });

        // Initialiser les sélecteurs de catégories marketplace
        const marketplaceCategorySelect = document.getElementById('marketplaceCategorySelect');
        if (marketplaceCategorySelect && marketplaceCategorySelect.children.length <= 1) {
            this.loadMarketplaceCategories();
        }
    }

    loadCitiesIntoSelect(selectElement) {
        const cities = [
            'Casablanca', 'Rabat', 'Marrakech', 'Fès', 'Tanger', 'Meknès', 'Agadir', 
            'Oujda', 'Kénitra', 'Tétouan', 'Safi', 'Mohammédia', 'Beni Mellal', 
            'El Jadida', 'Nador', 'Taza', 'Settat', 'Khouribga', 'Laâyoune', 'Dakhla'
        ];
        
        cities.forEach(city => {
            const option = document.createElement('option');
            option.value = city;
            option.textContent = city;
            selectElement.appendChild(option);
        });
    }

    loadMarketplaceCategories() {
        const categories = {
            'ciment': 'Ciment',
            'acier': 'Acier',
            'revetement': 'Revêtement',
            'bois': 'Bois',
            'isolation': 'Isolation',
            'plomberie': 'Plomberie',
            'electricite': 'Électricité',
            'outillage': 'Outillage',
            'quincaillerie': 'Quincaillerie',
            'autres': 'Autres'
        };

        const select = document.getElementById('marketplaceCategorySelect');
        if (!select) return;

        // Vider les options existantes sauf la première
        while (select.children.length > 1) {
            select.removeChild(select.lastChild);
        }

        Object.entries(categories).forEach(([value, label]) => {
            const option = document.createElement('option');
            option.value = value;
            option.textContent = label;
            select.appendChild(option);
        });
    }

    checkAuth() {
        try {
            const savedUser = localStorage.getItem('currentUser');
            if (savedUser) {
                this.state.currentUser = JSON.parse(savedUser);
                this.state.isAdmin = this.state.currentUser.role === 'admin';
                console.log('🔐 Utilisateur restauré:', this.state.currentUser.prenom);
                
                // Mettre à jour l'interface d'authentification si la fonction existe
                if (typeof updateAuthUI === 'function') {
                    updateAuthUI();
                }
            }
        } catch (error) {
            console.error('❌ Erreur authentification:', error);
            this.state.currentUser = null;
            this.state.isAdmin = false;
            if (typeof updateAuthUI === 'function') {
                updateAuthUI();
            }
        }
    }

    updateAuthUI() {
        const guestNav = document.getElementById('guest-nav');
        const userNav = document.getElementById('user-nav');
        const adminNav = document.getElementById('admin-nav');

        if (this.state.currentUser) {
            if (guestNav) guestNav.style.display = 'none';
            if (userNav) userNav.style.display = 'flex';
            if (adminNav) adminNav.style.display = this.state.isAdmin ? 'block' : 'none';
        } else {
            if (guestNav) guestNav.style.display = 'flex';
            if (userNav) userNav.style.display = 'none';
            if (adminNav) adminNav.style.display = 'none';
        }
    }

    // Méthodes utilitaires
    requireAuth(callback) {
        if (!this.state.currentUser) {
            if (window.showLoginModal) {
                showLoginModal();
            }
            showAlert('🔐 Veuillez vous connecter pour accéder à cette fonctionnalité', 'warning');
            return false;
        }
        if (callback) callback();
        return true;
    }

    requireAdmin(callback) {
        if (!this.state.currentUser || !this.state.isAdmin) {
            showAlert('❌ Accès réservé aux administrateurs', 'error');
            return false;
        }
        if (callback) callback();
        return true;
    }

    showSection(sectionId) {
        this.loadSection(sectionId);
    }

    refreshCurrentSection() {
        console.log('🔄 Rafraîchissement section courante:', this.state.currentSection);
        this.loadSectionData(this.state.currentSection);
    }
}

// ========== FONCTIONS GLOBALES ==========

// ✅ FONCTION DE VÉRIFICATION UNIFIÉE POUR LES PUBLICATIONS (CORRIGÉE)
function checkAuthForPublish() {
    if (!btpApp || !btpApp.state.currentUser) {
        showAlert('🔐 Connectez-vous pour publier une annonce', 'warning');
        if (typeof showLoginModal === 'function') {
            showLoginModal();
        }
        return false;
    }
    
    if (btpApp.state.currentUser.status === 'suspended' || btpApp.state.currentUser.status === 'banned') {
        showAlert('❌ Votre compte est suspendu. Vous ne pouvez pas publier d\'annonces.', 'error');
        return false;
    }
    
    return true;
}

// ✅ FONCTION DE RECHERCHE GLOBALE
function performGlobalSearch() {
    const searchInput = document.querySelector('.search-container input');
    const query = searchInput.value.trim();
    
    if (!query) {
        showAlert('🔍 Veuillez saisir un terme de recherche', 'warning');
        return;
    }
    
    console.log('🔍 Recherche globale:', query);
    sessionStorage.setItem('globalSearchQuery', query);
    goToSection('search');
}

function displaySearchResults() {
    const query = sessionStorage.getItem('globalSearchQuery');
    
    if (!query) {
        goToSection('home');
        return;
    }
    
    const container = document.getElementById('search-results-container');
    if (!container) return;
    
    container.innerHTML = `
        <div class="text-center py-4">
            <h4>Résultats pour: "${query}"</h4>
            <p class="text-muted">Recherche en cours de développement...</p>
            <div class="spinner-border text-primary" role="status">
                <span class="visually-hidden">Chargement...</span>
            </div>
        </div>
    `;
}

// ✅ FONCTION POUR REJOINDRE L'ANNUAIRE DES PROFESSIONNELS
function requestProfessionalListing() {
    if (!checkAuthForPublish()) return;
    
    const modalHtml = `
        <div class="modal fade" id="professionalRequestModal">
            <div class="modal-dialog">
                <div class="modal-content">
                    <div class="modal-header">
                        <h5 class="modal-title">Rejoindre l'Annuaire des Professionnels</h5>
                        <button type="button" class="btn-close" data-bs-dismiss="modal"></button>
                    </div>
                    <div class="modal-body">
                        <form id="professionalRequestForm">
                            <div class="mb-3">
                                <label class="form-label">Nom de l'entreprise</label>
                                <input type="text" class="form-control" name="companyName" required>
                            </div>
                            <div class="mb-3">
                                <label class="form-label">Spécialité</label>
                                <select class="form-select" name="specialty" required>
                                    <option value="">Choisir une spécialité</option>
                                    <option value="maçonnerie">Maçonnerie</option>
                                    <option value="electricite">Électricité</option>
                                    <option value="plomberie">Plomberie</option>
                                    <option value="charpente">Charpente</option>
                                    <option value="couverture">Couverture</option>
                                    <option value="peinture">Peinture</option>
                                    <option value="isolation">Isolation</option>
                                </select>
                            </div>
                            <div class="mb-3">
                                <label class="form-label">Description</label>
                                <textarea class="form-control" name="description" rows="3" required></textarea>
                            </div>
                            <div class="mb-3">
                                <label class="form-label">Téléphone</label>
                                <input type="tel" class="form-control" name="phone" required>
                            </div>
                        </form>
                    </div>
                    <div class="modal-footer">
                        <button type="button" class="btn btn-secondary" data-bs-dismiss="modal">Annuler</button>
                        <button type="button" class="btn btn-primary" onclick="submitProfessionalRequest()">Soumettre la demande</button>
                    </div>
                </div>
            </div>
        </div>
    `;
    
    // Injecter le modal
    document.body.insertAdjacentHTML('beforeend', modalHtml);
    const modal = new bootstrap.Modal(document.getElementById('professionalRequestModal'));
    modal.show();
    
    // Nettoyer après fermeture
    document.getElementById('professionalRequestModal').addEventListener('hidden.bs.modal', function () {
        this.remove();
    });
}

function submitProfessionalRequest() {
    const form = document.getElementById('professionalRequestForm');
    const formData = new FormData(form);
    const data = Object.fromEntries(formData.entries());
    
    // Validation
    if (!data.companyName || !data.specialty || !data.description || !data.phone) {
        showAlert('❌ Veuillez remplir tous les champs', 'error');
        return;
    }
    
    // Sauvegarder la demande
    const requestData = {
        ...data,
        userId: btpApp.state.currentUser.id,
        userName: btpApp.state.currentUser.prenom + ' ' + btpApp.state.currentUser.nom,
        userEmail: btpApp.state.currentUser.email,
        status: 'en_attente',
        createdAt: new Date().toISOString()
    };
    
    // Ici vous sauvegarderiez dans votre base de données
    console.log('💾 Demande professionnelle:', requestData);
    
    showAlert('✅ Votre demande a été soumise avec succès! Elle sera traitée sous 48h.', 'success');
    
    // Fermer le modal
    const modal = bootstrap.Modal.getInstance(document.getElementById('professionalRequestModal'));
    modal.hide();
}

// ========== INITIALISATION ==========
let btpApp;

document.addEventListener('DOMContentLoaded', () => {
    console.log('📄 DOM chargé - Démarrage application...');
    btpApp = new BTPApp();
    window.appState = btpApp.state;
});

window.goToSection = function(sectionId) {
    if (btpApp) {
        btpApp.loadSection(sectionId);
    } else {
        console.error('❌ Application non initialisée');
        document.querySelectorAll('.section-content').forEach(section => {
            section.classList.remove('active');
            section.style.display = 'none';
        });
        const targetSection = document.getElementById(sectionId + '-section');
        if (targetSection) {
            targetSection.classList.add('active');
            targetSection.style.display = 'block';
        }
    }
};

window.checkAuthAndGo = function(section, context = '') {
    if (!btpApp || !btpApp.state.currentUser) {
        if (window.showLoginModal) {
            showLoginModal();
        }
        showAlert(`🔐 Veuillez vous connecter pour ${context || 'accéder à cette fonctionnalité'}`, 'warning');
        return false;
    }
    goToSection(section);
    return true;
};

window.goToPublish = function() {
    if (checkAuthAndGo('publish', 'publier une annonce')) {
        setTimeout(() => {
            const marketplaceForm = document.getElementById('marketplace-form');
            if (marketplaceForm) {
                marketplaceForm.style.display = 'block';
            }
        }, 100);
    }
};

window.showNewAnnounceForm = function() {
    document.querySelectorAll('.publish-form').forEach(form => {
        form.style.display = 'none';
    });
    document.getElementById('marketplace-form').style.display = 'block';
    
    document.querySelectorAll('.list-group-item').forEach(item => {
        item.classList.remove('active');
    });
    document.querySelector('[onclick="showPublishForm(\'marketplace\')"]').classList.add('active');
};

window.showPublishForm = function(formType) {
    document.querySelectorAll('.publish-form').forEach(form => {
        form.style.display = 'none';
    });
    
    const targetForm = document.getElementById(formType + '-form');
    if (targetForm) {
        targetForm.style.display = 'block';
    }
    
    document.querySelectorAll('.list-group-item').forEach(item => {
        item.classList.remove('active');
    });
    document.querySelector(`[onclick="showPublishForm('${formType}')"]`).classList.add('active');
};

window.appDebug = function() {
    console.log('🔍 État application:', btpApp?.state);
    console.log('🔗 Sections disponibles:', document.querySelectorAll('.section-content').length);
    console.log('📋 Liens navigation:', document.querySelectorAll('[data-section]').length);
    console.log('👤 Utilisateur:', btpApp?.state.currentUser);
    console.log('👑 Admin:', btpApp?.state.isAdmin);
};

window.addEventListener('error', function(e) {
    console.error('❌ Erreur globale:', e.error);
});

window.addEventListener('unhandledrejection', function(e) {
    console.error('❌ Promise rejetée:', e.reason);
});

console.log('✅ app.js corrigé - Application PRÊTE avec gestion complète des sections');