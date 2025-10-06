#!/bin/bash

echo "=== Diagnostic QR Codes ==="

echo "1. Vérification des QR codes existants..."
cd /home/dialibatoul-marakhib/Programation/javascript/full\ js\ gestion\ salarier/backend

# Requête pour voir les QR codes
echo "SELECT COUNT(*) as total FROM qr_codes_employes;" | npx prisma db execute --stdin
echo "SELECT employeId, actif, dateGeneration FROM qr_codes_employes LIMIT 5;" | npx prisma db execute --stdin

echo ""
echo "2. Suppression des QR codes existants (pour nettoyer)..."
echo "DELETE FROM qr_codes_employes;" | npx prisma db execute --stdin

echo ""
echo "3. Vérification après nettoyage..."
echo "SELECT COUNT(*) as total FROM qr_codes_employes;" | npx prisma db execute --stdin

echo ""
echo "=== Nettoyage terminé ==="