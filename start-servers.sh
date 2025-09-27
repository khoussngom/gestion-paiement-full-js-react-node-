#!/bin/bash

# Script principal pour démarrer les serveurs frontend et backend
# Utilise les scripts individuels pour plus de robustesse

echo "🚀 Démarrage des serveurs de l'application..."

# Définir les chemins
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" &> /dev/null && pwd)"
BACKEND_SCRIPT="$SCRIPT_DIR/start-backend.sh"
FRONTEND_SCRIPT="$SCRIPT_DIR/start-frontend.sh"

echo "� Répertoire du projet: $SCRIPT_DIR"

# Fonction pour arrêter tous les serveurs
stop_servers() {
    echo "🛑 Arrêt des serveurs..."
    pkill -f "npm.*dev" 2>/dev/null || true
    pkill -f "react-scripts" 2>/dev/null || true
    pkill -f "nodemon" 2>/dev/null || true
    fuser -k 3000/tcp 2>/dev/null || true
    fuser -k 3001/tcp 2>/dev/null || true
    sleep 2
}

# Fonction pour vérifier si les scripts existent
check_scripts() {
    if [ ! -f "$BACKEND_SCRIPT" ]; then
        echo "❌ Script backend introuvable: $BACKEND_SCRIPT"
        return 1
    fi
    
    if [ ! -f "$FRONTEND_SCRIPT" ]; then
        echo "❌ Script frontend introuvable: $FRONTEND_SCRIPT"
        return 1
    fi
    
    return 0
}

# Traiter les arguments
CLEAN_MODE=false
if [ "$1" = "--clean" ]; then
    CLEAN_MODE=true
    echo "🧹 Mode nettoyage activé"
fi

if [ "$1" = "--stop" ]; then
    stop_servers
    echo "✅ Tous les serveurs ont été arrêtés"
    exit 0
fi

# Vérifier que les scripts existent
if ! check_scripts; then
    echo "❌ Scripts de démarrage manquants"
    exit 1
fi

# Arrêter les serveurs existants
stop_servers

echo ""
echo "🔧 Démarrage du serveur backend..."
if $CLEAN_MODE; then
    "$BACKEND_SCRIPT" --clean
else
    "$BACKEND_SCRIPT"
fi

if [ $? -ne 0 ]; then
    echo "❌ Échec du démarrage du backend"
    exit 1
fi

echo ""
echo "🌐 Démarrage du serveur frontend..."
if $CLEAN_MODE; then
    "$FRONTEND_SCRIPT" --clean
else
    "$FRONTEND_SCRIPT"
fi

if [ $? -ne 0 ]; then
    echo "❌ Échec du démarrage du frontend"
    exit 1
fi

echo ""
echo "🎉 Tous les serveurs ont démarré avec succès!"
echo ""
echo "� Application:"
echo "   🌐 Frontend: http://localhost:3000"
echo "   � Dashboard: http://localhost:3000/admin/dashboard"
echo "   🔧 API: http://localhost:3001/api"
echo "   ❤️  Santé API: http://localhost:3001/api/sante"
echo ""
echo "📝 Commandes utiles:"
echo "   ./start-servers.sh --stop    # Arrêter tous les serveurs"
echo "   ./start-servers.sh --clean   # Nettoyer et redémarrer"
echo ""
echo "📄 Logs en temps réel:"
echo "   Backend: tail -f backend/backend.log"
echo "   Frontend: tail -f frontend/frontend.log"