import { RoleUtilisateur } from '@/enums';
import { IUtilisateur } from '@/interfaces/entities';

export class Utilisateur implements IUtilisateur {
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

  constructor(donnees: any) {
    this.id = donnees.id || '';
    this.nom = donnees.nom || '';
    this.prenom = donnees.prenom || '';
    this.email = donnees.email || '';
    this.motDePasse = donnees.motDePasse || '';
    this.role = donnees.role || RoleUtilisateur.CAISSIER;
    this.entrepriseId = donnees.entrepriseId;
    this.dateCreation = donnees.dateCreation || new Date();
    this.dateModification = donnees.dateModification || new Date();
    this.actif = donnees.actif !== undefined ? donnees.actif : true;
    this.doitChangerMotDePasse = donnees.doitChangerMotDePasse !== undefined ? donnees.doitChangerMotDePasse : true;
  }

  obtenirNomComplet(): string {
    return `${this.prenom} ${this.nom}`;
  }

  estSuperAdmin(): boolean {
    return this.role === RoleUtilisateur.SUPER_ADMIN;
  }

  estAdmin(): boolean {
    return this.role === RoleUtilisateur.ADMIN_ENTREPRISE;
  }

  estCaissier(): boolean {
    return this.role === RoleUtilisateur.CAISSIER;
  }

  peutGererEntreprise(entrepriseId: string): boolean {
    if (this.estSuperAdmin()) return true;
    return this.entrepriseId === entrepriseId;
  }

  peutEffectuerPaiements(): boolean {
    return this.role === RoleUtilisateur.CAISSIER || this.role === RoleUtilisateur.ADMIN_ENTREPRISE;
  }

  peutGererEmployes(): boolean {
    return this.role === RoleUtilisateur.ADMIN_ENTREPRISE || this.role === RoleUtilisateur.SUPER_ADMIN;
  }

  peutGererCyclesPaie(): boolean {
    return this.role === RoleUtilisateur.ADMIN_ENTREPRISE || this.role === RoleUtilisateur.SUPER_ADMIN;
  }
}
