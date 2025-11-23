// ========== GESTION DES RÉPONSES DU FORUM ==========
console.log('💬 Chargement de la gestion des réponses...');

async function submitReply(event, topicId) {
    event.preventDefault();
    
    if (!appState.currentUser) {
        showAlert('🔐 Connectez-vous pour répondre', 'warning');
        if (typeof showLoginModal === 'function') showLoginModal();
        return;
    }
    
    const content = document.getElementById('replyContent')?.value;
    
    if (!content || content.trim().length < 10) {
        showAlert('❌ La réponse doit contenir au moins 10 caractères', 'error');
        return;
    }
    
    showLoading(true);
    
    try {
        const replyData = {
            topicId: topicId,
            content: content.trim(),
            authorId: appState.currentUser.id,
            authorName: `${appState.currentUser.prenom} ${appState.currentUser.nom}`,
            authorEmail: appState.currentUser.email,
            isSolution: false,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString()
        };
        
        // Sauvegarder la réponse
        await btpDB.post('forum_replies', replyData);
        
        // Mettre à jour le compteur de réponses et dernière activité du sujet
        const allReplies = await btpDB.get('forum_replies') || [];
        const topicReplies = allReplies.filter(reply => reply.topicId === topicId);
        
        await btpDB.put('forum_topics', topicId, {
            replyCount: topicReplies.length,
            lastActivity: new Date().toISOString(),
            updatedAt: new Date().toISOString()
        });
        
        showAlert('✅ Réponse publiée avec succès !', 'success');
        document.getElementById('replyForm').reset();
        
        // Recharger la vue détaillée du sujet actuel
        const topic = await btpDB.get('forum_topics', topicId);
        if (topic) {
            await showTopicDetailView(topic);
        }
        
    } catch (error) {
        console.error('❌ Erreur publication réponse:', error);
        showAlert('❌ Erreur lors de la publication de la réponse', 'error');
    } finally {
        showLoading(false);
    }
}

async function markAsSolution(replyId, topicId) {
    if (!appState.currentUser) return;
    
    try {
        // Vérifier que l'utilisateur est bien l'auteur du sujet
        const topic = await btpDB.get('forum_topics', topicId);
        if (!topic || topic.authorId !== appState.currentUser.id) {
            showAlert('❌ Seul l\'auteur du sujet peut marquer une réponse comme solution', 'error');
            return;
        }
        
        const confirmed = await showConfirmModal(
            'Marquer comme solution',
            'Êtes-vous sûr de vouloir marquer cette réponse comme solution ? Cette action est visible par tous les membres.',
            'success',
            'Confirmer'
        );
        
        if (!confirmed) return;
        
        // Réinitialiser toutes les solutions pour ce sujet
        const allReplies = await btpDB.get('forum_replies') || [];
        for (const reply of allReplies) {
            if (reply.topicId === topicId && reply.isSolution) {
                await btpDB.put('forum_replies', reply.id, {
                    isSolution: false,
                    updatedAt: new Date().toISOString()
                });
            }
        }
        
        // Marquer la réponse comme solution
        await btpDB.put('forum_replies', replyId, {
            isSolution: true,
            updatedAt: new Date().toISOString()
        });
        
        showAlert('✅ Réponse marquée comme solution !', 'success');
        
        // Recharger la vue du sujet
        const updatedTopic = await btpDB.get('forum_topics', topicId);
        if (updatedTopic) {
            showTopicDetailView(updatedTopic);
        }
        
    } catch (error) {
        console.error('❌ Erreur marquage solution:', error);
        showAlert('❌ Erreur lors du marquage de la solution', 'error');
    }
}

async function deleteReply(replyId, topicId) {
    if (!appState.currentUser) return;
    
    try {
        // Vérifier les permissions
        const reply = await btpDB.get('forum_replies', replyId);
        if (!reply) return;
        
        const isAuthor = reply.authorId === appState.currentUser.id;
        if (!isAuthor && !appState.isAdmin) {
            showAlert('❌ Action non autorisée', 'error');
            return;
        }
        
        const confirmed = await showConfirmModal(
            'Supprimer la réponse',
            'Êtes-vous sûr de vouloir supprimer cette réponse ? Cette action est irréversible.',
            'danger',
            'Supprimer'
        );
        
        if (!confirmed) return;
        
        // Supprimer la réponse
        await btpDB.delete('forum_replies', replyId);
        
        // Mettre à jour le compteur de réponses du sujet
        const allReplies = await btpDB.get('forum_replies') || [];
        const topicReplies = allReplies.filter(reply => reply.topicId === topicId);
        
        await btpDB.put('forum_topics', topicId, {
            replyCount: topicReplies.length,
            updatedAt: new Date().toISOString()
        });
        
        showAlert('✅ Réponse supprimée avec succès', 'success');
        
        // Recharger la vue du sujet
        const topic = await btpDB.get('forum_topics', topicId);
        if (topic) {
            showTopicDetailView(topic);
        }
        
    } catch (error) {
        console.error('❌ Erreur suppression réponse:', error);
        showAlert('❌ Erreur lors de la suppression de la réponse', 'error');
    }
}

// Export des fonctions
window.submitReply = submitReply;
window.markAsSolution = markAsSolution;
window.deleteReply = deleteReply;

console.log('✅ forum-replies.js chargé - Gestion des réponses disponible');