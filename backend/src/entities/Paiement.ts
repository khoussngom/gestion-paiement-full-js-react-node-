import { ModePaiement } from '@/enums';
import { IPaiement } from '@/interfaces/entities';

export class Paiement implements IPaiement {
  id: string;
  bulletinPaieId: string;
  employeId: string;
  entrepriseId: string;
  utilisateurId: string;
  montant: number;
  modePaiement: ModePaiement;
  reference?: string;
  notes?: string;
  datePaiement: Date;
  dateCreation: Date;

  constructor(donnees: Partial<IPaiement>) {
    this.id = donnees.id || '';
    this.bulletinPaieId = donnees.bulletinPaieId || '';
    this.employeId = donnees.employeId || '';
    this.entrepriseId = donnees.entrepriseId || '';
    this.utilisateurId = donnees.utilisateurId || '';
    this.montant = donnees.montant || 0;
    this.modePaiement = donnees.modePaiement || ModePaiement.ESPECES;
    this.reference = donnees.reference;
    this.notes = donnees.notes;
    this.datePaiement = donnees.datePaiement || new Date();
    this.dateCreation = donnees.dateCreation || new Date();
  }

  estValide(): boolean {
    return this.montant > 0 && this.bulletinPaieId !== '' && this.employeId !== '';
  }

  obtenirLibelleModePaiement(): string {
    const libelles = {
      [ModePaiement.ESPECES]: 'Espèces',
      [ModePaiement.VIREMENT_BANCAIRE]: 'Virement bancaire',
      [ModePaiement.ORANGE_MONEY]: 'Orange Money',
      [ModePaiement.WAVE]: 'Wave',
      [ModePaiement.AUTRE]: 'Autre'
    };
    return libelles[this.modePaiement] || 'Non défini';
  }

  genererReference(): string {
    if (this.reference) return this.reference;
    
    const date = this.datePaiement.toISOString().slice(0, 10).replace(/-/g, '');
    const suffixe = Math.random().toString(36).substring(2, 8).toUpperCase();
    return `PAY-${date}-${suffixe}`;
  }

  formaterMontant(devise: string = 'FCFA'): string {
    return `${this.montant.toLocaleString('fr-FR')} ${devise}`;
  }

  obtenirResumePaiement(): string {
    const mode = this.obtenirLibelleModePaiement();
    const montant = this.formaterMontant();
    const date = this.datePaiement.toLocaleDateString('fr-FR');
    return `${montant} - ${mode} - ${date}`;
  }
}
