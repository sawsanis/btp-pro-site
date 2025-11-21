// ========== GESTION GLOBALE DE L'APPLICATION CORRIGÉE ==========
class BTPApp {
    constructor() {
        this.state = {
            currentUser: null,
            isAdmin: false,
            currentSection: 'home'
        };
        this.userProfile = null; // 🔥 CORRECTION: Instance du profil
        this.init();
    }

    async init() {
        console.log('🚀 Initialisation BTP Pro...');
        
        // ✅ ATTENDRE L'INITIALISATION COMPLÈTE DE L'AUTH
        await this.waitForAuthInitialization();
        
        // 🔥 CORRECTION: Initialiser le profil utilisateur
        await this.initializeUserProfile();
        
        // Initialiser l'interface
        this.setupEventListeners();
        this.loadSection('home');
        
        // 🔥 CORRECTION: Initialiser les types de biens immobiliers
        this.initializeRealEstateTypes();
        
        // Cacher le loader
        setTimeout(() => {
            const loader = document.querySelector('.loading-overlay');
            if (loader) loader.style.display = 'none';
        }, 1000);
    }

    // ✅ NOUVELLE MÉTHODE POUR ATTENDRE L'AUTH
    async waitForAuthInitialization() {
        console.log('⏳ Attente initialisation auth...');
        
        // Attendre que authState soit disponible
        let attempts = 0;
        while (typeof authState === 'undefined' && attempts < 50) {
            await new Promise(resolve => setTimeout(resolve, 100));
            attempts++;
        }
        
        if (typeof authState !== 'undefined') {
            console.log('✅ authState disponible après', attempts, 'tentatives');
            this.syncWithAuthSystem();
        } else {
            console.warn('❌ authState non disponible après attente');
        }
    }

    // ✅ SYNCHRONISATION AVEC LE SYSTÈME D'AUTH UNIFIÉ
    syncWithAuthSystem() {
        // Utiliser authState comme source de vérité
        if (typeof authState !== 'undefined') {
            console.log('🔄 Synchronisation avec authState...');
            this.state.currentUser = authState.currentUser;
            this.state.isAdmin = authState.isAdmin;
            
            console.log('✅ État synchronisé:', {
                user: !!this.state.currentUser,
                email: this.state.currentUser?.email,
                admin: this.state.isAdmin,
                userRole: this.state.currentUser?.role
            });
        } else {
            console.warn('⚠️ authState non disponible pour synchronisation');
        }
    }

    // 🔥 CORRECTION: INITIALISATION DU PROFIL UTILISATEUR
    async initializeUserProfile() {
        console.log('👤 Initialisation du profil utilisateur...');
        
        // Attendre que l'authentification soit complètement initialisée
        if (this.state.currentUser) {
            console.log('✅ Utilisateur connecté, initialisation UserProfile...');
            
            // Vérifier si UserProfile existe
            if (typeof UserProfile !== 'undefined') {
                this.userProfile = new UserProfile();
                console.log('✅ UserProfile initialisé');
            } else {
                console.warn('❌ UserProfile non disponible');
            }
        } else {
            console.log('👤 Aucun utilisateur connecté, profil non initialisé');
        }
    }

    // 🔥 CORRECTION: INITIALISER LES TYPES DE BIENS IMMOBILIERS
    initializeRealEstateTypes() {
        console.log('🏠 Initialisation des types de biens immobiliers...');
        
        // S'assurer que les types sont disponibles dans tous les formulaires
        setTimeout(() => {
            if (typeof initializeRealEstateFormTypes === 'function') {
                initializeRealEstateFormTypes();
                console.log('✅ Types de biens immobiliers initialisés');
            }
        }, 500);
    }

