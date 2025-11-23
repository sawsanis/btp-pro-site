// ========== INTERFACES UTILISATEUR DU FORUM ==========
console.log('🎨 Chargement des interfaces du forum...');

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

async function showTopicDetailView(topic) {
    const container = document.getElementById('forum-content');
    if (!container) {
        console.error('❌ Container forum-content non trouvé');
        return;
    }
    
    try {
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

function updateNavigationState(section) {
    const forumContent = document.getElementById('forum-content');
    if (!forumContent) return;
    
    if (section === 'forum-detail') {
        const topicsContainer = document.getElementById('forum-topics-container');
        if (topicsContainer) {
            topicsContainer.style.display = 'none';
        }
    } else if (section === 'forum') {
        const topicsContainer = document.getElementById('forum-topics-container');
        if (topicsContainer) {
            topicsContainer.style.display = 'block';
        }
    }
}

function returnToForumTopics() {
    console.log('🔙 Retour aux sujets du forum');
    
    if (typeof updateNavigationState === 'function') {
        updateNavigationState('forum');
    }
    
    loadForumTopics();
}

// Export des fonctions
window.showForumCreate = showForumCreate;
window.showTopicDetailView = showTopicDetailView;
window.updateNavigationState = updateNavigationState;
window.returnToForumTopics = returnToForumTopics;

console.log('✅ forum-ui.js chargé - Interfaces utilisateur disponibles');