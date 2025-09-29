#!/bin/bash

echo "🔄 Redémarrage du backend avec debug..."

# Tuer tous les processus backend
pkill -f "nodemon" 2>/dev/null || true
pkill -f "ts-node" 2>/dev/null || true
fuser -k 3001/tcp 2>/dev/null || true

# Attendre un peu
sleep 2

# Aller dans le répertoire backend
cd "/home/dialibatoul-marakhib/Programation/javascript/full js gestion salarier/backend"

echo "📁 Répertoire: $(pwd)"
echo "🚀 Démarrage du serveur..."

# Démarrer le serveur et montrer les logs
npm run dev
