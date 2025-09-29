import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';
import { RoleUtilisateur, TypeContrat, StatutCyclePaie, StatutBulletinPaie, ModePaiement } from '../enums';

const prisma = new PrismaClient();

async function seed() {
  console.log('🌱 Démarrage du seed de la base de données...');

  try {
    // 1. Créer une entreprise de démonstration
    const entrepriseDemo = await prisma.entreprise.create({
      data: {
        nom: 'Entreprise Démonstration SARL',
        adresse: '123 Avenue de la Paix, Dakar, Sénégal',
        telephone: '+221 33 456 78 90',
        email: 'contact@entreprise-demo.sn',
        devise: 'FCFA',
        typePeriode: 'MENSUEL'
      }
    });
    console.log('✅ Entreprise de démonstration créée');

    // 2. Créer un super-administrateur
    const motDePasseHache = await bcrypt.hash('admin123', 10);
    const superAdmin = await prisma.utilisateur.create({
      data: {
        nom: 'Administrateur',
        prenom: 'Super',
        email: 'superadmin@gestionsalaires.sn',
        motDePasse: motDePasseHache,
        role: RoleUtilisateur.SUPER_ADMIN
      }
    });
    console.log('✅ Super-administrateur créé');

    // 3. Créer des entreprises supplémentaires
    const entreprise2 = await prisma.entreprise.create({
      data: {
        nom: 'Marakhib Tech SARL',
        adresse: '456 Rue de l\'Innovation, Dakar, Sénégal',
        telephone: '+221 33 123 45 67',
        email: 'contact@marakhib-tech.sn',
        devise: 'FCFA',
        typePeriode: 'MENSUEL'
      }
    });
    console.log('✅ Entreprise Marakhib Tech créée');

    // 4. Créer des administrateurs d'entreprise
    const adminEntreprise1 = await prisma.utilisateur.create({
      data: {
        nom: 'Diallo',
        prenom: 'Amadou',
        email: 'adminEntreprise1@marakhib.com',
        motDePasse: await bcrypt.hash('admin123', 10),
        role: RoleUtilisateur.ADMIN_ENTREPRISE,
        entrepriseId: entrepriseDemo.id
      }
    });
    console.log('✅ Administrateur d\'entreprise 1 créé');

    const adminEntreprise2 = await prisma.utilisateur.create({
      data: {
        nom: 'Ba',
        prenom: 'Mariama',
        email: 'admin@marakhib-tech.sn',
        motDePasse: await bcrypt.hash('admin123', 10),
        role: RoleUtilisateur.ADMIN_ENTREPRISE,
        entrepriseId: entreprise2.id
      }
    });
    console.log('✅ Administrateur d\'entreprise 2 créé');

    // 5. Créer des caissiers
    const caissier1 = await prisma.utilisateur.create({
      data: {
        nom: 'Sow',
        prenom: 'Fatou',
        email: 'caissierEntrepise1@marakhib.com',
        motDePasse: await bcrypt.hash('caissier123', 10),
        role: RoleUtilisateur.CAISSIER,
        entrepriseId: entrepriseDemo.id
      }
    });
    console.log('✅ Caissier entreprise 1 créé');

    const caissier2 = await prisma.utilisateur.create({
      data: {
        nom: 'Fall',
        prenom: 'Omar',
        email: 'caissierEntrepise2@marakhib.com',
        motDePasse: await bcrypt.hash('caissier123', 10),
        role: RoleUtilisateur.CAISSIER,
        entrepriseId: entreprise2.id
      }
    });
    console.log('✅ Caissier entreprise 2 créé');

    // 5. Créer des employés de démonstration
    const employes = [
      {
        nomComplet: 'Ibrahima NDIAYE',
        poste: 'Développeur Senior',
        typeContrat: TypeContrat.SALAIRE_FIXE,
        salaireFixe: 850000,
        coordonneesBancaires: 'UBA 12345678901',
        telephone: '+221 77 123 45 67',
        email: 'ibrahima.ndiaye@entreprise-demo.sn',
        adresse: 'Almadies, Dakar',
        entrepriseId: entrepriseDemo.id,
        dateEmbauche: new Date('2023-01-15')
      },
      {
        nomComplet: 'Aïssatou FALL',
        poste: 'Comptable',
        typeContrat: TypeContrat.SALAIRE_FIXE,
        salaireFixe: 650000,
        coordonneesBancaires: 'CBAO 98765432109',
        telephone: '+221 76 987 65 43',
        email: 'aissatou.fall@entreprise-demo.sn',
        adresse: 'Mermoz, Dakar',
        entrepriseId: entrepriseDemo.id,
        dateEmbauche: new Date('2023-02-01')
      },
      {
        nomComplet: 'Mamadou KANE',
        poste: 'Gardien',
        typeContrat: TypeContrat.JOURNALIER,
        tauxSalaireHoraire: 2500,
        telephone: '+221 78 111 22 33',
        adresse: 'Guédiawaye, Dakar',
        entrepriseId: entrepriseDemo.id,
        dateEmbauche: new Date('2023-03-01')
      },
      {
        nomComplet: 'Dr. Khadija SARR',
        poste: 'Consultante Juridique',
        typeContrat: TypeContrat.HONORAIRE,
        tauxHonoraire: 75000,
        telephone: '+221 77 444 55 66',
        email: 'khadija.sarr@avocat.sn',
        adresse: 'Plateau, Dakar',
        entrepriseId: entrepriseDemo.id,
        dateEmbauche: new Date('2023-01-01')
      }
    ];

    const employesCrees = [];
    for (const employeData of employes) {
      const employe = await prisma.employe.create({
        data: employeData
      });
      employesCrees.push(employe);
    }
    console.log('✅ Employés de démonstration créés');

    // 6. Créer un cycle de paie
    const cyclePaie = await prisma.cyclePaie.create({
      data: {
        nom: 'Paie Septembre 2024',
        dateDebut: new Date('2024-09-01'),
        dateFin: new Date('2024-09-30'),
        statut: StatutCyclePaie.APPROUVE,
        entrepriseId: entrepriseDemo.id
      }
    });
    console.log('✅ Cycle de paie créé');

    // 7. Créer des bulletins de paie
    const bulletinsPaie = [];
    for (const employe of employesCrees) {
      let salaireBrut = 0;
      let joursTravailles = undefined;
      let heuresTravailleurs = undefined;

      // Calculer le salaire selon le type de contrat
      switch (employe.typeContrat) {
        case TypeContrat.SALAIRE_FIXE:
          salaireBrut = Number(employe.salaireFixe) || 0;
          break;
        case TypeContrat.JOURNALIER:
          joursTravailles = 22; // 22 jours travaillés dans le mois
          salaireBrut = (Number(employe.tauxSalaireHoraire) || 0) * 8 * joursTravailles;
          break;
        case TypeContrat.HONORAIRE:
          salaireBrut = Number(employe.tauxHonoraire) || 0;
          break;
      }

      const deductions = salaireBrut * 0.05; // 5% de déductions
      const salaireNet = salaireBrut - deductions;

      const bulletin = await prisma.bulletinPaie.create({
        data: {
          employeId: employe.id,
          cycleId: cyclePaie.id,
          entrepriseId: entrepriseDemo.id,
          salaireBrut,
          deductions,
          salaireNet,
          joursTravailles,
          heuresTravailleurs,
          statut: StatutBulletinPaie.EN_ATTENTE
        }
      });
      bulletinsPaie.push(bulletin);
    }
    console.log('✅ Bulletins de paie créés');

    // 8. Créer quelques paiements partiels
    for (let i = 0; i < 2; i++) {
      const bulletin = bulletinsPaie[i];
      const montantPartiel = Number(bulletin.salaireNet) * 0.6; // 60% du salaire

      await prisma.paiement.create({
        data: {
          bulletinPaieId: bulletin.id,
          employeId: bulletin.employeId,
          entrepriseId: entrepriseDemo.id,
          utilisateurId: caissier1.id,
          montant: montantPartiel,
          modePaiement: ModePaiement.VIREMENT_BANCAIRE,
          reference: `PAY-${Date.now()}-${Math.random().toString(36).substring(2, 8).toUpperCase()}`,
          notes: 'Paiement partiel - Première tranche'
        }
      });

      // Mettre à jour le statut du bulletin
      await prisma.bulletinPaie.update({
        where: { id: bulletin.id },
        data: { statut: StatutBulletinPaie.PARTIEL }
      });
    }
    console.log('✅ Paiements partiels créés');

    console.log('🎉 Seed terminé avec succès!');
    console.log('\n📋 Données créées:');
    console.log(`- 2 entreprises: ${entrepriseDemo.nom}, ${entreprise2.nom}`);
    console.log(`- 5 utilisateurs:`);
    console.log(`  • Super Admin: superadmin@gestionsalaires.sn (admin123)`);
    console.log(`  • Admin Entreprise 1: adminEntreprise1@marakhib.com (admin123)`);
    console.log(`  • Admin Entreprise 2: admin@marakhib-tech.sn (admin123)`);
    console.log(`  • Caissier Entreprise 1: caissierEntrepise1@marakhib.com (caissier123)`);
    console.log(`  • Caissier Entreprise 2: caissierEntrepise2@marakhib.com (caissier123)`);
    console.log(`- ${employesCrees.length} employés`);
    console.log(`- 1 cycle de paie`);
    console.log(`- ${bulletinsPaie.length} bulletins de paie`);
    console.log(`- 2 paiements partiels`);

  } catch (error) {
    console.error('❌ Erreur lors du seed:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

// Exécuter le seed
seed()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
