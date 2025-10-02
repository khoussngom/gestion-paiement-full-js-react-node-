import { TypeContrat, RoleUtilisateur, StatutCyclePaie, StatutBulletinPaie, ModePaiement, TypeCyclePaie } from '@/enums';

export interface IEntreprise {
  id: string;
  nom: string;
  adresse?: string;
  telephone?: string;
  email?: string;
  logo?: string;
  devise: string;
  typePeriode: string;
  dateCreation: Date;
  dateModification: Date;
  actif: boolean;
}

export interface IUtilisateur {
  id: string;
  nom: string;
  prenom: string;
  email: string;
  motDePasse: string;
  role: RoleUtilisateur;
  entrepriseId?: string;
  dateCreation: Date;
  dateModification: Date;
  actif: boolean;
  doitChangerMotDePasse: boolean;
}

export interface IEmploye {
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
}

export interface ICyclePaie {
  id: string;
  nom: string;
  typeCycle: TypeCyclePaie;
  dateDebut: Date;
  dateFin: Date;
  statut: StatutCyclePaie;
  entrepriseId: string;
  dateCreation: Date;
  dateModification: Date;
}

export interface IBulletinPaie {
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
}

export interface IPaiement {
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
}
