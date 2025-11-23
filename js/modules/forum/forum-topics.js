// ========== GESTION DES SUJETS DU FORUM ==========
console.log('📝 Chargement de la gestion des sujets...');

async function loadForumTopics() {
    console.log('💬 Chargement des sujets du forum...');
    
    try {
        if (typeof updateNavigationState === 'function') {
            updateNavigationState('forum');
        }
        
        const topics = await btpDB.get('forum_topics');
        console.log('📊 Sujets du forum récupérés:', topics.length);
        
        const container = document.getElementById('forum-topics-container');
        const forumContent = document.getElementById('forum-content');
        
        if (!container && !forumContent) {
            console.warn('❌ Aucun conteneur forum trouvé');
            return;
        }
        
        if (forumContent && !container) {
            displayForumTopicsInContent(topics, forumContent);
            return;
        }
        
        if (!topics || topics.length === 0) {
            container.innerHTML = `
            <div class="text-center py-5">
                <i class="fas fa-comments fa-3x text-muted mb-3"></i>
                <h4>Aucun sujet pour le moment</h4>
                <p class="text-muted">Soyez le premier à lancer une discussion !</p>
                <button class="btn btn-primary mt-3" onclick="showForumCreate()">
                    <i class="fas fa-plus me-2"></i>Créer le premier sujet
                </button>
            </div>`;
            return;
        }
        
        const sortedTopics = [...topics].sort((a, b) => {
            if (a.isPinned && !b.isPinned) return -1;
            if (!a.isPinned && b.isPinned) return 1;
            return new Date(b.lastActivity || b.createdAt || 0) - new Date(a.lastActivity || a.createdAt || 0);
        });
        
        displayForumTopics(sortedTopics);
        console.log(`✅ ${sortedTopics.length} sujets du forum affichés`);
        
    } catch (error) {
        console.error('❌ Erreur chargement forum:', error);
        const container = document.getElementById('forum-topics-container');
        if (container) {
            container.innerHTML = `
                <div class="text-center text-danger py-5">
                    <i class="fas fa-exclamation-triangle fa-2x mb-3"></i>
                    <p>Erreur lors du chargement des sujets</p>
                    <button class="btn btn-primary btn-sm" onclick="loadForumTopics()">
                        <i class="fas fa-redo me-1"></i>Réessayer
                    </button>
                </div>
            `;
        }
    }
}

