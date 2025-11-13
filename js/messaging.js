// ========== FONCTIONS DE MESSAGERIE ==========
let currentChat = null;
let messagingOpen = false;
let contacts = [];

function toggleMessaging(contactId = null) {
    const messagingContainer = document.getElementById('messagingContainer');
    
    if (!messagingContainer) {
        console.warn('❌ Container messagerie non trouvé');
        return;
    }
    
    if (messagingOpen) {
        closeMessaging();
    } else {
        openMessaging(contactId);
    }
}

function openMessaging(contactId = null) {
    const messagingContainer = document.getElementById('messagingContainer');
    if (!messagingContainer) return;
    
    messagingContainer.style.display = 'flex';
    messagingOpen = true;
    
    // Charger les contacts
    loadContacts();
    
    if (contactId) {
        // Ouvrir directement une conversation
        openChat(contactId);
    }
}

function closeMessaging() {
    const messagingContainer = document.getElementById('messagingContainer');
    if (messagingContainer) {
        messagingContainer.style.display = 'none';
    }
    messagingOpen = false;
    currentChat = null;
}

async function loadContacts() {
    if (!appState.currentUser) {
        showAlert('🔐 Connectez-vous pour accéder à la messagerie', 'warning');
        closeMessaging();
        return;
    }
    
    try {
        // Récupérer les utilisateurs et messages
        const [messages, users] = await Promise.all([
            btpDB.get('messages'),
            btpDB.get('users')
        ]);
        
        // Filtrer l'utilisateur actuel
        const otherUsers = users.filter(user => user.id !== appState.currentUser.id);
        
        // Créer une liste des contacts avec le dernier message
        const contactMap = new Map();
        
        // Ajouter tous les utilisateurs comme contacts potentiels
        otherUsers.forEach(user => {
            contactMap.set(user.id, {
                id: user.id,
                name: `${user.prenom} ${user.nom}`,
                lastMessage: 'Aucun message',
                timestamp: null,
                unread: false,
                user: user
            });
        });
        
        // Mettre à jour avec les messages existants
        messages.forEach(msg => {
            const contactId = msg.senderId === appState.currentUser.id ? msg.receiverId : msg.senderId;
            const contact = contactMap.get(contactId);
            
            if (contact) {
                contact.lastMessage = msg.content;
                contact.timestamp = msg.timestamp;
                contact.unread = msg.receiverId === appState.currentUser.id && !msg.read;
            }
        });
        
        contacts = Array.from(contactMap.values());
        
        // Trier par dernier message
        contacts.sort((a, b) => {
            if (!a.timestamp && !b.timestamp) return 0;
            if (!a.timestamp) return 1;
            if (!b.timestamp) return -1;
            return new Date(b.timestamp) - new Date(a.timestamp);
        });
        
        displayContacts();
        
    } catch (error) {
        console.error('❌ Erreur chargement contacts:', error);
        showAlert('❌ Erreur lors du chargement des contacts', 'error');
    }
}

function displayContacts() {
    const contactsList = document.getElementById('contactsList');
    if (!contactsList) return;
    
    if (contacts.length === 0) {
        contactsList.innerHTML = `
            <div class="text-center text-muted p-3">
                <i class="fas fa-users fa-2x mb-2"></i>
                <p>Aucun contact disponible</p>
                <small>Les conversations apparaîtront ici</small>
            </div>`;
        return;
    }
    
    let html = '';
    contacts.forEach(contact => {
        const isActive = currentChat === contact.id;
        const unreadBadge = contact.unread ? '<span class="contact-unread-badge">!</span>' : '';
        
        html += `
        <div class="contact-item p-3 border-bottom ${isActive ? 'active' : ''}" 
             onclick="openChat('${contact.id}')"
             style="cursor: pointer; transition: background-color 0.2s;">
            <div class="d-flex justify-content-between align-items-start">
                <div class="flex-grow-1">
                    <div class="d-flex align-items-center">
                        <div class="user-avatar-small me-2">
                            <div style="width: 32px; height: 32px; border-radius: 50%; background: var(--primary-color); color: white; display: flex; align-items: center; justify-content: center; font-weight: bold; font-size: 0.8rem;">
                                ${contact.name.split(' ').map(n => n[0]).join('').toUpperCase()}
                            </div>
                        </div>
                        <div>
                            <strong class="d-block">${contact.name}</strong>
                            <small class="text-muted">${contact.lastMessage.substring(0, 30)}${contact.lastMessage.length > 30 ? '...' : ''}</small>
                        </div>
                    </div>
                </div>
                <div class="text-end">
                    ${unreadBadge}
                    ${contact.timestamp ? `
                    <small class="text-muted d-block">${formatMessageTime(contact.timestamp)}</small>
                    ` : ''}
                </div>
            </div>
        </div>`;
    });
    
    contactsList.innerHTML = html;
}

