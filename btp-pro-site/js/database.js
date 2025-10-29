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

try {
    // Initialiser Firebase
    firebaseApp = firebase.initializeApp(firebaseConfig);
    firestore = firebase.firestore();
    auth = firebase.auth();
    firebaseOnline = true;
    console.log('✅ Firebase initialisé avec succès');
} catch (error) {
    console.warn('❌ Firebase non disponible, utilisation du localStorage:', error);
    firebaseOnline = false;
}

// ========== BASE DE DONNÉES AVEC FALLBACK ==========
class BTPDatabase {
    constructor() {
        this.localStorageKey = 'btp_pro_local_db';
        this.init();
    }

    init() {
        if (!localStorage.getItem(this.localStorageKey)) {
            this.initializeLocalData();
        }
        
        // Synchroniser avec Firebase si disponible
        if (firebaseOnline) {
            this.syncWithFirebase();
        }
    }

    async syncWithFirebase() {
        try {
            console.log('🔄 Synchronisation avec Firebase...');
            
            // Synchroniser les utilisateurs
            const usersSnapshot = await firestore.collection('users').get();
            if (!usersSnapshot.empty) {
                const firebaseUsers = usersSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
                const localData = this.getLocalData();
                localData.users = firebaseUsers;
                this.saveLocalData(localData);
            }
            
            console.log('✅ Synchronisation Firebase terminée');
        } catch (error) {
            console.warn('⚠️ Erreur synchronisation Firebase:', error);
        }
    }

