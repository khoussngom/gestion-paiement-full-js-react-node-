import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';
import { StatutCyclePaie, TypeContrat } from './src/enums';

const prisma = new PrismaClient();

async function main() {
  try {
    console.log('🌱 Début du seeding...');

    // Créer une entreprise de test
    const entreprise = await prisma.entreprise.create({
      data: {
        nom: 'TechCorp SARL',
        adresse: '123 Rue de la Technologie, Paris 75001',
        telephone: '0123456789',
        email: 'contact@techcorp.fr',
        actif: true
      }
    });
    console.log('✅ Entreprise créée:', entreprise.nom);

    // Créer une deuxième entreprise
    const entreprise2 = await prisma.entreprise.create({
      data: {
        nom: 'CommerceHouse SAS',
        adresse: '456 Avenue du Commerce, Lyon 69000',
        telephone: '0487654321',
        email: 'contact@commercehouse.fr',
        actif: true
      }
    });
    console.log('✅ Entreprise 2 créée:', entreprise2.nom);

    // Créer les utilisateurs demandés
    const motDePasseHash = await bcrypt.hash('password123', 10);
    
    const adminEntreprise1 = await prisma.utilisateur.create({
      data: {
        nom: 'Admin',
        prenom: 'Entreprise1',
        email: 'adminEntreprise1@marakhib.com',
        motDePasse: motDePasseHash,
        role: 'ADMIN',
        entrepriseId: entreprise.id,
        actif: true
      }
    });
    console.log('✅ Admin Entreprise 1 créé:', adminEntreprise1.email);

    const caissierEntreprise1 = await prisma.utilisateur.create({
      data: {
        nom: 'Caissier',
        prenom: 'Entreprise1',
        email: 'caissierEntrepise1@marakhib.com',
        motDePasse: motDePasseHash,
        role: 'CAISSIER',
        entrepriseId: entreprise.id,
        actif: true
      }
    });
    console.log('✅ Caissier Entreprise 1 créé:', caissierEntreprise1.email);

    const caissierEntreprise2 = await prisma.utilisateur.create({
      data: {
        nom: 'Caissier',
        prenom: 'Entreprise2',
        email: 'caissierEntrepise2@marakhib.com',
        motDePasse: motDePasseHash,
        role: 'CAISSIER',
        entrepriseId: entreprise2.id,
        actif: true
      }
    });
    console.log('✅ Caissier Entreprise 2 créé:', caissierEntreprise2.email);

    const superAdmin = await prisma.utilisateur.create({
      data: {
        nom: 'Super',
        prenom: 'Admin',
        email: 'superadmin@marakhib.com',
        motDePasse: motDePasseHash,
        role: 'SUPER_ADMIN',
        actif: true
      }
    });
    console.log('✅ Super Admin créé:', superAdmin.email);

    // Créer quelques employés de test
    const employes = await Promise.all([
      prisma.employe.create({
        data: {
          nomComplet: 'Jean Dupont',
          email: 'jean.dupont@techcorp.fr',
          telephone: '0123456001',
          adresse: '1 Rue de la Paix, Paris 75001',
          dateEmbauche: new Date('2023-01-01'),
          poste: 'Développeur Full Stack',
          salaireFixe: 45000,
          typeContrat: TypeContrat.SALAIRE_FIXE,
          entrepriseId: entreprise.id,
          actif: true
        }
      }),
      prisma.employe.create({
        data: {
          nomComplet: 'Sophie Martin',
          email: 'sophie.martin@techcorp.fr',
          telephone: '0123456002',
          adresse: '2 Avenue des Champs, Lyon 69000',
          dateEmbauche: new Date('2022-06-01'),
          poste: 'Chef de Projet',
          salaireFixe: 55000,
          typeContrat: TypeContrat.SALAIRE_FIXE,
          entrepriseId: entreprise.id,
          actif: true
        }
      }),
      prisma.employe.create({
        data: {
          nomComplet: 'Paul Bernard',
          email: 'paul.bernard@techcorp.fr',
          telephone: '0123456003',
          adresse: '3 Boulevard Saint-Michel, Marseille 13000',
          dateEmbauche: new Date('2024-01-15'),
          poste: 'Designer UX/UI',
          tauxHonoraire: 450,
          typeContrat: TypeContrat.HONORAIRE,
          entrepriseId: entreprise.id,
          actif: true
        }
      })
    ]);
    console.log('✅ Employés créés:', employes.length);

    // Créer un cycle de paie de test
    const cyclePaie = await prisma.cyclePaie.create({
      data: {
        nom: 'Janvier 2024',
        dateDebut: new Date('2024-01-01'),
        dateFin: new Date('2024-01-31'),
        statut: StatutCyclePaie.BROUILLON,
        entrepriseId: entreprise.id
      }
    });
    console.log('✅ Cycle de paie créé:', cyclePaie.nom);

    console.log('\n🎉 Seeding terminé avec succès !');
    console.log('\n📋 Données de test créées :');
    console.log(`👤 Super Admin: ${superAdmin.email} / password123`);
    console.log(`👤 Admin Entreprise 1: ${adminEntreprise1.email} / password123`);
    console.log(`👤 Caissier Entreprise 1: ${caissierEntreprise1.email} / password123`);
    console.log(`👤 Caissier Entreprise 2: ${caissierEntreprise2.email} / password123`);
    console.log(`🏢 Entreprise 1: ${entreprise.nom}`);
    console.log(`🏢 Entreprise 2: ${entreprise2.nom}`);
    console.log(`👥 Employés: ${employes.length}`);
    console.log(`📅 Cycles de paie: 1`);

  } catch (error) {
    console.error('❌ Erreur lors du seeding:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  });
