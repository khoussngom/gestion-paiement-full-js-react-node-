import { PrismaClient } from '@prisma/client';
import { QRCodeRepository } from '../repositories/QRCodeRepository';
import { QRCodeEmploye } from '../entities/QRCodeEmploye';
import QRCode from 'qrcode';

export class ServiceQRCode {
  private prisma: PrismaClient;
  private qrCodeRepository: QRCodeRepository;

  constructor() {
    this.prisma = new PrismaClient();
    this.qrCodeRepository = new QRCodeRepository();
  }

  /**
   * Génère un QR Code pour un employé
   */
  async genererQRCodeEmploye(employeId: string, dureeValidite?: number): Promise<{
    qrCode: any;
    qrCodeImage: string;
  }> {
    try {
      // Vérifier si l'employé existe et est actif
      const employe = await this.prisma.employe.findFirst({
        where: { id: employeId, actif: true }
      });

      if (!employe) {
        throw new Error('Employé non trouvé ou inactif');
      }

      // Désactiver l'ancien QR Code s'il existe
      const ancienQRCode = await this.qrCodeRepository.trouverParEmployeId(employeId);
      if (ancienQRCode) {
        await this.qrCodeRepository.desactiver(ancienQRCode.id);
      }

      // Générer les nouveaux codes
      const codeQR = QRCodeEmploye.genererCodeQR(employeId);
      const codeSecret = QRCodeEmploye.genererCodeSecret();

      // Définir la date d'expiration si spécifiée
      let dateExpiration: Date | undefined;
      if (dureeValidite) {
        dateExpiration = new Date();
        dateExpiration.setDate(dateExpiration.getDate() + dureeValidite);
      }

      // Créer le QR Code en base
      const qrCodeDB = await this.qrCodeRepository.creerQRCode({
        employeId,
        codeQR,
        codeSecret,
        dateExpiration
      });

      // Créer l'entité QR Code
      const qrCodeEntity = new QRCodeEmploye({
        id: qrCodeDB.id,
        employeId: qrCodeDB.employeId,
        codeQR: qrCodeDB.codeQR,
        codeSecret: qrCodeDB.codeSecret,
        dateGeneration: qrCodeDB.dateGeneration,
        dateExpiration: qrCodeDB.dateExpiration,
        actif: qrCodeDB.actif,
        nombreUtilisations: qrCodeDB.nombreUtilisations
      });

      // Générer l'image du QR Code
      const donneesQR = qrCodeEntity.genererDonneesQR();
      const qrCodeImage = await QRCode.toDataURL(donneesQR, {
        width: 256,
        margin: 2,
        color: {
          dark: '#000000',
          light: '#FFFFFF'
        }
      });

      return {
        qrCode: qrCodeDB,
        qrCodeImage
      };

    } catch (error: any) {
      throw new Error(`Erreur lors de la génération du QR Code: ${error.message}`);
    }
  }

  /**
   * Valide un scan de QR Code
   */
  async validerScanQRCode(donneesJson: string, adresseIP?: string): Promise<{
    valide: boolean;
    employe?: any;
    qrCode?: any;
    message?: string;
  }> {
    try {
      // Valider le format des données
      const donneesValidation = QRCodeEmploye.validerDonneesScan(donneesJson);
      
      if (!donneesValidation.valide) {
        return {
          valide: false,
          message: 'Format de QR Code invalide'
        };
      }

      // Vérifier la validité du QR Code
      const verification = await this.qrCodeRepository.verifierValidite(
        donneesValidation.code!,
        donneesValidation.secret!
      );

      if (!verification.valide) {
        return {
          valide: false,
          message: verification.raison
        };
      }

      // Enregistrer l'utilisation
      await this.qrCodeRepository.enregistrerUtilisation(verification.qrCode.id);

      return {
        valide: true,
        employe: verification.qrCode.employe,
        qrCode: verification.qrCode,
        message: 'QR Code validé avec succès'
      };

    } catch (error: any) {
      return {
        valide: false,
        message: `Erreur de validation: ${error.message}`
      };
    }
  }

  /**
   * Renouvelle un QR Code expiré ou compromis
   */
  async renouverrQRCode(employeId: string): Promise<{
    qrCode: any;
    qrCodeImage: string;
  }> {
    try {
      // Générer de nouveaux codes
      const nouveauCode = QRCodeEmploye.genererCodeQR(employeId);
      const nouveauSecret = QRCodeEmploye.genererCodeSecret();

      // Renouveler en base
      const qrCodeDB = await this.qrCodeRepository.renouveler(
        employeId,
        nouveauCode,
        nouveauSecret
      );

      // Générer la nouvelle image
      const qrCodeEntity = new QRCodeEmploye({
        ...qrCodeDB,
        codeQR: nouveauCode,
        codeSecret: nouveauSecret
      });

      const donneesQR = qrCodeEntity.genererDonneesQR();
      const qrCodeImage = await QRCode.toDataURL(donneesQR, {
        width: 256,
        margin: 2
      });

      return {
        qrCode: qrCodeDB,
        qrCodeImage
      };

    } catch (error: any) {
      throw new Error(`Erreur lors du renouvellement: ${error.message}`);
    }
  }

