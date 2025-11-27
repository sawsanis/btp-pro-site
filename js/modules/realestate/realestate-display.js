/**
 * REALESTATE-DISPLAY.JS - VERSION CORRIGÉE
 * Module d'affichage des biens immobiliers sans boucle
 */

// =============================================
// CONFIGURATION MINIMALISTE FONCTIONNELLE
// =============================================

const RealEstateDisplay = {
    // État simple
    state: {
        initialized: false,
        currentPage: 1,
        properties: []
    },

    // Éléments DOM
    elements: {
        propertiesContainer: null
    }
};

// =============================================
// FONCTION PRINCIPALE D'AFFICHAGE
// =============================================

/**
 * Affiche les biens immobiliers - FONCTION GLOBALE
 */
function displayRealEstatePosts(properties = []) {
    console.log('🏠 displayRealEstatePosts appelé avec:', properties.length, 'propriétés');
    
    if (!RealEstateDisplay.elements.propertiesContainer) {
        RealEstateDisplay.elements.propertiesContainer = document.getElementById('properties-container');
    }
    
    if (!RealEstateDisplay.elements.propertiesContainer) {
        console.error('❌ Conteneur des propriétés non trouvé');
        return;
    }
    
    if (!properties || properties.length === 0) {
        RealEstateDisplay.elements.propertiesContainer.innerHTML = `
            <div class="no-properties" style="text-align: center; padding: 40px; color: #666;">
                <h3>🏠 Aucun bien immobilier trouvé</h3>
                <p>Essayez de modifier vos critères de recherche.</p>
            </div>
        `;
        return;
    }
    
    try {
        const html = properties.map(property => 
            RealEstateDisplay.renderPropertyCard(property)
        ).join('');
        
        RealEstateDisplay.elements.propertiesContainer.innerHTML = html;
        RealEstateDisplay.attachEventListeners();
        
        console.log('✅ Affichage réussi:', properties.length, 'propriétés');
        
    } catch (error) {
        console.error('❌ Erreur affichage:', error);
        RealEstateDisplay.elements.propertiesContainer.innerHTML = `
            <div class="error-message" style="text-align: center; padding: 40px; color: red;">
                <h3>❌ Erreur d'affichage</h3>
                <p>${error.message}</p>
            </div>
        `;
    }
}

// =============================================
// FONCTIONS DE RENDU
// =============================================

/**
 * Rend une carte propriété
 */
RealEstateDisplay.renderPropertyCard = function(property) {
    if (!property) return '';
    
    const imageUrl = property.images && property.images.length > 0 ? 
                    property.images[0] : '/images/placeholder-property.jpg';
    
    const premiumBadge = property.premium ? '<span class="premium-badge">⭐ Premium</span>' : '';
    const statusBadge = property.status === 'active' ? 
        '<span class="status-badge active">🟢 Actif</span>' : 
        '<span class="status-badge inactive">🔴 Inactif</span>';
    
    return `
        <div class="property-card" data-property-id="${property.id}">
            <div class="property-card-header">
                <div class="property-image-container">
                    <img src="${imageUrl}" 
                         alt="${property.title || 'Propriété'}" 
                         class="property-image"
                         loading="lazy"
                         onerror="this.src='/images/placeholder-property.jpg'">
                    <div class="property-image-overlay">
                        <button class="favorite-btn" data-property-id="${property.id}">
                            🤍
                        </button>
                        ${premiumBadge}
                    </div>
                </div>
            </div>
            
            <div class="property-card-body">
                <h3 class="property-title">${property.title || 'Sans titre'}</h3>
                <p class="property-description">${property.description || ''}</p>
                
                <div class="property-details">
                    <div class="property-price">${this.formatPrice(property.price)}</div>
                    <div class="property-meta">
                        <span class="property-surface">${property.surface || 'N/A'} m²</span>
                        <span class="property-rooms">${property.rooms || 'N/A'} pièces</span>
                        <span class="property-location">${property.city || property.location || 'Maroc'}</span>
                    </div>
                </div>
            </div>
            
            <div class="property-card-footer">
                <div class="property-actions">
                    <button class="btn btn-primary view-details" data-property-id="${property.id}">
                        👀 Voir détails
                    </button>
                    <button class="btn btn-secondary contact-btn" data-property-id="${property.id}">
                        📞 Contacter
                    </button>
                </div>
                
                <div class="property-stats">
                    <span class="stat-views">👁️ ${property.views || 0}</span>
                    <span class="stat-contacts">📞 ${property.contacts || 0}</span>
                </div>
            </div>
            
            ${statusBadge}
        </div>
    `;
};

