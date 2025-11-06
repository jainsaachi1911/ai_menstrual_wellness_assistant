// src/services/firebase.js
import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";

const firebaseConfig = {
  apiKey: "AIzaSyD0uzhfrm-2VTY4GC3DDCSHyp1PkfNeUz8",
  authDomain: "ai-menstrual-wellness.firebaseapp.com",
  projectId: "ai-menstrual-wellness",
  storageBucket: "ai-menstrual-wellness.firebasestorage.app",
  messagingSenderId: "450701292589",
  appId: "1:450701292589:web:2ad567ef2aa5086ca374a4",
};

const app = initializeApp(firebaseConfig);

export const auth = getAuth(app);
export const db = getFirestore(app);