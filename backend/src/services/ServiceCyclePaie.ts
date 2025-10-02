import { PrismaClient } from '@prisma/client';
import { CyclePaieRepository } from '@/repositories/CyclePaieRepository';
import { EmployeRepository } from '@/repositories/EmployeRepository';
import { CyclePaie } from '@/entities/CyclePaie';
import { CreerCyclePaieDto, ModifierCyclePaieDto } from '@/validators';
import { TypeCyclePaie, TypeContrat, StatutCyclePaie, StatutBulletinPaie } from '@/enums';

export class ServiceCyclePaie {
  private cyclePaieRepo: CyclePaieRepository;
  private employeRepo: EmployeRepository;
  private prisma: PrismaClient;

  constructor() {
    this.cyclePaieRepo = new CyclePaieRepository();
    this.employeRepo = new EmployeRepository();
    this.prisma = new PrismaClient();
  }

  /**
   * Crée un nouveau cycle de paie et génère automatiquement les bulletins de paie
   * pour les employés correspondant au type de cycle
   */
  async creerCyclePaie(donneesEntree: CreerCyclePaieDto): Promise<{
    cycle: CyclePaie;
    employesInclus: number;
    bulletinsGeneres: number;
  }> {
    try {
      // Validation des dates
      this.validerPeriodeCycle(donneesEntree.dateDebut, donneesEntree.dateFin, donneesEntree.typeCycle);

      // Vérifier les chevauchements de cycles
      const chevauchement = await this.cyclePaieRepo.checkOverlap(
        donneesEntree.entrepriseId,
        donneesEntree.dateDebut,
        donneesEntree.dateFin
      );

      if (chevauchement) {
        throw new Error('Un cycle de paie existe déjà pour cette période');
      }

      // Créer le cycle de paie
      const cycle = await this.cyclePaieRepo.create(donneesEntree);

      // Générer automatiquement les bulletins de paie pour les employés correspondants
      const { employesInclus, bulletinsGeneres } = await this.genererBulletinsPourCycle(cycle);

      return {
        cycle,
        employesInclus,
        bulletinsGeneres
      };
    } catch (error) {
      console.error('Erreur lors de la création du cycle de paie:', error);
      throw error;
    }
  }

  /**
   * Génère automatiquement les bulletins de paie pour un cycle donné
   */
  private async genererBulletinsPourCycle(cycle: CyclePaie): Promise<{
    employesInclus: number;
    bulletinsGeneres: number;
  }> {
    // Déterminer les types de contrats à inclure selon le type de cycle
    const typesContrats = this.obtenirTypesContratsSelonCycle(cycle.typeCycle);

    // Récupérer les employés correspondants
    const employes = await this.employeRepo.getByEntreprise(cycle.entrepriseId);
    const employesEligibles = employes.filter(emp => 
      emp.actif && typesContrats.includes(emp.typeContrat)
    );

    let bulletinsGeneres = 0;

    // Créer un bulletin de paie pour chaque employé éligible
    for (const employe of employesEligibles) {
      const salaireBrut = this.calculerSalaireBrut(employe, cycle);
      
      await this.prisma.bulletinPaie.create({
        data: {
          employeId: employe.id,
          cycleId: cycle.id,
          entrepriseId: cycle.entrepriseId,
          salaireBrut: salaireBrut,
          deductions: 0,
          salaireNet: salaireBrut,
          statut: StatutBulletinPaie.EN_ATTENTE,
          joursTravailles: cycle.typeCycle === TypeCyclePaie.MENSUEL ? 22 : 5, // Par défaut
          heuresTravailleurs: cycle.typeCycle === TypeCyclePaie.MENSUEL ? 176 : 40 // Par défaut
        }
      });

      bulletinsGeneres++;
    }

    return {
      employesInclus: employesEligibles.length,
      bulletinsGeneres
    };
  }

  /**
   * Obtient les types de contrats à inclure selon le type de cycle
   */
  private obtenirTypesContratsSelonCycle(typeCycle: TypeCyclePaie): TypeContrat[] {
    switch (typeCycle) {
      case TypeCyclePaie.MENSUEL:
        return [TypeContrat.SALAIRE_FIXE]; // Employés salariés
      case TypeCyclePaie.HEBDOMADAIRE:
        return [TypeContrat.HONORAIRE]; // Employés à honoraires
      default:
        throw new Error(`Type de cycle non supporté: ${typeCycle}`);
    }
  }