function displayForumTopicsInContent(topics, forumContent) {
    if (!topics || topics.length === 0) {
        forumContent.innerHTML = `
        <div class="text-center py-5">
            <i class="fas fa-comments fa-3x text-muted mb-3"></i>
            <h4>Aucun sujet pour le moment</h4>
            <p class="text-muted">Soyez le premier à lancer une discussion !</p>
            <button class="btn btn-primary mt-3" onclick="showForumCreate()">
                <i class="fas fa-plus me-2"></i>Créer le premier sujet
            </button>
        </div>`;
        return;
    }
    
    const sortedTopics = [...topics].sort((a, b) => {
        if (a.isPinned && !b.isPinned) return -1;
        if (!a.isPinned && b.isPinned) return 1;
        return new Date(b.lastActivity || b.createdAt || 0) - new Date(a.lastActivity || a.createdAt || 0);
    });
    
    let html = `
        <div class="forum-topics-view">
            <div class="d-flex justify-content-between align-items-center mb-4">
                <h3><i class="fas fa-comments me-2"></i>Forum BTP</h3>
                <button class="btn btn-primary" onclick="showForumCreate()">
                    <i class="fas fa-plus me-2"></i>Nouveau sujet
                </button>
            </div>
    `;
    
    sortedTopics.forEach((topic) => {
        const isActive = topic.status !== 'closed';
        const lastActivity = topic.lastActivity || topic.createdAt;
        const replyCount = topic.replyCount || 0;
        const views = topic.views || 0;
        
        html += `
        <div class="forum-topic-card p-3 border rounded mb-3 ${topic.isPinned ? 'border-warning bg-warning bg-opacity-10' : ''}" 
             style="cursor: pointer;" 
             onclick="viewForumTopic('${topic.id}')">
            <div class="d-flex justify-content-between align-items-start">
                <div class="flex-grow-1 me-3">
                    <div class="d-flex align-items-start mb-2">
                        <h5 class="mb-0 me-2 text-primary">
                            ${topic.title || 'Sans titre'}
                        </h5>
                        ${topic.isPinned ? '<span class="badge bg-warning ms-2"><i class="fas fa-thumbtack"></i></span>' : ''}
                        ${!isActive ? '<span class="badge bg-secondary ms-2"><i class="fas fa-lock"></i></span>' : ''}
                    </div>
                    
                    <p class="text-muted mb-2 small">${topic.content ? truncateText(topic.content, 120) : 'Aucun contenu disponible'}...</p>
                    
                    <div class="d-flex align-items-center flex-wrap gap-2">
                        <span class="badge bg-${getCategoryColor(topic.category)}">${getCategoryLabel(topic.category)}</span>
                        <small class="text-muted">
                            <i class="fas fa-user me-1"></i>${topic.authorName || 'Utilisateur'}
                        </small>
                        <small class="text-muted">
                            <i class="fas fa-clock me-1"></i>${lastActivity ? formatDate(lastActivity) : 'Date inconnue'}
                        </small>
                    </div>
                </div>
                
                <div class="d-flex align-items-center gap-3">
                    <div class="text-center">
                        <div class="h6 mb-0 text-primary">${replyCount}</div>
                        <small class="text-muted">Réponses</small>
                    </div>
                    <div class="text-center">
                        <div class="h6 mb-0 text-info">${views}</div>
                        <small class="text-muted">Vues</small>
                    </div>
                    
                    ${appState.currentUser && appState.isAdmin ? `
                    <div class="admin-actions ms-3" onclick="event.stopPropagation()">
                        <div class="btn-group-vertical btn-group-sm">
                            <button class="btn btn-outline-warning btn-sm" 
                                    onclick="toggleTopicPin('${topic.id}', ${!topic.isPinned})" 
                                    title="${topic.isPinned ? 'Désépingler' : 'Épingler'}">
                                <i class="fas fa-thumbtack"></i>
                            </button>
                            <button class="btn btn-outline-${isActive ? 'secondary' : 'success'} btn-sm" 
                                    onclick="toggleTopicStatus('${topic.id}', '${isActive ? 'closed' : 'active'}')"
                                    title="${isActive ? 'Fermer' : 'Rouvrir'}">
                                <i class="fas fa-${isActive ? 'lock' : 'unlock'}"></i>
                            </button>
                            <button class="btn btn-outline-danger btn-sm" 
                                    onclick="deleteForumTopic('${topic.id}')" 
                                    title="Supprimer">
                                <i class="fas fa-trash"></i>
                            </button>
                        </div>
                    </div>
                    ` : ''}
                </div>
            </div>
            
            <div class="text-end mt-2">
                <small class="text-muted">
                    <i class="fas fa-mouse-pointer me-1"></i>Cliquer pour ouvrir
                </small>
            </div>
        </div>`;
    });
    
    html += `</div>`;
    forumContent.innerHTML = html;
    console.log(`✅ ${sortedTopics.length} sujets du forum affichés dans le contenu principal`);
}

