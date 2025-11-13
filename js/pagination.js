// ========== SYSTÈME DE PAGINATION AMÉLIORÉ ==========
const ITEMS_PER_PAGE = 12;

function setupPagination(containerId, items, displayFunction) {
    const container = document.getElementById(containerId);
    if (!container) {
        console.warn(`❌ Container ${containerId} non trouvé pour la pagination`);
        return;
    }
    
    // Vérifier si les items sont valides
    if (!items || !Array.isArray(items)) {
        console.error('❌ Items invalides pour la pagination:', items);
        container.innerHTML = `
            <div class="col-12 text-center text-danger">
                <i class="fas fa-exclamation-triangle me-2"></i>
                Erreur lors du chargement des données
            </div>
        `;
        return;
    }
    
    const totalPages = Math.ceil(items.length / ITEMS_PER_PAGE);
    let currentPage = 1;
    
    function displayPage(page) {
        // Validation de la page
        if (page < 1 || page > totalPages) {
            console.warn(`❌ Page ${page} invalide. Total pages: ${totalPages}`);
            return;
        }
        
        currentPage = page;
        const startIndex = (page - 1) * ITEMS_PER_PAGE;
        const endIndex = Math.min(startIndex + ITEMS_PER_PAGE, items.length);
        const pageItems = items.slice(startIndex, endIndex);
        
        console.log(`📄 Affichage page ${page}: ${pageItems.length} éléments`);
        
        try {
            displayFunction(pageItems);
            updatePaginationControls();
        } catch (error) {
            console.error('❌ Erreur lors de l\'affichage de la page:', error);
            container.innerHTML = `
                <div class="col-12 text-center text-danger">
                    <i class="fas fa-exclamation-triangle me-2"></i>
                    Erreur d'affichage
                </div>
            `;
        }
    }
    
    function updatePaginationControls() {
        const paginationContainer = document.getElementById(`${containerId}-pagination`);
        if (!paginationContainer) {
            console.warn(`❌ Container de pagination ${containerId}-pagination non trouvé`);
            return;
        }
        
        if (totalPages <= 1) {
            paginationContainer.innerHTML = '';
            return;
        }
        
        let html = `
            <nav aria-label="Pagination">
                <ul class="pagination justify-content-center">
                    <li class="page-item ${currentPage === 1 ? 'disabled' : ''}">
                        <a class="page-link" href="#" onclick="event.preventDefault(); displayPage(${currentPage - 1})" aria-label="Précédent">
                            <i class="fas fa-chevron-left me-1"></i>Précédent
                        </a>
                    </li>`;
        
        // Afficher les numéros de page avec ellipsis
        const maxVisiblePages = 5;
        let startPage = Math.max(1, currentPage - Math.floor(maxVisiblePages / 2));
        let endPage = Math.min(totalPages, startPage + maxVisiblePages - 1);
        
        // Ajuster si on est près du début
        if (endPage - startPage + 1 < maxVisiblePages) {
            startPage = Math.max(1, endPage - maxVisiblePages + 1);
        }
        
        // Première page
        if (startPage > 1) {
            html += `
                <li class="page-item ${1 === currentPage ? 'active' : ''}">
                    <a class="page-link" href="#" onclick="event.preventDefault(); displayPage(1)">1</a>
                </li>`;
            if (startPage > 2) {
                html += `<li class="page-item disabled"><span class="page-link">...</span></li>`;
            }
        }
        
        // Pages visibles
        for (let i = startPage; i <= endPage; i++) {
            html += `
                <li class="page-item ${i === currentPage ? 'active' : ''}">
                    <a class="page-link" href="#" onclick="event.preventDefault(); displayPage(${i})">${i}</a>
                </li>`;
        }
        
        // Dernière page
        if (endPage < totalPages) {
            if (endPage < totalPages - 1) {
                html += `<li class="page-item disabled"><span class="page-link">...</span></li>`;
            }
            html += `
                <li class="page-item ${totalPages === currentPage ? 'active' : ''}">
                    <a class="page-link" href="#" onclick="event.preventDefault(); displayPage(${totalPages})">${totalPages}</a>
                </li>`;
        }
        
        html += `
                    <li class="page-item ${currentPage === totalPages ? 'disabled' : ''}">
                        <a class="page-link" href="#" onclick="event.preventDefault(); displayPage(${currentPage + 1})" aria-label="Suivant">
                            Suivant<i class="fas fa-chevron-right ms-1"></i>
                        </a>
                    </li>
                </ul>
            </nav>
            <div class="text-center mt-2">
                <small class="text-muted">
                    Page ${currentPage} sur ${totalPages} - 
                    ${items.length} annonce${items.length > 1 ? 's' : ''}
                </small>
            </div>`;
        
        paginationContainer.innerHTML = html;
    }
    
    // Initialiser avec la première page
    if (items.length > 0) {
        displayPage(1);
    } else {
        // Pas besoin de pagination si pas d'éléments
        const paginationContainer = document.getElementById(`${containerId}-pagination`);
        if (paginationContainer) {
            paginationContainer.innerHTML = '';
        }
    }
}