    initializeLocalData() {
        const initialData = {
            users: [
                {
                    id: 1,
                    prenom: "Admin",
                    nom: "BTP",
                    email: "admin@btp.ma",
                    password: this.hashPassword("admin123"),
                    phone: "+212 6 00 00 00 00",
                    role: "admin",
                    isVerified: true,
                    isBlocked: false,
                    hasPremium: true,
                    visitCount: 15,
                    lastVisit: new Date().toISOString(),
                    createdAt: new Date().toISOString()
                },
                {
                    id: 2,
                    prenom: "Abderrahmane",
                    nom: "Lyaakobi",
                    email: "lyaakobi@hotmail.com",
                    password: this.hashPassword("@nisawsan1"),
                    phone: "+212 6 63 06 62 25",
                    role: "user",
                    isVerified: true,
                    isBlocked: false,
                    hasPremium: true,
                    visitCount: 8,
                    lastVisit: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
                    createdAt: new Date().toISOString()
                },
                {
                    id: 3,
                    prenom: "Younes",
                    nom: "Hachimi",
                    email: "y.hachimi.yh@gmail.com",
                    password: this.hashPassword("@younes1"),
                    role: "user",
                    isVerified: true,
                    isBlocked: false,
                    hasPremium: true,
                    visitCount: 12,
                    lastVisit: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString(),
                    createdAt: new Date().toISOString()
                }
            ],
            marketplace_posts: [
                {
                    id: 1,
                    title: "Ciment CPJ45 Lafarge",
                    description: "Sac de 50kg - Qualité Premium",
                    price: 85,
                    unit: "sac",
                    category: "ciment",
                    city: "casablanca",
                    phone: "+212 6 63 06 62 25",
                    status: ANNOUNCE_STATUS.APPROVED,
                    userId: 2,
                    userName: "Abderrahmane Lyaakobi",
                    isPremium: false,
                    photos: [],
                    createdAt: new Date(Date.now() - 35 * 24 * 60 * 60 * 1000).toISOString()
                },
                {
                    id: 2,
                    title: "Carreaux Céramique 30x30",
                    description: "Marque Céragrès - Lot de 10m²",
                    price: 120,
                    unit: "m2",
                    category: "revetement",
                    city: "rabat",
                    phone: "+212 6 87 65 43 21",
                    status: ANNOUNCE_STATUS.APPROVED,
                    userId: 1,
                    userName: "Admin BTP",
                    isPremium: false,
                    photos: [],
                    createdAt: new Date().toISOString()
                }
            ],
            realestate_posts: [
                {
                    id: 1,
                    title: "Villa Moderne 220m² - Marrakech",
                    description: "Villa moderne avec 4 chambres, 3 salles de bain, garage",
                    price: 2800000,
                    type: "villa",
                    transaction: "vente",
                    surface: 220,
                    rooms: 4,
                    address: "Gueliz, Marrakech",
                    phone: "+212 6 63 06 62 25",
                    status: ANNOUNCE_STATUS.APPROVED,
                    userId: 2,
                    userName: "Abderrahmane Lyaakobi",
                    isPremium: true,
                    photos: [],
                    createdAt: new Date(Date.now() - 40 * 24 * 60 * 60 * 1000).toISOString()
                }
            ],
            job_posts: [
                {
                    id: 1,
                    poste: "Chef de Chantier BTP",
                    description: "Management d'équipe, suivi de chantier, respect des délais",
                    salaire: "15 000 - 18 000 MAD/mois",
                    contrat: "cdi",
                    ville: "casablanca",
                    experience: "5+ ans",
                    phone: "+212 6 63 06 62 25",
                    status: ANNOUNCE_STATUS.APPROVED,
                    userId: 2,
                    userName: "Abderrahmane Lyaakobi",
                    isPremium: true,
                    createdAt: new Date().toISOString()
                }
            ],
            freelancers: [
                {
                    id: 1,
                    title: "Infographiste 3D BTP - Freelance",
                    description: "Création de rendus 3D photoréalistes pour projets BTP, visualisations architecturales et conception de plans techniques",
                    specialty: "infographie",
                    tarif: "500-1000 MAD/jour",
                    ville: "casablanca",
                    experience: "5+ ans",
                    portfolio: "https://portfolio-lyaakobi.com",
                    phone: "+212 6 63 06 62 25",
                    status: ANNOUNCE_STATUS.APPROVED,
                    userId: 2,
                    userName: "Abderrahmane Lyaakobi",
                    rating: 4.8,
                    reviewCount: 12,
                    isPremium: true,
                    createdAt: new Date(Date.now() - 45 * 24 * 60 * 60 * 1000).toISOString()
                }
            ],
            professionals: [
                {
                    id: 1,
                    company: "Maçonnerie Lyaakobi",
                    specialty: "maçonnerie",
                    experience: 15,
                    city: "casablanca",
                    description: "Spécialiste en gros œuvre et fondations",
                    phone: "+212 6 63 06 62 25",
                    rating: 4.8,
                    reviewCount: 124,
                    userId: 2
                },
                {
                    id: 2,
                    company: "Électricité BTP Pro",
                    specialty: "electricite",
                    experience: 8,
                    city: "rabat",
                    description: "Installation électrique complète, mise aux normes",
                    phone: "+212 6 87 65 43 21",
                    rating: 4.9,
                    reviewCount: 89,
                    userId: 3
                }
            ],
            messages: [],
            user_announces: [],
            favorites: [],
            adsense_slots: [
                {
                    id: 'header_ad',
                    name: 'Bannière en-tête',
                    code: '',
                    position: 'header'
                },
                {
                    id: 'sidebar_ad',
                    name: 'Panneau latéral',
                    code: '',
                    position: 'sidebar'
                },
                {
                    id: 'footer_ad',
                    name: 'Pied de page',
                    code: '',
                    position: 'footer'
                }
            ],
            forum_topics: [],
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
    }

    // Hash simple pour les mots de passe
    hashPassword(password) {
        let hash = 0;
        for (let i = 0; i < password.length; i++) {
            const char = password.charCodeAt(i);
            hash = ((hash << 5) - hash) + char;
            hash = hash & hash;
        }
        return hash.toString();
    }

    async get(collection) {
        if (firebaseOnline) {
            try {
                const snapshot = await firestore.collection(collection).get();
                return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
            } catch (error) {
                console.warn(`⚠️ Erreur Firebase pour ${collection}, fallback localStorage:`, error);
                firebaseOnline = false;
            }
        }
        
        // Fallback localStorage
        const localData = this.getLocalData();
        return localData[collection] || [];
    }

    async post(collection, data) {
        const item = {
            id: Date.now(),
            createdAt: new Date().toISOString(),
            ...data
        };

        if (firebaseOnline) {
            try {
                const docRef = await firestore.collection(collection).add(item);
                item.id = docRef.id;
            } catch (error) {
                console.warn(`⚠️ Erreur Firebase pour ${collection}, fallback localStorage:`, error);
                firebaseOnline = false;
            }
        }

        // Sauvegarde locale
        const localData = this.getLocalData();
        if (!localData[collection]) localData[collection] = [];
        localData[collection].push(item);
        this.saveLocalData(localData);

        return item;
    }

    async put(collection, id, data) {
        if (firebaseOnline) {
            try {
                await firestore.collection(collection).doc(id.toString()).update(data);
            } catch (error) {
                console.warn(`⚠️ Erreur Firebase pour ${collection}, fallback localStorage:`, error);
                firebaseOnline = false;
            }
        }

        // Sauvegarde locale
        const localData = this.getLocalData();
        const index = localData[collection].findIndex(item => item.id === id);
        
        if (index !== -1) {
            localData[collection][index] = { ...localData[collection][index], ...data };
            this.saveLocalData(localData);
            return localData[collection][index];
        }
        
        return null;
    }

    getLocalData() {
        return JSON.parse(localStorage.getItem(this.localStorageKey)) || {};
    }

    saveLocalData(data) {
        localStorage.setItem(this.localStorageKey, JSON.stringify(data));
    }

    async authenticateUser(email, password) {
        if (firebaseOnline) {
            try {
                const userCredential = await auth.signInWithEmailAndPassword(email, password);
                const user = userCredential.user;
                
                // Récupérer les données utilisateur depuis Firestore
                const userDoc = await firestore.collection('users').doc(user.uid).get();
                if (userDoc.exists) {
                    return { id: user.uid, ...userDoc.data() };
                }
            } catch (error) {
                console.warn('⚠️ Erreur Firebase auth, fallback localStorage:', error);
                firebaseOnline = false;
            }
        }

        // Fallback localStorage
        const users = await this.get('users');
        const hashedPassword = this.hashPassword(password);
        const user = users.find(u => u.email === email && u.password === hashedPassword);
        return user || null;
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
                    password: this.hashPassword(userData.password),
                    role: 'user',
                    isVerified: false,
                    isBlocked: false,
                    hasPremium: false,
                    visitCount: 0,
                    lastVisit: new Date().toISOString(),
                    createdAt: new Date().toISOString()
                };
                
                await firestore.collection('users').doc(user.uid).set(newUser);
                return newUser;
                
            } catch (error) {
                console.warn('⚠️ Erreur Firebase register, fallback localStorage:', error);
                firebaseOnline = false;
            }
        }

        // Fallback localStorage
        const newUser = {
            id: Date.now(),
            ...userData,
            password: this.hashPassword(userData.password),
            role: 'user',
            isVerified: false,
            isBlocked: false,
            hasPremium: false,
            visitCount: 0,
            lastVisit: new Date().toISOString(),
            createdAt: new Date().toISOString()
        };

        const localData = this.getLocalData();
        localData.users.push(newUser);
        this.saveLocalData(localData);

        return newUser;
    }

    async incrementUserVisit(userId) {
        const users = await this.get('users');
        const userIndex = users.findIndex(u => u.id === userId);
        
        if (userIndex !== -1) {
            const currentVisits = users[userIndex].visitCount || 0;
            users[userIndex].visitCount = currentVisits + 1;
            users[userIndex].lastVisit = new Date().toISOString();
            
            const localData = this.getLocalData();
            localData.users = users;
            this.saveLocalData(localData);
            
            return users[userIndex].visitCount;
        }
        return 0;
    }
}

// ========== INITIALISATION ==========
const btpDB = new BTPDatabase();