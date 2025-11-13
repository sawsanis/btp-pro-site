// js/ai-assistant.js - Assistant IA Google Gemini pour BTP Pro
class AIAssistant {
    constructor() {
        this.apiKey = 'VOTRE_CLE_API_GEMINI'; // À obtenir sur Google AI Studio
        this.baseURL = 'https://generativelanguage.googleapis.com/v1beta/models/gemini-pro:generateContent';
        this.conversationHistory = [];
        this.isOpen = false;
        this.initializeAssistant();
    }

    // Initialiser l'assistant
    initializeAssistant() {
        this.createAssistantUI();
        this.setupEventListeners();
    }

    // Créer l'interface utilisateur
    createAssistantUI() {
        const assistantHTML = `
            <div id="aiAssistant" class="ai-assistant">
                <div class="ai-header">
                    <h5>🤖 Assistant BTP Pro</h5>
                    <button class="ai-close-btn">&times;</button>
                </div>
                <div class="ai-chat-container">
                    <div class="ai-messages" id="aiMessages">
                        <div class="ai-welcome-message">
                            <strong>Assistant BTP Pro</strong>
                            <p>Bonjour ! Je suis votre assistant expert en BTP. Je peux vous aider avec :</p>
                            <ul>
                                <li>📐 Calculs techniques et devis</li>
                                <li>🏗️ Conseils construction et rénovation</li>
                                <li>📋 Réglementation et normes</li>
                                <li>🛠️ Choix de matériaux et techniques</li>
                                <li>💰 Estimations de prix et coûts</li>
                            </ul>
                            <small><i class="fas fa-info-circle"></i> Service gratuit - 15,000 requêtes/mois</small>
                        </div>
                    </div>
                    <div class="ai-input-container">
                        <input type="text" id="aiInput" placeholder="Posez votre question BTP..." class="ai-input">
                        <button id="aiSendBtn" class="ai-send-btn">
                            <i class="fas fa-paper-plane"></i>
                        </button>
                    </div>
                </div>
            </div>
            
            <button id="aiToggleBtn" class="ai-toggle-btn">
                <i class="fas fa-robot"></i>
            </button>
        `;

        if (!document.getElementById('aiAssistant')) {
            document.body.insertAdjacentHTML('beforeend', assistantHTML);
        }
    }

    // Configurer les événements
    setupEventListeners() {
        // Bouton toggle
        document.getElementById('aiToggleBtn').addEventListener('click', () => {
            this.toggleAssistant();
        });

        // Bouton fermer
        document.querySelector('.ai-close-btn').addEventListener('click', () => {
            this.hideAssistant();
        });

        // Envoi message
        document.getElementById('aiSendBtn').addEventListener('click', () => {
            this.sendMessage();
        });

        // Entrée clavier
        document.getElementById('aiInput').addEventListener('keypress', (e) => {
            if (e.key === 'Enter') {
                this.sendMessage();
            }
        });

        // Clic externe pour fermer
        document.addEventListener('click', (e) => {
            if (!e.target.closest('#aiAssistant') && !e.target.closest('#aiToggleBtn')) {
                this.hideAssistant();
            }
        });
    }

    // Afficher/masquer l'assistant
    toggleAssistant() {
        const assistant = document.getElementById('aiAssistant');
        if (this.isOpen) {
            assistant.classList.remove('show');
            this.isOpen = false;
        } else {
            assistant.classList.add('show');
            this.isOpen = true;
            document.getElementById('aiInput').focus();
        }
    }

    hideAssistant() {
        document.getElementById('aiAssistant').classList.remove('show');
        this.isOpen = false;
    }

    // Envoyer un message à l'API Gemini
    async sendMessage() {
        const input = document.getElementById('aiInput');
        const message = input.value.trim();

        if (!message) return;

        // Ajouter le message utilisateur
        this.addMessage('user', message);
        input.value = '';

        // Désactiver l'input pendant la requête
        input.disabled = true;
        document.getElementById('aiSendBtn').disabled = true;

        // Afficher le loading
        this.showLoading();

        try {
            const response = await this.callGeminiAPI(message);
            this.addMessage('assistant', response);
        } catch (error) {
            console.error('Erreur API Gemini:', error);
            this.addMessage('assistant', 
                'Désolé, je rencontre un problème technique. ' +
                'Veuillez vérifier votre connexion internet ou réessayer plus tard.'
            );
        } finally {
            // Réactiver l'input
            input.disabled = false;
            document.getElementById('aiSendBtn').disabled = false;
            input.focus();
            
            // Masquer le loading
            this.hideLoading();
        }
    }

