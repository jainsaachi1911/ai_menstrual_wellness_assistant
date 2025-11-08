# Environment Setup Guide

## Overview
This guide explains how to set up environment variables for the AI Menstrual Wellness Assistant.

## 🔧 Setup Instructions

### Step 1: Create `.env` File
1. Navigate to the `frontend/` directory
2. Create a new file named `.env` (note: this file is git-ignored for security)
3. Copy the contents from `.env.example`

### Step 2: Add Your API Keys

#### Firebase API Keys
Your Firebase configuration is already available:
```
VITE_FIREBASE_API_KEY=AIzaSyD0uzhfrm-2VTY4GC3DDCSHyp1PkfNeUz8
VITE_FIREBASE_AUTH_DOMAIN=ai-menstrual-wellness.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=ai-menstrual-wellness
VITE_FIREBASE_STORAGE_BUCKET=ai-menstrual-wellness.firebasestorage.app
VITE_FIREBASE_MESSAGING_SENDER_ID=450701292589
VITE_FIREBASE_APP_ID=1:450701292589:web:2ad567ef2aa5086ca374a4
```

#### Groq API Key
1. Go to https://console.groq.com/keys
2. Copy your API key
3. Add it to `.env`:
```
VITE_GROQ_API_KEY=your_groq_api_key_here
```

### Step 3: Complete `.env` File
Your complete `.env` file should look like:
```
VITE_GROQ_API_KEY=your_groq_api_key_here
VITE_FIREBASE_API_KEY=AIzaSyD0uzhfrm-2VTY4GC3DDCSHyp1PkfNeUz8
VITE_FIREBASE_AUTH_DOMAIN=ai-menstrual-wellness.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=ai-menstrual-wellness
VITE_FIREBASE_STORAGE_BUCKET=ai-menstrual-wellness.firebasestorage.app
VITE_FIREBASE_MESSAGING_SENDER_ID=450701292589
VITE_FIREBASE_APP_ID=1:450701292589:web:2ad567ef2aa5086ca374a4
VITE_BACKEND_URL=http://localhost:5000
```

## 🔐 API Key Integration

### Firebase Integration
**File:** `frontend/src/services/firebase.js`

Firebase configuration uses environment variables with fallback values:
```javascript
const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY || "AIzaSyD0uzhfrm-2VTY4GC3DDCSHyp1PkfNeUz8",
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN || "ai-menstrual-wellness.firebaseapp.com",
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID || "ai-menstrual-wellness",
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET || "ai-menstrual-wellness.firebasestorage.app",
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID || "450701292589",
  appId: import.meta.env.VITE_FIREBASE_APP_ID || "1:450701292589:web:2ad567ef2aa5086ca374a4",
};
```

✅ **Status**: Properly integrated with fallback values

### Groq API Integration
**File:** `frontend/src/services/aiService.js`

Groq API key is loaded from environment:
```javascript
const apiKey = import.meta.env.VITE_GROQ_API_KEY;

const client = new OpenAI({
  apiKey,
  baseURL: "https://api.groq.com/openai/v1",
  dangerouslyAllowBrowser: true,
});
```

✅ **Status**: Properly integrated, validates key is present

## ✅ Verification Steps

### 1. Check Firebase Connection
- Navigate to User Profile page
- Try to save profile information
- Should save to Firestore without errors

### 2. Check Groq API Connection
- Navigate to AI Chat page
- Send a message
- Should receive response from Groq API

### 3. Check Console Logs
Open browser DevTools (F12) and check Console tab:
- ✅ "Groq API key loaded successfully" - Key is loaded
- ⚠️ "VITE_GROQ_API_KEY is not set" - Key is missing

## 🚀 Running the Application

### Frontend
```bash
cd frontend
npm install
npm run dev
```

### Backend
```bash
cd backend
python -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate
pip install -r requirements.txt
python app.py
```

## 🔒 Security Notes

1. **Never commit `.env` file** - It's in `.gitignore` for security
2. **Firebase keys are public by design** - They're safe to expose
3. **Groq API key is sensitive** - Keep it private
4. **Use `.env.example`** - As a template for new developers

## 📝 Environment Variables Reference

| Variable | Purpose | Required | Source |
|----------|---------|----------|--------|
| VITE_GROQ_API_KEY | Groq LLM API | Yes | https://console.groq.com/keys |
| VITE_FIREBASE_API_KEY | Firebase Auth | Yes | Firebase Console |
| VITE_FIREBASE_AUTH_DOMAIN | Firebase Auth | Yes | Firebase Console |
| VITE_FIREBASE_PROJECT_ID | Firebase Project | Yes | Firebase Console |
| VITE_FIREBASE_STORAGE_BUCKET | Firebase Storage | Yes | Firebase Console |
| VITE_FIREBASE_MESSAGING_SENDER_ID | Firebase Messaging | Yes | Firebase Console |
| VITE_FIREBASE_APP_ID | Firebase App | Yes | Firebase Console |
| VITE_BACKEND_URL | Backend API | No | Local: http://localhost:5000 |

## 🆘 Troubleshooting

### "API key not found" Error
- Check `.env` file exists in `frontend/` directory
- Verify `VITE_GROQ_API_KEY` is set
- Restart dev server: `npm run dev`

### "401 Invalid API Key" Error
- Verify Groq API key is valid
- Check key hasn't expired
- Get new key from https://console.groq.com/keys

### Firebase Connection Issues
- Verify all Firebase environment variables are set
- Check Firebase project is active
- Verify Firestore database is enabled

## 📞 Support
For issues or questions, refer to the main README.md or documentation files.

---

**Last Updated**: 2024
**Version**: 1.0