    // ✅ MÉTHODE POUR SYNCHRONISER QUAND L'UTILISATEUR CHANGE
    refreshAuthState() {
        console.log('🔄 Rafraîchissement état auth...');
        this.syncWithAuthSystem();
        
        // 🔥 CORRECTION: Réinitialiser le profil si l'utilisateur change
        if (this.state.currentUser) {
            this.initializeUserProfile();
        } else {
            this.userProfile = null;
        }
        
        this.updateAuthUI();
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

            // 🔥 CORRECTION: Gestion du clic sur le profil
            if (target.matches('#user-profile-btn') || target.closest('#user-profile-btn')) {
                e.preventDefault();
                this.showUserProfile();
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

        // 🔥 CORRECTION: Écouteur pour le modal de profil
        document.addEventListener('show.bs.modal', (e) => {
            if (e.target.id === 'profileModal') {
                console.log('🎯 Modal profil ouvert - chargement données...');
                // S'assurer que les données sont chargées
                if (typeof userProfileManager !== 'undefined') {
                    setTimeout(() => userProfileManager.loadUserProfile(), 100);
                } else if (typeof loadProfileData === 'function') {
                    setTimeout(() => loadProfileData(), 100);
                }
            }
        });
    }

    // 🔥 CORRECTION: MÉTHODE POUR AFFICHER LE PROFIL
    showUserProfile() {
        if (!this.state.currentUser) {
            showAlert('🔐 Veuillez vous connecter pour accéder à votre profil', 'warning');
            if (typeof showLoginModal === 'function') {
                showLoginModal();
            }
            return;
        }

        console.log('👤 Affichage du profil utilisateur:', this.state.currentUser.email);
        
        // Utiliser la fonction globale si disponible
        if (typeof showProfileModal === 'function') {
            showProfileModal();
        } else {
            // Fallback : afficher le modal directement
            const profileModal = new bootstrap.Modal(document.getElementById('profileModal'));
            profileModal.show();
            
            // Charger les données après un court délai
            setTimeout(() => {
                if (typeof userProfileManager !== 'undefined') {
                    userProfileManager.loadUserProfile();
                } else if (typeof loadProfileData === 'function') {
                    loadProfileData();
                }
            }, 300);
        }
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

            // ✅ RÉINITIALISER LES FILTRES DE LA NOUVELLE SECTION
            this.resetSectionFilters(sectionId);

            // Charger les données de la section
            this.loadSectionData(sectionId);

            // Scroll vers le haut
            window.scrollTo(0, 0);
        } else {
            console.warn('❌ Section non trouvée:', sectionId);
        }
    }

    // ✅ MÉTHODE POUR RÉINITIALISER LES FILTRES
    resetSectionFilters(sectionId) {
        console.log('🔄 Appel réinitialisation filtres pour:', sectionId);
        
        // Utiliser la fonction de utils.js si elle existe
        if (typeof resetSectionFilters === 'function') {
            resetSectionFilters(sectionId);
        } else {
            // Fallback : réinitialisation manuelle
            this.fallbackResetFilters(sectionId);
        }
    }