    // Appeler l'API Google Gemini
    async callGeminiAPI(userMessage) {
        const prompt = `
            Tu es un expert en BTP (Bâtiment et Travaux Publics) spécialisé pour la plateforme BTP Pro.
            
            CONTEXTE ET EXPERTISE :
            - Calculs techniques : surfaces, volumes, quantités de matériaux
            - Devis et estimations de prix détaillés
            - Conseils construction neuve et rénovation
            - Normes françaises et européennes (NF, DTU)
            - Choix de matériaux adaptés aux projets
            - Solutions techniques pour problèmes courants
            - Réglementation thermique (RE2020)
            - Conseils sécurité chantier
            
            STYLE DE RÉPONSE :
            - Sois technique mais pédagogique
            - Donne des chiffres et estimations quand c'est pertinent
            - Mentionne toujours les normes applicables
            - Recommande de consulter des professionnels pour les projets importants
            - Sois précis et factuel
            - Utilise un langage professionnel mais accessible
            - Réponds en français
            
            QUESTION DE L'UTILISATEUR : ${userMessage}
        `;

        const response = await fetch(`${this.baseURL}?key=${this.apiKey}`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                contents: [{
                    parts: [{
                        text: prompt
                    }]
                }],
                generationConfig: {
                    temperature: 0.7,
                    topK: 40,
                    topP: 0.95,
                    maxOutputTokens: 1024,
                },
                safetySettings: [
                    {
                        category: "HARM_CATEGORY_HARASSMENT",
                        threshold: "BLOCK_MEDIUM_AND_ABOVE"
                    },
                    {
                        category: "HARM_CATEGORY_HATE_SPEECH",
                        threshold: "BLOCK_MEDIUM_AND_ABOVE"
                    }
                ]
            })
        });

        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(`API Gemini Error: ${response.status} - ${JSON.stringify(errorData)}`);
        }

        const data = await response.json();
        
        if (!data.candidates || !data.candidates[0] || !data.candidates[0].content) {
            throw new Error('Réponse API invalide');
        }

        return data.candidates[0].content.parts[0].text;
    }

    // Ajouter un message à l'interface
    addMessage(role, content) {
        const messagesContainer = document.getElementById('aiMessages');
        const messageDiv = document.createElement('div');
        messageDiv.className = `ai-message ai-message-${role}`;
        
        messageDiv.innerHTML = `
            <div class="ai-message-content">
                <strong>${role === 'user' ? 'Vous' : 'Assistant BTP'}</strong>
                <div class="ai-message-text">${this.formatMessage(content)}</div>
            </div>
        `;

        messagesContainer.appendChild(messageDiv);
        messagesContainer.scrollTop = messagesContainer.scrollHeight;
    }

    // Formater le message (markdown basique)
    formatMessage(content) {
        return content
            .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
            .replace(/\*(.*?)\*/g, '<em>$1</em>')
            .replace(/\n/g, '<br>')
            .replace(/- (.*?)(<br>|$)/g, '• $1<br>');
    }

    // Afficher le loading
    showLoading() {
        const messagesContainer = document.getElementById('aiMessages');
        const loadingDiv = document.createElement('div');
        loadingDiv.className = 'ai-message ai-message-assistant ai-loading';
        loadingDiv.id = 'aiLoading';
        loadingDiv.innerHTML = `
            <div class="ai-message-content">
                <strong>Assistant BTP</strong>
                <div class="ai-message-text">
                    <i class="fas fa-spinner fa-spin"></i> Réflexion en cours...
                </div>
            </div>
        `;
        messagesContainer.appendChild(loadingDiv);
        messagesContainer.scrollTop = messagesContainer.scrollHeight;
    }

    // Masquer le loading
    hideLoading() {
        const loading = document.getElementById('aiLoading');
        if (loading) {
            loading.remove();
        }
    }

    // Méthodes spécialisées BTP
    async calculateEstimate(projectDetails) {
        const prompt = `
            En tant qu'expert BTP, estime le coût pour ce projet :
            ${JSON.stringify(projectDetails)}
            
            Donne une estimation détaillée par poste de travail avec fourchettes de prix.
            Précise bien que c'est une estimation indicative et qu'un devis professionnel est nécessaire.
        `;

        return await this.callGeminiAPI(prompt);
    }

    async getTechnicalAdvice(topic) {
        const prompt = `
            Donne des conseils techniques détaillés sur : ${topic}
            Sois précis et cite les normes applicables (NF, DTU).
            Inclus si possible des recommandations de matériaux et techniques.
        `;

        return await this.callGeminiAPI(prompt);
    }

    async getMaterialRecommendation(projectType, budget, constraints) {
        const prompt = `
            Recommande des matériaux pour : ${projectType}
            Budget : ${budget}
            Contraintes : ${constraints}
            
            Donne plusieurs options avec avantages/inconvénients et fourchettes de prix.
        `;

        return await this.callGeminiAPI(prompt);
    }
}

// Initialiser l'assistant
let aiAssistant;

// Démarrer l'assistant quand la page est chargée
document.addEventListener('DOMContentLoaded', function() {
    aiAssistant = new AIAssistant();
    console.log('🤖 Assistant BTP Pro initialisé avec Google Gemini');
});