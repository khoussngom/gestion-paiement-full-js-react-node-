#!/bin/bash

# Script de démarrage robuste pour le serveur frontend
# Ce script gère les erreurs courantes et redémarre automatiquement

PROJECT_ROOT="/home/dialibatoul-marakhib/Programation/javascript/full js gestion salarier"
FRONTEND_DIR="$PROJECT_ROOT/frontend"
LOG_FILE="$FRONTEND_DIR/frontend.log"

echo "🚀 Démarrage du serveur frontend..."
echo "📁 Répertoire: $FRONTEND_DIR"

# Fonction pour nettoyer les processus existants
cleanup() {
    echo "🧹 Nettoyage des processus existants..."
    pkill -f "react-scripts" 2>/dev/null
    pkill -f "node.*frontend" 2>/dev/null
    sleep 2
}

# Fonction pour vérifier si le port est libre
check_port() {
    if lsof -Pi :3000 -sTCP:LISTEN -t >/dev/null ; then
        echo "⚠️  Le port 3000 est déjà utilisé"
        echo "🔍 Processus utilisant le port 3000:"
        lsof -Pi :3000 -sTCP:LISTEN
        return 1
    fi
    return 0
}

# Nettoyage initial
cleanup

# Vérification du répertoire
if [ ! -d "$FRONTEND_DIR" ]; then
    echo "❌ Erreur: Le répertoire frontend n'existe pas: $FRONTEND_DIR"
    exit 1
fi

# Navigation vers le répertoire frontend
cd "$FRONTEND_DIR" || {
    echo "❌ Erreur: Impossible de naviguer vers $FRONTEND_DIR"
    exit 1
}

# Vérification du port
if ! check_port; then
    echo "🛑 Arrêt des processus utilisant le port 3000..."
    fuser -k 3000/tcp 2>/dev/null || true
    sleep 3
fi

# Nettoyage du cache npm si nécessaire
if [ "$1" = "--clean" ]; then
    echo "🧹 Nettoyage du cache npm..."
    npm cache clean --force
    echo "📦 Réinstallation des dépendances..."
    rm -rf node_modules package-lock.json
    npm install
fi

# Démarrage du serveur
echo "🎯 Démarrage du serveur frontend..."
echo "📄 Logs: $LOG_FILE"

# Définir la variable d'environnement pour éviter l'ouverture automatique du navigateur
export BROWSER=none

# Utiliser nohup pour éviter les problèmes de terminal
nohup npm start > "$LOG_FILE" 2>&1 &
SERVER_PID=$!

echo "🆔 PID du serveur: $SERVER_PID"
echo "⏳ Attente du démarrage du serveur..."

# Attendre que le serveur démarre
for i in {1..60}; do
    if curl -s http://localhost:3000 >/dev/null 2>&1; then
        echo "✅ Serveur frontend démarré avec succès!"
        echo "🌐 Application disponible sur: http://localhost:3000"
        echo "📊 Dashboard: http://localhost:3000/admin/dashboard"
        exit 0
    fi
    sleep 1
    echo -n "."
done

echo ""
echo "❌ Échec du démarrage du serveur"
echo "📄 Dernières lignes du log:"
tail -10 "$LOG_FILE"
exit 1
