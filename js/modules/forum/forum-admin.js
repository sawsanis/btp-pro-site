// ========== FONCTIONS ADMINISTRATEUR DU FORUM ==========
console.log('👑 Chargement des fonctions administrateur...');

async function deleteForumTopic(topicId) {
    console.log('🗑️ Suppression du sujet:', topicId);
    
    if (!appState.currentUser || !appState.isAdmin) {
        showAlert('❌ Action réservée aux administrateurs', 'error');
        return;
    }
    
    const confirmation = await showConfirmModal(
        'Supprimer le sujet',
        'Êtes-vous sûr de vouloir supprimer définitivement ce sujet ? Toutes les réponses associées seront également supprimées. Cette action est irréversible.',
        'danger',
        'Supprimer'
    );
    
    if (!confirmation) return;
    
    showLoading(true);
    
    try {
        // Supprimer également toutes les réponses associées
        const allReplies = await btpDB.get('forum_replies') || [];
        const topicReplies = allReplies.filter(reply => reply.topicId === topicId);
        
        for (const reply of topicReplies) {
            await btpDB.delete('forum_replies', reply.id);
        }
        
        // Supprimer le sujet
        const success = await btpDB.delete('forum_topics', topicId);
        
        if (success) {
            showAlert('✅ Sujet et réponses supprimés avec succès', 'success');
            returnToForumTopics();
        } else {
            throw new Error('Échec de la suppression');
        }
        
    } catch (error) {
        console.error('❌ Erreur suppression sujet:', error);
        showAlert('❌ Erreur lors de la suppression du sujet', 'error');
    } finally {
        showLoading(false);
    }
}

async function toggleTopicPin(topicId, pinState) {
    if (!appState.currentUser || !appState.isAdmin) return;
    
    try {
        await btpDB.put('forum_topics', topicId, {
            isPinned: pinState,
            updatedAt: new Date().toISOString()
        });
        
        showAlert(`✅ Sujet ${pinState ? 'épinglé' : 'désépinglé'}`, 'success');
        
        // Recharger la vue actuelle
        const container = document.getElementById('forum-content');
        if (container && container.innerHTML.includes('forum-topic-detail')) {
            const topic = await btpDB.get('forum_topics', topicId);
            if (topic) showTopicDetailView(topic);
        } else {
            returnToForumTopics();
        }
        
    } catch (error) {
        console.error('❌ Erreur modification épingle:', error);
        showAlert('❌ Erreur lors de la modification', 'error');
    }
}

async function toggleTopicStatus(topicId, newStatus) {
    if (!appState.currentUser || !appState.isAdmin) return;
    
    const action = newStatus === 'closed' ? 'fermer' : 'rouvrir';
    const confirmed = await showConfirmModal(
        `${action.charAt(0).toUpperCase() + action.slice(1)} le sujet`,
        `Êtes-vous sûr de vouloir ${action} ce sujet ?`,
        'warning'
    );
    
    if (!confirmed) return;
    
    try {
        await btpDB.put('forum_topics', topicId, {
            status: newStatus,
            updatedAt: new Date().toISOString()
        });
        
        showAlert(`✅ Sujet ${action} avec succès`, 'success');
        
        // Recharger la vue actuelle
        const container = document.getElementById('forum-content');
        if (container && container.innerHTML.includes('forum-topic-detail')) {
            const topic = await btpDB.get('forum_topics', topicId);
            if (topic) showTopicDetailView(topic);
        } else {
            returnToForumTopics();
        }
        
    } catch (error) {
        console.error('❌ Erreur modification statut:', error);
        showAlert('❌ Erreur lors de la modification', 'error');
    }
}

// Export des fonctions admin
window.deleteForumTopic = deleteForumTopic;
window.toggleTopicPin = toggleTopicPin;
window.toggleTopicStatus = toggleTopicStatus;

console.log('✅ forum-admin.js chargé - Fonctions admin disponibles');