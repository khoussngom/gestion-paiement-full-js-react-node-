// Script de test pour vérifier l'intégration du système de pointage
// Usage: node test-pointage-integration.js

const fetch = require('node-fetch');

const BASE_URL = 'http://localhost:3001/api';

// Tokens de test (à remplacer par de vrais tokens)
const ADMIN_TOKEN = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...'; // Token admin
const VIGILE_TOKEN = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...'; // Token vigile

async function testerEndpoints() {
  console.log('🧪 Test d\'intégration du système de pointage\n');

  // Test 1: Santé du serveur
  try {
    console.log('1️⃣ Test de connexion au serveur...');
    const response = await fetch(`${BASE_URL}/health`);
    console.log(response.ok ? '✅ Serveur accessible' : '❌ Serveur inaccessible');
  } catch (error) {
    console.log('❌ Erreur de connexion:', error.message);
    return;
  }

  // Test 2: Endpoint génération QR (nécessite un employé existant)
  try {
    console.log('\n2️⃣ Test génération QR code...');
    const response = await fetch(`${BASE_URL}/pointages/qr/generer/test-employee-id`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${ADMIN_TOKEN}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ dureeValidite: 7 })
    });
    
    if (response.ok) {
      const data = await response.json();
      console.log('✅ QR Code généré avec succès');
      console.log(`   - ID: ${data.donnees?.qrCode?.id}`);
    } else {
      console.log(`❌ Erreur génération QR: ${response.status}`);
    }
  } catch (error) {
    console.log('❌ Erreur génération QR:', error.message);
  }

  // Test 3: Endpoint statistiques
  try {
    console.log('\n3️⃣ Test statistiques...');
    const response = await fetch(`${BASE_URL}/pointages/statistiques`, {
      headers: {
        'Authorization': `Bearer ${ADMIN_TOKEN}`
      }
    });
    
    if (response.ok) {
      const data = await response.json();
      console.log('✅ Statistiques récupérées');
      console.log(`   - Total pointages: ${data.donnees?.totalPointages || 0}`);
    } else {
      console.log(`❌ Erreur statistiques: ${response.status}`);
    }
  } catch (error) {
    console.log('❌ Erreur statistiques:', error.message);
  }

  // Test 4: Endpoint présents temps réel
  try {
    console.log('\n4️⃣ Test présents temps réel...');
    const response = await fetch(`${BASE_URL}/pointages/presents-temps-reel`, {
      headers: {
        'Authorization': `Bearer ${VIGILE_TOKEN}`
      }
    });
    
    if (response.ok) {
      const data = await response.json();
      console.log('✅ Présents temps réel OK');
      console.log(`   - Nombre de présents: ${data.donnees?.length || 0}`);
    } else {
      console.log(`❌ Erreur présents temps réel: ${response.status}`);
    }
  } catch (error) {
    console.log('❌ Erreur présents temps réel:', error.message);
  }

  console.log('\n🎯 Tests terminés!');
  console.log('\n📋 Étapes suivantes:');
  console.log('   1. Appliquer la migration: npx prisma migrate dev');
  console.log('   2. Créer un utilisateur vigile');
  console.log('   3. Générer des QR codes pour vos employés');
  console.log('   4. Tester le scan avec l\'interface vigile');
  console.log('   5. Consulter les rapports dans l\'interface admin');
}

// Variables d'environnement pour faciliter les tests
console.log('🔧 Configuration de test:');
console.log(`   - URL Backend: ${BASE_URL}`);
console.log(`   - Admin Token: ${ADMIN_TOKEN ? 'Configuré' : 'Non configuré'}`);
console.log(`   - Vigile Token: ${VIGILE_TOKEN ? 'Configuré' : 'Non configuré'}\n`);

if (ADMIN_TOKEN.includes('...') || VIGILE_TOKEN.includes('...')) {
  console.log('⚠️  Veuillez configurer de vrais tokens JWT dans ce script pour tester les endpoints protégés.\n');
}

// Exécuter les tests si ce fichier est appelé directement
if (require.main === module) {
  testerEndpoints();
}

module.exports = { testerEndpoints };