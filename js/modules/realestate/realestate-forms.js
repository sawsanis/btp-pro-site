// ========== INITIALISATION DES VILLES MAROCAINES (30 villes) ==========
function initializeRealEstateCities() {
    console.log('🏙️ Initialisation des villes marocaines...');
    
    // 🔥 CORRECTION AMÉLIORÉE
    let citySelect = null;
    
    // 1. D'abord, chercher le formulaire immobilier
    const immobilierForm = document.getElementById('immobilier-form');
    
    if (immobilierForm) {
        console.log('✅ Formulaire immobilier-form trouvé');
        
        // 🔥 CORRECTION : Utiliser querySelector sur le formulaire
        // Chercher le champ ville avec différentes possibilités
        citySelect = immobilierForm.querySelector('[name="city"]') || 
                    immobilierForm.querySelector('[name="ville"]') ||
                    immobilierForm.querySelector('select[name="city"]') ||
                    immobilierForm.querySelector('input[name="city"]') ||
                    immobilierForm.querySelector('#realestateCity') ||
                    immobilierForm.querySelector('#ville');
        
        if (citySelect) {
            console.log('🎯 Champ ville trouvé dans formulaire:', citySelect.name || citySelect.id || 'sans-id');
        }
    }
    
    // 2. Si pas trouvé dans le formulaire, chercher globalement
    if (!citySelect) {
        console.log('🔍 Recherche globale du champ ville...');
        
        citySelect = document.querySelector('[name="city"]') ||
                    document.querySelector('[name="ville"]') ||
                    document.querySelector('select[name="city"]') ||
                    document.querySelector('input[name="city"]') ||
                    document.querySelector('#realestateCity') ||
                    document.querySelector('#ville');
        
        if (citySelect) {
            console.log('🎯 Champ ville trouvé globalement:', citySelect.name || citySelect.id || 'sans-id');
        }
    }
    
    // 3. Si toujours pas trouvé, chercher par partial match
    if (!citySelect) {
        console.log('🔍 Recherche par correspondance partielle...');
        
        const allElements = document.querySelectorAll('input, select');
        for (const element of allElements) {
            const name = element.name || '';
            const id = element.id || '';
            
            if (name.includes('city') || name.includes('ville') || 
                id.includes('city') || id.includes('ville')) {
                citySelect = element;
                console.log('🎯 Champ ville trouvé par correspondance:', name || id);
                break;
            }
        }
    }
    
    if (!citySelect) {
        console.warn('❌ Champ ville non trouvé - vérifiez le nom/id du champ dans le HTML');
        
        // Debug: Afficher tous les champs disponibles
        console.log('🔍 Debug - Tous les champs dans le formulaire:');
        if (immobilierForm) {
            const allFields = immobilierForm.querySelectorAll('input, select, textarea');
            allFields.forEach(field => {
                console.log(`  - ${field.tagName} name="${field.name}" id="${field.id}" placeholder="${field.placeholder}"`);
            });
        }
        
        return false;
    }
    
    console.log('✅ Champ ville final trouvé:', {
        tag: citySelect.tagName,
        name: citySelect.name,
        id: citySelect.id,
        type: citySelect.type
    });
    
    // Si c'est un select, ajouter les options
    if (citySelect.tagName === 'SELECT') {
        console.log('📋 Ajout des villes marocaines au select...');
        
        // Vider les options existantes sauf la première
        while (citySelect.children.length > 1) {
            citySelect.removeChild(citySelect.lastChild);
        }
        
        // Liste des 30+ principales villes marocaines
        const moroccanCities = [
            { value: 'casablanca', label: 'Casablanca' },
            { value: 'rabat', label: 'Rabat' },
            { value: 'fes', label: 'Fès' },
            { value: 'marrakech', label: 'Marrakech' },
            { value: 'tanger', label: 'Tanger' },
            { value: 'agadir', label: 'Agadir' },
            { value: 'meknes', label: 'Meknès' },
            { value: 'oujda', label: 'Oujda' },
            { value: 'kenitra', label: 'Kénitra' },
            { value: 'tetouan', label: 'Tétouan' },
            { value: 'safi', label: 'Safi' },
            { value: 'mohammedia', label: 'Mohammédia' },
            { value: 'eljadida', label: 'El Jadida' },
            { value: 'berkane', label: 'Berkane' },
            { value: 'nador', label: 'Nador' },
            { value: 'taza', label: 'Taza' },
            { value: 'settat', label: 'Settat' },
            { value: 'larache', label: 'Larache' },
            { value: 'khouribga', label: 'Khouribga' },
            { value: 'benimellal', label: 'Béni Mellal' },
            { value: 'errachidia', label: 'Errachidia' },
            { value: 'tiznit', label: 'Tiznit' },
            { value: 'essaouira', label: 'Essaouira' },
            { value: 'chefchaouen', label: 'Chefchaouen' },
            { value: 'ouarzazate', label: 'Ouarzazate' },
            { value: 'figuig', label: 'Figuig' },
            { value: 'alhoceima', label: 'Al Hoceïma' },
            { value: 'asilah', label: 'Asilah' },
            { value: 'midelt', label: 'Midelt' },
            { value: 'taroudant', label: 'Taroudant' },
            { value: 'sidiifni', label: 'Sidi Ifni' },
            { value: 'dakhla', label: 'Dakhla' },
            { value: 'laayoune', label: 'Laâyoune' },
            { value: 'smara', label: 'Smara' },
            { value: 'guelmim', label: 'Guelmim' }
        ];
        
        moroccanCities.forEach(city => {
            const option = document.createElement('option');
            option.value = city.value;
            option.textContent = city.label;
            citySelect.appendChild(option);
        });
        
        console.log(`✅ ${moroccanCities.length} villes marocaines ajoutées`);
        return true;
    } 
    // Si c'est un input texte
    else if (citySelect.tagName === 'INPUT') {
        console.log('ℹ️ Champ ville est un input texte - pas d\'options à ajouter');
        return true;
    }
    
    return false;
}