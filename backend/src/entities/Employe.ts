import { TypeContrat } from '@/enums';
import { IEmploye } from '@/interfaces/entities';

export class Employe implements IEmploye {
  id: string;
  nomComplet: string;
  poste: string;
  typeContrat: TypeContrat;
  tauxSalaireHoraire?: number;
  salaireFixe?: number;
  tauxHonoraire?: number;
  coordonneesBancaires?: string;
  telephone?: string;
  email?: string;
  adresse?: string;
  entrepriseId: string;
  dateEmbauche: Date;
  dateCreation: Date;
  dateModification: Date;
  actif: boolean;

  constructor(donnees: any) {
    this.id = donnees.id || '';
    this.nomComplet = donnees.nomComplet || '';
    this.poste = donnees.poste || '';
    this.typeContrat = donnees.typeContrat || TypeContrat.SALAIRE_FIXE;
    this.tauxSalaireHoraire = donnees.tauxSalaireHoraire ? Number(donnees.tauxSalaireHoraire) : undefined;
    this.salaireFixe = donnees.salaireFixe ? Number(donnees.salaireFixe) : undefined;
    this.tauxHonoraire = donnees.tauxHonoraire ? Number(donnees.tauxHonoraire) : undefined;
    this.coordonneesBancaires = donnees.coordonneesBancaires;
    this.telephone = donnees.telephone;
    this.email = donnees.email;
    this.adresse = donnees.adresse;
    this.entrepriseId = donnees.entrepriseId || '';
    this.dateEmbauche = donnees.dateEmbauche || new Date();
    this.dateCreation = donnees.dateCreation || new Date();
    this.dateModification = donnees.dateModification || new Date();
    this.actif = donnees.actif !== undefined ? donnees.actif : true;
  }

  public calculerSalaireBrut(joursTravailles?: number, heuresTravaillees?: number): number {
    switch (this.typeContrat) {
      case TypeContrat.SALAIRE_FIXE:
        return this.salaireFixe || 0;
      
      case TypeContrat.JOURNALIER:
        if (!joursTravailles || !this.tauxSalaireHoraire) return 0;
        return joursTravailles * this.tauxSalaireHoraire;
      
      case TypeContrat.HONORAIRE:
        return this.tauxHonoraire || 0;
      
      default:
        return 0;
    }
  }

  public modifierPoste(nouveauPoste: string): void {
    this.poste = nouveauPoste;
    this.dateModification = new Date();
  }

  public modifierSalaire(nouveauSalaire: number): void {
    if (this.typeContrat === TypeContrat.SALAIRE_FIXE) {
      this.salaireFixe = nouveauSalaire;
    } else if (this.typeContrat === TypeContrat.JOURNALIER) {
      this.tauxSalaireHoraire = nouveauSalaire;
    } else if (this.typeContrat === TypeContrat.HONORAIRE) {
      this.tauxHonoraire = nouveauSalaire;
    }
    this.dateModification = new Date();
  }

  public activerDesactiver(actif: boolean): void {
    this.actif = actif;
    this.dateModification = new Date();
  }

  public estActif(): boolean {
    return this.actif;
  }

  public estJournalier(): boolean {
    return this.typeContrat === TypeContrat.JOURNALIER;
  }

  public estSalaireFixe(): boolean {
    return this.typeContrat === TypeContrat.SALAIRE_FIXE;
  }

  public estHonoraire(): boolean {
    return this.typeContrat === TypeContrat.HONORAIRE;
  }
}
