import { StatutCyclePaie, TypeCyclePaie } from '@/enums';
import { ICyclePaie } from '@/interfaces/entities';

export class CyclePaie implements ICyclePaie {
  id: string;
  nom: string;
  typeCycle: TypeCyclePaie;
  dateDebut: Date;
  dateFin: Date;
  statut: StatutCyclePaie;
  entrepriseId: string;
  dateCreation: Date;
  dateModification: Date;

  constructor(donnees: any) {
    this.id = donnees.id || '';
    this.nom = donnees.nom || '';
    this.typeCycle = donnees.typeCycle || TypeCyclePaie.MENSUEL;
    this.dateDebut = donnees.dateDebut || new Date();
    this.dateFin = donnees.dateFin || new Date();
    this.statut = donnees.statut || StatutCyclePaie.BROUILLON;
    this.entrepriseId = donnees.entrepriseId || '';
    this.dateCreation = donnees.dateCreation || new Date();
    this.dateModification = donnees.dateModification || new Date();
  }

  estModifiable(): boolean {
    return this.statut === StatutCyclePaie.BROUILLON;
  }

  estApprouve(): boolean {
    return this.statut === StatutCyclePaie.APPROUVE;
  }

  estCloture(): boolean {
    return this.statut === StatutCyclePaie.CLOTURE;
  }

  peutEtreApprouve(): boolean {
    return this.statut === StatutCyclePaie.BROUILLON;
  }

  peutEtreCloture(): boolean {
    return this.statut === StatutCyclePaie.APPROUVE;
  }

  approuver(): void {
    if (!this.peutEtreApprouve()) {
      throw new Error('Ce cycle ne peut pas être approuvé');
    }
    this.statut = StatutCyclePaie.APPROUVE;
    this.dateModification = new Date();
  }

  cloturer(): void {
    if (!this.peutEtreCloture()) {
      throw new Error('Ce cycle ne peut pas être clôturé');
    }
    this.statut = StatutCyclePaie.CLOTURE;
    this.dateModification = new Date();
  }

  obtenirDureeEnJours(): number {
    const millisecondesParJour = 24 * 60 * 60 * 1000;
    return Math.ceil((this.dateFin.getTime() - this.dateDebut.getTime()) / millisecondesParJour);
  }

  genererNomAutomatique(): string {
    const moisDebut = this.dateDebut.toLocaleDateString('fr-FR', { month: 'long', year: 'numeric' });
    return `Paie ${moisDebut}`;
  }
}
