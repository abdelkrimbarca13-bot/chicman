# Guide de Lancement du Projet

Ce projet est composé d'un **Backend** (Node.js, Express, Prisma, SQLite) et d'un **Frontend** (React, Vite, Tailwind CSS).

## Prérequis

- **Node.js** (v18 ou supérieur recommandé)
- **npm** (installé avec Node.js)

---

## 1. Configuration du Backend

Le backend gère l'API et la base de données SQLite.

1.  Ouvrez un terminal et accédez au dossier `backend` :
    ```bash
    cd backend
    ```
2.  Installez les dépendances :
    ```bash
    npm install
    ```
3.  Initialisez la base de données et générez le client Prisma :
    ```bash
    npx prisma generate
    ```
    *(Note : Si vous souhaitez réinitialiser la base de données avec les migrations, vous pouvez lancer `npx prisma migrate dev`)*
4.  (Optionnel) Remplissez la base de données avec des données de test :
    ```bash
    npm run seed
    ```
5.  Lancez le serveur en mode développement :
    ```bash
    npm run dev
    ```
    Le serveur sera accessible sur `http://localhost:5000`.

---

## 2. Configuration du Frontend

Le frontend est l'interface utilisateur React.

1.  Ouvrez un **nouveau terminal** et accédez au dossier `frontend` :
    ```bash
    cd frontend
    ```
2.  Installez les dépendances :
    ```bash
    npm install
    ```
3.  Lancez l'application en mode développement :
    ```bash
    npm run dev
    ```
    L'application sera accessible sur `http://localhost:5173`.

---

## Résumé des Commandes

| Action | Emplacement | Commande |
| :--- | :--- | :--- |
| **Installer Backend** | `/backend` | `npm install` |
| **Générer Prisma** | `/backend` | `npx prisma generate` |
| **Lancer Backend** | `/backend` | `npm run dev` |
| **Installer Frontend** | `/frontend` | `npm install` |
| **Lancer Frontend** | `/frontend` | `npm run dev` |
