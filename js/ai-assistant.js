// js/ai-assistant.js - Version Hugging Face Optimisée
class AIAssistant {
    constructor() {
        // Clé HF gratuite - à obtenir sur huggingface.co/settings/tokens
        this.apiKey = 'hf_votre_cle_gratuite_ici';
        this.baseURL = 'https://api-inference.huggingface.co/models';
        this.currentModel = 'microsoft/DialoGPT-medium'; // Modèle stable
        this.fallbackModels = [
            'google/flan-t5-xl',
            'microsoft/DialoGPT-large'
        ];
        this.conversationHistory = [];
        this.isOpen = false;
        this.initializeAssistant();
    }

    async callHuggingFaceAPI(userMessage) {
        const prompt = this.buildBTPPrompt(userMessage);
        
        // Essayer le modèle principal
        try {
            return await this.tryModel(this.currentModel, prompt);
        } catch (error) {
            console.warn(`Modèle ${this.currentModel} échoué, essai fallback...`);
            
            // Essayer les modèles de fallback
            for (const model of this.fallbackModels) {
                try {
                    return await this.tryModel(model, prompt);
                } catch (fallbackError) {
                    console.warn(`Fallback ${model} aussi échoué`);
                }
            }
            throw new Error('Tous les modèles ont échoué');
        }
    }

    async tryModel(model, prompt) {
        const response = await fetch(`${this.baseURL}/${model}`, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${this.apiKey}`,
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                inputs: prompt,
                parameters: {
                    max_new_tokens: 800,
                    temperature: 0.7,
                    top_p: 0.9,
                    do_sample: true,
                    return_full_text: false
                },
                options: {
                    wait_for_model: true, // ⚠️ Peut timeout si modèle pas chargé
                    use_cache: true
                }
            })
        });

        if (!response.ok) {
            const errorText = await response.text();
            
            if (response.status === 503) {
                throw new Error('MODEL_LOADING');
            } else if (response.status === 429) {
                throw new Error('RATE_LIMIT');
            } else {
                throw new Error(`API Error: ${response.status} - ${errorText}`);
            }
        }

        const data = await response.json();
        
        // Format de réponse variable selon le modèle
        if (Array.isArray(data)) {
            return data[0]?.generated_text || "Désolé, je n'ai pas pu générer de réponse.";
        } else if (data.generated_text) {
            return data.generated_text;
        } else {
            return "Format de réponse inattendu.";
        }
    }

    buildBTPPrompt(userMessage) {
        return `<s>[INST] <<SYS>>
Tu es un expert BTP français avec 20 ans d'expérience. 
Tu réponds de manière technique, précise et pédagogique.

DOMAINES D'EXPERTISE:
- Calculs techniques (surfaces, volumes, matériaux)
- Devis et estimations de prix
- Normes françaises (DTU, NF)
- Conseils construction/rénovation
- Choix de matériaux
- Réglementation RE2020

STYLE:
- Sois factuel et technique
- Donne des chiffres concrets quand possible
- Mentionne les normes applicables
- Recommande des professionnels pour les gros travaux
- Réponds en français professionnel
<</SYS>>

Question: ${userMessage} [/INST]
Réponse:`;
    }

    // Gestion intelligente des erreurs
    async sendMessage() {
        const input = document.getElementById('aiInput');
        const message = input.value.trim();

        if (!message) return;

        this.addMessage('user', message);
        input.value = '';
        input.disabled = true;
        
        this.showLoading();

        try {
            const response = await this.callHuggingFaceAPI(message);
            this.addMessage('assistant', this.cleanResponse(response));
            
        } catch (error) {
            console.error('Erreur API:', error);
            
            let errorMessage = "Désolé, service temporairement indisponible. ";
            
            if (error.message === 'MODEL_LOADING') {
                errorMessage += "Le modèle est en cours de chargement (peut prendre 30s). Réessayez dans quelques instants.";
            } else if (error.message === 'RATE_LIMIT') {
                errorMessage += "Trop de requêtes. Veuillez patienter 1 minute.";
            } else {
                errorMessage += "Veuillez réessayer ou contacter le support.";
            }
            
            this.addMessage('assistant', errorMessage);
            
        } finally {
            input.disabled = false;
            input.focus();
            this.hideLoading();
        }
    }

    cleanResponse(response) {
        // Nettoyer la réponse des artefacts du modèle
        return response
            .replace(/<\/?s>/g, '')
            .replace(/\[INST\].*?\[\/INST\]/g, '')
            .replace(/<<SYS>>.*?<<\/SYS>>/g, '')
            .trim();
    }
}