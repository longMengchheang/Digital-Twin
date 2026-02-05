// Chat state
let chatInitialized = false;
let isLoading = false;
let messages = [];

// Initialize chat functionality
function initializeChat() {
    if (chatInitialized) return;
    
    // Initialize Lucide icons
    lucide.createIcons();
    
    // DOM elements
    const messagesContainer = document.getElementById('messages-container');
    const messageInput = document.getElementById('message-input');
    const sendButton = document.getElementById('send-button');
    
    // Check if messages already exist
    if (messagesContainer.querySelector('.message')) return;
    
    // Sample initial message
    const initialMessage = {
        id: '1',
        text: "Hello! I'm your AI companion. How can I help you today?",
        sender: 'ai',
        timestamp: new Date()
    };
    
    // Format time
    function formatTime(date) {
        return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    }
    
    // Add message to UI
    function addMessage(message) {
        // Remove empty state if it exists
        const emptyState = messagesContainer.querySelector('.empty-state');
        if (emptyState) {
            messagesContainer.removeChild(emptyState);
        }
        
        const messageElement = document.createElement('div');
        messageElement.className = `message message-${message.sender}`;
        
        messageElement.innerHTML = `
            ${message.sender === 'ai' ? `
                <div class="message-avatar ai">
                    <i data-lucide="bot"></i>
                </div>
            ` : ''}
            
            <div class="message-content">
                <div class="message-bubble ${message.sender}">
                    ${message.text}
                    <div class="message-meta">
                        <span class="message-time">${formatTime(message.timestamp)}</span>
                    </div>
                </div>
            </div>
            
            ${message.sender === 'user' ? `
                <div class="message-avatar user">
                    <i data-lucide="user"></i>
                </div>
            ` : ''}
        `;
        
        messagesContainer.appendChild(messageElement);
        scrollToBottom();
        lucide.createIcons();
    }
    
    // Show loading indicator
    function showLoading() {
        const loadingElement = document.createElement('div');
        loadingElement.className = 'message message-ai';
        loadingElement.innerHTML = `
            <div class="message-avatar ai">
                <i data-lucide="bot"></i>
            </div>
            <div class="message-content">
                <div class="loading-dots">
                    <div class="loading-dot"></div>
                    <div class="loading-dot"></div>
                    <div class="loading-dot"></div>
                </div>
            </div>
        `;
        
        messagesContainer.appendChild(loadingElement);
        scrollToBottom();
        lucide.createIcons();
        
        return loadingElement;
    }
    
    // Scroll to bottom of messages
    function scrollToBottom() {
        messagesContainer.scrollTop = messagesContainer.scrollHeight;
    }
    
    // Generate AI response
    function generateAIResponse(userMessage) {
        const responses = [
            "That's wonderful to hear! How can I assist you further?",
            "I understand. Would you like to talk more about that?",
            "I'm sorry to hear that. Remember I'm here to help.",
            "Interesting perspective! Tell me more about your thoughts on this.",
            "Let me think about how best to help with that..."
        ];
        
        const userText = userMessage.text.toLowerCase();
        let response;
        
        if (userText.includes('?') || userText.includes('help')) {
            response = "I'd be happy to help with that. Could you provide more details?";
        } 
        else if (userText.includes('sad') || userText.includes('upset')) {
            response = "I'm sorry you're feeling this way. Would it help to talk about what's bothering you?";
        }
        else if (userText.includes('happy') || userText.includes('excited')) {
            response = "That's fantastic! It's great to hear you're feeling positive!";
        }
        else {
            response = responses[Math.floor(Math.random() * responses.length)];
        }
        
        return {
            id: Date.now().toString(),
            text: response,
            sender: 'ai',
            timestamp: new Date()
        };
    }
    
    // Send message
    async function sendMessage() {
        const text = messageInput.value.trim();
        if (!text || isLoading) return;
        
        // Create user message
        const userMessage = {
            id: Date.now().toString(),
            text: text,
            sender: 'user',
            timestamp: new Date()
        };
        
        // Add to UI
        addMessage(userMessage);
        messageInput.value = '';
        messageInput.style.height = 'auto';
        sendButton.disabled = true;
        isLoading = true;
        
        // Show loading indicator
        const loadingElement = showLoading();
        
        // Simulate API delay
        await new Promise(resolve => setTimeout(resolve, 500 + Math.random() * 1000));
        
        // Generate AI response
        const aiMessage = generateAIResponse(userMessage);
        
        // Remove loading and add response
        messagesContainer.removeChild(loadingElement);
        addMessage(aiMessage);
        
        isLoading = false;
    }
    
    // Auto-resize textarea
    messageInput.addEventListener('input', function() {
        this.style.height = 'auto';
        this.style.height = (this.scrollHeight) + 'px';
        sendButton.disabled = this.value.trim() === '' || isLoading;
    });
    
    // Send on Enter (but allow Shift+Enter for new lines)
    messageInput.addEventListener('keydown', function(e) {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            sendMessage();
        }
    });
    
    // Send button click
    sendButton.addEventListener('click', sendMessage);
    
    // Add initial message
    addMessage(initialMessage);
    
    chatInitialized = true;
}

// Make function available globally
window.initializeChat = initializeChat;