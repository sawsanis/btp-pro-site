// ========== FONCTIONS DE GESTION DU FORUM ==========
async function loadForumTopics() {
    const topics = await btpDB.get('forum_topics');
    displayForumTopics(topics);
}

function displayForumTopics(topics) {
    const container = document.getElementById('forum-topics-container');
    
    if (topics.length === 0) {
        container.innerHTML = `
        <div class="text-center py-5">
            <i class="fas fa-comments fa-3x text-muted mb-3"></i>
            <h4>Aucun sujet pour le moment</h4>
            <p class="text-muted">Soyez le premier à lancer une discussion !</p>
        </div>`;
        return;
    }
    
    let html = '';
    
    topics.forEach(topic => {
        html += `
        <div class="forum-topic">
            <div class="d-flex justify-content-between align-items-start">
                <div class="flex-grow-1">
                    <h5 class="mb-1">
                        <a href="#" onclick="viewForumTopic(${topic.id})" class="text-decoration-none">${topic.title}</a>
                    </h5>
                    <p class="text-muted mb-1">${topic.content.substring(0, 150)}...</p>
                    <div class="d-flex align-items-center">
                        <small class="text-muted">
                            <i class="fas fa-user me-1"></i>${topic.authorName}
                        </small>
                        <small class="text-muted ms-3">
                            <i class="fas fa-clock me-1"></i>${new Date(topic.createdAt).toLocaleDateString('fr-FR')}
                        </small>
                        <span class="badge bg-primary ms-2">${topic.category}</span>
                    </div>
                </div>
                <div class="text-end">
                    <div class="d-flex align-items-center">
                        <small class="text-muted me-3">
                            <i class="fas fa-comment me-1"></i>${topic.replyCount || 0}
                        </small>
                        <small class="text-muted">
                            <i class="fas fa-eye me-1"></i>${topic.views || 0}
                        </small>
                    </div>
                </div>
            </div>
        </div>`;
    });
    
    container.innerHTML = html;
}

function showForumCreate() {
    if (!appState.currentUser) {
        showAlert('🔐 Connectez-vous pour créer un sujet', 'warning');
        showLoginModal();
        return;
    }
    goToSection('forum-create');
}

async function createForumTopic(event) {
    event.preventDefault();
    
    const title = document.getElementById('forumTopicTitle').value;
    const category = document.getElementById('forumTopicCategory').value;
    const content = document.getElementById('forumTopicContent').value;
    
    try {
        const topic = await btpDB.post('forum_topics', {
            title,
            category,
            content,
            authorId: appState.currentUser.id,
            authorName: `${appState.currentUser.prenom} ${appState.currentUser.nom}`,
            replyCount: 0,
            views: 0,
            lastActivity: new Date().toISOString(),
            status: 'active'
        });
        
        showAlert('✅ Sujet créé avec succès', 'success');
        goToSection('forum');
        loadForumTopics();
    } catch (error) {
        console.error('Erreur création sujet:', error);
        showAlert('❌ Erreur lors de la création du sujet', 'error');
    }
}

function viewForumTopic(topicId) {
    showAlert(`📖 Consultation du sujet ${topicId} - Fonctionnalité en développement`, 'info');
}

function filterForum(category) {
    showAlert(`📋 Filtrage du forum par catégorie: ${category}`, 'info');
}

function searchForum() {
    const searchTerm = document.getElementById('forumSearch').value;
    if (searchTerm) {
        showAlert(`🔍 Recherche dans le forum: "${searchTerm}"`, 'info');
    }
}

// ========== FONCTIONS PREMIUM ==========
function selectSubscription(plan) {
    if (!appState.currentUser) {
        showAlert('🔐 Connectez-vous pour souscrire à un abonnement', 'warning');
        showLoginModal();
        return;
    }
    
    showAlert(`🎉 Abonnement ${plan} sélectionné ! Redirection vers le paiement...`, 'success');
    
    // Simuler le processus d'abonnement
    setTimeout(() => {
        btpDB.put('users', appState.currentUser.id, { hasPremium: true });
        appState.currentUser.hasPremium = true;
        updateUIAfterAuth();
        showAlert('⭐ Félicitations ! Vous êtes maintenant membre Premium', 'success');
    }, 2000);
}