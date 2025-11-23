// ========== REALESTATE UTILS - FONCTIONS UTILITAIRES ==========
console.log('⚙️ Chargement du module RealEstate Utils...');

// ========== FONCTIONS UTILITAIRES IMMOBILIÈRES ==========
function getPropertyTypeLabel(type) {
    const types = {
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
    return types[type] || type;
}

function formatPrice(price) {
    if (!price && price !== 0) return 'Non spécifié';
    return new Intl.NumberFormat('fr-FR').format(price) + ' MAD';
}

function formatDate(dateString) {
    if (!dateString) return 'Date inconnue';
    
    try {
        const date = new Date(dateString);
        return date.toLocaleDateString('fr-FR', {
            day: '2-digit',
            month: '2-digit',
            year: 'numeric'
        });
    } catch (error) {
        return 'Date invalide';
    }
}

function truncateText(text, maxLength = 100) {
    if (!text) return '';
    if (text.length <= maxLength) return text;
    return text.substring(0, maxLength) + '...';
}

// ========== VÉRIFICATION PERMISSIONS ==========
function checkRealEstatePermissions(property) {
    const currentUser = JSON.parse(localStorage.getItem('currentUser') || 'null');
    if (!currentUser) return { canEdit: false, canDelete: false, canToggleStatus: false, canTogglePremium: false };
    
    const isOwner = currentUser.id === property.userId;
    const isAdmin = currentUser.role === 'admin';
    
    return {
        canEdit: isOwner || isAdmin,
        canDelete: isOwner || isAdmin,
        canToggleStatus: isAdmin,
        canTogglePremium: isAdmin
    };
}

// ========== STATISTIQUES IMMOBILIÈRES ==========
async function getRealEstateStats() {
    try {
        const properties = await btpDB.get('realestate_posts') || [];
        
        const stats = {
            total: properties.length,
            approved: properties.filter(p => p.status === 'approuve' || p.status === 'approved').length,
            pending: properties.filter(p => p.status === 'en_attente').length,
            paused: properties.filter(p => p.status === 'en_pause').length,
            premium: properties.filter(p => p.isPremium).length,
            byType: {},
            byCity: {}
        };
        
        // Statistiques par type
        properties.forEach(property => {
            if (property.type) {
                stats.byType[property.type] = (stats.byType[property.type] || 0) + 1;
            }
            if (property.city) {
                stats.byCity[property.city] = (stats.byCity[property.city] || 0) + 1;
            }
        });
        
        return stats;
        
    } catch (error) {
        console.error('❌ Erreur statistiques immobilier:', error);
        return null;
    }
}

// ========== GESTION DES VUES ET CONTACTS ==========
async function incrementPropertyView(propertyId) {
    try {
        const properties = await btpDB.get('realestate_posts') || [];
        const propertyIndex = properties.findIndex(p => p.id == propertyId);
        
        if (propertyIndex !== -1) {
            properties[propertyIndex].viewCount = (properties[propertyIndex].viewCount || 0) + 1;
            properties[propertyIndex].updatedAt = new Date().toISOString();
            await btpDB.set('realestate_posts', properties);
        }
    } catch (error) {
        console.error('❌ Erreur incrémentation vue:', error);
    }
}

async function incrementPropertyContact(propertyId) {
    try {
        const properties = await btpDB.get('realestate_posts') || [];
        const propertyIndex = properties.findIndex(p => p.id == propertyId);
        
        if (propertyIndex !== -1) {
            properties[propertyIndex].contactCount = (properties[propertyIndex].contactCount || 0) + 1;
            properties[propertyIndex].updatedAt = new Date().toISOString();
            await btpDB.set('realestate_posts', properties);
        }
    } catch (error) {
        console.error('❌ Erreur incrémentation contact:', error);
    }
}

// ========== VALIDATION DONNÉES IMMOBILIÈRES ==========
function validateRealEstateData(data) {
    const errors = [];
    
    if (!data.title || data.title.trim().length < 5) {
        errors.push('Le titre doit contenir au moins 5 caractères');
    }
    
    if (!data.type) {
        errors.push('Le type de bien est requis');
    }
    
    if (!data.price || isNaN(data.price) || data.price <= 0) {
        errors.push('Le prix doit être un nombre positif');
    }
    
    if (data.surface && (isNaN(data.surface) || data.surface < 0)) {
        errors.push('La surface doit être un nombre positif');
    }
    
    if (data.rooms && (isNaN(data.rooms) || data.rooms < 0)) {
        errors.push('Le nombre de pièces doit être un nombre positif');
    }
    
    if (!data.address || data.address.trim().length < 10) {
        errors.push('L\'adresse doit contenir au moins 10 caractères');
    }
    
    if (!data.description || data.description.trim().length < 20) {
        errors.push('La description doit contenir au moins 20 caractères');
    }
    
    if (!data.phone || !/^[0-9+\-\s()]{10,}$/.test(data.phone)) {
        errors.push('Le numéro de téléphone est invalide');
    }
    
    return {
        isValid: errors.length === 0,
        errors: errors
    };
}

// ========== GÉNÉRATION DE DONNÉES EXEMPLES ==========
function generateSampleRealEstateData() {
    const sampleData = {
        title: "Belle villa moderne avec piscine",
        type: "villa",
        price: 2500000,
        surface: 180,
        rooms: 5,
        address: "123 Avenue des Palmiers, Casablanca",
        city: "Casablanca",
        description: "Magnifique villa moderne avec piscine, jardin et garage. Située dans un quartier résidentiel calme. Proche des commodités et des écoles.",
        phone: "+212612345678",
        photos: []
    };
    
    return sampleData;
}

// ========== INITIALISATION ET EXPORTS ==========
function initializeUtilityFunctions() {
    console.log('🔄 Initialisation des fonctions utilitaires...');
    console.log('✅ Utilitaires RealEstate initialisés');
}

// Export des fonctions
window.getPropertyTypeLabel = getPropertyTypeLabel;
window.formatPrice = formatPrice;
window.formatDate = formatDate;
window.truncateText = truncateText;
window.checkRealEstatePermissions = checkRealEstatePermissions;
window.getRealEstateStats = getRealEstateStats;
window.incrementPropertyView = incrementPropertyView;
window.incrementPropertyContact = incrementPropertyContact;
window.validateRealEstateData = validateRealEstateData;
window.generateSampleRealEstateData = generateSampleRealEstateData;
window.initializeUtilityFunctions = initializeUtilityFunctions;

console.log('✅ realestate-utils.js chargé - Utilitaires prêts');