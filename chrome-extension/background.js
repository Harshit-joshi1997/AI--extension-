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
        title: 'AI: Translate to...',
        contexts: ['selection']
    },
    {
        id: 'ai-improve',
        title: 'AI: Improve Writing',
        contexts: ['selection']
    }
];

// Language options for translation
const LANGUAGES = [
    { id: 'translate-english', title: 'English', lang: 'English' },
    { id: 'translate-spanish', title: 'Spanish (Español)', lang: 'Spanish' },
    { id: 'translate-french', title: 'French (Français)', lang: 'French' },
    { id: 'translate-german', title: 'German (Deutsch)', lang: 'German' },
    { id: 'translate-italian', title: 'Italian (Italiano)', lang: 'Italian' },
    { id: 'translate-portuguese', title: 'Portuguese (Português)', lang: 'Portuguese' },
    { id: 'translate-chinese', title: 'Chinese (中文)', lang: 'Chinese' },
    { id: 'translate-japanese', title: 'Japanese (日本語)', lang: 'Japanese' },
    { id: 'translate-korean', title: 'Korean (한국어)', lang: 'Korean' },
    { id: 'translate-arabic', title: 'Arabic (العربية)', lang: 'Arabic' },
    { id: 'translate-hindi', title: 'Hindi (हिन्दी)', lang: 'Hindi' },
    { id: 'translate-russian', title: 'Russian (Русский)', lang: 'Russian' }
];

// Initialize context menus on install
chrome.runtime.onInstalled.addListener(() => {
    // Create main context menus
    CONTEXT_MENUS.forEach(menu => {
        chrome.contextMenus.create(menu);
    });

    // Create language submenu items under "AI: Translate to..."
    LANGUAGES.forEach(lang => {
        chrome.contextMenus.create({
            id: lang.id,
            parentId: 'ai-translate',
            title: lang.title,
            contexts: ['selection']
        });
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
    const menuId = info.menuItemId;

    // Check if it's a translation request
    if (menuId.startsWith('translate-')) {
        const language = LANGUAGES.find(l => l.id === menuId);
        if (language) {
            prompt = `Translate this text to ${language.lang}:\n\n${selectedText}`;
        }
    } else {
        // Handle other actions
        switch (menuId) {
            case 'ai-summarize':
                prompt = `Summarize this text concisely:\n\n${selectedText}`;
                break;
            case 'ai-explain':
                prompt = `Explain this text in simple terms:\n\n${selectedText}`;
                break;
            case 'ai-rewrite':
                prompt = `Rewrite this text to make it clearer and more professional:\n\n${selectedText}`;
                break;
            case 'ai-improve':
                prompt = `Improve the writing quality of this text (fix grammar, enhance clarity, improve flow):\n\n${selectedText}`;
                break;
        }
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
