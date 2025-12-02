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
let firebaseApp, firestore, auth, storage;
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
        storage = firebase.storage();
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
        this.firebaseInitialized = false;
        this.init();
    }

    init() {
        console.log('🗄️ Initialisation de la base de données...');
        
        if (!localStorage.getItem(this.localStorageKey)) {
            this.initializeLocalData();
        }
        
        // Tester la connexion Firebase
        this.testFirebaseConnection().then(isConnected => {
            this.firebaseInitialized = isConnected;
            if (isConnected) {
                console.log('✅ Firebase connecté et opérationnel');
                this.syncWithFirebase();
            } else {
                console.warn('⚠️ Mode hors ligne - utilisation localStorage uniquement');
            }
        }).catch(error => {
            console.warn('⚠️ Erreur connexion Firebase:', error.message);
            this.firebaseInitialized = false;
        });
        
        console.log('✅ Base de données initialisée');
    }

    async testFirebaseConnection() {
        if (!firebaseOnline) return false;
        
        try {
            // Tester avec une requête simple
            await firestore.collection('test_connection').limit(1).get();
            console.log('✅ Connexion Firebase testée avec succès');
            return true;
        } catch (error) {
            // Si permission denied, c'est que Firebase est accessible mais les règles bloquent
            if (error.code === 'permission-denied') {
                console.log('✅ Firebase accessible (règles restrictives)');
                return true;
            }
            
            console.warn('❌ Connexion Firebase échouée:', error.message);
            return false;
        }
    }

    async syncWithFirebase() {
        if (!this.firebaseInitialized) return;
        
        try {
            console.log('🔄 Synchronisation avec Firebase...');
            
            // Synchroniser les collections principales avec gestion d'erreurs
            const collections = [
                'users', 
                'marketplace_posts', 
                'realestate_posts', 
                'job_posts',
                'freelancers', 
                'professionals',
                'forum_topics',
                'forum_replies'
            ];
            
            for (const collection of collections) {
                await this.syncCollectionFromFirebase(collection);
            }
            
            console.log('✅ Synchronisation Firebase terminée');
        } catch (error) {
            console.warn('⚠️ Erreur synchronisation Firebase:', error.message);
            // Ne pas bloquer l'application en cas d'erreur
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
                    company: "BTP Pro Maroc",
                    address: "Casablanca, Maroc",
                    city: "Casablanca",
                    postalCode: "20000",
                    website: "https://btp-pro.ma",
                    description: "Administrateur de la plateforme BTP Pro Maroc",
                    metier: "Administration",
                    source: "système",
                    status: "actif"
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
                    company: "Maçonnerie Lyaakobi",
                    address: "123 Avenue Hassan II, Casablanca",
                    city: "Casablanca",
                    postalCode: "20250",
                    website: "https://maconnerie-lyaakobi.ma",
                    description: "Entreprise familiale spécialisée en maçonnerie depuis 15 ans",
                    metier: "Maçonnerie",
                    source: "import",
                    status: "actif"
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
                    company: "Hachimi Construction",
                    address: "45 Rue Mohammed V, Rabat",
                    city: "Rabat",
                    postalCode: "10000",
                    website: "",
                    description: "Entrepreneur en bâtiment spécialisé dans la rénovation",
                    metier: "Construction",
                    source: "site web",
                    status: "actif"
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
            forum_replies: [
                {
                    id: "1",
                    topicId: "1",
                    content: "Merci pour ce sujet intéressant ! Pour le dosage du béton, je recommande généralement un ratio 1:2:3 (ciment:sable:gravier) pour la plupart des applications courantes.",
                    authorId: "2",
                    authorName: "Abderrahmane Lyaakobi",
                    authorEmail: "lyaakobi@hotmail.com",
                    isSolution: true,
                    createdAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
                    updatedAt: new Date().toISOString()
                },
                {
                    id: "2", 
                    topicId: "1",
                    content: "Je confirme les recommandations d'Abderrahmane. N'oubliez pas de bien humidifier le sable et les graviers avant mélange pour un béton plus homogène.",
                    authorId: "3",
                    authorName: "Younes Hachimi", 
                    authorEmail: "y.hachimi.yh@gmail.com",
                    isSolution: false,
                    createdAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString(),
                    updatedAt: new Date().toISOString()
                }
            ],
            forum_topics: [
                {
                    id: "1",
                    title: "Problème de dosage béton pour fondation",
                    content: "Bonjour à tous, je rencontre des difficultés avec le dosage de mon béton pour des fondations de mur de soutènement. Quel ratio ciment/sable/gravier recommandez-vous ?",
                    category: "technique",
                    authorId: "2",
                    authorName: "Abderrahmane Lyaakobi",
                    authorEmail: "lyaakobi@hotmail.com",
                    replyCount: 2,
                    views: 15,
                    lastActivity: new Date().toISOString(),
                    status: "active",
                    isPinned: true,
                    tags: ["beton", "fondation", "dosage"],
                    createdAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString(),
                    updatedAt: new Date().toISOString()
                },
                {
                    id: "2",
                    title: "Quelle marque de ciment choisir ?",
                    content: "Je dois acheter du ciment pour un chantier à Casablanca. Quelle marque me conseillez-vous entre Lafarge, Asment et Ciments du Maroc ?",
                    category: "materiaux", 
                    authorId: "3",
                    authorName: "Younes Hachimi",
                    authorEmail: "y.hachimi.yh@gmail.com",
                    replyCount: 0,
                    views: 8,
                    lastActivity: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString(),
                    status: "active", 
                    isPinned: false,
                    tags: ["ciment", "marque", "qualite"],
                    createdAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString(),
                    updatedAt: new Date().toISOString()
                }
            ],
            newsletter_history: [],
            job_applications: [],
            job_ratings: [],
            employer_profiles: [],
            notifications: [],
            messages: [],
            adsense_slots: [],
            premium_features: [],
            temp_uploads: [] // Nouvelle collection pour les uploads temporaires
        };
        
        this.saveLocalData(initialData);
        console.log('✅ Données de démonstration initialisées avec forum complet');
    }

    // ========== OPÉRATIONS CRUD AVEC GESTION D'ERREURS ==========
    async get(collection, filters = {}) {
        try {
            const localData = this.getLocalData();
            let data = localData[collection] || [];
            
            // Appliquer les filtres si fournis
            if (Object.keys(filters).length > 0) {
                data = this.applyFilters(data, filters);
            }
            
            // Tenter une synchronisation Firebase en arrière-plan
            if (this.firebaseInitialized) {
                this.syncCollectionFromFirebase(collection).catch(error => {
                    console.warn(`⚠️ Sync Firebase ${collection} échouée:`, error.message);
                });
            }
            
            return data;
            
        } catch (error) {
            console.error(`❌ Erreur chargement ${collection}:`, error);
            return [];
        }
    }

    applyFilters(data, filters) {
        return data.filter(item => {
            for (const [key, value] of Object.entries(filters)) {
                if (value === undefined || value === null || value === '') continue;
                
                // Filtre par correspondance exacte ou partielle
                if (typeof value === 'string' && item[key]) {
                    if (!item[key].toLowerCase().includes(value.toLowerCase())) {
                        return false;
                    }
                } else if (item[key] !== value) {
                    return false;
                }
            }
            return true;
        });
    }

    async syncCollectionFromFirebase(collection) {
        if (!this.firebaseInitialized) return;
        
        try {
            console.log(`🔄 Tentative sync Firebase ${collection}...`);
            
            const snapshot = await firestore.collection(collection).limit(1).get();
            
            if (snapshot.empty) {
                console.log(`ℹ️ Collection ${collection} vide sur Firebase`);
                return;
            }
            
            // Récupérer toutes les données
            const fullSnapshot = await firestore.collection(collection).get();
            const firebaseData = fullSnapshot.docs.map(doc => {
                const data = doc.data();
                return { 
                    id: doc.id, 
                    ...data,
                    // Nettoyer les données sensibles
                    password: data.password ? '********' : undefined
                };
            });
            
            const localData = this.getLocalData();
            localData[collection] = this.mergeArrays(localData[collection] || [], firebaseData);
            this.saveLocalData(localData);
            
            console.log(`✅ ${collection} synchronisé depuis Firebase: ${firebaseData.length} éléments`);
            
        } catch (error) {
            console.warn(`⚠️ Erreur sync Firebase ${collection}:`, error.message);
            
            // Ne pas bloquer l'application en cas d'erreur Firebase
            if (error.code === 'permission-denied') {
                console.warn(`❌ Permission refusée pour ${collection}, utilisation des données locales`);
            }
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

        // Synchroniser avec Firebase en arrière-plan
        if (this.firebaseInitialized) {
            this.syncToFirebase(collection, item).catch(error => {
                console.warn(`⚠️ Sync Firebase ${collection} échouée:`, error.message);
            });
        }

        return item;
    }

    async syncToFirebase(collection, item) {
        if (!this.firebaseInitialized) return;
        
        try {
            // Nettoyer les données sensibles avant l'envoi à Firebase
            const cleanItem = { ...item };
            if (cleanItem.password && cleanItem.password !== '********') {
                cleanItem.password = '********'; // Ne pas envoyer les mots de passe réels
            }
            
            await firestore.collection(collection).doc(item.id.toString()).set(cleanItem);
            console.log(`☁️ ${collection} synchronisé vers Firebase:`, item.id);
        } catch (error) {
            console.warn(`⚠️ Erreur sync vers Firebase ${collection}:`, error.message);
        }
    }

    async put(collection, id, data) {
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

            // Synchroniser avec Firebase
            if (this.firebaseInitialized) {
                this.updateInFirebase(collection, id, data).catch(error => {
                    console.warn(`⚠️ Update Firebase ${collection} échouée:`, error.message);
                });
            }

            return localData[collection][index];
        }
        
        console.warn(`❌ ${collection} non trouvé:`, id);
        return null;
    }

    async updateInFirebase(collection, id, data) {
        if (!this.firebaseInitialized) return;
        
        try {
            await firestore.collection(collection).doc(id.toString()).update(data);
            console.log(`☁️ ${collection} mis à jour dans Firebase:`, id);
        } catch (error) {
            console.warn(`⚠️ Erreur update Firebase ${collection}:`, error.message);
        }
    }

    async delete(collection, id) {
        const localData = this.getLocalData();
        if (localData[collection]) {
            const initialLength = localData[collection].length;
            localData[collection] = localData[collection].filter(item => item.id != id);
            this.saveLocalData(localData);
            console.log(`✅ ${collection} supprimé localement:`, id);

            // Supprimer de Firebase
            if (this.firebaseInitialized) {
                this.deleteFromFirebase(collection, id).catch(error => {
                    console.warn(`⚠️ Delete Firebase ${collection} échouée:`, error.message);
                });
            }

            return initialLength !== localData[collection].length;
        }
        
        return false;
    }

    async deleteFromFirebase(collection, id) {
        if (!this.firebaseInitialized) return;
        
        try {
            await firestore.collection(collection).doc(id.toString()).delete();
            console.log(`☁️ ${collection} supprimé de Firebase:`, id);
        } catch (error) {
            console.warn(`⚠️ Erreur delete Firebase ${collection}:`, error.message);
        }
    }

    // ========== FONCTIONS POUR UPLOAD DE PHOTOS ==========
    
    async uploadPhoto(file, formId, userId) {
        console.log(`📸 Upload photo pour ${formId} par ${userId}`);
        
        try {
            // Générer un ID unique pour la photo
            const photoId = `${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
            const fileName = `${photoId}_${file.name}`;
            
            // 1. Sauvegarder localement (Base64)
            const localPhotoData = {
                id: photoId,
                name: fileName,
                formId: formId,
                userId: userId,
                url: await this.fileToBase64(file),
                size: file.size,
                type: file.type,
                uploadedAt: new Date().toISOString(),
                status: 'uploaded'
            };
            
            // Ajouter aux uploads temporaires
            await this.post('temp_uploads', localPhotoData);
            
            console.log(`✅ Photo sauvegardée localement: ${fileName}`);
            
            // 2. Tenter l'upload Firebase en arrière-plan
            if (this.firebaseInitialized && storage) {
                this.uploadToFirebaseStorage(file, fileName, photoId, formId, userId)
                    .catch(error => {
                        console.warn('⚠️ Upload Firebase échoué, photo disponible localement:', error.message);
                    });
            }
            
            return {
                success: true,
                photoId: photoId,
                localUrl: localPhotoData.url,
                fileName: fileName
            };
            
        } catch (error) {
            console.error('❌ Erreur upload photo:', error);
            return {
                success: false,
                error: error.message
            };
        }
    }
    
    async uploadToFirebaseStorage(file, fileName, photoId, formId, userId) {
        if (!this.firebaseInitialized || !storage) return;
        
        try {
            // Créer une référence dans le storage
            const storageRef = storage.ref();
            const photoRef = storageRef.child(`uploads/${formId}/${fileName}`);
            
            // Upload vers Firebase Storage
            const snapshot = await photoRef.put(file);
            const downloadURL = await snapshot.ref.getDownloadURL();
            
            console.log(`☁️ Photo uploadée vers Firebase Storage: ${downloadURL}`);
            
            // Mettre à jour l'enregistrement avec l'URL Firebase
            const tempUploads = await this.get('temp_uploads');
            const uploadIndex = tempUploads.findIndex(u => u.id === photoId);
            
            if (uploadIndex !== -1) {
                const updatedUpload = {
                    ...tempUploads[uploadIndex],
                    firebaseUrl: downloadURL,
                    status: 'synced',
                    updatedAt: new Date().toISOString()
                };
                
                await this.put('temp_uploads', photoId, updatedUpload);
            }
            
            return downloadURL;
            
        } catch (error) {
            console.warn('⚠️ Erreur upload Firebase Storage:', error.message);
            throw error;
        }
    }
    
    fileToBase64(file) {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.readAsDataURL(file);
            reader.onload = () => resolve(reader.result);
            reader.onerror = error => reject(error);
        });
    }
    
    async getUploadedPhotos(formId, userId) {
        try {
            const tempUploads = await this.get('temp_uploads');
            return tempUploads.filter(upload => 
                upload.formId === formId && upload.userId === userId
            );
        } catch (error) {
            console.error('❌ Erreur récupération photos:', error);
            return [];
        }
    }
    
    async clearUploadedPhotos(formId, userId) {
        try {
            const tempUploads = await this.get('temp_uploads');
            const userUploads = tempUploads.filter(upload => 
                upload.formId === formId && upload.userId === userId
            );
            
            for (const upload of userUploads) {
                await this.delete('temp_uploads', upload.id);
            }
            
            console.log(`✅ ${userUploads.length} photos supprimées pour ${formId}`);
            return true;
            
        } catch (error) {
            console.error('❌ Erreur suppression photos:', error);
            return false;
        }
    }

    // ========== AUTHENTIFICATION SÉCURISÉE ==========
    async authenticateUser(email, password) {
        console.log('🔐 Tentative de connexion:', email);
        
        if (this.firebaseInitialized) {
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

        if (this.firebaseInitialized) {
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
                    company: userData.company || '',
                    address: userData.address || '',
                    city: userData.city || '',
                    postalCode: userData.postalCode || '',
                    website: userData.website || '',
                    description: userData.description || '',
                    metier: userData.metier || '',
                    source: userData.source || 'site web',
                    status: userData.status || 'actif'
                };
                
                await firestore.collection('users').doc(user.uid).set(newUser);
                localStorage.setItem('currentUser', JSON.stringify(newUser));
                return newUser;
                
            } catch (error) {
                console.warn('⚠️ Erreur Firebase register, fallback localStorage:', error.message);
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
            company: userData.company || '',
            address: userData.address || '',
            city: userData.city || '',
            postalCode: userData.postalCode || '',
            website: userData.website || '',
            description: userData.description || '',
            metier: userData.metier || '',
            source: userData.source || 'site web',
            status: userData.status || 'actif'
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
                
                const completeUserProfile = {
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
                    metier: user.metier || '',
                    source: user.source || 'site web',
                    status: user.status || 'actif',
                    isVerified: user.isVerified || false,
                    hasPremium: user.hasPremium || false,
                    visitCount: user.visitCount || 0,
                    lastVisit: user.lastVisit || new Date().toISOString(),
                    createdAt: user.createdAt || new Date().toISOString(),
                    updatedAt: user.updatedAt || new Date().toISOString()
                };
                
                console.log('📋 Profil complet préparé:', completeUserProfile);
                return completeUserProfile;
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
                    email: profileData.email || users[userIndex].email,
                    phone: profileData.phone || '',
                    company: profileData.company || '',
                    address: profileData.address || '',
                    city: profileData.city || '',
                    postalCode: profileData.postalCode || '',
                    website: profileData.website || '',
                    description: profileData.description || '',
                    metier: profileData.metier || '',
                    source: profileData.source || users[userIndex].source,
                    status: profileData.status || users[userIndex].status,
                    updatedAt: new Date().toISOString()
                };
                
                await this.put('users', userId, updatedUser);
                
                const currentUser = this.getCurrentUser();
                if (currentUser && currentUser.id == userId) {
                    const updatedCurrentUser = { 
                        ...currentUser, 
                        email: profileData.email || currentUser.email,
                        phone: profileData.phone || currentUser.phone,
                        company: profileData.company || currentUser.company,
                        address: profileData.address || currentUser.address,
                        city: profileData.city || currentUser.city,
                        postalCode: profileData.postalCode || currentUser.postalCode,
                        website: profileData.website || currentUser.website,
                        description: profileData.description || currentUser.description,
                        metier: profileData.metier || currentUser.metier,
                        status: profileData.status || currentUser.status
                    };
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

    async updateUserPassword(userId, currentPassword, newPassword) {
        try {
            console.log('🔑 Changement mot de passe pour:', userId);
            
            const users = await this.get('users');
            const userIndex = users.findIndex(u => u.id == userId);
            
            if (userIndex !== -1) {
                const user = users[userIndex];
                
                if (user.password !== currentPassword) {
                    throw new Error('Mot de passe actuel incorrect');
                }
                
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
            
            if (this.firebaseInitialized) {
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
        if (!localArray || localArray.length === 0) return firebaseArray || [];
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
        if (this.firebaseInitialized && auth) {
            auth.signOut().catch(error => {
                console.warn('⚠️ Erreur déconnexion Firebase:', error.message);
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

    async upgradeOldUsers() {
        try {
            console.log('🔄 Mise à niveau des anciens utilisateurs...');
            const users = await this.get('users');
            let updatedCount = 0;
            
            for (const user of users) {
                const needsUpgrade = !user.company && !user.address && !user.city && !user.postalCode && !user.website && !user.description;
                
                if (needsUpgrade) {
                    const upgradedUser = {
                        ...user,
                        company: user.company || '',
                        address: user.address || '',
                        city: user.city || '',
                        postalCode: user.postalCode || '',
                        website: user.website || '',
                        description: user.description || '',
                        metier: user.metier || '',
                        source: user.source || 'site web',
                        status: user.status || 'actif',
                        updatedAt: new Date().toISOString()
                    };
                    
                    await this.put('users', user.id, upgradedUser);
                    updatedCount++;
                    console.log(`✅ Utilisateur ${user.email} mis à niveau`);
                }
            }
            
            console.log(`✅ ${updatedCount} utilisateurs mis à niveau`);
            return updatedCount;
        } catch (error) {
            console.error('❌ Erreur mise à niveau utilisateurs:', error);
            return 0;
        }
    }

    // ========== FONCTIONS POUR SAUVEGARDE COMPLÈTE ==========

    async exportCompleteData() {
        try {
            console.log('💾 Export complet des données...');
            
            const allCollections = [
                'users', 'marketplace_posts', 'realestate_posts', 'job_posts', 
                'freelancers', 'professionals', 'job_applications', 'newsletter_history',
                'adsense_slots', 'premium_features', 'forum_topics', 'forum_replies',
                'temp_uploads'
            ];
            
            const exportData = {};
            
            for (const collection of allCollections) {
                exportData[collection] = await this.get(collection);
                console.log(`✅ ${collection}: ${exportData[collection]?.length || 0} enregistrements`);
            }
            
            console.log('🔐 Mots de passe inclus dans l\'export');
            
            return exportData;
            
        } catch (error) {
            console.error('❌ Erreur export complet:', error);
            throw error;
        }
    }

    async importCompleteData(importData) {
        try {
            console.log('📤 Import complet des données...');
            
            if (!importData || typeof importData !== 'object') {
                throw new Error('Données d\'import invalides');
            }
            
            const requiredCollections = ['users'];
            for (const collection of requiredCollections) {
                if (!importData[collection]) {
                    throw new Error(`Collection manquante: ${collection}`);
                }
            }
            
            const backupData = await this.exportCompleteData();
            localStorage.setItem('btp_pro_pre_import_backup', JSON.stringify(backupData));
            console.log('✅ Sauvegarde de sécurité créée');
            
            for (const [collection, data] of Object.entries(importData)) {
                if (Array.isArray(data)) {
                    const localData = this.getLocalData();
                    localData[collection] = [];
                    this.saveLocalData(localData);
                    
                    for (const item of data) {
                        await this.post(collection, item);
                    }
                    
                    console.log(`✅ ${collection}: ${data.length} enregistrements importés`);
                }
            }
            
            console.log('🔐 Mots de passe importés avec succès');
            
            showAlert('✅ Import complet réussi ! Les mots de passe ont été préservés.', 'success');
            
            return true;
            
        } catch (error) {
            console.error('❌ Erreur import complet:', error);
            
            try {
                const backupData = JSON.parse(localStorage.getItem('btp_pro_pre_import_backup'));
                if (backupData) {
                    await this.importCompleteData(backupData);
                    console.log('✅ Données restaurées depuis la sauvegarde de sécurité');
                }
            } catch (restoreError) {
                console.error('❌ Erreur restauration sauvegarde:', restoreError);
            }
            
            throw error;
        }
    }

    // ========== FONCTIONS SPÉCIALES POUR IMPORT EXCEL ==========

    async importUsersFromExcel(excelData, options = {}) {
        try {
            console.log('📊 Import utilisateurs depuis Excel...', excelData);
            
            if (!Array.isArray(excelData) || excelData.length === 0) {
                throw new Error('Aucune donnée Excel à importer');
            }

            const importResults = {
                total: excelData.length,
                success: 0,
                errors: 0,
                details: []
            };

            const defaultPassword = options.defaultPassword || 'btp123';
            const overwriteExisting = options.overwriteExisting || false;

            for (const [index, row] of excelData.entries()) {
                try {
                    const userData = this.cleanExcelUserData(row, index);
                    
                    const existingUser = await this.findUserByEmail(userData.email);
                    
                    if (existingUser && !overwriteExisting) {
                        importResults.details.push({
                            index: index + 1,
                            email: userData.email,
                            status: 'ignoré',
                            message: 'Utilisateur déjà existant'
                        });
                        continue;
                    }

                    const completeUserData = {
                        ...userData,
                        password: existingUser ? existingUser.password : this.generatePassword(userData, defaultPassword),
                        role: 'user',
                        isVerified: userData.isVerified !== undefined ? userData.isVerified : true,
                        hasPremium: userData.hasPremium !== undefined ? userData.hasPremium : false,
                        isBlocked: false,
                        visitCount: userData.visitCount || 0,
                        lastVisit: userData.lastVisit || new Date().toISOString(),
                        createdAt: userData.createdAt || new Date().toISOString(),
                        updatedAt: new Date().toISOString()
                    };

                    if (existingUser && overwriteExisting) {
                        await this.put('users', existingUser.id, completeUserData);
                        importResults.details.push({
                            index: index + 1,
                            email: userData.email,
                            status: 'mis à jour',
                            message: 'Utilisateur mis à jour'
                        });
                    } else {
                        await this.registerUser(completeUserData);
                        importResults.details.push({
                            index: index + 1,
                            email: userData.email,
                            status: 'créé',
                            message: 'Nouvel utilisateur créé'
                        });
                    }

                    importResults.success++;

                } catch (error) {
                    importResults.errors++;
                    importResults.details.push({
                        index: index + 1,
                        email: row.email || 'N/A',
                        status: 'erreur',
                        message: error.message
                    });
                    console.error(`❌ Erreur ligne ${index + 1}:`, error);
                }
            }

            console.log('📈 Résultat import Excel:', importResults);
            return importResults;

        } catch (error) {
            console.error('❌ Erreur import Excel:', error);
            throw error;
        }
    }

    cleanExcelUserData(row, index) {
        const cleanedData = {
            prenom: (row['Prénom'] || row['prenom'] || '').trim(),
            nom: (row['Nom'] || row['nom'] || '').trim(),
            email: (row['Email'] || row['email'] || '').trim().toLowerCase(),
            phone: (row['Téléphone'] || row['Phone'] || row['telephone'] || '').trim(),
            company: (row['Entreprise'] || row['Company'] || row['entreprise'] || '').trim(),
            city: (row['Ville'] || row['City'] || row['ville'] || '').trim(),
            metier: (row['Métier'] || row['Metier'] || row['métier'] || '').trim(),
            source: (row['Source'] || row['source'] || 'import excel').trim(),
            status: (row['Statut'] || row['Status'] || row['statut'] || 'actif').trim()
        };

        if (!cleanedData.email) {
            throw new Error('Email manquant');
        }

        if (!this.isValidEmail(cleanedData.email)) {
            throw new Error('Email invalide');
        }

        if (row['Date d\'inscription'] || row['createdAt']) {
            cleanedData.createdAt = this.parseExcelDate(row['Date d\'inscription'] || row['createdAt']);
        }

        if (row['Dernière connexion'] || row['lastVisit']) {
            cleanedData.lastVisit = this.parseExcelDate(row['Dernière connexion'] || row['lastVisit']);
        }

        if (row['Statut Premium'] !== undefined) {
            cleanedData.hasPremium = this.parseExcelBoolean(row['Statut Premium']);
        }

        if (row['Email vérifié'] !== undefined) {
            cleanedData.isVerified = this.parseExcelBoolean(row['Email vérifié']);
        }

        return cleanedData;
    }

    async findUserByEmail(email) {
        const users = await this.get('users');
        return users.find(u => u.email.toLowerCase() === email.toLowerCase());
    }

    generatePassword(userData, defaultPassword) {
        if (userData.prenom && userData.nom) {
            return `${userData.prenom.charAt(0)}${userData.nom}123`.toLowerCase();
        }
        return defaultPassword;
    }

    isValidEmail(email) {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        return emailRegex.test(email);
    }

    parseExcelDate(dateValue) {
        if (!dateValue) return new Date().toISOString();
        
        try {
            if (dateValue instanceof Date) {
                return dateValue.toISOString();
            }
            
            if (typeof dateValue === 'number' && dateValue > 25569) {
                const jsDate = new Date((dateValue - 25569) * 86400 * 1000);
                return jsDate.toISOString();
            }
            
            const parsedDate = new Date(dateValue);
            if (!isNaN(parsedDate.getTime())) {
                return parsedDate.toISOString();
            }
            
            return new Date().toISOString();
        } catch (error) {
            console.warn('⚠️ Erreur parsing date:', dateValue, error);
            return new Date().toISOString();
        }
    }

    parseExcelBoolean(value) {
        if (typeof value === 'boolean') return value;
        if (typeof value === 'string') {
            const lowerValue = value.toLowerCase();
            return lowerValue === 'true' || lowerValue === 'vrai' || lowerValue === 'oui' || lowerValue === '1' || lowerValue === 'x';
        }
        if (typeof value === 'number') return value === 1;
        return false;
    }

    async exportUsersForExcel() {
        try {
            console.log('📊 Export utilisateurs pour Excel...');
            
            const users = await this.get('users');
            
            const excelData = users.map(user => ({
                'ID': user.id,
                'Prénom': user.prenom || '',
                'Nom': user.nom || '',
                'Email': user.email || '',
                'Téléphone': user.phone || '',
                'Ville': user.city || '',
                'Entreprise': user.company || '',
                'Métier': user.metier || '',
                'Date d\'inscription': user.createdAt ? new Date(user.createdAt).toLocaleDateString('fr-FR') : '',
                'Dernière connexion': user.lastVisit ? new Date(user.lastVisit).toLocaleDateString('fr-FR') : '',
                'Statut Premium': user.hasPremium ? 'Oui' : 'Non',
                'Email vérifié': user.isVerified ? 'Oui' : 'Non',
                'Statut': user.status || 'actif',
                'Source': user.source || 'site web',
                'Mot de passe': user.password || ''
            }));
            
            console.log(`✅ ${excelData.length} utilisateurs exportés pour Excel`);
            return excelData;
            
        } catch (error) {
            console.error('❌ Erreur export Excel:', error);
            throw error;
        }
    }

    async migrateToNewServer(backupData) {
        try {
            console.log('🚀 Migration vers nouveau serveur...');
            
            if (!backupData) {
                backupData = await this.exportCompleteData();
            }
            
            const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
            const backupFileName = `btp-pro-migration-${timestamp}.json`;
            
            const blob = new Blob([JSON.stringify(backupData, null, 2)], { type: 'application/json' });
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = backupFileName;
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            URL.revokeObjectURL(url);
            
            console.log('✅ Fichier de migration généré:', backupFileName);
            
            return {
                fileName: backupFileName,
                data: backupData,
                stats: {
                    users: backupData.users?.length || 0,
                    marketplace: backupData.marketplace_posts?.length || 0,
                    realestate: backupData.realestate_posts?.length || 0,
                    jobs: backupData.job_posts?.length || 0,
                    freelancers: backupData.freelancers?.length || 0,
                    professionals: backupData.professionals?.length || 0,
                    forum_topics: backupData.forum_topics?.length || 0,
                    forum_replies: backupData.forum_replies?.length || 0,
                    temp_uploads: backupData.temp_uploads?.length || 0
                }
            };
            
        } catch (error) {
            console.error('❌ Erreur migration:', error);
            throw error;
        }
    }

    // ========== FONCTIONS ADSENSE ==========
    
    async initializeAdsenseSlots() {
        console.log('📢 Initialisation des slots Adsense...');
        
        try {
            const slotsData = await this.get('adsense_slots');
            
            if (slotsData.length === 0) {
                // Créer des slots par défaut
                const defaultSlots = [
                    {
                        id: 'header-ad',
                        position: 'header',
                        code: '<div class="ad-slot header-ad">Publicité Header</div>',
                        isActive: true,
                        createdAt: new Date().toISOString()
                    },
                    {
                        id: 'sidebar-ad',
                        position: 'sidebar',
                        code: '<div class="ad-slot sidebar-ad">Publicité Sidebar</div>',
                        isActive: true,
                        createdAt: new Date().toISOString()
                    },
                    {
                        id: 'footer-ad',
                        position: 'footer',
                        code: '<div class="ad-slot footer-ad">Publicité Footer</div>',
                        isActive: true,
                        createdAt: new Date().toISOString()
                    }
                ];
                
                for (const slot of defaultSlots) {
                    await this.post('adsense_slots', slot);
                }
                
                console.log('✅ Slots Adsense par défaut créés');
                return defaultSlots;
            }
            
            console.log(`✅ ${slotsData.length} slots Adsense chargés`);
            return slotsData;
            
        } catch (error) {
            console.error('❌ Erreur initialisation Adsense:', error);
            return [];
        }
    }
}

// ========== INITIALISATION ==========
const btpDB = new BTPDatabase();
window.btpDB = btpDB;

// Mise à niveau automatique des anciens utilisateurs
setTimeout(() => {
    btpDB.upgradeOldUsers().then(updatedCount => {
        if (updatedCount > 0) {
            console.log(`🎉 ${updatedCount} anciens utilisateurs ont été mis à niveau avec les champs de profil complets`);
        }
    });
}, 2000);

console.log('✅ database.js COMPLET CORRIGÉ - Système upload photo intégré et gestion d\'erreurs Firebase améliorée');

// ========== EXPORT DES FONCTIONS ==========
window.exportCompleteData = () => btpDB.exportCompleteData();
window.importCompleteData = (data) => btpDB.importCompleteData(data);
window.importUsersFromExcel = (data, options) => btpDB.importUsersFromExcel(data, options);
window.exportUsersForExcel = () => btpDB.exportUsersForExcel();
window.migrateToNewServer = (data) => btpDB.migrateToNewServer(data);
window.generateBackupFile = () => btpDB.migrateToNewServer();

// Fonctions upload photo accessibles globalement
window.uploadPhoto = (file, formId) => {
    const user = btpDB.getCurrentUser();
    if (!user) {
        showAlert('🔐 Veuillez vous connecter pour uploader des photos', 'warning');
        return Promise.resolve({ success: false, error: 'Non authentifié' });
    }
    return btpDB.uploadPhoto(file, formId, user.id);
};

window.getUploadedPhotos = (formId) => {
    const user = btpDB.getCurrentUser();
    if (!user) return Promise.resolve([]);
    return btpDB.getUploadedPhotos(formId, user.id);
};

window.clearUploadedPhotos = (formId) => {
    const user = btpDB.getCurrentUser();
    if (!user) return Promise.resolve(false);
    return btpDB.clearUploadedPhotos(formId, user.id);
};

// Fonction utilitaire pour afficher les alertes (si non définie)
if (typeof showAlert === 'undefined') {
    window.showAlert = function(message, type = 'info') {
        console.log(`ALERTE [${type}]: ${message}`);
        
        // Créer une alerte Bootstrap
        const alertDiv = document.createElement('div');
        alertDiv.className = `alert alert-${type} alert-dismissible fade show`;
        alertDiv.innerHTML = `
            ${message}
            <button type="button" class="btn-close" data-bs-dismiss="alert"></button>
        `;
        
        const container = document.querySelector('.alerts-container') || document.body;
        container.appendChild(alertDiv);
        
        setTimeout(() => {
            if (alertDiv.parentNode) {
                alertDiv.remove();
            }
        }, 5000);
    };
}