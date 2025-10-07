import { RoleUtilisateur } from '../enums';

/**
 * Entité représentant une autorisation temporaire d'accès
 * Permet au SuperAdmin d'accéder à l'interface d'une entreprise
 * après autorisation explicite de l'admin de cette entreprise
 */
export class AutorisationAcces {
  id: string;
  entrepriseId: string;
  superAdminId: string;
  adminId: string; // L'admin qui accorde l'accès
  dateCreation: Date;
  dateExpiration: Date;
  estActif: boolean;
  raisonAcces?: string; // Optionnel : raison de la demande d'accès
  
  // Relations
  entreprise?: any;
  superAdmin?: any;
  admin?: any;

  constructor(data: {
    id?: string;
    entrepriseId: string;
    superAdminId: string;
    adminId: string;
    dateCreation?: Date;
    dateExpiration: Date;
    estActif?: boolean;
    raisonAcces?: string;
  }) {
    this.id = data.id || '';
    this.entrepriseId = data.entrepriseId;
    this.superAdminId = data.superAdminId;
    this.adminId = data.adminId;
    this.dateCreation = data.dateCreation || new Date();
    this.dateExpiration = data.dateExpiration;
    this.estActif = data.estActif ?? true;
    this.raisonAcces = data.raisonAcces;
  }

  /**
   * Vérifie si l'autorisation est encore valide
   * @returns true si l'autorisation est active et non expirée
   */
  estValide(): boolean {
    if (!this.estActif) {
      return false;
    }
    
    const maintenant = new Date();
    return maintenant <= this.dateExpiration;
  }

  /**
   * Désactive l'autorisation
   */
  desactiver(): void {
    this.estActif = false;
  }

  /**
   * Vérifie si l'autorisation va expirer bientôt
   * @param heuresAvantExpiration Nombre d'heures avant expiration pour considérer comme "bientôt"
   * @returns true si l'autorisation expire dans les prochaines heures spécifiées
   */
  expireBientot(heuresAvantExpiration: number = 24): boolean {
    if (!this.estValide()) {
      return false;
    }

    const maintenant = new Date();
    const limiteExpiration = new Date(maintenant.getTime() + (heuresAvantExpiration * 60 * 60 * 1000));
    
    return this.dateExpiration <= limiteExpiration;
  }

  /**
   * Retourne le temps restant avant expiration en millisecondes
   * @returns Millisecondes restantes, ou 0 si expiré
   */
  tempsRestantMs(): number {
    if (!this.estValide()) {
      return 0;
    }

    const maintenant = new Date();
    return Math.max(0, this.dateExpiration.getTime() - maintenant.getTime());
  }

  /**
   * Retourne une représentation lisible du temps restant
   * @returns String formatée du temps restant
   */
  tempsRestantFormate(): string {
    const ms = this.tempsRestantMs();
    
    if (ms === 0) {
      return 'Expiré';
    }

    const heures = Math.floor(ms / (1000 * 60 * 60));
    const minutes = Math.floor((ms % (1000 * 60 * 60)) / (1000 * 60));

    if (heures === 0) {
      return `${minutes}m restantes`;
    }

    return `${heures}h ${minutes}m restantes`;
  }

  /**
   * Crée une autorisation avec une durée spécifiée en heures
   * @param data Données de base
   * @param dureeHeures Durée en heures
   * @returns Nouvelle instance d'AutorisationAcces
   */
  static creerAvecDuree(
    data: {
      entrepriseId: string;
      superAdminId: string;
      adminId: string;
      raisonAcces?: string;
    },
    dureeHeures: number = 24
  ): AutorisationAcces {
    const dateExpiration = new Date();
    dateExpiration.setHours(dateExpiration.getHours() + dureeHeures);

    return new AutorisationAcces({
      ...data,
      dateExpiration,
    });
  }

  /**
   * Valide les données de l'autorisation
   * @returns Array des erreurs de validation
   */
  valider(): string[] {
    const erreurs: string[] = [];

    if (!this.entrepriseId) {
      erreurs.push('L\'ID de l\'entreprise est requis');
    }

    if (!this.superAdminId) {
      erreurs.push('L\'ID du SuperAdmin est requis');
    }

    if (!this.adminId) {
      erreurs.push('L\'ID de l\'admin est requis');
    }

    if (!this.dateExpiration) {
      erreurs.push('La date d\'expiration est requise');
    } else if (this.dateExpiration <= new Date()) {
      erreurs.push('La date d\'expiration doit être future');
    }

    return erreurs;
  }

  /**
   * Convertit l'entité en objet pour l'API
   * @returns Objet sérialisable
   */
  toJSON() {
    return {
      id: this.id,
      entrepriseId: this.entrepriseId,
      superAdminId: this.superAdminId,
      adminId: this.adminId,
      dateCreation: this.dateCreation,
      dateExpiration: this.dateExpiration,
      estActif: this.estActif,
      raisonAcces: this.raisonAcces,
      estValide: this.estValide(),
      expireBientot: this.expireBientot(),
      tempsRestant: this.tempsRestantFormate(),
      entreprise: this.entreprise,
      superAdmin: this.superAdmin,
      admin: this.admin
    };
  }
}