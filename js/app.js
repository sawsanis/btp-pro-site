// ========== GESTION GLOBALE DE L'APPLICATION CORRIGÉE ==========
class BTPApp {
    constructor() {
        this.state = {
            currentUser: null,
            isAdmin: false,
            isAuthenticated: false,
            currentSection: 'home'
        };
        this.userProfile = null;
        this.init();
    }

    async init() {
        console.log('🚀 Initialisation BTP Pro...');
        
        await this.waitForAuthInitialization();
        await this.initializeUserProfile();
        
        this.setupEventListeners();
        this.loadSection('home');
        
        this.scheduleRealEstateInitialization();
        
        setTimeout(() => {
            const loader = document.querySelector('.loading-overlay');
            if (loader) loader.style.display = 'none';
        }, 1000);
    }

    async waitForAuthInitialization() {
        console.log('⏳ Attente initialisation auth...');
        
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

    syncWithAuthSystem() {
        if (typeof authState !== 'undefined') {
            console.log('🔄 Synchronisation avec authState...');
            this.state.currentUser = authState.currentUser;
            this.state.isAdmin = authState.isAdmin;
            this.state.isAuthenticated = authState.isAuthenticated;
            
            console.log('✅ État synchronisé:', {
                user: !!this.state.currentUser,
                email: this.state.currentUser?.email,
                admin: this.state.isAdmin,
                authenticated: this.state.isAuthenticated
            });
        } else {
            console.warn('⚠️ authState non disponible pour synchronisation');
        }
    }

    async initializeUserProfile() {
        console.log('👤 Initialisation du profil utilisateur...');
        
        if (this.state.currentUser) {
            console.log('✅ Utilisateur connecté, initialisation UserProfile...');
            
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

    scheduleRealEstateInitialization() {
        console.log('⏰ Planification initialisation types de biens...');
    }

    refreshAuthState() {
        console.log('🔄 Rafraîchissement état auth...');
        this.syncWithAuthSystem();
        
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
            
            if (target.matches('[data-section]') || target.closest('[data-section]')) {
                e.preventDefault();
                const element = target.matches('[data-section]') ? target : target.closest('[data-section]');
                const section = element.getAttribute('data-section');
                this.loadSection(section);
                return;
            }

            if (target.closest('.navbar-brand')) {
                e.preventDefault();
                this.loadSection('home');
                return;
            }

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

        // Fermer le menu mobile
        document.addEventListener('click', (e) => {
            if (window.innerWidth < 992) {
                const navbarCollapse = document.querySelector('.navbar-collapse.show');
                if (navbarCollapse && e.target.matches('.nav-link')) {
                    navbarCollapse.classList.remove('show');
                }
            }
        });

        // Modal de profil
        document.addEventListener('show.bs.modal', (e) => {
            if (e.target.id === 'profileModal') {
                console.log('🎯 Modal profil ouvert - chargement données...');
                if (typeof userProfileManager !== 'undefined') {
                    setTimeout(() => userProfileManager.loadUserProfile(), 100);
                } else if (typeof loadProfileData === 'function') {
                    setTimeout(() => loadProfileData(), 100);
                }
            }
        });
    }

    showUserProfile() {
        if (!this.state.currentUser) {
            showAlert('🔐 Veuillez vous connecter pour accéder à votre profil', 'warning');
            if (typeof showLoginModal === 'function') {
                showLoginModal();
            }
            return;
        }

        console.log('👤 Affichage du profil utilisateur:', this.state.currentUser.email);
        
        if (typeof showProfileModal === 'function') {
            showProfileModal();
        } else {
            const profileModal = new bootstrap.Modal(document.getElementById('profileModal'));
            profileModal.show();
            
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
        
        document.querySelectorAll('.section-content').forEach(section => {
            section.classList.remove('active');
            section.style.display = 'none';
        });

        const targetSection = document.getElementById(sectionId + '-section');
        if (targetSection) {
            targetSection.classList.add('active');
            targetSection.style.display = 'block';
            this.state.currentSection = sectionId;

            this.closeMobileMenu();
            this.updateActiveNav(sectionId);
            this.resetSectionFilters(sectionId);
            this.loadSectionData(sectionId);

            window.scrollTo(0, 0);
        } else {
            console.warn('❌ Section non trouvée:', sectionId);
        }
    }

    resetSectionFilters(sectionId) {
        console.log('🔄 Appel réinitialisation filtres pour:', sectionId);
        
        if (typeof resetSectionFilters === 'function') {
            resetSectionFilters(sectionId);
        } else {
            this.fallbackResetFilters(sectionId);
        }
    }

    fallbackResetFilters(sectionId) {
        console.log('🔄 Fallback réinitialisation pour:', sectionId);
        
        setTimeout(() => {
            const sectionElement = document.getElementById(sectionId + '-section');
            if (sectionElement) {
                const selects = sectionElement.querySelectorAll('select');
                selects.forEach(select => {
                    select.value = '';
                    if (select.id.includes('Sort')) {
                        select.value = 'newest';
                    }
                });
                
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
        document.querySelectorAll('.nav-link').forEach(link => {
            link.classList.remove('active');
        });

        const activeLink = document.querySelector(`[data-section="${sectionId}"]`);
        if (activeLink) {
            activeLink.classList.add('active');
        }

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

    initializeAdsense() {
        console.log('📢 Initialisation Adsense...');
        
        if (typeof btpDB !== 'undefined' && btpDB.initializeAdsenseSlots) {
            setTimeout(() => {
                btpDB.initializeAdsenseSlots().then(slots => {
                    console.log(`✅ ${slots.length} slots Adsense initialisés`);
                });
            }, 1000);
        }
    }

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

    loadAccountSection() {
        console.log('💼 Chargement section mon compte...');
        
        if (!this.state.currentUser) {
            showAlert('🔐 Veuillez vous connecter', 'warning');
            if (typeof showLoginModal === 'function') {
                showLoginModal();
            }
            return;
        }

        if (typeof userProfileManager !== 'undefined') {
            setTimeout(() => userProfileManager.loadUserProfile(), 100);
        } else if (typeof loadProfileData === 'function') {
            setTimeout(() => loadProfileData(), 100);
        }

        this.showAccountTab('profile');
    }

    showAccountTab(tabName) {
        console.log('📑 Affichage onglet compte:', tabName);
        
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

    initializePublishSection() {
        console.log('🎯 Initialisation section publication...');
        
        const citySelects = document.querySelectorAll('select[name="city"]');
        citySelects.forEach(select => {
            if (select.children.length <= 1) {
                this.loadCitiesIntoSelect(select);
            }
        });

        const marketplaceCategorySelect = document.getElementById('marketplaceCategorySelect');
        if (marketplaceCategorySelect && marketplaceCategorySelect.children.length <= 1) {
            this.loadMarketplaceCategories();
        }
        
        // INITIALISATION - SEULEMENT le nouveau système (10 photos)
        this.initializeNewPhotoUploadSystem();
        
        // Déclencher l'initialisation des formulaires immobilier
        this.triggerRealEstateFormInitialization();
        
        setTimeout(() => {
            const hasActiveForm = document.querySelector('.publish-form[style*="display: block"]');
            if (!hasActiveForm) {
                this.showPublishForm('marketplace');
            }
            
            this.initializePublishNavigation();
        }, 200);
    }

    // NOUVELLE MÉTHODE - Uniquement le système de 10 photos
    initializeNewPhotoUploadSystem() {
        console.log('📸 Initialisation du NOUVEAU système d\'upload (10 photos)...');
        
        // Vérifier que PhotoUploadSystem est disponible
        if (typeof PhotoUploadSystem === 'undefined' || !window.photoUploadSystemInstance) {
            console.warn('❌ PhotoUploadSystem non disponible');
            return;
        }
        
        console.log('✅ PhotoUploadSystem disponible');
        
        // Initialiser seulement si les formulaires existent
        const formsToInitialize = [
            { id: 'marketplace-form', name: 'Marketplace' },
            { id: 'immobilier-form', name: 'Immobilier' },
            { id: 'jobs-form', name: 'Jobs' },
            { id: 'freelancers-form', name: 'Freelancers' }
        ];
        
        formsToInitialize.forEach(form => {
            if (document.getElementById(form.id)) {
                console.log(`📸 Initialisation pour ${form.name}`);
                window.photoUploadSystemInstance.initialize(form.id);
            }
        });
    }

    triggerRealEstateFormInitialization() {
        console.log('🎬 Déclenchement initialisation formulaire immobilier...');
        
        const immobilierForm = document.getElementById('immobilier-form');
        
        if (!immobilierForm) {
            console.log('⚠️ Formulaire immobilier-form non trouvé, recherche alternative...');
            const allForms = document.querySelectorAll('.publish-form');
            let foundForm = null;
            allForms.forEach(form => {
                const text = form.textContent.toLowerCase();
                if (text.includes('immobilier')) {
                    foundForm = form;
                    console.log('🔍 Formulaire immobilier trouvé par texte:', form.id || 'sans-id');
                }
            });
            
            if (!foundForm) {
                console.log('❌ Aucun formulaire immobilier trouvé');
                return;
            }
        }
        
        if (typeof initializeRealEstateFormTypes === 'function') {
            console.log('✅ Appel de initializeRealEstateFormTypes');
            setTimeout(() => {
                initializeRealEstateFormTypes();
            }, 300);
        } else if (typeof forceInitializeRealEstateForm === 'function') {
            console.log('✅ Appel de forceInitializeRealEstateForm');
            setTimeout(() => {
                forceInitializeRealEstateForm();
            }, 300);
        } else {
            console.log('ℹ️ Fonctions d\'initialisation non disponibles');
        }
    }

    manualRealEstateFormInitialization() {
        console.log('🔧 Initialisation manuelle du formulaire immobilier...');
        
        const immobilierForm = document.getElementById('immobilier-form');
        if (!immobilierForm) {
            console.log('❌ Formulaire immobilier-form non trouvé');
            return;
        }
        
        const typeSelect = immobilierForm.querySelector('select[name="type"], select');
        if (typeSelect) {
            console.log('🎯 Select trouvé:', typeSelect.id || typeSelect.name);
            
            if (typeSelect.options.length < 15) {
                console.log('⚠️ Select incomplet, initialisation...');
                
                const propertyTypes = [
                    { value: 'villa', label: 'Villa' },
                    { value: 'appartement', label: 'Appartement' },
                    { value: 'maison', label: 'Maison' },
                    { value: 'ferme', label: 'Ferme' },
                    { value: 'bungalow', label: 'Bungalow' },
                    { value: 'usine', label: 'Usine' },
                    { value: 'entrepot', label: 'Entrepôt' },
                    { value: 'bureau', label: 'Bureau' },
                    { value: 'local', label: 'Local commercial' },
                    { value: 'terrain', label: 'Terrain' },
                    { value: 'duplex', label: 'Duplex' },
                    { value: 'studio', label: 'Studio' },
                    { value: 'riad', label: 'Riad' },
                    { value: 'chalet', label: 'Chalet' },
                    { value: 'residence', label: 'Résidence' },
                    { value: 'immeuble', label: 'Immeuble' },
                    { value: 'garage', label: 'Garage' },
                    { value: 'commerce', label: 'Commerce' },
                    { value: 'cafe', label: 'Café' },
                    { value: 'magasin', label: 'Magasin' }
                ];
                
                const defaultOption = typeSelect.options[0];
                typeSelect.innerHTML = '';
                
                if (defaultOption) {
                    typeSelect.appendChild(defaultOption);
                } else {
                    const defaultOpt = document.createElement('option');
                    defaultOpt.value = '';
                    defaultOpt.textContent = 'Type de bien';
                    typeSelect.appendChild(defaultOpt);
                }
                
                propertyTypes.forEach(type => {
                    const option = document.createElement('option');
                    option.value = type.value;
                    option.textContent = type.label;
                    typeSelect.appendChild(option);
                });
                
                console.log(`✅ ${propertyTypes.length} types ajoutés manuellement`);
                showAlert('✅ Types de biens mis à jour (20 types disponibles)', 'success');
            } else {
                console.log('✅ Select déjà complet:', typeSelect.options.length, 'options');
            }
        } else {
            console.log('❌ Aucun select trouvé dans le formulaire immobilier');
        }
    }

    showPublishForm(formType) {
        console.log('📝 Affichage formulaire:', formType);
        
        let formId = formType + '-form';
        if (formType === 'realestate') {
            if (document.getElementById('immobilier-form')) {
                formId = 'immobilier-form';
            }
        }
        
        document.querySelectorAll('.publish-form').forEach(form => {
            form.style.display = 'none';
        });
        
        const targetForm = document.getElementById(formId);
        if (targetForm) {
            targetForm.style.display = 'block';
            console.log('✅ Formulaire affiché:', formId);
            
            // Réinitialiser l'upload photo seulement pour le nouveau système
            setTimeout(() => {
                if (typeof PhotoUploadSystem !== 'undefined' && window.photoUploadSystemInstance) {
                    window.photoUploadSystemInstance.initialize(formId);
                }
            }, 100);
            
            if (formType === 'realestate') {
                setTimeout(() => {
                    this.triggerRealEstateFormInitialization();
                }, 100);
            }
        } else {
            console.warn('❌ Formulaire non trouvé:', formId);
            
            if (formType === 'realestate') {
                const allForms = document.querySelectorAll('.publish-form');
                allForms.forEach(form => {
                    const text = form.textContent.toLowerCase();
                    if (text.includes('immobilier')) {
                        console.log('🔍 Formulaire immobilier trouvé par texte');
                        form.style.display = 'block';
                        setTimeout(() => {
                            this.triggerRealEstateFormInitialization();
                        }, 100);
                    }
                });
            }
        }
        
        this.updatePublishNavigation(formType);
    }

    updatePublishNavigation(activeFormType) {
        console.log('🎯 Mise à jour navigation pour:', activeFormType);
        
        const publishSection = document.getElementById('publish-section');
        if (publishSection) {
            const allNavItems = publishSection.querySelectorAll('.list-group-item, .nav-link');
            allNavItems.forEach(item => {
                item.classList.remove('active', 'bg-primary', 'text-white');
                item.classList.add('bg-light', 'text-dark');
            });
        }
        
        let activeNavItem = document.querySelector(`[onclick*="showPublishForm('${activeFormType}')"]`);
        
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
        
        if (activeNavItem) {
            activeNavItem.classList.remove('bg-light', 'text-dark');
            activeNavItem.classList.add('active', 'bg-primary', 'text-white');
        }
    }

    initializePublishNavigation() {
        const navItems = document.querySelectorAll('.publish-nav .list-group-item');
        console.log('🔧 Initialisation navigation publication:', navItems.length, 'éléments');
        
        navItems.forEach(item => {
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
        if (typeof updateAuthUI === 'function') {
            updateAuthUI();
        } else {
            console.warn('⚠️ updateAuthUI non disponible - fallback manuel');
            this.fallbackUpdateAuthUI();
        }
    }

    fallbackUpdateAuthUI() {
        console.log('🔄 Fallback mise à jour interface auth...');
        
        const authButtons = document.getElementById('auth-buttons');
        const userMenu = document.getElementById('user-menu');
        const adminNavItem = document.getElementById('admin-nav-item');
        const adminMenuItem = document.getElementById('admin-menu-item');
        
        if (this.state.currentUser && this.state.isAuthenticated) {
            if (authButtons) authButtons.style.display = 'none';
            if (userMenu) userMenu.style.display = 'flex';
            
            if (this.state.isAdmin) {
                if (adminNavItem) adminNavItem.style.display = 'block';
                if (adminMenuItem) adminMenuItem.style.display = 'block';
            } else {
                if (adminNavItem) adminNavItem.style.display = 'none';
                if (adminMenuItem) adminMenuItem.style.display = 'none';
            }
        } else {
            if (authButtons) authButtons.style.display = 'flex';
            if (userMenu) userMenu.style.display = 'none';
            if (adminNavItem) adminNavItem.style.display = 'none';
            if (adminMenuItem) adminMenuItem.style.display = 'none';
        }
    }

    requireAuth(callback) {
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

// ========== FONCTIONS GLOBALES ==========

window.showPublishForm = function(formType) {
    if (btpApp && btpApp.showPublishForm) {
        btpApp.showPublishForm(formType);
    } else {
        document.querySelectorAll('.publish-form').forEach(form => {
            form.style.display = 'none';
        });
        
        let formId = formType + '-form';
        if (formType === 'realestate' && document.getElementById('immobilier-form')) {
            formId = 'immobilier-form';
        }
        
        const targetForm = document.getElementById(formId);
        if (targetForm) {
            targetForm.style.display = 'block';
        }
        
        document.querySelectorAll('.publish-nav .list-group-item').forEach(item => {
            item.classList.remove('active');
        });
        const activeNavItem = document.querySelector(`[onclick*="showPublishForm('${formType}')"]`);
        if (activeNavItem) {
            activeNavItem.classList.add('active');
        }
    }
};

window.showAccountTab = function(tabName) {
    if (btpApp && btpApp.showAccountTab) {
        btpApp.showAccountTab(tabName);
    } else {
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

window.goToPublish = function(defaultForm = 'marketplace') {
    if (typeof checkAuthForPublish === 'function' && checkAuthForPublish()) {
        goToSection('publish');
        
        setTimeout(() => {
            showPublishForm(defaultForm);
        }, 100);
    }
};

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

window.showUserProfile = function() {
    if (btpApp && btpApp.showUserProfile) {
        btpApp.showUserProfile();
    } else {
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

console.log('✅ app.js CORRIGÉ - Ancien système d\'upload 5 photos SUPPRIMÉ, seul le système 10 photos reste');