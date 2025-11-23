// ========== FONCTIONS DE GESTION DU FORUM COMPLÈTEMENT CORRIGÉES ==========
async function loadForumTopics() {
    console.log('💬 Chargement des sujets du forum...');
    
    try {
        // CORRECTION : S'assurer qu'on est dans le bon état de navigation
        if (typeof updateNavigationState === 'function') {
            updateNavigationState('forum');
        }
        
        const topics = await btpDB.get('forum_topics');
        console.log('📊 Sujets du forum récupérés:', topics.length);
        
        const container = document.getElementById('forum-topics-container');
        const forumContent = document.getElementById('forum-content');
        
        // CORRECTION : Gérer les deux conteneurs possibles
        if (!container && !forumContent) {
            console.warn('❌ Aucun conteneur forum trouvé');
            return;
        }
        
        // Si on a forum-content (vue détaillée), on affiche la liste des sujets
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
        
        // Trier par épinglé d'abord, puis par dernière activité
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

// ========== FONCTION POUR AFFICHER DANS LE CONTENU PRINCIPAL ==========
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
    
    // Trier par épinglé d'abord, puis par dernière activité
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
    
    sortedTopics.forEach((topic, index) => {
        const isActive = topic.status !== 'closed';
        const lastActivity = topic.lastActivity || topic.createdAt;
        const replyCount = topic.replyCount || 0;
        const views = topic.views || 0;
        
        html += `
        <div class="forum-topic-card p-3 border rounded mb-3 ${topic.isPinned ? 'border-warning bg-warning bg-opacity-10' : ''}" 
             style="cursor: pointer;" 
             onclick="viewForumTopic('${topic.id}')">
            <div class="d-flex justify-content-between align-items-start">
                <!-- Contenu du sujet à gauche -->
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
                
                <!-- Métriques et actions à droite -->
                <div class="d-flex align-items-center gap-3">
                    <!-- Métriques -->
                    <div class="text-center">
                        <div class="h6 mb-0 text-primary">${replyCount}</div>
                        <small class="text-muted">Réponses</small>
                    </div>
                    <div class="text-center">
                        <div class="h6 mb-0 text-info">${views}</div>
                        <small class="text-muted">Vues</small>
                    </div>
                    
                    <!-- Actions admin -->
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
            
            <!-- Indicateur de clic -->
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
    
    topics.forEach((topic, index) => {
        const isActive = topic.status !== 'closed';
        const lastActivity = topic.lastActivity || topic.createdAt;
        const replyCount = topic.replyCount || 0;
        const views = topic.views || 0;
        
        html += `
        <div class="forum-topic-card p-3 border rounded mb-3 ${topic.isPinned ? 'border-warning bg-warning bg-opacity-10' : ''}" 
             style="cursor: pointer;" 
             onclick="viewForumTopic('${topic.id}')">
            <div class="d-flex justify-content-between align-items-start">
                <!-- Contenu du sujet à gauche -->
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
                
                <!-- Métriques et actions à droite -->
                <div class="d-flex align-items-center gap-3">
                    <!-- Métriques -->
                    <div class="text-center">
                        <div class="h6 mb-0 text-primary">${replyCount}</div>
                        <small class="text-muted">Réponses</small>
                    </div>
                    <div class="text-center">
                        <div class="h6 mb-0 text-info">${views}</div>
                        <small class="text-muted">Vues</small>
                    </div>
                    
                    <!-- Actions admin -->
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
            
            <!-- Indicateur de clic -->
            <div class="text-end mt-2">
                <small class="text-muted">
                    <i class="fas fa-mouse-pointer me-1"></i>Cliquer pour ouvrir
                </small>
            </div>
        </div>`;
    });
    
    container.innerHTML = html;
}

// ========== FONCTION POUR OUVRIR LE SUJET EN DÉTAIL ==========

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

// ========== AFFICHAGE DE LA VUE DÉTAILLÉE DU SUJET ==========

async function showTopicDetailView(topic) {
    const container = document.getElementById('forum-content');
    if (!container) {
        console.error('❌ Container forum-content non trouvé');
        return;
    }
    
    try {
        // CORRECTION : S'assurer qu'on est dans le bon état de navigation
        if (typeof updateNavigationState === 'function') {
            updateNavigationState('forum-detail');
        }
        
        // Charger les réponses
        const allReplies = await btpDB.get('forum_replies') || [];
        const topicReplies = allReplies.filter(reply => reply.topicId === topic.id)
                                      .sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt));
        
        container.innerHTML = `
            <div class="forum-topic-detail">
                <!-- En-tête avec bouton retour -->
                <div class="d-flex justify-content-between align-items-center mb-4">
                    <button class="btn btn-outline-secondary" onclick="returnToForumTopics()">
                        <i class="fas fa-arrow-left me-2"></i>Retour aux sujets
                    </button>
                    
                    ${appState.currentUser && appState.isAdmin ? `
                    <div class="btn-group">
                        <button class="btn btn-outline-warning btn-sm" 
                                onclick="toggleTopicPin('${topic.id}', ${!topic.isPinned})" 
                                title="${topic.isPinned ? 'Désépingler' : 'Épingler'}">
                            <i class="fas fa-thumbtack"></i>
                        </button>
                        <button class="btn btn-outline-${topic.status !== 'closed' ? 'secondary' : 'success'} btn-sm" 
                                onclick="toggleTopicStatus('${topic.id}', '${topic.status !== 'closed' ? 'closed' : 'active'}')"
                                title="${topic.status !== 'closed' ? 'Fermer' : 'Rouvrir'}">
                            <i class="fas fa-${topic.status !== 'closed' ? 'lock' : 'unlock'}"></i>
                        </button>
                        <button class="btn btn-outline-danger btn-sm" 
                                onclick="deleteForumTopic('${topic.id}')" 
                                title="Supprimer">
                            <i class="fas fa-trash"></i>
                        </button>
                    </div>
                    ` : ''}
                </div>

                <!-- Sujet principal -->
                <div class="card mb-4">
                    <div class="card-header bg-light">
                        <div class="d-flex justify-content-between align-items-center">
                            <div>
                                <h3 class="mb-1 text-primary">${topic.title || 'Sans titre'}</h3>
                                <div class="d-flex align-items-center flex-wrap gap-2">
                                    <span class="badge bg-${getCategoryColor(topic.category)}">${getCategoryLabel(topic.category)}</span>
                                    <small class="text-muted">
                                        <i class="fas fa-user me-1"></i>${topic.authorName || 'Utilisateur'}
                                    </small>
                                    <small class="text-muted">
                                        <i class="fas fa-clock me-1"></i>${formatDate(topic.createdAt)}
                                    </small>
                                    <small class="text-muted">
                                        <i class="fas fa-eye me-1"></i>${topic.views || 0} vues
                                    </small>
                                </div>
                            </div>
                            <div>
                                ${topic.status === 'closed' ? '<span class="badge bg-secondary"><i class="fas fa-lock me-1"></i>Fermé</span>' : ''}
                                ${topic.isPinned ? '<span class="badge bg-warning"><i class="fas fa-thumbtack me-1"></i>Épinglé</span>' : ''}
                            </div>
                        </div>
                    </div>
                    <div class="card-body">
                        <div class="topic-content">
                            ${formatForumContent(topic.content)}
                        </div>
                    </div>
                </div>

                <!-- Section des réponses -->
                <div class="replies-section">
                    <div class="d-flex justify-content-between align-items-center mb-3">
                        <h4>
                            <i class="fas fa-reply me-2"></i>Réponses
                            <span class="badge bg-primary ms-2">${topicReplies.length}</span>
                        </h4>
                    </div>
                    
                    <!-- Liste des réponses -->
                    <div class="replies-list mb-4">
                        ${topicReplies.length === 0 ? `
                            <div class="text-center py-5 text-muted">
                                <i class="fas fa-comments fa-3x mb-3"></i>
                                <h5>Aucune réponse pour le moment</h5>
                                <p>Soyez le premier à répondre à ce sujet !</p>
                            </div>
                        ` : topicReplies.map((reply, index) => `
                            <div class="card mb-3 ${reply.isSolution ? 'border-success border-2' : ''}">
                                <div class="card-body">
                                    <div class="d-flex justify-content-between align-items-start mb-3">
                                        <div class="d-flex align-items-center">
                                            <div class="bg-primary text-white rounded-circle d-flex align-items-center justify-content-center me-3" 
                                                 style="width: 45px; height: 45px; font-size: 1.2rem;">
                                                <i class="fas fa-user"></i>
                                            </div>
                                            <div>
                                                <h6 class="mb-0">${reply.authorName || 'Utilisateur'}</h6>
                                                <small class="text-muted">${formatDate(reply.createdAt)}</small>
                                            </div>
                                        </div>
                                        <div class="d-flex align-items-center gap-2">
                                            ${reply.isSolution ? `
                                                <span class="badge bg-success">
                                                    <i class="fas fa-check me-1"></i>Solution acceptée
                                                </span>
                                            ` : ''}
                                            ${(appState.currentUser && appState.currentUser.id === topic.authorId && topic.status !== 'closed' && !reply.isSolution) ? `
                                                <button class="btn btn-outline-success btn-sm" 
                                                        onclick="markAsSolution('${reply.id}', '${topic.id}')"
                                                        title="Marquer comme solution">
                                                    <i class="fas fa-check me-1"></i>Solution
                                                </button>
                                            ` : ''}
                                            ${(appState.currentUser && (appState.currentUser.id === reply.authorId || appState.isAdmin)) ? `
                                                <button class="btn btn-outline-danger btn-sm" 
                                                        onclick="deleteReply('${reply.id}', '${topic.id}')"
                                                        title="Supprimer cette réponse">
                                                    <i class="fas fa-trash"></i>
                                                </button>
                                            ` : ''}
                                        </div>
                                    </div>
                                    <div class="reply-content">
                                        ${formatForumContent(reply.content)}
                                    </div>
                                </div>
                            </div>
                        `).join('')}
                    </div>
                </div>

                <!-- Formulaire de réponse -->
                ${topic.status !== 'closed' ? `
                <div class="reply-form-section">
                    <div class="card">
                        <div class="card-header">
                            <h5 class="mb-0">
                                <i class="fas fa-reply me-2"></i>Répondre à ce sujet
                            </h5>
                        </div>
                        <div class="card-body">
                            ${!appState.currentUser ? `
                                <div class="alert alert-warning">
                                    <i class="fas fa-exclamation-triangle me-2"></i>
                                    Vous devez être connecté pour répondre.
                                    <button class="btn btn-primary btn-sm ms-2" onclick="showLoginModal()">Se connecter</button>
                                </div>
                            ` : `
                                <form id="replyForm" onsubmit="submitReply(event, '${topic.id}')">
                                    <div class="mb-3">
                                        <label for="replyContent" class="form-label">Votre réponse <span class="text-danger">*</span></label>
                                        <textarea class="form-control" id="replyContent" rows="6" 
                                                  placeholder="Partagez votre expertise, posez des questions complémentaires ou proposez une solution..."
                                                  required minlength="10"></textarea>
                                        <div class="form-text">Minimum 10 caractères. Les réponses constructives sont appréciées.</div>
                                    </div>
                                    <div class="d-flex justify-content-end">
                                        <button type="submit" class="btn btn-primary">
                                            <i class="fas fa-paper-plane me-2"></i>Publier la réponse
                                        </button>
                                    </div>
                                </form>
                            `}
                        </div>
                    </div>
                </div>
                ` : `
                <div class="alert alert-secondary">
                    <i class="fas fa-lock me-2"></i>
                    Ce sujet est fermé. Les nouvelles réponses ne sont plus autorisées.
                </div>
                `}
            </div>
        `;
        
    } catch (error) {
        console.error('❌ Erreur affichage détail sujet:', error);
        container.innerHTML = `
            <div class="alert alert-danger">
                <i class="fas fa-exclamation-triangle me-2"></i>
                Erreur lors du chargement du sujet. 
                <button class="btn btn-sm btn-outline-danger ms-2" onclick="returnToForumTopics()">Retour aux sujets</button>
            </div>
        `;
    }
}

// ========== GESTION DES RÉPONSES ==========

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
        
        // CORRECTION : Recharger la vue détaillée du sujet actuel
        const topic = await btpDB.get('forum_topics', topicId);
        if (topic) {
            await showTopicDetailView(topic); // Ajout du await
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

// ========== FONCTIONS ADMIN ==========

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
            returnToForumTopics(); // CORRECTION : Utiliser la nouvelle fonction
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
            returnToForumTopics(); // CORRECTION : Utiliser la nouvelle fonction
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
            returnToForumTopics(); // CORRECTION : Utiliser la nouvelle fonction
        }
        
    } catch (error) {
        console.error('❌ Erreur modification statut:', error);
        showAlert('❌ Erreur lors de la modification', 'error');
    }
}

// ========== CRÉATION DE SUJETS ==========

function showForumCreate() {
    const container = document.getElementById('forum-content');
    if (!container) return;
    
    container.innerHTML = `
        <div class="forum-create">
            <button class="btn btn-outline-secondary mb-3" onclick="returnToForumTopics()">
                <i class="fas fa-arrow-left me-2"></i>Retour aux sujets
            </button>
            
            <div class="card">
                <div class="card-header">
                    <h4 class="mb-0">
                        <i class="fas fa-plus-circle me-2"></i>Créer un nouveau sujet
                    </h4>
                </div>
                <div class="card-body">
                    ${!appState.currentUser ? `
                        <div class="alert alert-warning">
                            <i class="fas fa-exclamation-triangle me-2"></i>
                            Vous devez être connecté pour créer un sujet.
                            <button class="btn btn-primary btn-sm ms-2" onclick="showLoginModal()">Se connecter</button>
                        </div>
                    ` : `
                        <form id="forumTopicForm" onsubmit="createForumTopic(event)">
                            <div class="mb-3">
                                <label for="forumTopicTitle" class="form-label">Titre du sujet <span class="text-danger">*</span></label>
                                <input type="text" class="form-control" id="forumTopicTitle" 
                                       placeholder="Ex: Problème avec le dosage du béton..." 
                                       required minlength="5" maxlength="200">
                                <div class="form-text">Soyez clair et concis dans votre titre (5-200 caractères)</div>
                            </div>
                            
                            <div class="mb-3">
                                <label for="forumTopicCategory" class="form-label">Catégorie <span class="text-danger">*</span></label>
                                <select class="form-select" id="forumTopicCategory" required>
                                    <option value="">Choisir une catégorie...</option>
                                    <option value="technique">Questions techniques</option>
                                    <option value="materiaux">Matériaux & Fournitures</option>
                                    <option value="reglementation">Réglementation & Normes</option>
                                    <option value="chantier">Gestion de chantier</option>
                                    <option value="conseils">Conseils & Astuces</option>
                                    <option value="outillage">Outillage & Équipement</option>
                                    <option value="securite">Sécurité & Prévention</option>
                                    <option value="autres">Autres sujets</option>
                                </select>
                            </div>
                            
                            <div class="mb-3">
                                <label for="forumTopicContent" class="form-label">Contenu <span class="text-danger">*</span></label>
                                <textarea class="form-control" id="forumTopicContent" rows="8" 
                                          placeholder="Décrivez votre problème, posez votre question ou partagez votre expérience en détail..."
                                          required minlength="10"></textarea>
                                <div class="form-text">Plus vous serez précis, plus les réponses seront pertinentes (minimum 10 caractères)</div>
                            </div>
                            
                            <div class="d-flex justify-content-between align-items-center">
                                <small class="text-muted">
                                    <i class="fas fa-lightbulb me-1"></i>
                                    Pensez à vérifier l'orthographe et la clarté de votre message
                                </small>
                                <button type="submit" class="btn btn-primary">
                                    <i class="fas fa-paper-plane me-2"></i>Publier le sujet
                                </button>
                            </div>
                        </form>
                    `}
                </div>
            </div>
        </div>
    `;
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
        
        // Rediriger vers le forum
        setTimeout(() => {
            returnToForumTopics(); // CORRECTION : Utiliser la nouvelle fonction
        }, 1000);
        
    } catch (error) {
        console.error('❌ Erreur création sujet:', error);
        showAlert('❌ Erreur lors de la création du sujet', 'error');
    } finally {
        showLoading(false);
    }
}

// ========== FONCTIONS UTILITAIRES ==========

// ========== FONCTION DE RETOUR AUX SUJETS ==========

function returnToForumTopics() {
    console.log('🔙 Retour aux sujets du forum');
    
    // CORRECTION : S'assurer qu'on est dans le bon état de navigation
    if (typeof updateNavigationState === 'function') {
        updateNavigationState('forum');
    }
    
    // Recharger la liste des sujets
    loadForumTopics();
}

// ========== FONCTION POUR METTRE À JOUR L'ÉTAT DE NAVIGATION ==========

function updateNavigationState(section) {
    // Mettre à jour l'interface pour refléter l'état actuel
    const forumContent = document.getElementById('forum-content');
    if (!forumContent) return;
    
    if (section === 'forum-detail') {
        // Cacher les éléments de la liste si nécessaire
        const topicsContainer = document.getElementById('forum-topics-container');
        if (topicsContainer) {
            topicsContainer.style.display = 'none';
        }
    } else if (section === 'forum') {
        // Afficher les éléments de la liste
        const topicsContainer = document.getElementById('forum-topics-container');
        if (topicsContainer) {
            topicsContainer.style.display = 'block';
        }
    }
}

function getCategoryLabel(category) {
    const categories = {
        'technique': 'Questions techniques',
        'materiaux': 'Matériaux & Fournitures',
        'reglementation': 'Réglementation & Normes',
        'chantier': 'Gestion de chantier',
        'conseils': 'Conseils & Astuces',
        'outillage': 'Outillage & Équipement',
        'securite': 'Sécurité & Prévention',
        'autres': 'Autres sujets'
    };
    return categories[category] || category;
}

function getCategoryColor(category) {
    const colors = {
        'technique': 'primary',
        'materiaux': 'success',
        'reglementation': 'warning',
        'chantier': 'info',
        'conseils': 'secondary',
        'outillage': 'dark',
        'securite': 'danger',
        'autres': 'light'
    };
    return colors[category] || 'secondary';
}

function formatDate(dateString) {
    if (!dateString) return 'Date inconnue';
    try {
        const date = new Date(dateString);
        return date.toLocaleDateString('fr-FR', {
            year: 'numeric',
            month: 'short',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });
    } catch (error) {
        return 'Date invalide';
    }
}

function truncateText(text, maxLength) {
    if (!text) return '';
    if (text.length <= maxLength) return text;
    return text.substring(0, maxLength) + '...';
}

function formatForumContent(content) {
    if (!content) return '<p class="text-muted">Aucun contenu</p>';
    
    let formatted = content
        .split('\n')
        .filter(line => line.trim())
        .map(line => `<p>${line.trim()}</p>`)
        .join('');
    
    return formatted;
}

function extractTags(content) {
    if (!content) return [];
    const tags = [];
    const commonTags = ['beton', 'ciment', 'acier', 'bois', 'isolation', 'electricite', 'plomberie', 'carrelage', 'peinture', 'chantier'];
    
    commonTags.forEach(tag => {
        if (content.toLowerCase().includes(tag)) {
            tags.push(tag);
        }
    });
    
    return tags.slice(0, 5);
}

// ========== FONCTION DE CONFIRMATION ==========

function showConfirmModal(title, message, type = 'warning', confirmText = 'Confirmer') {
    return new Promise((resolve) => {
        const modalId = 'confirmModal';
        let modal = document.getElementById(modalId);
        
        if (modal) {
            modal.remove();
        }
        
        const modalHTML = `
            <div class="modal fade" id="${modalId}" tabindex="-1">
                <div class="modal-dialog">
                    <div class="modal-content">
                        <div class="modal-header">
                            <h5 class="modal-title text-${type}">
                                <i class="fas fa-exclamation-triangle me-2"></i>${title}
                            </h5>
                            <button type="button" class="btn-close" data-bs-dismiss="modal"></button>
                        </div>
                        <div class="modal-body">
                            <p>${message}</p>
                        </div>
                        <div class="modal-footer">
                            <button type="button" class="btn btn-secondary" data-bs-dismiss="modal">Annuler</button>
                            <button type="button" class="btn btn-${type}" id="confirmActionBtn">${confirmText}</button>
                        </div>
                    </div>
                </div>
            </div>
        `;
        
        document.body.insertAdjacentHTML('beforeend', modalHTML);
        
        modal = document.getElementById(modalId);
        const confirmBtn = document.getElementById('confirmActionBtn');
        
        const bsModal = new bootstrap.Modal(modal);
        bsModal.show();
        
        confirmBtn.onclick = () => {
            bsModal.hide();
            resolve(true);
        };
        
        modal.addEventListener('hidden.bs.modal', () => {
            resolve(false);
            modal.remove();
        });
    });
}

// ========== FONCTIONS DE FILTRE ET RECHERCHE ==========

function filterForum(category) {
    console.log('Filtrage forum par catégorie:', category);
    // À implémenter selon vos besoins
}

function searchForum(query) {
    console.log('Recherche forum:', query);
    // À implémenter selon vos besoins
}

// ========== EXPORT DES FONCTIONS ==========

window.loadForumTopics = loadForumTopics;
window.showForumCreate = showForumCreate;
window.createForumTopic = createForumTopic;
window.viewForumTopic = viewForumTopic;
window.filterForum = filterForum;
window.searchForum = searchForum;
window.toggleTopicPin = toggleTopicPin;
window.toggleTopicStatus = toggleTopicStatus;
window.deleteForumTopic = deleteForumTopic;
window.formatDate = formatDate;
window.truncateText = truncateText;
window.submitReply = submitReply;
window.markAsSolution = markAsSolution;
window.deleteReply = deleteReply;
window.returnToForumTopics = returnToForumTopics;
window.updateNavigationState = updateNavigationState;

console.log('✅ forum.js COMPLET - Système de forum avec vue détaillée CORRIGÉ');