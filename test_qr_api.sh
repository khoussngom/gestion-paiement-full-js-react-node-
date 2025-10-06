#!/bin/bash

echo "=== Test QR Code API ==="

# Récupérer un token d'admin
echo "1. Connexion admin..."
TOKEN_RESPONSE=$(curl -s -X POST http://localhost:3001/api/auth/connexion \
  -H "Content-Type: application/json" \
  -d '{"email": "adminEntreprise1@marakhib.com", "motDePasse": "motdepasse123"}')

TOKEN=$(echo $TOKEN_RESPONSE | grep -o '"token":"[^"]*"' | sed 's/"token":"\([^"]*\)"/\1/')

echo "Token: ${TOKEN:0:50}..."

echo -e "\n2. Test récupération QR Code..."
curl -s -X GET "http://localhost:3001/api/pointages/qr-code/cmg9lahgw0001k83l07rwlson" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" | jq .

echo -e "\n3. Test génération QR Code pour tous..."
curl -s -X POST "http://localhost:3001/api/pointages/qr-code/generer-tous" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" | jq .

echo -e "\n=== Fin des tests ==="