    // ✅ FALLBACK SI utils.js N'EST PAS DISPONIBLE
    fallbackResetFilters(sectionId) {
        console.log('🔄 Fallback réinitialisation pour:', sectionId);
        
        setTimeout(() => {
            const sectionElement = document.getElementById(sectionId + '-section');
            if (sectionElement) {
                // Réinitialiser tous les selects
                const selects = sectionElement.querySelectorAll('select');
                selects.forEach(select => {
                    select.value = '';
                    // Garder "newest" pour les tris
                    if (select.id.includes('Sort')) {
                        select.value = 'newest';
                    }
                });
                
                // Réinitialiser les inputs de recherche
                const searchInputs = sectionElement.querySelectorAll('input[type="search"]');
                searchInputs.forEach(input => {
                    input.value = '';
                });
                
                console.log(`✅ ${selects.length} select(s) et ${searchInputs.length} input(s) réinitialisés`);
            }
        }, 100);
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
                // 🔥 CORRECTION: Initialiser Adsense si nécessaire
                this.initializeAdsense();
            },
            'marketplace': () => {
                if (window.loadMarketplaceAnnounces) {
                    loadMarketplaceAnnounces();
                }
            },
            'realestate': () => {
                if (window.loadRealEstateAnnounces) {
                    loadRealEstateAnnounces();
                }
                // 🔥 CORRECTION: S'assurer que les types de biens sont initialisés
                this.initializeRealEstateTypes();
            },
            'jobs': () => {
                if (window.loadJobsAnnounces) {
                    loadJobsAnnounces();
                }
            },
            'freelancers': () => {
                if (window.loadFreelancers) {
                    loadFreelancers();
                }
            },
            'professionals': () => {
                if (window.loadProfessionals) {
                    loadProfessionals();
                }
            },
            'forum': () => {
                if (window.loadForumTopics) {
                    loadForumTopics();
                }
            },
            'publish': () => {
                console.log('📝 Section publication chargée');
                this.initializePublishSection();
            },
            'admin': () => {
                // 🔥 CORRECTION: Vérification ADMIN RENFORCÉE
                if (this.checkAdminAccess()) {
                    if (window.refreshAdminData) {
                        refreshAdminData();
                    } else {
                        console.warn('❌ Fonction refreshAdminData non disponible');
                        showAlert('❌ Module administration non chargé', 'error');
                    }
                } else {
                    console.warn('❌ Accès admin refusé - redirection vers accueil');
                    this.loadSection('home');
                }
            },
            'my_account': () => {
                console.log('👤 Section mon compte chargée');
                // 🔥 CORRECTION: Charger les données du profil
                this.loadAccountSection();
            },
            'search': () => {
                if (window.displaySearchResults) {
                    displaySearchResults();
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
                }
            }
        };

        if (sectionLoaders[sectionId]) {
            try {
                sectionLoaders[sectionId]();
            } catch (error) {
                console.error(`❌ Erreur chargement section ${sectionId}:`, error);
            }
        }
    }

    // 🔥 CORRECTION: INITIALISATION ADSENSE
    initializeAdsense() {
        console.log('📢 Initialisation Adsense...');
        
        // S'assurer que les slots Adsense sont initialisés
        if (typeof btpDB !== 'undefined' && btpDB.initializeAdsenseSlots) {
            setTimeout(() => {
                btpDB.initializeAdsenseSlots().then(slots => {
                    console.log(`✅ ${slots.length} slots Adsense initialisés`);
                });
            }, 1000);
        }
    }

    // 🔥 CORRECTION: VÉRIFICATION ADMIN RENFORCÉE
    checkAdminAccess() {
        console.log('🔐 Vérification accès admin...', {
            hasUser: !!this.state.currentUser,
            isAdmin: this.state.isAdmin,
            userRole: this.state.currentUser?.role
        });
        
        if (!this.state.currentUser) {
            console.warn('❌ Tentative d\'accès admin sans utilisateur connecté');
            showAlert('❌ Vous devez être connecté pour accéder à l\'administration', 'error');
            return false;
        }
        
        if (!this.state.isAdmin) {
            console.warn('❌ Tentative d\'accès admin sans permission administrateur');
            showAlert('❌ Accès réservé aux administrateurs', 'error');
            return false;
        }
        
        console.log('✅ Accès admin autorisé');
        return true;
    }

    // 🔥 CORRECTION: CHARGEMENT DE LA SECTION COMPTE
    loadAccountSection() {
        console.log('💼 Chargement section mon compte...');
        
        // S'assurer que l'utilisateur est connecté
        if (!this.state.currentUser) {
            showAlert('🔐 Veuillez vous connecter', 'warning');
            if (typeof showLoginModal === 'function') {
                showLoginModal();
            }
            return;
        }

        // Charger les données du profil si disponible
        if (typeof userProfileManager !== 'undefined') {
            setTimeout(() => userProfileManager.loadUserProfile(), 100);
        } else if (typeof loadProfileData === 'function') {
            setTimeout(() => loadProfileData(), 100);
        }

        // Afficher les onglets du compte
        this.showAccountTab('profile');
    }

    // 🔥 CORRECTION: AFFICHAGE DES ONGLETS DU COMPTE
    showAccountTab(tabName) {
        console.log('📑 Affichage onglet compte:', tabName);
        
        // Masquer tous les onglets
        document.querySelectorAll('.account-tab').forEach(tab => {
            tab.style.display = 'none';
        });
        
        // Désactiver tous les liens d'onglets
        document.querySelectorAll('.account-nav .nav-link').forEach(link => {
            link.classList.remove('active');
        });
        
        // Afficher l'onglet cible
        const targetTab = document.getElementById(tabName + '-tab');
        if (targetTab) {
            targetTab.style.display = 'block';
        }
        
        // Activer le lien d'onglet
        const activeNavLink = document.querySelector(`[onclick*="showAccountTab('${tabName}')"]`);
        if (activeNavLink) {
            activeNavLink.classList.add('active');
        }

        // Charger les données spécifiques à l'onglet
        switch(tabName) {
            case 'profile':
                if (typeof userProfileManager !== 'undefined') {
                    userProfileManager.loadUserProfile();
                } else if (typeof loadProfileData === 'function') {
                    loadProfileData();
                }
                break;
            case 'announces':
                if (window.loadUserAnnounces) {
                    loadUserAnnounces();
                }
                break;
            case 'favorites':
                if (window.loadFavorites) {
                    loadFavorites();
                }
                break;
            case 'settings':
                console.log('⚙️ Paramètres chargés');
                break;
        }
    }

    // ✅ SECTION PUBLICATION COMPLÈTEMENT CORRIGÉE
    initializePublishSection() {
        console.log('🎯 Initialisation section publication...');
        
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
        
        // 🔥 CORRECTION: Initialiser les types de biens immobiliers
        this.initializeRealEstateFormTypes();
        
        // ✅ FORCER L'AFFICHAGE DU PREMIER FORMULAIRE AU CHARGEMENT
        setTimeout(() => {
            const hasActiveForm = document.querySelector('.publish-form[style*="display: block"]');
            if (!hasActiveForm) {
                this.showPublishForm('marketplace');
            }
            
            // ✅ INITIALISER LES ÉCOUTEURS D'ÉVÉNEMENTS POUR LA NAVIGATION
            this.initializePublishNavigation();
        }, 200);
    }

    // 🔥 CORRECTION: INITIALISER LES TYPES DE BIENS DANS LE FORMULAIRE
    initializeRealEstateFormTypes() {
        console.log('🏠 Initialisation types de biens formulaire...');
        
        if (typeof initializeRealEstateFormTypes === 'function') {
            initializeRealEstateFormTypes();
        } else {
            // Fallback manuel
            const typeSelect = document.getElementById('realestateType');
            if (typeSelect && typeSelect.children.length <= 1) {
                const propertyTypes = [
                    'villa', 'appartement', 'maison', 'ferme', 'bungalow', 'usine',
                    'entrepot', 'bureau', 'local', 'terrain', 'duplex', 'studio',
                    'riad', 'chalet', 'residence', 'immeuble'
                ];
                
                propertyTypes.forEach(type => {
                    const option = document.createElement('option');
                    option.value = type;
                    option.textContent = this.getPropertyTypeLabel(type);
                    typeSelect.appendChild(option);
                });
                
                console.log(`✅ ${propertyTypes.length} types de biens ajoutés`);
            }
        }
    }

    // 🔥 CORRECTION: LABELS DES TYPES DE BIENS
    getPropertyTypeLabel(type) {
        const labels = {
            'villa': 'Villa',
            'appartement': 'Appartement',
            'maison': 'Maison',
            'ferme': 'Ferme',
            'bungalow': 'Bungalow',
            'usine': 'Usine',
            'entrepot': 'Entrepôt',
            'bureau': 'Bureau',
            'local': 'Local commercial',
            'terrain': 'Terrain',
            'duplex': 'Duplex',
            'studio': 'Studio',
            'riad': 'Riad',
            'chalet': 'Chalet',
            'residence': 'Résidence',
            'immeuble': 'Immeuble'
        };
        return labels[type] || type;
    }

    // ✅ NOUVELLE MÉTHODE POUR AFFICHER LES FORMULAIRES
    showPublishForm(formType) {
        console.log('📝 Affichage formulaire:', formType);
        
        // Masquer tous les formulaires
        document.querySelectorAll('.publish-form').forEach(form => {
            form.style.display = 'none';
        });
        
        // Afficher le formulaire cible
        const targetForm = document.getElementById(formType + '-form');
        if (targetForm) {
            targetForm.style.display = 'block';
            console.log('✅ Formulaire affiché:', formType);
        } else {
            console.warn('❌ Formulaire non trouvé:', formType);
        }
        
        // Mettre à jour la navigation active
        this.updatePublishNavigation(formType);
    }

    // ✅ MÉTHODE CORRIGÉE POUR METTRE À JOUR LA NAVIGATION
    updatePublishNavigation(activeFormType) {
        console.log('🎯 Mise à jour navigation pour:', activeFormType);
        
        // 1. DÉSÉLECTIONNER TOUS LES BOUTONS
        const publishSection = document.getElementById('publish-section');
        if (publishSection) {
            const allNavItems = publishSection.querySelectorAll('.list-group-item, .nav-link');
            allNavItems.forEach(item => {
                item.classList.remove('active', 'bg-primary', 'text-white');
                item.classList.add('bg-light', 'text-dark');
            });
        }
        
        // 2. SÉLECTIONNER LE BOUTON ACTIF
        let activeNavItem = document.querySelector(`[onclick*="showPublishForm('${activeFormType}')"]`);
        
        // Fallback : chercher par texte
        if (!activeNavItem) {
            const allNavItems = document.querySelectorAll('.publish-nav .list-group-item');
            allNavItems.forEach(item => {
                const text = item.textContent.toLowerCase();
                if ((activeFormType === 'marketplace' && text.includes('marketplace')) ||
                    (activeFormType === 'realestate' && text.includes('immobilier')) ||
                    (activeFormType === 'jobs' && text.includes('emploi')) ||
                    (activeFormType === 'freelancers' && text.includes('freelance'))) {
                    activeNavItem = item;
                }
            });
        }
        
        // 3. APPLIQUER LES STYLES AU BOUTON ACTIF
        if (activeNavItem) {
            activeNavItem.classList.remove('bg-light', 'text-dark');
            activeNavItem.classList.add('active', 'bg-primary', 'text-white');
        }
    }

    // ✅ INITIALISER LA NAVIGATION DES FORMULAIRES
    initializePublishNavigation() {
        const navItems = document.querySelectorAll('.publish-nav .list-group-item');
        console.log('🔧 Initialisation navigation publication:', navItems.length, 'éléments');
        
        navItems.forEach(item => {
            // S'assurer que chaque élément a un onclick
            if (!item.getAttribute('onclick')) {
                const text = item.textContent.toLowerCase();
                if (text.includes('marketplace')) {
                    item.setAttribute('onclick', "btpApp.showPublishForm('marketplace')");
                } else if (text.includes('immobilier')) {
                    item.setAttribute('onclick', "btpApp.showPublishForm('realestate')");
                } else if (text.includes('emploi')) {
                    item.setAttribute('onclick', "btpApp.showPublishForm('jobs')");
                } else if (text.includes('freelance')) {
                    item.setAttribute('onclick', "btpApp.showPublishForm('freelancers')");
                }
            }
            
            // Ajouter un écouteur d'événement direct pour plus de fiabilité
            item.addEventListener('click', function(e) {
                const onclick = this.getAttribute('onclick');
                if (onclick && onclick.includes('showPublishForm')) {
                    const match = onclick.match(/showPublishForm\('([^']+)'\)/);
                    if (match && match[1]) {
                        btpApp.showPublishForm(match[1]);
                    }
                }
            });
        });
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

    updateAuthUI() {
        // ✅ DÉLÉGUER COMPLÈTEMENT À auth.js
        if (typeof updateAuthUI === 'function') {
            updateAuthUI();
        } else {
            console.warn('⚠️ updateAuthUI non disponible - fallback manuel');
            // Fallback manuel basique
            this.fallbackUpdateAuthUI();
        }
    }

    // 🔥 CORRECTION: FALLBACK POUR UPDATE AUTH UI
    fallbackUpdateAuthUI() {
        console.log('🔄 Fallback mise à jour interface auth...');
        
        const authButtons = document.getElementById('auth-buttons');
        const userMenu = document.getElementById('user-menu');
        const adminNavItem = document.getElementById('admin-nav-item');
        const adminMenuItem = document.getElementById('admin-menu-item');
        
        if (this.state.currentUser && this.state.isAuthenticated) {
            // Utilisateur connecté
            if (authButtons) authButtons.style.display = 'none';
            if (userMenu) userMenu.style.display = 'flex';
            
            // 🔥 CORRECTION: Masquer admin si pas admin
            if (this.state.isAdmin) {
                if (adminNavItem) adminNavItem.style.display = 'block';
                if (adminMenuItem) adminMenuItem.style.display = 'block';
            } else {
                if (adminNavItem) adminNavItem.style.display = 'none';
                if (adminMenuItem) adminMenuItem.style.display = 'none';
            }
        } else {
            // Utilisateur déconnecté
            if (authButtons) authButtons.style.display = 'flex';
            if (userMenu) userMenu.style.display = 'none';
            if (adminNavItem) adminNavItem.style.display = 'none';
            if (adminMenuItem) adminMenuItem.style.display = 'none';
        }
    }

    // Méthodes utilitaires - DÉLÉGUER À auth.js
    requireAuth(callback) {
        // ✅ UTILISER LA FONCTION UNIFIÉE
        if (typeof checkAuthForPublish === 'function') {
            const isAuthenticated = checkAuthForPublish();
            if (isAuthenticated && callback) callback();
            return isAuthenticated;
        }
        return false;
    }

    requireAdmin(callback) {
        if (this.checkAdminAccess()) {
            if (callback) callback();
            return true;
        }
        return false;
    }
}

