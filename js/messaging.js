// ========== FONCTIONS DE MESSAGERIE ==========
let currentChat = null;

function toggleMessaging() {
    const container = document.getElementById('messagingContainer');
    container.style.display = container.style.display === 'flex' ? 'none' : 'flex';
    
    if (container.style.display === 'flex') {
        loadContacts();
    }
}

async function loadContacts() {
    const users = await btpDB.get('users');
    const currentUserId = appState.currentUser?.id;
    
    const contactsList = document.getElementById('contactsList');
    let html = '';
    
    users.forEach(user => {
        if (user.id !== currentUserId) {
            html += `
            <div class="contact-item" onclick="selectContact(${user.id}, '${user.prenom} ${user.nom}')">
                <div class="d-flex align-items-center">
                    <div style="width: 40px; height: 40px; border-radius: 50%; background: var(--primary-color); color: white; display: flex; align-items: center; justify-content: center; font-weight: bold; margin-right: 10px;">
                        ${user.prenom.charAt(0)}${user.nom.charAt(0)}
                    </div>
                    <div>
                        <strong>${user.prenom} ${user.nom}</strong>
                        <div class="text-muted small">En ligne</div>
                    </div>
                </div>
            </div>`;
        }
    });
    
    contactsList.innerHTML = html || '<div class="text-center p-3 text-muted">Aucun contact</div>';
}

function selectContact(userId, userName) {
    currentChat = { userId, userName };
    
    // Activer le contact
    document.querySelectorAll('.contact-item').forEach(item => {
        item.classList.remove('active');
    });
    event.target.closest('.contact-item').classList.add('active');
    
    // Activer la messagerie
    document.getElementById('messageInput').disabled = false;
    document.querySelector('.chat-input button').disabled = false;
    
    // Charger les messages
    loadMessages(userId);
}

async function loadMessages(userId) {
    const messages = await btpDB.get('messages');
    const chatMessages = document.getElementById('chatMessages');
    
    const userMessages = messages.filter(msg => 
        (msg.senderId === appState.currentUser.id && msg.receiverId === userId) ||
        (msg.senderId === userId && msg.receiverId === appState.currentUser.id)
    ).sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt));
    
    let html = '';
    userMessages.forEach(msg => {
        const isSent = msg.senderId === appState.currentUser.id;
        html += `
        <div class="message ${isSent ? 'sent' : 'received'}">
            <div>${msg.content}</div>
            <div class="message-time">${new Date(msg.createdAt).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}</div>
        </div>`;
    });
    
    chatMessages.innerHTML = html || '<div class="alert alert-info text-center">Aucun message échangé</div>';
    chatMessages.scrollTop = chatMessages.scrollHeight;
}

async function sendMessage() {
    const messageInput = document.getElementById('messageInput');
    const message = messageInput.value.trim();
    
    if (!message || !currentChat) return;
    
    try {
        await btpDB.post('messages', {
            senderId: appState.currentUser.id,
            senderName: `${appState.currentUser.prenom} ${appState.currentUser.nom}`,
            receiverId: currentChat.userId,
            receiverName: currentChat.userName,
            content: message,
            read: false
        });
        
        messageInput.value = '';
        loadMessages(currentChat.userId);
    } catch (error) {
        console.error('Erreur envoi message:', error);
        showAlert('❌ Erreur lors de l\'envoi du message', 'error');
    }
}