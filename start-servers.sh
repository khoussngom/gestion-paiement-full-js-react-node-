#!/bin/bash

echo "🚀 Démarrage du système de gestion des salaires..."

# Démarrer le backend
echo "📡 Démarrage du serveur backend..."
cd backend
npm run dev &
BACKEND_PID=$!

# Attendre un peu que le backend démarre
sleep 3

# Démarrer le frontend
echo "🌐 Démarrage du serveur frontend..."
cd ../frontend
npm start &
FRONTEND_PID=$!

echo "✅ Serveurs démarrés !"
echo "🔗 Backend: http://localhost:3001"
echo "🔗 Frontend: http://localhost:3000"
echo ""
echo "Pour arrêter les serveurs, utilisez Ctrl+C"

# Attendre que l'utilisateur arrête les serveurs
wait