  /**
   * Obtient le QR Code d'un employé
   */
  async obtenirQRCodeEmploye(employeId: string): Promise<{
    qrCode?: any;
    qrCodeImage?: string;
    existe: boolean;
  }> {
    try {
      const qrCode = await this.qrCodeRepository.trouverParEmployeId(employeId);
      
      if (!qrCode || !qrCode.actif) {
        return { existe: false };
      }

      // Générer l'image
      const qrCodeEntity = new QRCodeEmploye(qrCode);
      const donneesQR = qrCodeEntity.genererDonneesQR();
      const qrCodeImage = await QRCode.toDataURL(donneesQR, {
        width: 256,
        margin: 2
      });

      return {
        existe: true,
        qrCode,
        qrCodeImage
      };

    } catch (error: any) {
      throw new Error(`Erreur lors de la récupération: ${error.message}`);
    }
  }

  /**
   * Obtient les statistiques des QR Codes d'une entreprise
   */
  async obtenirStatistiques(entrepriseId: string): Promise<any> {
    return await this.qrCodeRepository.obtenirStatistiques(entrepriseId);
  }

  /**
   * Désactive un QR Code
   */
  async desactiverQRCode(qrCodeId: string): Promise<boolean> {
    try {
      await this.qrCodeRepository.desactiver(qrCodeId);
      return true;
    } catch (error) {
      return false;
    }
  }

  /**
   * Nettoie les QR Codes expirés (tâche de maintenance)
   */
  async nettoyerQRCodesExpires(): Promise<number> {
    return await this.qrCodeRepository.nettoyerExpires();
  }

  /**
   * Génère des QR Codes pour tous les employés actifs d'une entreprise
   */
  async genererQRCodesPourTousEmployes(entrepriseId: string): Promise<{
    succes: number;
    echecs: number;
    details: Array<{ employeId: string; nom: string; statut: string; erreur?: string }>;
  }> {
    try {
      // Récupérer tous les employés actifs
      const employes = await this.prisma.employe.findMany({
        where: {
          entrepriseId: entrepriseId,
          actif: true
        },
        select: {
          id: true,
          nomComplet: true
        }
      });

      const resultats = {
        succes: 0,
        echecs: 0,
        details: [] as Array<{ employeId: string; nom: string; statut: string; erreur?: string }>
      };

      for (const employe of employes) {
        try {
          await this.genererQRCodeEmploye(employe.id);
          resultats.succes++;
          resultats.details.push({
            employeId: employe.id,
            nom: employe.nomComplet,
            statut: 'Réussi'
          });
        } catch (error: any) {
          resultats.echecs++;
          resultats.details.push({
            employeId: employe.id,
            nom: employe.nomComplet,
            statut: 'Échec',
            erreur: error.message
          });
        }
      }

      return resultats;

    } catch (error: any) {
      throw new Error(`Erreur lors de la génération massive: ${error.message}`);
    }
  }

  /**
   * Obtient l'historique d'utilisation d'un QR Code
   */
  async obtenirHistoriqueUtilisation(employeId: string, limite: number = 50): Promise<any[]> {
    return await this.qrCodeRepository.obtenirHistorique(employeId, limite);
  }

  /**
   * Valide la sécurité d'un QR Code (détection d'abus)
   */
  async validerSecurite(codeQR: string): Promise<{
    secure: boolean;
    risques: string[];
  }> {
    try {
      const qrCode = await this.qrCodeRepository.trouverParCode(codeQR);
      
      if (!qrCode) {
        return { secure: false, risques: ['QR Code inexistant'] };
      }

      const risques: string[] = [];

      // Vérifier l'utilisation excessive
      const qrCodeEntity = new QRCodeEmploye(qrCode);
      if (qrCodeEntity.estTropUtilise()) {
        risques.push('Utilisation excessive détectée');
      }

      // Vérifier l'âge du code
      const ageJours = (Date.now() - qrCode.dateGeneration.getTime()) / (1000 * 60 * 60 * 24);
      if (ageJours > 30) {
        risques.push('QR Code ancien (> 30 jours)');
      }

      // Vérifier les utilisations récentes suspectes
      if (qrCode.nombreUtilisations > 10) {
        const utilisationsRecentes = qrCode.nombreUtilisations / Math.max(1, ageJours);
        if (utilisationsRecentes > 5) {
          risques.push('Fréquence d\'utilisation suspecte');
        }
      }

      return {
        secure: risques.length === 0,
        risques
      };

    } catch (error: any) {
      return {
        secure: false,
        risques: [`Erreur de validation: ${error.message}`]
      };
    }
  }
}