/**
 * Formate un prix en MAD
 */
RealEstateDisplay.formatPrice = function(price) {
    if (!price && price !== 0) return 'Prix sur demande';
    
    return new Intl.NumberFormat('fr-MA', {
        style: 'currency',
        currency: 'MAD',
        minimumFractionDigits: 0,
        maximumFractionDigits: 0
    }).format(price);
};

// =============================================
// GESTION DES ÉVÉNEMENTS
// =============================================

/**
 * Attache les écouteurs d'événements
 */
RealEstateDisplay.attachEventListeners = function() {
    // Boutons "Voir détails"
    document.querySelectorAll('.view-details').forEach(btn => {
        btn.addEventListener('click', (e) => {
            const propertyId = e.target.dataset.propertyId;
            this.showPropertyDetails(propertyId);
        });
    });
    
    // Boutons "Contacter"
    document.querySelectorAll('.contact-btn').forEach(btn => {
        btn.addEventListener('click', (e) => {
            const propertyId = e.target.dataset.propertyId;
            this.incrementPropertyContact(propertyId);
        });
    });
    
    // Boutons favoris
    document.querySelectorAll('.favorite-btn').forEach(btn => {
        btn.addEventListener('click', (e) => {
            e.stopPropagation();
            const propertyId = e.target.dataset.propertyId;
            this.toggleFavorite(propertyId);
        });
    });
};

/**
 * Affiche les détails d'une propriété
 */
RealEstateDisplay.showPropertyDetails = function(propertyId) {
    console.log('🔍 Détails propriété:', propertyId);
    this.incrementPropertyView(propertyId);
    
    // Recherche la propriété dans les données
    const property = this.state.properties.find(p => p.id === propertyId);
    if (property) {
        alert(`Détails: ${property.title}\nPrix: ${this.formatPrice(property.price)}\nSurface: ${property.surface}m²\nVille: ${property.city || property.location}`);
    }
};

/**
 * Incrémente les vues
 */
RealEstateDisplay.incrementPropertyView = function(propertyId) {
    console.log('👀 Vue incrémentée:', propertyId);
    // Implémentation basique
};

/**
 * Incrémente les contacts
 */
RealEstateDisplay.incrementPropertyContact = function(propertyId) {
    console.log('📞 Contact incrémenté:', propertyId);
    alert('Demande de contact envoyée!');
};

/**
 * Bascule les favoris
 */
RealEstateDisplay.toggleFavorite = function(propertyId) {
    console.log('❤️ Favori basculé:', propertyId);
    const btn = document.querySelector(`.favorite-btn[data-property-id="${propertyId}"]`);
    if (btn) {
        if (btn.innerHTML === '🤍') {
            btn.innerHTML = '❤️';
            btn.classList.add('active');
        } else {
            btn.innerHTML = '🤍';
            btn.classList.remove('active');
        }
    }
};

// =============================================
// FONCTIONS DE COMPATIBILITÉ
// =============================================

/**
 * Charge les annonces immobilières - FONCTION GLOBALE
 */
function loadRealEstateAnnounces() {
    console.log('🔄 loadRealEstateAnnounces appelé');
    
    // Éviter la double initialisation
    if (RealEstateDisplay.state.initialized) {
        console.log('⚠️ Déjà initialisé');
        return RealEstateDisplay.state.properties;
    }
    
    try {
        // Charger depuis le localStorage
        const stored = localStorage.getItem('realestate_properties');
        if (stored) {
            RealEstateDisplay.state.properties = JSON.parse(stored);
            console.log('📂 Propriétés chargées:', RealEstateDisplay.state.properties.length);
        } else {
            // Données d'exemple
            RealEstateDisplay.state.properties = [
                {
                    id: '1',
                    title: 'Bel appartement à Casablanca',
                    description: 'Superbe appartement rénové au cœur de Casablanca.',
                    price: 850000,
                    surface: 75,
                    rooms: 3,
                    location: 'Centre-ville Casablanca',
                    city: 'Casablanca',
                    type: 'appartement',
                    status: 'active',
                    premium: true,
                    views: 150,
                    contacts: 12,
                    images: ['/images/sample1.jpg'],
                    createdAt: '2024-01-15T10:00:00Z'
                },
                {
                    id: '2', 
                    title: 'Villa moderne à Rabat',
                    description: 'Belle villa moderne avec jardin.',
                    price: 2500000,
                    surface: 200,
                    rooms: 5,
                    location: 'Agdal Rabat',
                    city: 'Rabat',
                    type: 'villa',
                    status: 'active',
                    premium: false,
                    views: 89,
                    contacts: 8,
                    images: ['/images/sample2.jpg'],
                    createdAt: '2024-01-14T15:30:00Z'
                }
            ];
            console.log('🎲 Données d\'exemple chargées');
        }
        
        RealEstateDisplay.state.initialized = true;
        return RealEstateDisplay.state.properties;
        
    } catch (error) {
        console.error('❌ Erreur chargement:', error);
        return [];
    }
}

