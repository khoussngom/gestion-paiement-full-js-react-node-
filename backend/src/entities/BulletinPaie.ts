import { StatutBulletinPaie } from '@/enums';
import { IBulletinPaie } from '@/interfaces/entities';

export class BulletinPaie implements IBulletinPaie {
  id: string;
  employeId: string;
  cycleId: string;
  entrepriseId: string;
  salaireBrut: number;
  deductions: number;
  salaireNet: number;
  joursTravailles?: number;
  heuresTravailleurs?: number;
  statut: StatutBulletinPaie;
  dateCreation: Date;
  dateModification: Date;

  constructor(donnees: Partial<IBulletinPaie>) {
    this.id = donnees.id || '';
    this.employeId = donnees.employeId || '';
    this.cycleId = donnees.cycleId || '';
    this.entrepriseId = donnees.entrepriseId || '';
    this.salaireBrut = donnees.salaireBrut || 0;
    this.deductions = donnees.deductions || 0;
    this.salaireNet = this.calculerSalaireNet();
    this.joursTravailles = donnees.joursTravailles;
    this.heuresTravailleurs = donnees.heuresTravailleurs;
    this.statut = donnees.statut || StatutBulletinPaie.EN_ATTENTE;
    this.dateCreation = donnees.dateCreation || new Date();
    this.dateModification = donnees.dateModification || new Date();
  }

  private calculerSalaireNet(): number {
    return this.salaireBrut - this.deductions;
  }

  public modifierSalaireBrut(nouveauSalaireBrut: number): void {
    this.salaireBrut = nouveauSalaireBrut;
    this.salaireNet = this.calculerSalaireNet();
    this.dateModification = new Date();
  }

  public modifierDeductions(nouvellesDeductions: number): void {
    this.deductions = nouvellesDeductions;
    this.salaireNet = this.calculerSalaireNet();
    this.dateModification = new Date();
  }

  public modifierJoursTravailles(nouveauxJours: number): void {
    this.joursTravailles = nouveauxJours;
    this.dateModification = new Date();
  }

  public modifierHeuresTravaillees(nouvellesHeures: number): void {
    this.heuresTravailleurs = nouvellesHeures;
    this.dateModification = new Date();
  }

  public changerStatut(nouveauStatut: StatutBulletinPaie): void {
    this.statut = nouveauStatut;
    this.dateModification = new Date();
  }

  public estPaye(): boolean {
    return this.statut === StatutBulletinPaie.PAYE;
  }

  public estPartiel(): boolean {
    return this.statut === StatutBulletinPaie.PARTIEL;
  }

  public estEnAttente(): boolean {
    return this.statut === StatutBulletinPaie.EN_ATTENTE;
  }

  public peutEtreModifie(): boolean {
    return this.statut !== StatutBulletinPaie.PAYE;
  }

  public calculerMontantRestant(montantsPaies: number): number {
    return Math.max(0, this.salaireNet - montantsPaies);
  }

  public obtenirLibelleStatut(): string {
    const libelles = {
      [StatutBulletinPaie.EN_ATTENTE]: 'En attente',
      [StatutBulletinPaie.PARTIEL]: 'Paiement partiel',
      [StatutBulletinPaie.PAYE]: 'Payé'
    };
    return libelles[this.statut] || 'Non défini';
  }

  public formaterMontant(montant: number, devise: string = 'FCFA'): string {
    return `${montant.toLocaleString('fr-FR')} ${devise}`;
  }

  public obtenirResumeBulletin(): string {
    const net = this.formaterMontant(this.salaireNet);
    const statut = this.obtenirLibelleStatut();
    return `${net} - ${statut}`;
  }
}
