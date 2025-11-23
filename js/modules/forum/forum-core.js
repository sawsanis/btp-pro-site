// ========== COORDINATEUR PRINCIPAL DU FORUM ==========
console.log('🏗️ Chargement du module forum principal...');

async function viewForumTopic(topicId) {
    console.log('🎯 CLIC sur le sujet:', topicId);
    
    if (!topicId) {
        console.error('❌ ID du sujet manquant');
        showAlert('❌ Erreur: ID du sujet manquant', 'error');
        return;
    }
    
    // Vérifier si appState est disponible
    if (typeof appState === 'undefined') {
        console.error('❌ appState non défini');
        showAlert('❌ Erreur système. Veuillez rafraîchir la page.', 'error');
        return;
    }
    
    if (!appState.currentUser) {
        console.log('🔐 Utilisateur non connecté');
        showAlert('🔐 Connectez-vous pour voir les détails du sujet', 'warning');
        if (typeof showLoginModal === 'function') {
            showLoginModal();
        } else {
            console.error('❌ showLoginModal non disponible');
        }
        return;
    }
    
    try {
        console.log('📥 Chargement du sujet:', topicId);
        const topics = await btpDB.get('forum_topics');
        const topic = topics.find(t => t.id == topicId);
        
        if (!topic) {
            console.error('❌ Sujet non trouvé:', topicId);
            showAlert('❌ Sujet non trouvé', 'error');
            return;
        }
        
        console.log('✅ Sujet trouvé:', topic.title);
        
        // Incrémenter le compteur de vues
        const newViews = (topic.views || 0) + 1;
        await btpDB.put('forum_topics', topicId, {
            views: newViews,
            updatedAt: new Date().toISOString()
        });
        
        // Afficher la vue détaillée
        showTopicDetailView(topic);
        
    } catch (error) {
        console.error('❌ Erreur ouverture sujet:', error);
        showAlert('❌ Erreur lors du chargement du sujet: ' + error.message, 'error');
    }
}

function filterForum(category) {
    console.log('Filtrage forum par catégorie:', category);
    // À implémenter selon vos besoins
    showAlert('Fonctionnalité de filtrage à implémenter', 'info');
}

function searchForum(query) {
    console.log('Recherche forum:', query);
    // À implémenter selon vos besoins
    showAlert('Fonctionnalité de recherche à implémenter', 'info');
}

// Export des fonctions principales
window.viewForumTopic = viewForumTopic;
window.filterForum = filterForum;
window.searchForum = searchForum;

console.log('✅ forum-core.js chargé - Module principal du forum prêt');