// ========== FONCTIONS UTILITAIRES DU FORUM ==========
// Ces fonctions sont indépendantes et sans risque

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

// Export des fonctions
window.getCategoryLabel = getCategoryLabel;
window.getCategoryColor = getCategoryColor;
window.formatDate = formatDate;
window.truncateText = truncateText;
window.formatForumContent = formatForumContent;
window.extractTags = extractTags;
window.showConfirmModal = showConfirmModal;

console.log('✅ forum-utils.js chargé - Utilitaires disponibles');