  /**
   * Calcule le salaire brut d'un employé pour un cycle donné
   */
  private calculerSalaireBrut(employe: any, cycle: CyclePaie): number {
    switch (employe.typeContrat) {
      case TypeContrat.SALAIRE_FIXE:
        return Number(employe.salaireFixe || 0);
      case TypeContrat.HONORAIRE:
        // Pour les honoraires, on peut multiplier par le nombre de semaines dans le cycle
        const nombreSemaines = Math.ceil(cycle.obtenirDureeEnJours() / 7);
        return Number(employe.tauxHonoraire || 0) * nombreSemaines;
      case TypeContrat.JOURNALIER:
        // Pour les journaliers, multiplier par le nombre de jours
        return Number(employe.tauxSalaireHoraire || 0) * 8 * cycle.obtenirDureeEnJours();
      default:
        return 0;
    }
  }

  /**
   * Valide la période d'un cycle selon son type
   */
  private validerPeriodeCycle(dateDebut: Date, dateFin: Date, typeCycle: TypeCyclePaie): void {
    const dureeEnJours = Math.ceil((dateFin.getTime() - dateDebut.getTime()) / (24 * 60 * 60 * 1000));

    switch (typeCycle) {
      case TypeCyclePaie.MENSUEL:
        if (dureeEnJours < 28 || dureeEnJours > 31) {
          throw new Error('Un cycle mensuel doit avoir une durée entre 28 et 31 jours');
        }
        break;
      case TypeCyclePaie.HEBDOMADAIRE:
        if (dureeEnJours < 7 || dureeEnJours > 7) {
          throw new Error('Un cycle hebdomadaire doit avoir une durée de 7 jours exactement');
        }
        break;
    }
  }

  /**
   * Liste tous les cycles de paie d'une entreprise
   */
  async listerCyclesPaie(entrepriseId: string): Promise<CyclePaie[]> {
    return await this.cyclePaieRepo.getByEntreprise(entrepriseId);
  }

  /**
   * Obtient un cycle de paie par son ID avec les employés et leurs statuts
   */
  async obtenirCycleAvecEmployes(cycleId: string): Promise<{
    cycle: CyclePaie;
    employes: Array<{
      id: string;
      nomComplet: string;
      poste: string;
      typeContrat: string;
      salaireBrut: number;
      salaireNet: number;
      statut: string;
      bulletinId: string;
    }>;
  }> {
    const cycle = await this.cyclePaieRepo.getById(cycleId);
    if (!cycle) {
      throw new Error('Cycle de paie non trouvé');
    }

    // Récupérer les bulletins de paie avec les employés
    const bulletins = await this.prisma.bulletinPaie.findMany({
      where: { cycleId },
      include: {
        employe: true
      },
      orderBy: {
        employe: { nomComplet: 'asc' }
      }
    });

    const employes = bulletins.map(bulletin => ({
      id: bulletin.employe.id,
      nomComplet: bulletin.employe.nomComplet,
      poste: bulletin.employe.poste,
      typeContrat: bulletin.employe.typeContrat as string,
      salaireBrut: Number(bulletin.salaireBrut),
      salaireNet: Number(bulletin.salaireNet),
      statut: bulletin.statut as string,
      bulletinId: bulletin.id
    }));

    return { cycle, employes };
  }

  /**
   * Met à jour le statut de paiement d'un employé dans un cycle
   */
  async mettreAJourStatutPaiement(bulletinId: string, nouveauStatut: StatutBulletinPaie): Promise<void> {
    await this.prisma.bulletinPaie.update({
      where: { id: bulletinId },
      data: { 
        statut: nouveauStatut,
        dateModification: new Date()
      }
    });
  }

  /**
   * Met à jour un cycle de paie
   */
  async modifierCyclePaie(cycleId: string, donnees: ModifierCyclePaieDto): Promise<CyclePaie> {
    const cycle = await this.cyclePaieRepo.getById(cycleId);
    if (!cycle) {
      throw new Error('Cycle de paie non trouvé');
    }

    if (!cycle.estModifiable()) {
      throw new Error('Ce cycle ne peut plus être modifié');
    }

    return await this.cyclePaieRepo.update(cycleId, donnees);
  }

  /**
   * Approuve un cycle de paie
   */
  async approuverCycle(cycleId: string): Promise<CyclePaie> {
    const cycle = await this.cyclePaieRepo.getById(cycleId);
    if (!cycle) {
      throw new Error('Cycle de paie non trouvé');
    }

    cycle.approuver();
    return await this.cyclePaieRepo.updateStatus(cycleId, StatutCyclePaie.APPROUVE);
  }

