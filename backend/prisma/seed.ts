import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';
import { StatutCyclePaie, TypeContrat, StatutBulletinPaie } from '../src/enums';

const prisma = new PrismaClient();

async function main() {
  try {
    console.log('🌱 Début du seeding...');

    // Créer une entreprise de test
    const entreprise = await prisma.entreprise.create({
      data: {
        nom: 'Marakhib Global',
        adresse: 'malibu,Guédiawaye',
        telephone: '774730039',
        email: 'contact@marakhib-global.com',
        actif: true
      }
    });
    console.log('✅ Entreprise créée:', entreprise.nom);

    // Créer une deuxième entreprise
    const entreprise2 = await prisma.entreprise.create({
      data: {
        nom: 'sindidi global',
        adresse: 'touba',
        telephone: '331234567',
        email: 'contact@sindidi global',
        actif: true
      }
    });
    console.log('✅ Entreprise 2 créée:', entreprise2.nom);

    // Créer les utilisateurs demandés
    const motDePasseHash = await bcrypt.hash('password123', 10);
    
    const adminEntreprise1 = await prisma.utilisateur.upsert({
      where: { email: 'adminEntreprise1@marakhib.com' },
      update: {},
      create: {
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

    const caissierEntreprise1 = await prisma.utilisateur.upsert({
      where: { email: 'caissierEntrepise1@marakhib.com' },
      update: {},
      create: {
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

    const caissierEntreprise2 = await prisma.utilisateur.upsert({
      where: { email: 'caissierEntrepise2@marakhib.com' },
      update: {},
      create: {
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

    const superAdmin = await prisma.utilisateur.upsert({
      where: { email: 'superadmin@marakhib.com' },
      update: {},
      create: {
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
          nomComplet: 'Fallou senghor',
          email: 'FallouSenghor@gmail.com',
          telephone: '771234567',
          adresse: 'niakoul-rab',
          dateEmbauche: new Date('2025-01-01'),
          poste: 'Développeur Full Stack',
          salaireFixe: 450000,
          typeContrat: TypeContrat.SALAIRE_FIXE,
          entrepriseId: entreprise.id,
          actif: true
        }
      }),
      prisma.employe.create({
        data: {
          nomComplet: 'coach aly',
          email: 'aly@gmail.com',
          telephone: '771234567',
          adresse: 'PAI',
          dateEmbauche: new Date('2022-06-01'),
          poste: 'Chef de Projet',
          salaireFixe: 550000,
          typeContrat: TypeContrat.SALAIRE_FIXE,
          entrepriseId: entreprise.id,
          actif: true
        }
      }),
      prisma.employe.create({
        data: {
          nomComplet: 'aliou ndiaye',
          email: 'aliou@gmail.com',
          telephone: '0123456003',
          adresse: 'rufisque',
          dateEmbauche: new Date('2024-01-15'),
          poste: 'Designer UX/UI',
          tauxHonoraire: 5000,
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

    // Créer des bulletins de paie de test
    const bulletinsPaie = await Promise.all([
      prisma.bulletinPaie.create({
        data: {
          employeId: employes[0].id,
          cycleId: cyclePaie.id,
          entrepriseId: entreprise.id,
          salaireBrut: 450000,
          deductions: 0,
          salaireNet: 450000,
          statut: StatutBulletinPaie.PAYE
        }
      }),
      prisma.bulletinPaie.create({
        data: {
          employeId: employes[1].id,
          cycleId: cyclePaie.id,
          entrepriseId: entreprise.id,
          salaireBrut: 550000,
          deductions: 0,
          salaireNet: 550000,
          statut: StatutBulletinPaie.PAYE
        }
      }),
      prisma.bulletinPaie.create({
        data: {
          employeId: employes[2].id,
          cycleId: cyclePaie.id,
          entrepriseId: entreprise.id,
          salaireBrut: 180000,
          deductions: 0,
          salaireNet: 180000,
          statut: StatutBulletinPaie.PAYE
        }
      })
    ]);
    console.log('✅ Bulletins de paie créés:', bulletinsPaie.length);

    // Créer quelques paiements de test
    const paiements = await Promise.all([
      prisma.paiement.create({
        data: {
          bulletinPaieId: bulletinsPaie[0].id,
          employeId: employes[0].id,
          entrepriseId: entreprise.id,
          utilisateurId: adminEntreprise1.id,
          montant: 450000,
          datePaiement: new Date('2024-09-15'),
          modePaiement: 'VIREMENT_BANCAIRE',
          reference: 'PAY-001-2024'
        }
      }),
      prisma.paiement.create({
        data: {
          bulletinPaieId: bulletinsPaie[1].id,
          employeId: employes[1].id,
          entrepriseId: entreprise.id,
          utilisateurId: adminEntreprise1.id,
          montant: 550000,
          datePaiement: new Date('2024-09-15'),
          modePaiement: 'ESPECES',
          reference: 'PAY-002-2024'
        }
      }),
      prisma.paiement.create({
        data: {
          bulletinPaieId: bulletinsPaie[2].id,
          employeId: employes[2].id,
          entrepriseId: entreprise.id,
          utilisateurId: adminEntreprise1.id,
          montant: 180000,
          datePaiement: new Date('2024-09-20'),
          modePaiement: 'VIREMENT_BANCAIRE',
          reference: 'PAY-003-2024'
        }
      })
    ]);
    console.log('✅ Paiements créés:', paiements.length);

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
    console.log(`📋 Bulletins de paie: ${bulletinsPaie.length}`);
    console.log(`💰 Paiements: ${paiements.length}`);

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