// ========== FONCTIONS GLOBALES CORRIGÉES ==========

// ✅ FONCTION UNIFIÉE POUR AFFICHER LES FORMULAIRES (compatibilité)
window.showPublishForm = function(formType) {
    if (btpApp && btpApp.showPublishForm) {
        btpApp.showPublishForm(formType);
    } else {
        // Fallback basique
        document.querySelectorAll('.publish-form').forEach(form => {
            form.style.display = 'none';
        });
        const targetForm = document.getElementById(formType + '-form');
        if (targetForm) {
            targetForm.style.display = 'block';
        }
        
        // Mettre à jour la navigation
        document.querySelectorAll('.publish-nav .list-group-item').forEach(item => {
            item.classList.remove('active');
        });
        const activeNavItem = document.querySelector(`[onclick*="showPublishForm('${formType}')"]`);
        if (activeNavItem) {
            activeNavItem.classList.add('active');
        }
    }
};

// 🔥 CORRECTION: FONCTION POUR AFFICHER LES ONGLETS DU COMPTE
window.showAccountTab = function(tabName) {
    if (btpApp && btpApp.showAccountTab) {
        btpApp.showAccountTab(tabName);
    } else {
        // Fallback basique
        document.querySelectorAll('.account-tab').forEach(tab => {
            tab.style.display = 'none';
        });
        
        document.querySelectorAll('.account-nav .nav-link').forEach(link => {
            link.classList.remove('active');
        });
        
        const targetTab = document.getElementById(tabName + '-tab');
        if (targetTab) {
            targetTab.style.display = 'block';
        }
        
        const activeNavLink = document.querySelector(`[onclick*="showAccountTab('${tabName}')"]`);
        if (activeNavLink) {
            activeNavLink.classList.add('active');
        }
    }
};