// ========== FONCTIONS ADMIN AVANCÉES ==========

async function toggleAnnounceStatus(announceId, announceType, newStatus) {
    if (!appState.currentUser || !appState.isAdmin) {
        showAlert('❌ Accès administrateur requis', 'error');
        return;
    }
    
    const statusMessages = {
        'approuve': 'approuvée',
        'en_pause': 'mise en pause',
        'en_attente': 'mise en attente',
        'rejete': 'rejetée'
    };
    
    const message = statusMessages[newStatus] || 'modifiée';
    
    if (!confirm(`Êtes-vous sûr de vouloir ${message} cette annonce ?`)) {
        return;
    }
    
    showLoading(true);
    
    try {
        const collectionName = getCollectionName(announceType);
        await btpDB.put(collectionName, announceId, {
            status: newStatus,
            moderatedAt: new Date().toISOString(),
            moderatedBy: appState.currentUser.id,
            updatedAt: new Date().toISOString()
        });
        
        showAlert(`✅ Annonce ${message} avec succès`, 'success');
        
        // Recharger la section actuelle
        setTimeout(() => {
            if (window.btpApp && window.btpApp.refreshCurrentSection) {
                window.btpApp.refreshCurrentSection();
            }
        }, 1000);
        
    } catch (error) {
        console.error('❌ Erreur modification statut:', error);
        showAlert('❌ Erreur lors de la modification', 'error');
    } finally {
        showLoading(false);
    }
}

async function togglePremium(announceId, announceType, isPremium) {
    if (!appState.currentUser || !appState.isAdmin) {
        showAlert('❌ Accès administrateur requis', 'error');
        return;
    }
    
    const action = isPremium ? 'mettre en avant' : 'retirer la mise en avant';
    
    if (!confirm(`Êtes-vous sûr de vouloir ${action} cette annonce ?`)) {
        return;
    }
    
    showLoading(true);
    
    try {
        const collectionName = getCollectionName(announceType);
        await btpDB.put(collectionName, announceId, {
            isPremium: isPremium,
            updatedAt: new Date().toISOString()
        });
        
        showAlert(`✅ Annonce ${isPremium ? 'mise en avant' : 'retirée de la mise en avant'} avec succès`, 'success');
        
        // Recharger la section actuelle
        setTimeout(() => {
            if (window.btpApp && window.btpApp.refreshCurrentSection) {
                window.btpApp.refreshCurrentSection();
            }
        }, 1000);
        
    } catch (error) {
        console.error('❌ Erreur modification premium:', error);
        showAlert('❌ Erreur lors de la modification', 'error');
    } finally {
        showLoading(false);
    }
}

// Fonction utilitaire pour obtenir le nom de la collection
function getCollectionName(announceType) {
    const collections = {
        'marketplace': 'marketplace_posts',
        'realestate': 'realestate_posts',
        'jobs': 'job_posts',
        'freelancers': 'freelancers',
        'professionals': 'professionals'
    };
    return collections[announceType] || announceType;
}

// ========== EXPORT DES FONCTIONS ==========
window.setupPagination = setupPagination;
window.toggleAnnounceStatus = toggleAnnounceStatus;
window.togglePremium = togglePremium;
window.ITEMS_PER_PAGE = ITEMS_PER_PAGE;
window.getCollectionName = getCollectionName;

console.log('✅ pagination.js CORRIGÉ - Pagination robuste et fonctions admin optimisées');