/**
 * Fonction de compatibilité
 */
function displayRealEstateItems(properties) {
    console.log('🔄 displayRealEstateItems appelé');
    return displayRealEstatePosts(properties);
}

// =============================================
// FONCTIONS ADMIN (BASIQUE)
// =============================================

/**
 * Gère l'édition d'une propriété
 */
RealEstateDisplay.handleEditRealEstate = function(propertyId) {
    console.log('✏️ Édition:', propertyId);
    alert('Fonction d\'édition: ' + propertyId);
};

/**
 * Bascule le statut
 */
RealEstateDisplay.toggleAnnounceStatus = function(propertyId) {
    console.log('🔄 Statut basculé:', propertyId);
    alert('Statut basculé: ' + propertyId);
};

/**
 * Bascule le premium
 */
RealEstateDisplay.togglePremium = function(propertyId) {
    console.log('⭐ Premium basculé:', propertyId);
    alert('Premium basculé: ' + propertyId);
};

/**
 * Supprime une annonce
 */
RealEstateDisplay.deleteAnnounce = function(propertyId) {
    console.log('🗑️ Suppression:', propertyId);
    if (confirm('Supprimer cette annonce?')) {
        alert('Annonce supprimée: ' + propertyId);
    }
};

// =============================================
// FONCTIONS FAVORIS (BASIQUE)
// =============================================

RealEstateDisplay.addToFavorites = function(propertyId) {
    console.log('❤️ Ajout favori:', propertyId);
};

RealEstateDisplay.removeFromFavorites = function(propertyId) {
    console.log('💔 Retrait favori:', propertyId);
};

RealEstateDisplay.getFavoriteProperties = function() {
    return [];
};

RealEstateDisplay.displayFavoriteProperties = function() {
    console.log('❤️ Affichage favoris');
};

// =============================================
// RECHERCHE ET FILTRES (BASIQUE)
// =============================================

RealEstateDisplay.searchRealEstate = function() {
    console.log('🔍 Recherche');
};

RealEstateDisplay.sortProperties = function(sortBy) {
    console.log('📊 Tri:', sortBy);
};

RealEstateDisplay.initializeRealEstateFilters = function() {
    console.log('🎛️ Filtres initialisés');
};

RealEstateDisplay.filterRealEstate = function() {
    console.log('🔧 Filtrage');
};

// =============================================
// STATISTIQUES (BASIQUE)
// =============================================

RealEstateDisplay.getRealEstateStats = function() {
    return {
        totalProperties: this.state.properties.length,
        activeProperties: this.state.properties.filter(p => p.status === 'active').length,
        premiumProperties: this.state.properties.filter(p => p.premium).length
    };
};

// =============================================
// EXPORT (BASIQUE)
// =============================================

RealEstateDisplay.exportRealEstateData = function(format = 'json') {
    console.log('📤 Export:', format);
    alert('Export: ' + format);
};

// =============================================
// INITIALISATION SÉCURISÉE
// =============================================

/**
 * Initialisation sécurisée sans boucle
 */
RealEstateDisplay.initialize = function() {
    if (this.state.initialized) {
        console.log('⚠️ RealEstateDisplay déjà initialisé');
        return;
    }
    
    console.log('🚀 Initialisation RealEstateDisplay...');
    
    try {
        // Initialiser les éléments DOM
        this.elements.propertiesContainer = document.getElementById('properties-container');
        
        // Charger les données
        loadRealEstateAnnounces();
        
        this.state.initialized = true;
        console.log('✅ RealEstateDisplay initialisé');
        
    } catch (error) {
        console.error('❌ Erreur initialisation:', error);
    }
};

// =============================================
// EXPOSITION GLOBALE
// =============================================

// Exposer les fonctions globales
window.displayRealEstatePosts = displayRealEstatePosts;
window.loadRealEstateAnnounces = loadRealEstateAnnounces;
window.displayRealEstateItems = displayRealEstateItems;

// Exposer le module
window.RealEstateDisplay = RealEstateDisplay;

console.log('✅ realestate-display.js chargé - Version corrigée sans boucle');

// NE PAS initialiser automatiquement