// ✅ FONCTIONS SPÉCIFIQUES POUR CHAQUE TYPE
window.showMarketplaceForm = function() {
    if (typeof checkAuthForPublish === 'function' && checkAuthForPublish()) {
        goToSection('publish');
        setTimeout(() => showPublishForm('marketplace'), 100);
    }
};

window.showRealEstateForm = function() {
    if (typeof checkAuthForPublish === 'function' && checkAuthForPublish()) {
        goToSection('publish');
        setTimeout(() => showPublishForm('realestate'), 100);
    }
};

window.showJobsForm = function() {
    if (typeof checkAuthForPublish === 'function' && checkAuthForPublish()) {
        goToSection('publish');
        setTimeout(() => showPublishForm('jobs'), 100);
    }
};

window.showFreelancersForm = function() {
    if (typeof checkAuthForPublish === 'function' && checkAuthForPublish()) {
        goToSection('publish');
        setTimeout(() => showPublishForm('freelancers'), 100);
    }
};

// ✅ FONCTION POUR ALLER À LA SECTION PUBLICATION
window.goToPublish = function(defaultForm = 'marketplace') {
    // Vérifier l'authentification
    if (typeof checkAuthForPublish === 'function' && checkAuthForPublish()) {
        goToSection('publish');
        
        // Afficher le formulaire par défaut après un délai
        setTimeout(() => {
            showPublishForm(defaultForm);
        }, 100);
    }
};

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

