#!/bin/bash

# Script pour démarrer le backend avec gestion d'erreurs
echo "🔧 Démarrage du backend..."

# Nettoyer l'environnement
export NODE_ENV=development
export PATH="$HOME/.nvm/versions/node/v20.19.5/bin:$PATH"

# Aller au bon répertoire
BACKEND_DIR="/home/dialibatoul-marakhib/Programation/javascript/full js gestion salarier/backend"
cd "$BACKEND_DIR" || exit 1

echo "📁 Répertoire: $(pwd)"

# Nettoyer le cache npm
npm cache clean --force 2>/dev/null || true

# Vérifier le port 3001
if lsof -Pi :3001 -sTCP:LISTEN -t >/dev/null ; then
    echo "🛑 Port 3001 occupé, libération..."
    fuser -k 3001/tcp 2>/dev/null || true
    sleep 2
fi

# Démarrer le serveur
echo "🚀 Lancement du serveur backend..."
npm run dev
