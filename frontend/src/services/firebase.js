// src/services/firebase.js
import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";

const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY || "AIzaSyD0uzhfrm-2VTY4GC3DDCSHyp1PkfNeUz8",
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN || "ai-menstrual-wellness.firebaseapp.com",
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID || "ai-menstrual-wellness",
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET || "ai-menstrual-wellness.firebasestorage.app",
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID || "450701292589",
  appId: import.meta.env.VITE_FIREBASE_APP_ID || "1:450701292589:web:2ad567ef2aa5086ca374a4",
};

const app = initializeApp(firebaseConfig);

export const auth = getAuth(app);
export const db = getFirestore(app);