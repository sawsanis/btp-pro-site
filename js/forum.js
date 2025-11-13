// ========== FONCTIONS DE GESTION DU FORUM COMPLÈTEMENT CORRIGÉES ==========
async function loadForumTopics() {
    console.log('💬 Chargement des sujets du forum...');
    
    try {
        const topics = await btpDB.get('forum_topics');
        console.log('📊 Sujets du forum récupérés:', topics.length);
        
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
        
        // CORRECTION : Structure avec actions admin à droite
        html += `
        <div class="forum-topic-card p-3 border rounded mb-3 ${topic.isPinned ? 'border-warning bg-warning bg-opacity-10' : ''}">
            <div class="d-flex justify-content-between align-items-start">
                <!-- Contenu du sujet à gauche -->
                <div class="flex-grow-1 me-3">
                    <div class="d-flex align-items-start mb-2">
                        <h5 class="mb-0 me-2">
                            <a href="javascript:void(0)" onclick="viewForumTopic('${topic.id}')" 
                               class="text-decoration-none ${!isActive ? 'text-muted' : 'text-dark'}">
                                ${topic.title || 'Sans titre'}
                            </a>
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
                    
                    <!-- Actions admin - CORRECTION : TOUJOURS VISIBLES POUR ADMIN -->
                    ${appState.currentUser && appState.isAdmin ? `
                    <div class="admin-actions ms-3">
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
        </div>`;
    });
    
    container.innerHTML = html;
}

// CORRECTION : Fonction de suppression améliorée avec confirmation
async function deleteForumTopic(topicId) {
    console.log('🗑️ Suppression du sujet:', topicId);
    
    if (!appState.currentUser || !appState.isAdmin) {
        showAlert('❌ Action réservée aux administrateurs', 'error');
        return;
    }
    
    // Confirmation renforcée
    const confirmation = await showConfirmModal(
        'Supprimer le sujet',
        'Êtes-vous sûr de vouloir supprimer définitivement ce sujet ? Cette action est irréversible.',
        'danger',
        'Supprimer'
    );
    
    if (!confirmation) return;
    
    showLoading(true);
    
    try {
        const success = await btpDB.delete('forum_topics', topicId);
        
        if (success) {
            showAlert('✅ Sujet supprimé avec succès', 'success');
            // Rechargement IMMÉDIAT
            setTimeout(() => {
                loadForumTopics();
                showLoading(false);
            }, 500);
        } else {
            throw new Error('Échec de la suppression');
        }
        
    } catch (error) {
        console.error('❌ Erreur suppression sujet:', error);
        showAlert('❌ Erreur lors de la suppression du sujet', 'error');
        showLoading(false);
    }
}

// NOUVELLE FONCTION : Modal de confirmation amélioré
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

// CORRECTION : Fonctions admin simplifiées
async function toggleTopicPin(topicId, pinState) {
    if (!appState.currentUser || !appState.isAdmin) return;
    
    try {
        await btpDB.put('forum_topics', topicId, {
            isPinned: pinState,
            updatedAt: new Date().toISOString()
        });
        
        showAlert(`✅ Sujet ${pinState ? 'épinglé' : 'désépinglé'}`, 'success');
        loadForumTopics(); // Rechargement immédiat
        
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
        loadForumTopics(); // Rechargement immédiat
        
    } catch (error) {
        console.error('❌ Erreur modification statut:', error);
        showAlert('❌ Erreur lors de la modification', 'error');
    }
}

// Reste du code inchangé...
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
        document.getElementById('forumTopicForm').reset();
        
        setTimeout(() => {
            goToSection('forum');
            setTimeout(() => loadForumTopics(), 100);
        }, 500);
        
    } catch (error) {
        console.error('❌ Erreur création sujet:', error);
        showAlert('❌ Erreur lors de la création du sujet', 'error');
    } finally {
        showLoading(false);
    }
}

function viewForumTopic(topicId) {
    if (!appState.currentUser) {
        showAlert('🔐 Connectez-vous pour voir les détails du sujet', 'warning');
        showLoginModal();
        return;
    }
    
    console.log(`📖 Consultation du sujet ${topicId}`);
    
    btpDB.get('forum_topics').then(topics => {
        const topic = topics.find(t => t.id == topicId);
        if (topic) {
            const newViews = (topic.views || 0) + 1;
            btpDB.put('forum_topics', topicId, {
                views: newViews,
                updatedAt: new Date().toISOString()
            });
            
            showTopicDetails(topic);
        }
    }).catch(error => {
        console.error('Erreur incrémentation vues:', error);
    });
}

// Fonctions utilitaires inchangées...
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

// ========== EXPORT DES FONCTIONS CORRIGÉES ==========
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

console.log('✅ forum.js COMPLÈTEMENT CORRIGÉ - Suppression des sujets OPTIMISÉE');