import { BasePrismaRepository } from './BasePrismaRepository';
import { CreerEntrepriseDto } from '@/validators';
import { Entreprise } from '@prisma/client';

export class EntrepriseRepository extends BasePrismaRepository {
  
  async create(donnees: CreerEntrepriseDto): Promise<Entreprise> {
    console.log('📊 [REPO] Données reçues pour création entreprise:', donnees);
    
    // Filtrer les données pour ne garder que les champs de l'entreprise
    const { adminEmail, adminMotDePasse, adminNom, adminPrenom, ...donneesEntreprise } = donnees;
    
    console.log('🏢 [REPO] Données filtrées pour entreprise:', donneesEntreprise);
    
    try {
      const entreprise = await this.prisma.entreprise.create({
        data: {
          ...donneesEntreprise,
          dateCreation: new Date(),
          dateModification: new Date()
        }
      });
      
      console.log('✅ [REPO] Entreprise créée avec succès:', entreprise.id);
      return entreprise;
    } catch (error) {
      console.error('❌ [REPO] Erreur création entreprise:', error);
      throw error;
    }
  }

  async getById(id: string): Promise<Entreprise | null> {
    return await this.prisma.entreprise.findUnique({
      where: { id },
      include: {
        utilisateurs: true,
        employes: {
          where: { actif: true }
        },
        _count: {
          select: {
            employes: { where: { actif: true } },
            cyclesPaie: true
          }
        }
      }
    });
  }

  async getAll(): Promise<Entreprise[]> {
    return await this.prisma.entreprise.findMany({
      where: { actif: true },
      include: {
        _count: {
          select: {
            employes: { where: { actif: true } },
            utilisateurs: true
          }
        }
      },
      orderBy: { nom: 'asc' }
    });
  }

  async update(id: string, donnees: Partial<CreerEntrepriseDto>): Promise<Entreprise> {
    return await this.prisma.entreprise.update({
      where: { id },
      data: {
        ...donnees,
        dateModification: new Date()
      }
    });
  }

  async delete(id: string): Promise<void> {
    // Suppression en cascade - désactiver plutôt que supprimer
    await this.prisma.entreprise.update({
      where: { id },
      data: {
        actif: false,
        dateModification: new Date()
      }
    });
  }

  async getAllWithStats(): Promise<any[]> {
    return await this.prisma.entreprise.findMany({
      where: { actif: true },
      include: {
        _count: {
          select: {
            employes: { where: { actif: true } },
            cyclesPaie: true,
            bulletinsPaie: true
          }
        },
        bulletinsPaie: {
          include: {
            paiements: {
              select: {
                montant: true
              }
            }
          }
        }
      }
    });
  }

  async getStatistics(entrepriseId: string): Promise<any> {
    const entreprise = await this.prisma.entreprise.findUnique({
      where: { id: entrepriseId },
      include: {
        _count: {
          select: {
            employes: { where: { actif: true } },
            cyclesPaie: true
          }
        },
        bulletinsPaie: {
          include: {
            paiements: {
              select: {
                montant: true
              }
            }
          }
        }
      }
    });

    if (!entreprise) return null;

    // Calculer les statistiques
    const masseSalarialeTotal = entreprise.bulletinsPaie.reduce((total, bulletin) => 
      total + Number(bulletin.salaireNet), 0
    );

    const montantPaye = entreprise.bulletinsPaie.reduce((total, bulletin) => {
      const totalPaiements = bulletin.paiements.reduce((somme, paiement) => 
        somme + Number(paiement.montant), 0
      );
      return total + totalPaiements;
    }, 0);

    return {
      ...entreprise,
      statistiques: {
        masseSalarialeTotal,
        montantPaye,
        montantRestant: masseSalarialeTotal - montantPaye,
        nombreEmployesActifs: entreprise._count.employes,
        nombreCyclesPaie: entreprise._count.cyclesPaie
      }
    };
  }

  async updateLogo(id: string, logoUrl: string): Promise<Entreprise> {
    return await this.prisma.entreprise.update({
      where: { id },
      data: { 
        logo: logoUrl,
        dateModification: new Date()
      }
    });
  }

  async removeLogo(id: string): Promise<Entreprise> {
    return await this.prisma.entreprise.update({
      where: { id },
      data: { 
        logo: null,
        dateModification: new Date()
      }
    });
  }
}
