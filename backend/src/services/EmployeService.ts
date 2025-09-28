import { PrismaClient } from '@prisma/client';

export class EmployeService {
  private prisma: PrismaClient;

  constructor() {
    this.prisma = new PrismaClient();
  }

  async obtenirTousEmployes(entrepriseId: string) {
    return await this.prisma.employe.findMany({
      where: { entrepriseId },
      include: {
        paiements: {
          orderBy: { dateCreation: 'desc' },
          take: 1
        }
      },
      orderBy: { dateCreation: 'desc' }
    });
  }

  async obtenirEmployeParId(id: string, entrepriseId: string) {
    return await this.prisma.employe.findFirst({
      where: { id, entrepriseId },
      include: {
        paiements: {
          orderBy: { dateCreation: 'desc' },
          take: 5
        }
      }
    });
  }

  async creerEmploye(entrepriseId: string, donneesEmploye: any) {
    return await this.prisma.employe.create({
      data: {
        ...donneesEmploye,
        entrepriseId
      }
    });
  }

  async modifierEmploye(id: string, entrepriseId: string, donneesEmploye: any) {
    // D'abord vérifier que l'employé appartient à l'entreprise
    const employe = await this.prisma.employe.findFirst({
      where: { id, entrepriseId }
    });

    if (!employe) {
      throw new Error('Employé non trouvé ou n\'appartient pas à cette entreprise');
    }

    return await this.prisma.employe.update({
      where: { id },
      data: {
        ...donneesEmploye,
        dateModification: new Date()
      }
    });
  }

  async supprimerEmploye(id: string, entrepriseId: string) {
    return await this.prisma.employe.delete({
      where: { id }
    });
  }

  async activerEmploye(id: string, entrepriseId: string) {
    // D'abord vérifier que l'employé appartient à l'entreprise
    const employe = await this.prisma.employe.findFirst({
      where: { id, entrepriseId }
    });

    if (!employe) {
      throw new Error('Employé non trouvé ou n\'appartient pas à cette entreprise');
    }

    return await this.prisma.employe.update({
      where: { id },
      data: {
        actif: true,
        dateModification: new Date()
      }
    });
  }

  async desactiverEmploye(id: string, entrepriseId: string) {
    // D'abord vérifier que l'employé appartient à l'entreprise
    const employe = await this.prisma.employe.findFirst({
      where: { id, entrepriseId }
    });

    if (!employe) {
      throw new Error('Employé non trouvé ou n\'appartient pas à cette entreprise');
    }

    return await this.prisma.employe.update({
      where: { id },
      data: {
        actif: false,
        dateModification: new Date()
      }
    });
  }

  async obtenirStatistiques(entrepriseId: string) {
    const [total, actifs, inactifs] = await Promise.all([
      this.prisma.employe.count({ where: { entrepriseId } }),
      this.prisma.employe.count({ where: { entrepriseId, actif: true } }),
      this.prisma.employe.count({ where: { entrepriseId, actif: false } })
    ]);

    return {
      total,
      actifs,
      inactifs
    };
  }

  async exporterCSV(entrepriseId: string) {
    const employes = await this.obtenirTousEmployes(entrepriseId);
    
    const csvHeader = 'Nom complet,Email,Téléphone,Poste,Type contrat,Salaire fixe,Date embauche,Actif\n';
    const csvData = employes.map(e => 
      `"${e.nomComplet}","${e.email || ''}","${e.telephone || ''}","${e.poste}","${e.typeContrat}","${e.salaireFixe || ''}","${e.dateEmbauche ? new Date(e.dateEmbauche).toLocaleDateString('fr-FR') : ''}","${e.actif ? 'Oui' : 'Non'}"`
    ).join('\n');

    return csvHeader + csvData;
  }
}