function displayForumTopics(topics) {
    const container = document.getElementById('forum-topics-container');
    
    if (!container) {
        console.warn('❌ Container forum-topics-container non trouvé');
        return;
    }
    
    if (!topics || topics.length === 0) {
        container.innerHTML = `
        <div class="text-center py-5">
            <i class="fas fa-comments fa-3x text-muted mb-3"></i>
            <h4>Aucun sujet pour le moment</h4>
            <p class="text-muted">Soyez le premier à lancer une discussion !</p>
            <button class="btn btn-primary mt-3" onclick="showForumCreate()">
                <i class="fas fa-plus me-2"></i>Créer le premier sujet
            </button>
        </div>`;
        return;
    }
    
    let html = '';
    
    topics.forEach((topic) => {
        const isActive = topic.status !== 'closed';
        const lastActivity = topic.lastActivity || topic.createdAt;
        const replyCount = topic.replyCount || 0;
        const views = topic.views || 0;
        
        html += `
        <div class="forum-topic-card p-3 border rounded mb-3 ${topic.isPinned ? 'border-warning bg-warning bg-opacity-10' : ''}" 
             style="cursor: pointer;" 
             onclick="viewForumTopic('${topic.id}')">
            <div class="d-flex justify-content-between align-items-start">
                <div class="flex-grow-1 me-3">
                    <div class="d-flex align-items-start mb-2">
                        <h5 class="mb-0 me-2 text-primary">
                            ${topic.title || 'Sans titre'}
                        </h5>
                        ${topic.isPinned ? '<span class="badge bg-warning ms-2"><i class="fas fa-thumbtack"></i></span>' : ''}
                        ${!isActive ? '<span class="badge bg-secondary ms-2"><i class="fas fa-lock"></i></span>' : ''}
                    </div>
                    
                    <p class="text-muted mb-2 small">${topic.content ? truncateText(topic.content, 120) : 'Aucun contenu disponible'}...</p>
                    
                    <div class="d-flex align-items-center flex-wrap gap-2">
                        <span class="badge bg-${getCategoryColor(topic.category)}">${getCategoryLabel(topic.category)}</span>
                        <small class="text-muted">
                            <i class="fas fa-user me-1"></i>${topic.authorName || 'Utilisateur'}
                        </small>
                        <small class="text-muted">
                            <i class="fas fa-clock me-1"></i>${lastActivity ? formatDate(lastActivity) : 'Date inconnue'}
                        </small>
                    </div>
                </div>
                
                <div class="d-flex align-items-center gap-3">
                    <div class="text-center">
                        <div class="h6 mb-0 text-primary">${replyCount}</div>
                        <small class="text-muted">Réponses</small>
                    </div>
                    <div class="text-center">
                        <div class="h6 mb-0 text-info">${views}</div>
                        <small class="text-muted">Vues</small>
                    </div>
                    
                    ${appState.currentUser && appState.isAdmin ? `
                    <div class="admin-actions ms-3" onclick="event.stopPropagation()">
                        <div class="btn-group-vertical btn-group-sm">
                            <button class="btn btn-outline-warning btn-sm" 
                                    onclick="toggleTopicPin('${topic.id}', ${!topic.isPinned})" 
                                    title="${topic.isPinned ? 'Désépingler' : 'Épingler'}">
                                <i class="fas fa-thumbtack"></i>
                            </button>
                            <button class="btn btn-outline-${isActive ? 'secondary' : 'success'} btn-sm" 
                                    onclick="toggleTopicStatus('${topic.id}', '${isActive ? 'closed' : 'active'}')"
                                    title="${isActive ? 'Fermer' : 'Rouvrir'}">
                                <i class="fas fa-${isActive ? 'lock' : 'unlock'}"></i>
                            </button>
                            <button class="btn btn-outline-danger btn-sm" 
                                    onclick="deleteForumTopic('${topic.id}')" 
                                    title="Supprimer">
                                <i class="fas fa-trash"></i>
                            </button>
                        </div>
                    </div>
                    ` : ''}
                </div>
            </div>
            
            <div class="text-end mt-2">
                <small class="text-muted">
                    <i class="fas fa-mouse-pointer me-1"></i>Cliquer pour ouvrir
                </small>
            </div>
        </div>`;
    });
    
    container.innerHTML = html;
}

async function createForumTopic(event) {
    event.preventDefault();
    
    if (!appState.currentUser) {
        showAlert('🔐 Connectez-vous pour créer un sujet', 'warning');
        showLoginModal();
        return;
    }
    
    const title = document.getElementById('forumTopicTitle')?.value;
    const category = document.getElementById('forumTopicCategory')?.value;
    const content = document.getElementById('forumTopicContent')?.value;
    
    if (!title || !category || !content) {
        showAlert('❌ Veuillez remplir tous les champs obligatoires', 'error');
        return;
    }
    
    if (title.length < 5) {
        showAlert('❌ Le titre doit contenir au moins 5 caractères', 'error');
        return;
    }
    
    if (content.length < 10) {
        showAlert('❌ Le contenu doit contenir au moins 10 caractères', 'error');
        return;
    }
    
    showLoading(true);
    
    try {
        const topicData = {
            title: title.trim(),
            category: category,
            content: content.trim(),
            authorId: appState.currentUser.id,
            authorName: `${appState.currentUser.prenom} ${appState.currentUser.nom}`,
            authorEmail: appState.currentUser.email,
            replyCount: 0,
            views: 0,
            lastActivity: new Date().toISOString(),
            status: 'active',
            isPinned: false,
            tags: extractTags(content),
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString()
        };
        
        await btpDB.post('forum_topics', topicData);
        
        showAlert('✅ Sujet créé avec succès !', 'success');
        
        setTimeout(() => {
            returnToForumTopics();
        }, 1000);
        
    } catch (error) {
        console.error('❌ Erreur création sujet:', error);
        showAlert('❌ Erreur lors de la création du sujet', 'error');
    } finally {
        showLoading(false);
    }
}

// Export des fonctions
window.loadForumTopics = loadForumTopics;
window.displayForumTopicsInContent = displayForumTopicsInContent;
window.displayForumTopics = displayForumTopics;
window.createForumTopic = createForumTopic;

console.log('✅ forum-topics.js chargé - Gestion des sujets disponible');