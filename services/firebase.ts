import { initializeApp } from 'firebase/app';
import { getFirestore } from 'firebase/firestore';

// ---------------------------------------------------------
// CONFIGURATION FIREBASE
// ---------------------------------------------------------

const firebaseConfig = {
  apiKey: "AIzaSyDNJsBGVzRb-lIlp3ub6uWIwlQjzz5Gll0",
  authDomain: "nexus-task-ai.firebaseapp.com",
  projectId: "nexus-task-ai",
  storageBucket: "nexus-task-ai.firebasestorage.app",
  messagingSenderId: "853869418932",
  appId: "1:853869418932:web:7832148e4dbde9e0183ae1"
};

// ---------------------------------------------------------

let app;
let db: any;

try {
    // Initialisation standard Firebase
    if (firebaseConfig.apiKey && !firebaseConfig.apiKey.includes("COLLER_ICI")) {
        app = initializeApp(firebaseConfig);
        db = getFirestore(app);
        console.log("✅ Firebase connecté avec succès");
    } else {
        console.warn("⚠️ Firebase non configuré. Mode HORS-LIGNE actif.");
    }
} catch (e) {
    console.error("❌ Erreur d'initialisation Firebase:", e);
}

export { db };