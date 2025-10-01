import { PrismaClient } fro// Vérifier les fichiers dans le dossier uploads/logos
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

function checkLogos() {
    try {
        const __filename = fileURLToPath(import.meta.url);
        const __dirname = path.dirname(__filename);
        const logoDir = path.join(__dirname, 'uploads', 'logos');
        
        console.log('\n📁 Fichiers dans uploads/logos:');
        
        if (fs.existsSync(logoDir)) {
            const files = fs.readdirSync(logoDir);
            files.forEach((file, index) => {
                console.log(`${index + 1}. ${file}`);
            });
        } else {
            console.log('❌ Le dossier uploads/logos n\'existe pas');
        }
    } catch (error) {
        console.log('❌ Erreur:', error.message);
    }
}

checkLogos();nt';

const prisma = new PrismaClient();

async function checkLogos() {
  try {
    console.log('🔍 Vérification des URLs des logos d\'entreprises...\n');
    
    const entreprises = await prisma.entreprise.findMany({
      select: {
        id: true,
        nom: true,
        logo: true,
        couleurPrimaire: true
      }
    });

    console.log(`📊 Nombre total d'entreprises: ${entreprises.length}\n`);

    entreprises.forEach((entreprise, index) => {
      console.log(`${index + 1}. ${entreprise.nom}`);
      console.log(`   ID: ${entreprise.id}`);
      console.log(`   Logo: ${entreprise.logo || 'Aucun logo'}`);
      console.log(`   Couleur: ${entreprise.couleurPrimaire || 'Aucune couleur'}`);
      console.log('');
    });

    // Vérifier les fichiers existants
    console.log('📁 Fichiers dans uploads/logos:');
    const fs = require('fs');
    const path = require('path');
    const logoDir = path.join(__dirname, '../uploads/logos');
    
    if (fs.existsSync(logoDir)) {
      const files = fs.readdirSync(logoDir);
      files.forEach(file => {
        const fullPath = `http://localhost:3001/uploads/logos/${file}`;
        console.log(`   - ${fullPath}`);
      });
    } else {
      console.log('   Dossier logos introuvable!');
    }

  } catch (error) {
    console.error('❌ Erreur:', error);
  } finally {
    await prisma.$disconnect();
  }
}

checkLogos();