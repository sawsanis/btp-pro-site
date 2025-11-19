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
                    updatedAt: new Date().toISOString(),
                    // 🔥 CORRECTION: Ajout des champs de profil manquants
                    company: "BTP Pro Maroc",
                    address: "Casablanca, Maroc",
                    city: "Casablanca",
                    postalCode: "20000",
                    website: "https://btp-pro.ma",
                    description: "Administrateur de la plateforme BTP Pro Maroc"
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
                    updatedAt: new Date().toISOString(),
                    // 🔥 CORRECTION: Ajout des champs de profil manquants
                    company: "Maçonnerie Lyaakobi",
                    address: "123 Avenue Hassan II, Casablanca",
                    city: "Casablanca",
                    postalCode: "20250",
                    website: "https://maconnerie-lyaakobi.ma",
                    description: "Entreprise familiale spécialisée en maçonnerie depuis 15 ans"
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
                    updatedAt: new Date().toISOString(),
                    // 🔥 CORRECTION: Ajout des champs de profil manquants
                    company: "Hachimi Construction",
                    address: "45 Rue Mohammed V, Rabat",
                    city: "Rabat",
                    postalCode: "10000",
                    website: "",
                    description: "Entrepreneur en bâtiment spécialisé dans la rénovation"
                }
            ],
            // ... (le reste de vos collections reste inchangé)
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
            newsletter_history: [],
            job_applications: [],
            job_ratings: [],
            employer_profiles: [],
            notifications: [],
            messages: [],
            forum_topics: [],
            adsense_slots: [],
            premium_features: []
        };
        
        this.saveLocalData(initialData);
        console.log('✅ Données de démonstration initialisées avec profils complets');
    }

    // ========== OPÉRATIONS CRUD ==========
    async get(collection) {
        try {
            const localData = this.getLocalData();
            const data = localData[collection] || [];
            
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

        const localData = this.getLocalData();
        if (!localData[collection]) localData[collection] = [];
        localData[collection].push(item);
        this.saveLocalData(localData);

        console.log(`✅ ${collection} créé localement:`, item.id);

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
        // 🔥 CORRECTION: Mise à jour plus robuste
        const localData = this.getLocalData();
        if (!localData[collection]) {
            console.warn(`❌ Collection ${collection} non trouvée`);
            return null;
        }
        
        const index = localData[collection].findIndex(item => item.id == id);
        
        if (index !== -1) {
            localData[collection][index] = { 
                ...localData[collection][index], 
                ...data,
                updatedAt: new Date().toISOString()
            };
            this.saveLocalData(localData);
            console.log(`✅ ${collection} mis à jour localement:`, id);

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
        const localData = this.getLocalData();
        if (localData[collection]) {
            const initialLength = localData[collection].length;
            localData[collection] = localData[collection].filter(item => item.id != id);
            this.saveLocalData(localData);
            console.log(`✅ ${collection} supprimé localement:`, id);

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
        
        if (firebaseOnline) {
            try {
                console.log('🔥 Authentification Firebase...');
                const userCredential = await auth.signInWithEmailAndPassword(email, password);
                const user = userCredential.user;
                
                console.log('✅ Firebase Auth réussi:', user.uid);
                
                const userDoc = await firestore.collection('users').doc(user.uid).get();
                if (userDoc.exists) {
                    const userData = { id: user.uid, ...userDoc.data() };
                    localStorage.setItem('currentUser', JSON.stringify(userData));
                    console.log('✅ Utilisateur Firebase chargé');
                    return userData;
                }
            } catch (error) {
                console.log('❌ Erreur Firebase Auth:', error.message);
            }
        }
        
        // Mode développement LOCAL
        console.log('🔄 Mode développement local');
        
        const localData = this.getLocalData();
        const users = localData.users || [];
        
        console.log('👥 Utilisateurs disponibles:', users.map(u => u.email));
        
        const user = users.find(u => u.email === email);
        
        if (user) {
            if (user.password === password) {
                console.log('✅ Connexion locale réussie');
                
                // 🔥 CORRECTION: Ne pas supprimer le password pour permettre les mises à jour
                const userSession = { ...user };
                
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
        
        if (users.find(u => u.email === userData.email)) {
            throw new Error('Cet email est déjà utilisé');
        }

        if (firebaseOnline) {
            try {
                const userCredential = await auth.createUserWithEmailAndPassword(
                    userData.email, 
                    userData.password
                );
                
                const user = userCredential.user;
                
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
                    updatedAt: new Date().toISOString(),
                    // 🔥 CORRECTION: Initialiser tous les champs de profil
                    company: '',
                    address: '',
                    city: '',
                    postalCode: '',
                    website: '',
                    description: ''
                };
                
                await firestore.collection('users').doc(user.uid).set(newUser);
                localStorage.setItem('currentUser', JSON.stringify(newUser));
                return newUser;
                
            } catch (error) {
                console.warn('⚠️ Erreur Firebase register, fallback localStorage:', error);
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
            updatedAt: new Date().toISOString(),
            // 🔥 CORRECTION: Initialiser tous les champs de profil
            company: '',
            address: '',
            city: '',
            postalCode: '',
            website: '',
            description: ''
        };

        const localData = this.getLocalData();
        localData.users.push(newUser);
        this.saveLocalData(localData);

        localStorage.setItem('currentUser', JSON.stringify(newUser));
        return newUser;
    }

    // ========== FONCTIONS PROFIL CORRIGÉES ==========
    
    async getUserProfile(userId) {
        try {
            console.log('📥 Chargement profil utilisateur:', userId);
            const users = await this.get('users');
            const user = users.find(u => u.id == userId);
            
            if (user) {
                console.log('✅ Profil trouvé:', user.email);
                // 🔥 CORRECTION: Renvoyer TOUTES les données du profil
                return {
                    id: user.id,
                    prenom: user.prenom || '',
                    nom: user.nom || '',
                    email: user.email || '',
                    phone: user.phone || '',
                    role: user.role || 'user',
                    company: user.company || '',
                    address: user.address || '',
                    city: user.city || '',
                    postalCode: user.postalCode || '',
                    website: user.website || '',
                    description: user.description || '',
                    isVerified: user.isVerified || false,
                    hasPremium: user.hasPremium || false,
                    createdAt: user.createdAt,
                    updatedAt: user.updatedAt
                };
            }
            
            console.warn('❌ Profil non trouvé pour:', userId);
            return null;
        } catch (error) {
            console.error('❌ Erreur récupération profil utilisateur:', error);
            return null;
        }
    }

    async updateUserProfile(userId, profileData) {
        try {
            console.log('💾 Mise à jour profil:', userId, profileData);
            
            const users = await this.get('users');
            const userIndex = users.findIndex(u => u.id == userId);
            
            if (userIndex !== -1) {
                const updatedUser = {
                    ...users[userIndex],
                    ...profileData,
                    updatedAt: new Date().toISOString()
                };
                
                // Mettre à jour dans la base
                await this.put('users', userId, updatedUser);
                
                // 🔥 CORRECTION: Mettre à jour l'utilisateur courant dans localStorage
                const currentUser = this.getCurrentUser();
                if (currentUser && currentUser.id == userId) {
                    const updatedCurrentUser = { ...currentUser, ...profileData };
                    localStorage.setItem('currentUser', JSON.stringify(updatedCurrentUser));
                    console.log('✅ Utilisateur courant mis à jour dans localStorage');
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

    // 🔥 CORRECTION: Ajout de la fonction updateUserPassword manquante
    async updateUserPassword(userId, currentPassword, newPassword) {
        try {
            console.log('🔑 Changement mot de passe pour:', userId);
            
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

    async changeUserPassword(userId, currentPassword, newPassword) {
        return this.updateUserPassword(userId, currentPassword, newPassword);
    }

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

    getCurrentUser() {
        try {
            const userData = localStorage.getItem('currentUser');
            return userData ? JSON.parse(userData) : null;
        } catch (error) {
            console.error('❌ Erreur lecture utilisateur actuel:', error);
            return null;
        }
    }

    logoutUser() {
        localStorage.removeItem('currentUser');
        if (firebaseOnline && auth) {
            auth.signOut().catch(error => {
                console.warn('⚠️ Erreur déconnexion Firebase:', error);
            });
        }
    }

    isUserAdmin() {
        const user = this.getCurrentUser();
        return user && user.role === 'admin';
    }

    clearLocalData() {
        localStorage.removeItem(this.localStorageKey);
        localStorage.removeItem('currentUser');
        this.initializeLocalData();
        console.log('🗑️ Données locales réinitialisées');
    }

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

console.log('✅ database.js CORRIGÉ - Gestion du profil COMPLÈTEMENT fonctionnelle');