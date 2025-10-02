import { IQRCodeEmploye } from '@/interfaces/entities';
import crypto from 'crypto';

export class QRCodeEmploye implements IQRCodeEmploye {
  id: string;
  employeId: string;
  codeQR: string;
  codeSecret: string;
  dateGeneration: Date;
  dateExpiration?: Date;
  actif: boolean;
  nombreUtilisations: number;
  derniereUtilisation?: Date;

  constructor(donnees: Partial<IQRCodeEmploye>) {
    this.id = donnees.id || '';
    this.employeId = donnees.employeId || '';
    this.codeQR = donnees.codeQR || '';
    this.codeSecret = donnees.codeSecret || '';
    this.dateGeneration = donnees.dateGeneration || new Date();
    this.dateExpiration = donnees.dateExpiration;
    this.actif = donnees.actif !== undefined ? donnees.actif : true;
    this.nombreUtilisations = donnees.nombreUtilisations || 0;
    this.derniereUtilisation = donnees.derniereUtilisation;
  }

  /**
   * Génère un code QR unique pour l'employé
   */
  static genererCodeQR(employeId: string): string {
    const timestamp = Date.now();
    const random = Math.random().toString(36).substring(2, 15);
    return `QR-${employeId}-${timestamp}-${random}`.toUpperCase();
  }

  /**
   * Génère un code secret pour validation supplémentaire
   */
  static genererCodeSecret(): string {
    return crypto.randomBytes(16).toString('hex').toUpperCase();
  }

  /**
   * Vérifie si le code QR est valide et actif
   */
  estValide(): boolean {
    if (!this.actif) return false;
    
    if (this.dateExpiration && new Date() > this.dateExpiration) {
      return false;
    }
    
    return true;
  }

  /**
   * Désactive le code QR
   */
  desactiver(): void {
    this.actif = false;
  }

  /**
   * Enregistre une utilisation du code QR
   */
  enregistrerUtilisation(): void {
    this.nombreUtilisations += 1;
    this.derniereUtilisation = new Date();
  }

  /**
   * Vérifie si le code QR n'a pas été trop utilisé (sécurité)
   */
  estTropUtilise(): boolean {
    // Limite de 50 utilisations par jour pour éviter les abus
    const aujourd = new Date();
    const hierMinuit = new Date(aujourd.getFullYear(), aujourd.getMonth(), aujourd.getDate());
    
    return !!(this.derniereUtilisation && 
              this.derniereUtilisation >= hierMinuit && 
              this.nombreUtilisations > 50);
  }

  /**
   * Génère les données du QR Code au format JSON
   */
  genererDonneesQR(): string {
    return JSON.stringify({
      code: this.codeQR,
      secret: this.codeSecret,
      employeId: this.employeId,
      timestamp: this.dateGeneration.getTime()
    });
  }

  /**
   * Valide les données d'un scan QR
   */
  static validerDonneesScan(donneesJson: string): { valide: boolean; employeId?: string; code?: string; secret?: string } {
    try {
      const donnees = JSON.parse(donneesJson);
      
      if (!donnees.code || !donnees.secret || !donnees.employeId) {
        return { valide: false };
      }

      return {
        valide: true,
        employeId: donnees.employeId,
        code: donnees.code,
        secret: donnees.secret
      };
    } catch (error) {
      return { valide: false };
    }
  }

  /**
   * Définit une date d'expiration (optionnel)
   */
  definirExpiration(jours: number): void {
    const dateExp = new Date();
    dateExp.setDate(dateExp.getDate() + jours);
    this.dateExpiration = dateExp;
  }

  /**
   * Obtient le statut du code QR
   */
  obtenirStatut(): 'ACTIF' | 'EXPIRE' | 'DESACTIVE' | 'TROP_UTILISE' {
    if (!this.actif) return 'DESACTIVE';
    if (this.dateExpiration && new Date() > this.dateExpiration) return 'EXPIRE';
    if (this.estTropUtilise()) return 'TROP_UTILISE';
    return 'ACTIF';
  }

  /**
   * Renouvelle le code QR avec de nouveaux codes
   */
  renouveler(): void {
    this.codeQR = QRCodeEmploye.genererCodeQR(this.employeId);
    this.codeSecret = QRCodeEmploye.genererCodeSecret();
    this.dateGeneration = new Date();
    this.nombreUtilisations = 0;
    this.derniereUtilisation = undefined;
    this.actif = true;
  }
}