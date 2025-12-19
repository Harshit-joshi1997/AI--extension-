// Content script - injected into web pages

// Listen for messages from background script
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    if (request.type === 'SHOW_LOADING') {
        showLoadingNotification(request.action);
    } else if (request.type === 'SHOW_RESULT') {
        showResultNotification(request.result, request.action, request.originalText);
    } else if (request.type === 'SHOW_ERROR') {
        showErrorNotification(request.error);
    }
});

// Show loading notification
function showLoadingNotification(action) {
    removeExistingNotifications();

    const notification = createNotificationElement('loading');
    notification.innerHTML = `
    <div class="ai-notification-content">
      <div class="ai-notification-icon">
        <div class="ai-spinner"></div>
      </div>
      <div class="ai-notification-text">
        <div class="ai-notification-title">AI is thinking...</div>
        <div class="ai-notification-subtitle">Processing your request</div>
      </div>
    </div>
  `;

    document.body.appendChild(notification);

    setTimeout(() => {
        notification.classList.add('show');
    }, 10);
}

// Show result notification
function showResultNotification(result, action, originalText) {
    removeExistingNotifications();

    const notification = createNotificationElement('result');

    const actionTitles = {
        'ai-summarize': 'Summary',
        'ai-explain': 'Explanation',
        'ai-rewrite': 'Rewritten Text',
        'ai-translate': 'Translation',
        'ai-improve': 'Improved Text'
    };

    notification.innerHTML = `
    <div class="ai-notification-content">
      <div class="ai-notification-header">
        <div class="ai-notification-icon">✨</div>
        <div class="ai-notification-title">${actionTitles[action] || 'AI Result'}</div>
        <button class="ai-notification-close" onclick="this.closest('.ai-notification').remove()">×</button>
      </div>
      <div class="ai-notification-body">
        <div class="ai-result-text">${formatText(result)}</div>
      </div>
      <div class="ai-notification-actions">
        <button class="ai-btn ai-btn-copy" data-text="${escapeHtml(result)}">
          <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
            <rect x="9" y="9" width="13" height="13" rx="2" stroke="currentColor" stroke-width="2"/>
            <path d="M5 15H4C2.89543 15 2 14.1046 2 13V4C2 2.89543 2.89543 2 4 2H13C14.1046 2 15 2.89543 15 4V5" stroke="currentColor" stroke-width="2"/>
          </svg>
          Copy
        </button>
        <button class="ai-btn ai-btn-replace" data-text="${escapeHtml(result)}">
          <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M4 12H20M20 12L14 6M20 12L14 18" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
          </svg>
          Replace
        </button>
      </div>
    </div>
  `;

    document.body.appendChild(notification);

    setTimeout(() => {
        notification.classList.add('show');
    }, 10);

    // Add event listeners
    notification.querySelector('.ai-btn-copy').addEventListener('click', function () {
        copyToClipboard(this.dataset.text);
        this.innerHTML = '<svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M20 6L9 17L4 12" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></svg> Copied!';
        setTimeout(() => {
            this.innerHTML = '<svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"><rect x="9" y="9" width="13" height="13" rx="2" stroke="currentColor" stroke-width="2"/><path d="M5 15H4C2.89543 15 2 14.1046 2 13V4C2 2.89543 2.89543 2 4 2H13C14.1046 2 15 2.89543 15 4V5" stroke="currentColor" stroke-width="2"/></svg> Copy';
        }, 2000);
    });

    // Auto-hide after 10 seconds
    setTimeout(() => {
        notification.classList.remove('show');
        setTimeout(() => notification.remove(), 300);
    }, 10000);
}

// Show error notification
function showErrorNotification(error) {
    removeExistingNotifications();

    const notification = createNotificationElement('error');
    notification.innerHTML = `
    <div class="ai-notification-content">
      <div class="ai-notification-icon">⚠️</div>
      <div class="ai-notification-text">
        <div class="ai-notification-title">Error</div>
        <div class="ai-notification-subtitle">${error}</div>
      </div>
      <button class="ai-notification-close" onclick="this.closest('.ai-notification').remove()">×</button>
    </div>
  `;

    document.body.appendChild(notification);

    setTimeout(() => {
        notification.classList.add('show');
    }, 10);

    setTimeout(() => {
        notification.classList.remove('show');
        setTimeout(() => notification.remove(), 300);
    }, 5000);
}

// Create notification element
function createNotificationElement(type) {
    const notification = document.createElement('div');
    notification.className = `ai-notification ai-notification-${type}`;
    return notification;
}

// Remove existing notifications
function removeExistingNotifications() {
    document.querySelectorAll('.ai-notification').forEach(el => el.remove());
}

// Format text
function formatText(text) {
    return text
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/\n/g, '<br>')
        .replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
        .replace(/\*(.+?)\*/g, '<em>$1</em>');
}

// Escape HTML
function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

// Copy to clipboard
async function copyToClipboard(text) {
    try {
        await navigator.clipboard.writeText(text);
    } catch (err) {
        console.error('Failed to copy:', err);
    }
}

console.log('AI Assistant content script loaded');
