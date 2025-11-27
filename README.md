# NexusTask AI 🚀 (v1.2.1)

**L'Assistant de Productivité Cognitive.**

NexusTask AI n'est pas une simple "To-Do List". C'est un **système de gestion de la charge mentale** conçu pour les étudiants, freelances, et exécutifs qui jonglent avec des projets complexes. Il utilise l'IA pour analyser, prioriser et coacher l'utilisateur en temps réel.

![Version](https://img.shields.io/badge/version-1.2.1-blue.svg)
![Stack](https://img.shields.io/badge/React-19-61DAFB.svg)
![AI](https://img.shields.io/badge/Gemini-2.5-8E75B2.svg)
![Cloud](https://img.shields.io/badge/Firebase-Firestore-FFCA28.svg)

---

## ✨ Fonctionnalités Clés

### 🧠 1. Analyse de Charge Cognitive
Fini le burnout silencieux. L'IA analyse sémantiquement vos tâches en temps réel pour calculer votre score de charge mentale (0-100%).
*   **Calcul pondéré :** Prend en compte la complexité (IT vs Admin), le contexte du projet et votre vélocité historique.
*   **Conseils adaptatifs :** Si vous êtes en surcharge, l'IA suggère des stratégies immédiates (Délégation, Report).
*   **Deep Dive :** Explication pédagogique des concepts de productivité (Pomodoro, Eisenhower, Batching) appliquée à vos tâches actuelles.

### 👥 2. Système de Mentors (Personas IA)
L'application s'adapte à votre psychologie grâce à 5 coaches distincts :
*   **⚡ Aya (The Operator) :** Action, vitesse, livraison.
*   **🎯 Elias (The Strategist) :** ROI, vision long terme, leverage.
*   **🧠 Mina (Deep Work) :** Focus, énergie cognitive, calme.
*   **⚙️ Salma (Systems) :** Automatisation, process, scalabilité.
*   **🛡️ Kassi (Stoic) :** Discipline, limites, résilience.

> **Nouveau (v1.2)** : Un algorithme d'onboarding vous attribue le mentor idéal en fonction de votre profil (Freelance, Étudiant, Manager...) et de vos contraintes.

### 📂 3. Gestion de Projets Intelligente (v1.2)
*   **Contextes Riches :** Chaque projet possède des domaines (IT, Marketing, etc.) et une priorité stratégique qui influencent les décisions de l'IA.
*   **Planification IA 🪄 :** Vous avez une idée de projet ? Cliquez sur le "Cerveau" et l'IA génère automatiquement la liste des tâches techniques nécessaires pour le réaliser.
*   **Statistiques Pondérées :** Suivi de l'avancement réel basé sur la complexité des sous-tâches.

### 📊 4. Rapports Hebdomadaires & Contre-Analyses
*   Génération d'un rapport PDF-like chaque semaine avec : Wins, Time Leaks (fuites de temps) et Plan d'action.
*   **Feature Unique "Contre-Analyse" ⚖️ :** Demandez à un *autre* mentor de critiquer le rapport du premier pour obtenir une perspective équilibrée (ex: Le Stratège critique l'Opérateur).

---

## 🛠 Architecture Technique

### Frontend
*   **Framework :** React 19 + Vite + TypeScript.
*   **Styling :** Tailwind CSS (Design System "Glassmorphism" + Starfield animé).
*   **State Management :** React Hooks + LocalStorage hybride.

### Backend & Persistance (Hybride)
L'application utilise une architecture **"Offline-First"** robuste :
1.  **Cloud (Firebase Firestore) :** Synchro temps réel, collections éclatées (`users/{uid}/tasks`, `logs`, `projects`) pour la scalabilité.
2.  **Local (LocalStorage) :** Fonctionne sans internet.
3.  **Sécurité (Namespacing) :** Les données locales sont cloisonnées par `USER_UID` pour permettre le multi-compte sur une même machine sans fuite de données.

### Intelligence Artificielle
*   **SDK :** `@google/genai` (Google Gemini API).
*   **Modèle :** `gemini-2.5-flash` (Optimisé pour la latence et le raisonnement JSON).
*   **Techniques :** 
    *   *System Prompting* avancé pour incarner les mentors.
    *   *JSON Mode* strict pour l'intégration UI.
    *   *Context Injection* (Projets, Historique, Vélocité).

---

## 🚀 Installation & Développement

### Prérequis
*   Node.js 18+
*   Une clé API Google Gemini (AI Studio)
*   Un projet Firebase (Optionnel pour le mode Cloud, requis pour la synchro)

### 1. Cloner le projet
```bash
git clone https://github.com/votre-repo/nexus-task-ai.git
cd nexus-task-ai
```

### 2. Installer les dépendances
```bash
npm install
```

### 3. Configuration d'environnement
Créez un fichier `.env` à la racine :
```env
# Obligatoire pour l'IA
VITE_API_KEY=votre_cle_gemini_api_ici

# Optionnel (si vous modifiez la config Firebase dans services/firebase.ts)
# Les clés Firebase sont actuellement hardcodées pour la démo, 
# mais devraient être ici en production.
```

### 4. Lancer en développement
```bash
npm run dev
```

---

## 🔄 Historique des Versions

### v1.2.1 (Actuelle)
*   **New :** Gestion complète des Projets (Création, Édition, Domaines).
*   **AI :** Planificateur de projet automatique ("Magic Planning").
*   **UX :** Badge Mentor dans la navbar + Sélecteur rapide.
*   **Tech :** Migration automatique du schéma de données V1 -> V2 (Zero Data Loss).
*   **Tech :** Correction critique du LocalStorage (Cloisonnement des sessions).

### v1.1.0
*   Introduction des 5 Mentors.
*   Génération de Rapports Hebdomadaires.
*   Mode "Testeur" (Hors-ligne).

### v1.0.0
*   Gestionnaire de tâches basique.
*   Calcul de charge cognitive initial.

---

## 📄 Licence
Ce projet est sous licence MIT. Conçu avec ❤️ pour les esprits créatifs.
