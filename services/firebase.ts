
import firebase from 'firebase/compat/app';
import 'firebase/compat/firestore';
import 'firebase/compat/auth';

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
let auth: any;
let googleProvider: any;

try {
    // Initialisation standard Firebase (Compat/v8 style)
    if (firebaseConfig.apiKey && !firebaseConfig.apiKey.includes("COLLER_ICI")) {
        if (!firebase.apps.length) {
            app = firebase.initializeApp(firebaseConfig);
        } else {
            app = firebase.app();
        }
        
        db = firebase.firestore();
        auth = firebase.auth();
        googleProvider = new firebase.auth.GoogleAuthProvider();
        console.log("✅ Firebase (Auth & DB) connecté avec succès");
    } else {
        console.warn("⚠️ Firebase non configuré. Mode HORS-LIGNE actif.");
    }
} catch (e) {
    console.error("❌ Erreur d'initialisation Firebase:", e);
}

export { db, auth, googleProvider };
export default firebase;