async function openChat(contactId) {
    if (!appState.currentUser) return;
    
    currentChat = contactId;
    
    try {
        const contact = contacts.find(c => c.id === contactId);
        if (!contact) {
            showAlert('❌ Contact non trouvé', 'error');
            return;
        }
        
        // Mettre à jour l'affichage des contacts
        displayContacts();
        
        // Charger les messages
        await loadChatMessages(contactId);
        
        // Activer la zone de saisie
        const messageInput = document.getElementById('messageInput');
        const sendButton = document.querySelector('.chat-input button');
        
        if (messageInput && sendButton) {
            messageInput.disabled = false;
            messageInput.placeholder = `Message à ${contact.name}...`;
            sendButton.disabled = false;
            
            // Focus sur le champ de saisie
            messageInput.focus();
        }
        
    } catch (error) {
        console.error('❌ Erreur ouverture chat:', error);
        showAlert('❌ Erreur lors de l\'ouverture de la conversation', 'error');
    }
}

async function loadChatMessages(contactId) {
    try {
        const messages = await btpDB.get('messages');
        
        // Filtrer les messages de la conversation
        const chatMessages = messages.filter(msg =>
            (msg.senderId === appState.currentUser.id && msg.receiverId === contactId) ||
            (msg.receiverId === appState.currentUser.id && msg.senderId === contactId)
        ).sort((a, b) => new Date(a.timestamp) - new Date(b.timestamp));
        
        displayMessages(chatMessages, contactId);
        
        // Marquer les messages comme lus
        await markMessagesAsRead(contactId);
        
    } catch (error) {
        console.error('❌ Erreur chargement messages:', error);
    }
}

function displayMessages(messages, contactId) {
    const chatMessages = document.getElementById('chatMessages');
    if (!chatMessages) return;
    
    const contact = contacts.find(c => c.id === contactId);
    
    if (!messages || messages.length === 0) {
        chatMessages.innerHTML = `
            <div class="text-center text-muted mt-5">
                <i class="fas fa-comments fa-2x mb-2"></i>
                <p>Commencez la conversation</p>
                <small>Envoyez le premier message à ${contact?.name || 'ce contact'} !</small>
            </div>`;
        return;
    }
    
    let html = '';
    let lastDate = null;
    
    messages.forEach(msg => {
        const isSent = msg.senderId === appState.currentUser.id;
        const messageDate = new Date(msg.timestamp).toLocaleDateString('fr-FR');
        
        // Afficher la date si elle change
        if (messageDate !== lastDate) {
            html += `
            <div class="text-center my-3">
                <span class="badge bg-secondary">${messageDate}</span>
            </div>`;
            lastDate = messageDate;
        }
        
        html += `
        <div class="message ${isSent ? 'sent' : 'received'}">
            <div class="message-content">${msg.content}</div>
            <div class="message-time">${formatMessageTime(msg.timestamp)}</div>
        </div>`;
    });
    
    chatMessages.innerHTML = html;
    
    // Scroll vers le bas
    setTimeout(() => {
        chatMessages.scrollTop = chatMessages.scrollHeight;
    }, 100);
}

async function sendMessage() {
    const messageInput = document.getElementById('messageInput');
    const content = messageInput?.value.trim();
    
    if (!content || !currentChat) return;
    
    if (!appState.currentUser) {
        showAlert('🔐 Connectez-vous pour envoyer un message', 'warning');
        return;
    }
    
    try {
        const message = {
            senderId: appState.currentUser.id,
            receiverId: currentChat,
            content: content,
            timestamp: new Date().toISOString(),
            read: false
        };
        
        await btpDB.post('messages', message);
        
        // Recharger les messages
        await loadChatMessages(currentChat);
        
        // Vider le champ de saisie
        if (messageInput) {
            messageInput.value = '';
        }
        
        // Recharger les contacts pour mettre à jour le dernier message
        loadContacts();
        
    } catch (error) {
        console.error('❌ Erreur envoi message:', error);
        showAlert('❌ Erreur lors de l\'envoi du message', 'error');
    }
}

async function markMessagesAsRead(contactId) {
    try {
        const messages = await btpDB.get('messages');
        const unreadMessages = messages.filter(msg => 
            msg.receiverId === appState.currentUser.id && 
            msg.senderId === contactId && 
            !msg.read
        );
        
        // Marquer chaque message comme lu
        for (const msg of unreadMessages) {
            await btpDB.put('messages', msg.id, { read: true });
        }
        
        // Recharger les contacts pour mettre à jour les badges
        loadContacts();
        
    } catch (error) {
        console.error('❌ Erreur marquage messages lus:', error);
    }
}

function formatMessageTime(timestamp) {
    if (!timestamp) return '';
    
    const date = new Date(timestamp);
    const now = new Date();
    const diffMs = now - date;
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);
    
    if (diffMins < 1) return 'À l\'instant';
    if (diffMins < 60) return `Il y a ${diffMins} min`;
    if (diffHours < 24) return `Il y a ${diffHours} h`;
    if (diffDays < 7) return `Il y a ${diffDays} j`;
    
    return date.toLocaleDateString('fr-FR', { 
        day: 'numeric', 
        month: 'short',
        hour: '2-digit',
        minute: '2-digit'
    });
}

// Gestion de l'appui sur Entrée
document.addEventListener('DOMContentLoaded', function() {
    const messageInput = document.getElementById('messageInput');
    if (messageInput) {
        messageInput.addEventListener('keypress', function(e) {
            if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                sendMessage();
            }
        });
    }
});

// ========== EXPORT DES FONCTIONS ==========
window.toggleMessaging = toggleMessaging;
window.openChat = openChat;
window.sendMessage = sendMessage;

console.log('✅ messaging.js corrigé - Messagerie PRÊTE avec interface complète');