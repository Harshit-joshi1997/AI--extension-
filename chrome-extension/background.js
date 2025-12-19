// Background service worker for Chrome extension

// Context menu items
const CONTEXT_MENUS = [
    {
        id: 'ai-summarize',
        title: 'AI: Summarize',
        contexts: ['selection']
    },
    {
        id: 'ai-explain',
        title: 'AI: Explain',
        contexts: ['selection']
    },
    {
        id: 'ai-rewrite',
        title: 'AI: Rewrite',
        contexts: ['selection']
    },
    {
        id: 'ai-translate',
        title: 'AI: Translate',
        contexts: ['selection']
    },
    {
        id: 'ai-improve',
        title: 'AI: Improve Writing',
        contexts: ['selection']
    }
];

// Initialize context menus on install
chrome.runtime.onInstalled.addListener(() => {
    // Create context menus
    CONTEXT_MENUS.forEach(menu => {
        chrome.contextMenus.create(menu);
    });

    console.log('AI Assistant extension installed');
});

// Handle context menu clicks
chrome.contextMenus.onClicked.addListener(async (info, tab) => {
    const selectedText = info.selectionText;

    if (!selectedText) return;

    // Get settings
    const { settings } = await chrome.storage.local.get(['settings']);
    const serverUrl = settings?.serverUrl || 'http://localhost:3000';
    const apiKey = settings?.apiKey || '';
    const apiProvider = settings?.apiProvider || 'openai';

    // Determine the action
    let prompt = '';
    switch (info.menuItemId) {
        case 'ai-summarize':
            prompt = `Summarize this text concisely:\n\n${selectedText}`;
            break;
        case 'ai-explain':
            prompt = `Explain this text in simple terms:\n\n${selectedText}`;
            break;
        case 'ai-rewrite':
            prompt = `Rewrite this text to make it clearer and more professional:\n\n${selectedText}`;
            break;
        case 'ai-translate':
            prompt = `Translate this text to English (if not already in English, otherwise translate to Spanish):\n\n${selectedText}`;
            break;
        case 'ai-improve':
            prompt = `Improve the writing quality of this text (fix grammar, enhance clarity, improve flow):\n\n${selectedText}`;
            break;
    }

    try {
        // Send to content script to show notification
        chrome.tabs.sendMessage(tab.id, {
            type: 'SHOW_LOADING',
            action: info.menuItemId
        });

        // Call AI API
        const response = await fetch(`${serverUrl}/api/chat`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                message: prompt,
                provider: apiProvider,
                apiKey: apiKey
            })
        });

        if (!response.ok) {
            throw new Error(`Server error: ${response.status}`);
        }

        const data = await response.json();

        // Send result to content script
        chrome.tabs.sendMessage(tab.id, {
            type: 'SHOW_RESULT',
            action: info.menuItemId,
            result: data.response,
            originalText: selectedText
        });

    } catch (error) {
        console.error('Error processing AI request:', error);

        // Send error to content script
        chrome.tabs.sendMessage(tab.id, {
            type: 'SHOW_ERROR',
            error: error.message
        });
    }
});

// Handle messages from content scripts and popup
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    if (request.type === 'GET_SETTINGS') {
        chrome.storage.local.get(['settings'], (result) => {
            sendResponse({ settings: result.settings });
        });
        return true; // Keep message channel open for async response
    }
});

console.log('AI Assistant background script loaded');
