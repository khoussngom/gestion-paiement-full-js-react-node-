import { TypeContrat } from '@/enums';

export class Entreprise {
  constructor(
    public id: string,
    public nom: string,
    public adresse?: string,
    public telephone?: string,
    public email?: string,
    public logo?: string,
    public devise: string = 'FCFA',
    public typePeriode: string = 'MENSUEL',
    public dateCreation: Date = new Date(),
    public dateModification: Date = new Date(),
    public actif: boolean = true
  ) {}

  public modifierNom(nouveauNom: string): void {
    this.nom = nouveauNom;
    this.dateModification = new Date();
  }

  public modifierAdresse(nouvelleAdresse: string): void {
    this.adresse = nouvelleAdresse;
    this.dateModification = new Date();
  }

  public activerDesactiver(actif: boolean): void {
    this.actif = actif;
    this.dateModification = new Date();
  }

  public estActive(): boolean {
    return this.actif;
  }
}
