#!/bin/bash

# Script de démarrage robuste pour le serveur backend
# Ce script gère les erreurs courantes et redémarre automatiquement

PROJECT_ROOT="/home/dialibatoul-marakhib/Programation/javascript/full js gestion salarier"
BACKEND_DIR="$PROJECT_ROOT/backend"
LOG_FILE="$BACKEND_DIR/backend.log"

echo "🚀 Démarrage du serveur backend..."
echo "📁 Répertoire: $BACKEND_DIR"

# Fonction pour nettoyer les processus existants
cleanup() {
    echo "🧹 Nettoyage des processus existants..."
    pkill -f "npm.*dev" 2>/dev/null
    pkill -f "node.*backend" 2>/dev/null
    pkill -f "nodemon" 2>/dev/null
    sleep 2
}

# Fonction pour vérifier si le port est libre
check_port() {
    if lsof -Pi :3001 -sTCP:LISTEN -t >/dev/null ; then
        echo "⚠️  Le port 3001 est déjà utilisé"
        echo "🔍 Processus utilisant le port 3001:"
        lsof -Pi :3001 -sTCP:LISTEN
        return 1
    fi
    return 0
}

# Nettoyage initial
cleanup

# Vérification du répertoire
if [ ! -d "$BACKEND_DIR" ]; then
    echo "❌ Erreur: Le répertoire backend n'existe pas: $BACKEND_DIR"
    exit 1
fi

# Navigation vers le répertoire backend
cd "$BACKEND_DIR" || {
    echo "❌ Erreur: Impossible de naviguer vers $BACKEND_DIR"
    exit 1
}

# Vérification du port
if ! check_port; then
    echo "🛑 Arrêt des processus utilisant le port 3001..."
    fuser -k 3001/tcp 2>/dev/null || true
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
echo "🎯 Démarrage du serveur..."
echo "📄 Logs: $LOG_FILE"

# Utiliser nohup pour éviter les problèmes de terminal
nohup npm run dev > "$LOG_FILE" 2>&1 &
SERVER_PID=$!

echo "🆔 PID du serveur: $SERVER_PID"
echo "⏳ Attente du démarrage du serveur..."

# Attendre que le serveur démarre
for i in {1..30}; do
    if curl -s http://localhost:3001/api/sante >/dev/null 2>&1; then
        echo "✅ Serveur backend démarré avec succès!"
        echo "🌐 API disponible sur: http://localhost:3001/api"
        echo "📊 Dashboard: http://localhost:3001"
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
