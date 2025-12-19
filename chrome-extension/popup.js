// State Management
let conversationHistory = [];
let settings = {
    apiKey: '',
    apiProvider: 'openai',
    serverUrl: 'http://localhost:3000'
};

// Initialize
document.addEventListener('DOMContentLoaded', async () => {
    await loadSettings();
    initializeEventListeners();
    autoResizeTextarea();
});

// Load settings from storage
async function loadSettings() {
    try {
        const result = await chrome.storage.local.get(['settings']);
        if (result.settings) {
            settings = { ...settings, ...result.settings };
            updateSettingsUI();
        }
    } catch (error) {
        console.error('Error loading settings:', error);
    }
}

// Save settings to storage
async function saveSettings() {
    try {
        await chrome.storage.local.set({ settings });
        showNotification('Settings saved successfully!', 'success');
        document.getElementById('settingsPanel').classList.remove('active');
    } catch (error) {
        console.error('Error saving settings:', error);
        showNotification('Failed to save settings', 'error');
    }
}

// Update settings UI
function updateSettingsUI() {
    document.getElementById('apiKey').value = settings.apiKey || '';
    document.getElementById('apiProvider').value = settings.apiProvider || 'openai';
    document.getElementById('serverUrl').value = settings.serverUrl || 'http://localhost:3000';
}

// Initialize event listeners
function initializeEventListeners() {
    // Settings toggle
    document.getElementById('settingsBtn').addEventListener('click', () => {
        document.getElementById('settingsPanel').classList.toggle('active');
    });

    // Save settings
    document.getElementById('saveSettings').addEventListener('click', () => {
        settings.apiKey = document.getElementById('apiKey').value;
        settings.apiProvider = document.getElementById('apiProvider').value;
        settings.serverUrl = document.getElementById('serverUrl').value;
        saveSettings();
    });

    // Send message
    document.getElementById('sendBtn').addEventListener('click', () => sendMessage());

    // Enter to send (Shift+Enter for new line)
    document.getElementById('messageInput').addEventListener('keydown', (e) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            sendMessage();
        }
    });

    // Quick actions
    document.querySelectorAll('.quick-action').forEach(btn => {
        btn.addEventListener('click', async () => {
            const prompt = btn.dataset.prompt;
            const tab = await getCurrentTab();
            const message = `${prompt}\n\nPage: ${tab.title}\nURL: ${tab.url}`;
            sendMessage(message);
        });
    });
}

// Auto-resize textarea
function autoResizeTextarea() {
    const textarea = document.getElementById('messageInput');
    textarea.addEventListener('input', function () {
        this.style.height = 'auto';
        this.style.height = Math.min(this.scrollHeight, 120) + 'px';
    });
}

// Get current tab
async function getCurrentTab() {
    const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
    return tab;
}

// Send message
async function sendMessage(customMessage = null) {
    const input = document.getElementById('messageInput');
    let message = customMessage || input.value.trim();

    // Ensure message is a string
    if (typeof message !== 'string') {
        console.error('Invalid message type:', message);
        return;
    }

    if (!message) return;

    // Clear input
    if (!customMessage) {
        input.value = '';
        input.style.height = 'auto';
    }

    // Hide welcome message
    const welcomeMsg = document.querySelector('.welcome-message');
    if (welcomeMsg) {
        welcomeMsg.style.display = 'none';
    }

    // Add user message to UI
    addMessageToUI(message, 'user');

    // Add to conversation history - ensure it's a string
    conversationHistory.push({
        role: 'user',
        content: String(message)
    });

    // Show loading
    const loadingId = showLoading();

    try {
        // Filter and validate conversation history
        const validHistory = conversationHistory.filter(msg =>
            msg && typeof msg.content === 'string' && msg.role
        );

        // Send to backend (API key is configured in backend .env)
        const response = await fetch(`${settings.serverUrl}/api/chat`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                message: String(message),
                conversationHistory: validHistory,
                provider: settings.apiProvider
            })
        });

        removeLoading(loadingId);

        if (!response.ok) {
            throw new Error(`Server error: ${response.status}`);
        }

        const data = await response.json();

        // Add AI response to UI
        addMessageToUI(data.response, 'ai');

        // Add to conversation history - ensure it's a string
        conversationHistory.push({
            role: 'assistant',
            content: String(data.response || '')
        });

    } catch (error) {
        removeLoading(loadingId);
        console.error('Error sending message:', error);
        showNotification('Failed to send message. Please check your connection and settings.', 'error');
        addMessageToUI('Sorry, I encountered an error. Please try again or check your settings.', 'ai');
    }
}

// Add message to UI
function addMessageToUI(message, type) {
    const messagesContainer = document.getElementById('chatMessages');
    const messageDiv = document.createElement('div');
    messageDiv.className = `message ${type}`;

    const contentDiv = document.createElement('div');
    contentDiv.className = 'message-content';

    // Format message (support markdown-style code blocks)
    contentDiv.innerHTML = formatMessage(message);

    messageDiv.appendChild(contentDiv);
    messagesContainer.appendChild(messageDiv);

    // Scroll to bottom with smooth animation
    messagesContainer.scrollTo({
        top: messagesContainer.scrollHeight,
        behavior: 'smooth'
    });
}

// Format message (basic markdown support)
function formatMessage(text) {
    // Handle non-string inputs
    if (typeof text !== 'string') {
        console.error('formatMessage received non-string:', text);
        return String(text || '');
    }

    // Escape HTML
    let formatted = text
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;');

    // Code blocks
    formatted = formatted.replace(/```(\w+)?\n([\s\S]*?)```/g, (match, lang, code) => {
        return `<pre><code>${code.trim()}</code></pre>`;
    });

    // Inline code
    formatted = formatted.replace(/`([^`]+)`/g, '<code>$1</code>');

    // Bold
    formatted = formatted.replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>');

    // Italic
    formatted = formatted.replace(/\*(.+?)\*/g, '<em>$1</em>');

    // Line breaks
    formatted = formatted.replace(/\n/g, '<br>');

    return formatted;
}

// Show loading animation
function showLoading() {
    const messagesContainer = document.getElementById('chatMessages');
    const loadingDiv = document.createElement('div');
    const loadingId = `loading-${Date.now()}`;
    loadingDiv.id = loadingId;
    loadingDiv.className = 'message ai';
    loadingDiv.innerHTML = `
    <div class="message-content">
      <div class="loading">
        <div class="loading-dot"></div>
        <div class="loading-dot"></div>
        <div class="loading-dot"></div>
      </div>
    </div>
  `;
    messagesContainer.appendChild(loadingDiv);
    messagesContainer.scrollTo({
        top: messagesContainer.scrollHeight,
        behavior: 'smooth'
    });
    return loadingId;
}

// Remove loading animation
function removeLoading(loadingId) {
    const loadingDiv = document.getElementById(loadingId);
    if (loadingDiv) {
        loadingDiv.remove();
    }
}

// Show notification
function showNotification(message, type = 'info') {
    const messagesContainer = document.getElementById('chatMessages');
    const notificationDiv = document.createElement('div');
    notificationDiv.className = type === 'error' ? 'error' : 'success';
    notificationDiv.textContent = message;
    messagesContainer.appendChild(notificationDiv);

    setTimeout(() => {
        notificationDiv.remove();
    }, 3000);
}

// Clear conversation
function clearConversation() {
    conversationHistory = [];
    const messagesContainer = document.getElementById('chatMessages');
    messagesContainer.innerHTML = '';
    const welcomeMsg = document.querySelector('.welcome-message');
    if (welcomeMsg) {
        welcomeMsg.style.display = 'block';
    }
}
