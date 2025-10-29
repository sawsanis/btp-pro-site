// ========== FONCTIONS UTILITAIRES ==========
const ANNOUNCE_STATUS = {
    PENDING: 'en_attente',
    APPROVED: 'approuve',
    REJECTED: 'rejete',
    REPORTED: 'signale',
    PAUSED: 'en_pause'
};

const ITEMS_PER_PAGE = 8;

function showAlert(message, type = 'success') {
    const alert = document.querySelector('.message-alert');
    const alertMessage = alert.querySelector('.alert-message');
    
    alertMessage.innerHTML = message;
    alert.className = `alert alert-${type === 'error' ? 'danger' : type} message-alert`;
    alert.style.display = 'block';
    
    setTimeout(() => alert.style.display = 'none', 4000);
}

function showLoading(show) {
    document.querySelector('.loading-overlay').style.display = show ? 'flex' : 'none';
}

function validateEmail(email) {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
}

function validateEmailField(input) {
    const email = input.value.trim();
    const errorDiv = document.getElementById('emailError');
    
    if (!email) {
        input.classList.remove('is-invalid');
        return true;
    }
    
    if (!validateEmail(email)) {
        input.classList.add('is-invalid');
        errorDiv.textContent = 'Format d\'email invalide';
        return false;
    } else {
        input.classList.remove('is-invalid');
        return true;
    }
}

function getStatusBadge(status) {
    const statusMap = {
        [ANNOUNCE_STATUS.PENDING]: { class: 'status-pending', text: 'En attente' },
        [ANNOUNCE_STATUS.APPROVED]: { class: 'status-approved', text: 'Approuvé' },
        [ANNOUNCE_STATUS.REJECTED]: { class: 'status-rejected', text: 'Rejeté' },
        [ANNOUNCE_STATUS.PAUSED]: { class: 'status-paused', text: 'En pause' }
    };
    
    const statusInfo = statusMap[status] || { class: 'status-pending', text: 'Inconnu' };
    return `<span class="announce-status-badge ${statusInfo.class}">${statusInfo.text}</span>`;
}

function trackUserVisit() {
    if (appState.currentUser) {
        btpDB.incrementUserVisit(appState.currentUser.id);
    }
}

// ========== GESTION DU THÈME ==========
function changeTheme(theme) {
    document.body.setAttribute('data-theme', theme);
    appState.theme = theme;
    localStorage.setItem('btp_pro_theme', theme);
}

// Initialisation du thème
const savedTheme = localStorage.getItem('btp_pro_theme') || 'light';
changeTheme(savedTheme);