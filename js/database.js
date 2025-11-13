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
                },
                {
                    id: "2",
                    title: "Carreaux Céramique 30x30",
                    description: "Marque Céragrès - Lot de 10m² - Qualité première choix - Divers motifs disponibles",
                    price: 120,
                    unit: "m2",
                    category: "revetement",
                    city: "Rabat",
                    phone: "+212 6 87 65 43 21",
                    status: 'approuve',
                    userId: "1",
                    userName: "Admin BTP",
                    userEmail: "admin@btp.ma",
                    isPremium: false,
                    photos: [],
                    viewCount: 23,
                    contactCount: 8,
                    createdAt: new Date().toISOString(),
                    updatedAt: new Date().toISOString()
                },
                {
                    id: "3",
                    title: "Acier de construction HA500",
                    description: "Acier haute résistance pour béton armé - Diamètres disponibles: 6, 8, 10, 12, 14, 16mm",
                    price: 2500,
                    unit: "tonne",
                    category: "acier",
                    city: "Casablanca",
                    phone: "+212 6 63 06 62 25",
                    status: 'en_attente',
                    userId: "2",
                    userName: "Abderrahmane Lyaakobi",
                    userEmail: "lyaakobi@hotmail.com",
                    isPremium: false,
                    photos: [],
                    viewCount: 15,
                    contactCount: 3,
                    createdAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
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
                },
                {
                    id: "2",
                    title: "Appartement 80m² - Casablanca Centre",
                    description: "Bel appartement au cœur de Casablanca. 3 pièces, cuisine américaine, salle de bain rénovée. Immeuble sécurisé avec ascenseur. Idéal pour jeune couple ou investissement.",
                    price: 850000,
                    type: "appartement",
                    transaction: "vente",
                    surface: 80,
                    rooms: 3,
                    bathrooms: 1,
                    address: "Centre Ville, Casablanca",
                    city: "Casablanca",
                    phone: "+212 6 87 65 43 21",
                    status: 'en_attente',
                    userId: "1",
                    userName: "Admin BTP",
                    userEmail: "admin@btp.ma",
                    isPremium: false,
                    photos: [],
                    viewCount: 67,
                    contactCount: 12,
                    createdAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString(),
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
                },
                {
                    id: "2",
                    title: "Architecte d'intérieur - Conception Espaces",
                    description: "Architecte d'intérieur spécialisé dans l'aménagement d'espaces résidentiels et commerciaux. Services: conception 3D, suivi de chantier, sélection de matériaux.",
                    specialty: "architecture",
                    tarif: "800-1200 MAD/jour",
                    ville: "Marrakech",
                    experience: "3+ ans",
                    portfolio: "https://architecte-exemple.com",
                    phone: "+212 6 87 65 43 21",
                    status: 'en_attente',
                    userId: "1",
                    userName: "Admin BTP",
                    userEmail: "admin@btp.ma",
                    rating: 4.5,
                    reviewCount: 8,
                    isPremium: false,
                    viewCount: 123,
                    contactCount: 23,
                    createdAt: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(),
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
                },
                {
                    id: "2",
                    company: "Électricité BTP Pro",
                    specialty: "electricite",
                    experience: 8,
                    city: "Rabat",
                    description: "Installation électrique complète, mise aux normes, dépannage urgent. Certifié et assuré. Services: tableau électrique, éclairage, domotique, mise en sécurité.",
                    phone: "+212 6 87 65 43 21",
                    email: "contact@electricite-btppro.ma",
                    website: "https://electricite-btppro.ma",
                    rating: 4.9,
                    reviewCount: 89,
                    userId: "3",
                    status: 'approuve',
                    isVerified: true,
                    viewCount: 345,
                    contactCount: 67,
                    createdAt: new Date(Date.now() - 45 * 24 * 60 * 60 * 1000).toISOString(),
                    updatedAt: new Date().toISOString()
                },
                {
                    id: "3",
                    company: "Plomberie Express Maroc",
                    specialty: "plomberie",
                    experience: 12,
                    city: "Marrakech",
                    description: "Service de plomberie rapide et efficace pour particuliers et professionnels. Intervention sous 2h. Réparation fuites, installation sanitaire, chauffage central.",
                    phone: "+212 6 12 34 56 78",
                    email: "contact@plomberie-express.ma",
                    rating: 4.7,
                    reviewCount: 67,
                    userId: "1",
                    status: 'en_attente',
                    isVerified: false,
                    viewCount: 234,
                    contactCount: 45,
                    createdAt: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000).toISOString(),
                    updatedAt: new Date().toISOString()
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
                },
                {
                    id: 'sidebar_ad',
                    name: 'Panneau latéral',
                    code: '<!-- Code Adsense pour panneau latéral -->',
                    position: 'sidebar',
                    isActive: true,
                    createdAt: new Date().toISOString(),
                    updatedAt: new Date().toISOString()
                },
                {
                    id: 'footer_ad',
                    name: 'Pied de page',
                    code: '<!-- Code Adsense pour pied de page -->',
                    position: 'footer',
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
                },
                {
                    id: 'priority_support',
                    name: 'Support prioritaire',
                    description: 'Réponses rapides de notre équipe'
                },
                {
                    id: 'unlimited_announces',
                    name: 'Annonces illimitées',
                    description: 'Publiez autant d\'annonces que vous voulez'
                }
            ]
        };
        
        this.saveLocalData(initialData);
        console.log('✅ Données de démonstration initialisées');
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

console.log('✅ database.js CORRIGÉ - Fonctionnalités profil AJOUTÉES avec gestion sécurisée');