// ========== INITIALISATION CORRIGÉE ==========
let btpApp;

document.addEventListener('DOMContentLoaded', () => {
    console.log('📄 DOM chargé - Démarrage application...');
    btpApp = new BTPApp();
    window.appState = btpApp.state;
});

// ✅ FONCTION goToSection UNIFIÉE
window.goToSection = function(sectionId) {
    if (btpApp) {
        btpApp.loadSection(sectionId);
    } else {
        // Fallback basique
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

// ✅ FONCTION POUR DÉBOGUER LES FILTRES
window.debugFilters = function() {
    console.log('🐛 Debug filtres:');
    
    const sections = ['marketplace', 'realestate', 'jobs', 'freelancers', 'professionals'];
    
    sections.forEach(section => {
        console.log(`--- ${section} ---`);
        const sectionElement = document.getElementById(section + '-section');
        if (sectionElement) {
            const selects = sectionElement.querySelectorAll('select');
            const inputs = sectionElement.querySelectorAll('input[type="search"]');
            
            console.log(`📊 ${selects.length} select(s):`);
            selects.forEach((select, index) => {
                console.log(`  ${index + 1}. ${select.id || 'sans-id'}: "${select.value}"`);
            });
            
            console.log(`🔍 ${inputs.length} input(s) recherche:`);
            inputs.forEach((input, index) => {
                console.log(`  ${index + 1}. ${input.id || 'sans-id'}: "${input.value}"`);
            });
        } else {
            console.log('❌ Section non trouvée');
        }
    });
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

// 🔥 CORRECTION: FONCTION POUR AFFICHER LE PROFIL
window.showUserProfile = function() {
    if (btpApp && btpApp.showUserProfile) {
        btpApp.showUserProfile();
    } else {
        // Fallback
        if (typeof showProfileModal === 'function') {
            showProfileModal();
        } else {
            const profileModal = new bootstrap.Modal(document.getElementById('profileModal'));
            profileModal.show();
        }
    }
};

window.appDebug = function() {
    console.log('🔍 État application:', btpApp?.state);
    console.log('🔗 Sections disponibles:', document.querySelectorAll('.section-content').length);
    console.log('📋 Liens navigation:', document.querySelectorAll('[data-section]').length);
    console.log('👤 Utilisateur:', btpApp?.state.currentUser);
    console.log('👑 Admin:', btpApp?.state.isAdmin);
    console.log('👤 Profil initialisé:', !!btpApp?.userProfile);
    
    // 🔥 CORRECTION: Debug détaillé admin
    console.log('🔐 Debug admin détaillé:', {
        authStateAdmin: authState?.isAdmin,
        appStateAdmin: btpApp?.state.isAdmin,
        userRole: btpApp?.state.currentUser?.role,
        localStorageAdmin: localStorage.getItem('btp_pro_admin')
    });
};

window.addEventListener('error', function(e) {
    console.error('❌ Erreur globale:', e.error);
});

window.addEventListener('unhandledrejection', function(e) {
    console.error('❌ Promise rejetée:', e.reason);
});

console.log('✅ app.js COMPLET - Correction PROFIL et IMMOBILIER APPLIQUÉE');