  /**
   * Clôture un cycle de paie
   */
  async cloturerCycle(cycleId: string): Promise<CyclePaie> {
    const cycle = await this.cyclePaieRepo.getById(cycleId);
    if (!cycle) {
      throw new Error('Cycle de paie non trouvé');
    }

    cycle.cloturer();
    return await this.cyclePaieRepo.updateStatus(cycleId, StatutCyclePaie.CLOTURE);
  }

  /**
   * Obtient les statistiques d'un cycle de paie
   */
  async obtenirStatistiquesCycle(cycleId: string): Promise<{
    totalEmployes: number;
    employesPayes: number;
    employesEnAttente: number;
    montantTotalBrut: number;
    montantTotalNet: number;
    pourcentageCompletion: number;
  }> {
    const bulletins = await this.prisma.bulletinPaie.findMany({
      where: { cycleId }
    });

    const totalEmployes = bulletins.length;
    const employesPayes = bulletins.filter(b => b.statut === StatutBulletinPaie.PAYE).length;
    const employesEnAttente = bulletins.filter(b => b.statut === StatutBulletinPaie.EN_ATTENTE).length;
    
    const montantTotalBrut = bulletins.reduce((total, b) => total + Number(b.salaireBrut), 0);
    const montantTotalNet = bulletins.reduce((total, b) => total + Number(b.salaireNet), 0);
    
    const pourcentageCompletion = totalEmployes > 0 ? Math.round((employesPayes / totalEmployes) * 100) : 0;

    return {
      totalEmployes,
      employesPayes,
      employesEnAttente,
      montantTotalBrut,
      montantTotalNet,
      pourcentageCompletion
    };
  }

  /**
   * Obtenir les employés non payés des cycles actifs (BROUILLON et APPROUVE)
   */
  async obtenirEmployesNonPayesCyclesActifs(entrepriseId: string): Promise<Array<{
    id: string;
    nomComplet: string;
    poste: string;
    typeContrat: string;
    salaireBrut: number;
    salaireNet: number;
    statut: string;
    bulletinId: string;
    cycleNom: string;
    cycleId: string;
  }>> {
    const cyclesActifs = await this.prisma.cyclePaie.findMany({
      where: {
        entrepriseId,
        statut: {
          in: [StatutCyclePaie.BROUILLON, StatutCyclePaie.APPROUVE]
        }
      },
      include: {
        bulletinsPaie: {
          where: {
            statut: {
              in: ['EN_ATTENTE', 'PARTIEL'] // Exclure les employés déjà payés
            }
          },
          include: {
            employe: true
          }
        }
      },
      orderBy: {
        dateCreation: 'desc'
      }
    });

    const employesNonPayes: Array<{
      id: string;
      nomComplet: string;
      poste: string;
      typeContrat: string;
      salaireBrut: number;
      salaireNet: number;
      statut: string;
      bulletinId: string;
      cycleNom: string;
      cycleId: string;
    }> = [];

    cyclesActifs.forEach(cycle => {
      cycle.bulletinsPaie.forEach(bulletin => {
        employesNonPayes.push({
          id: bulletin.employe.id,
          nomComplet: bulletin.employe.nomComplet,
          poste: bulletin.employe.poste,
          typeContrat: bulletin.employe.typeContrat,
          salaireBrut: Number(bulletin.salaireBrut),
          salaireNet: Number(bulletin.salaireNet),
          statut: bulletin.statut,
          bulletinId: bulletin.id,
          cycleNom: cycle.nom,
          cycleId: cycle.id
        });
      });
    });

    return employesNonPayes;
  }

  /**
   * Génère automatiquement un nom pour le cycle selon sa période
   */
  genererNomCycle(typeCycle: TypeCyclePaie, dateDebut: Date): string {
    const options: Intl.DateTimeFormatOptions = { 
      month: 'long', 
      year: 'numeric' 
    };

    switch (typeCycle) {
      case TypeCyclePaie.MENSUEL:
        return `Paie ${dateDebut.toLocaleDateString('fr-FR', options)}`;
      case TypeCyclePaie.HEBDOMADAIRE:
        const semaine = Math.ceil(dateDebut.getDate() / 7);
        return `Paie Semaine ${semaine} - ${dateDebut.toLocaleDateString('fr-FR', { month: 'long', year: 'numeric' })}`;
      default:
        return `Cycle ${dateDebut.toLocaleDateString('fr-FR')}`;
    }
  }
}