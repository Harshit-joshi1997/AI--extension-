# 🚀 Quick Setup Guide - AI Blog Reader Extension

## What This Extension Does
Select any text from a blog or article, right-click, and get intelligent AI answers instantly! Also includes a chat popup for asking questions.

## Setup Steps

### 1️⃣ Install Backend Dependencies

```bash
cd backend
npm install
```

### 2️⃣ Configure Your OpenAI API Key

1. Open `backend/.env` file
2. Replace `your_openai_api_key_here` with your actual OpenAI API key
3. Save the file

**Get your OpenAI API key here:** https://platform.openai.com/api-keys

Your `.env` file should look like:
```env
PORT=3000
OPENAI_API_KEY=sk-proj-xxxxxxxxxxxxxxxxxxxxx
```

### 3️⃣ Start the Backend Server

```bash
cd backend
npm start
```

You should see:
```
🚀 AI Assistant Backend running on http://localhost:3000
```

Keep this terminal running!

### 4️⃣ Add Extension Icons

1. Create an `icons` folder inside `chrome-extension/`
2. Add these icon files:
   - `icon16.png` (16x16 pixels)
   - `icon32.png` (32x32 pixels)
   - `icon48.png` (48x48 pixels)
   - `icon128.png` (128x128 pixels)

### 5️⃣ Load Extension in Chrome

1. Open Chrome browser
2. Go to `chrome://extensions/`
3. Enable **Developer mode** (toggle in top right corner)
4. Click **"Load unpacked"**
5. Select the `chrome-extension` folder
6. Done! The extension icon should appear in your toolbar

## 🎯 How to Use

### Method 1: Select & Ask (Main Feature)
1. Go to any blog or article
2. **Select/highlight any text** you want to understand
3. **Right-click** on the selected text
4. Choose an AI action:
   - **AI: Summarize** - Get a quick summary
   - **AI: Explain** - Get a simple explanation
   - **AI: Rewrite** - Improve the text
   - **AI: Translate** - Translate to another language
   - **AI: Improve Writing** - Fix grammar and clarity
5. A beautiful notification will appear with the AI response
6. Click **Copy** or **Replace** as needed

### Method 2: Chat Popup
1. Click the extension icon in your toolbar
2. Type your question in the chat
3. Get instant AI responses
4. Use quick actions like "Summarize Page"

## 🎨 Features You'll Love

✨ **Beautiful Dark UI** - Modern gradient design with smooth animations
📝 **Smart Text Selection** - Highlight and analyze any text on any webpage
💬 **Chat Interface** - Full conversation history with markdown support
⚡ **Quick Actions** - One-click summarization and key points
🔒 **Secure** - Your API key stays in your local .env file
🌐 **Works Everywhere** - Any website, any blog, any article

## 🔧 Troubleshooting

### "API key is required" error
- Make sure you pasted your OpenAI API key in `backend/.env`
- Restart the backend server after adding the key

### Extension not working
- Verify backend server is running on port 3000
- Check Chrome console (F12) for errors
- Make sure you loaded the extension correctly

### Icons not showing
- Add icon files to `chrome-extension/icons/` folder
- Refresh the extension in `chrome://extensions/`

## 📝 File Structure

```
AI extension power/
├── chrome-extension/          # Extension files
│   ├── manifest.json         # Extension config
│   ├── popup.html/css/js     # Chat popup
│   ├── background.js         # Context menu handler
│   ├── content.js/css        # Page notifications
│   └── icons/               # Add your icons here!
├── backend/                  
│   ├── server.js            # AI backend server
│   ├── package.json         
│   └── .env                 # ⚠️ Add your API key here!
└── README.md
```

## 🎉 You're Ready!

Your AI Blog Reader extension is now ready to use. Enjoy intelligent reading assistance on any website!

**Need help?** Check the main README.md for detailed documentation.
