import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function updateEmployee() {
  try {
    // Mettre à jour l'employé "aliou ndiaye" pour qu'il soit inactif
    const updated = await prisma.employe.updateMany({
      where: {
        nomComplet: 'aliou ndiaye'
      },
      data: {
        actif: false
      }
    });
    
    console.log('✅ Employé mis à jour:', updated);
    
    // Vérifier les employés
    const employes = await prisma.employe.findMany({
      select: {
        nomComplet: true,
        actif: true
      }
    });
    
    console.log('📊 État des employés:');
    employes.forEach(emp => {
      console.log(`  - ${emp.nomComplet}: ${emp.actif ? 'ACTIF' : 'INACTIF'}`);
    });
    
  } catch (error) {
    console.error('❌ Erreur:', error);
  } finally {
    await prisma.$disconnect();
  }
}

updateEmployee();
