import { BasePrismaRepository } from './BasePrismaRepository';
import { QRCodeEmploye } from '../entities/QRCodeEmploye';

export class QRCodeRepository extends BasePrismaRepository {

  /**
   * Crée un nouveau QR Code pour un employé
   */
  async creerQRCode(qrCodeData: {
    employeId: string;
    codeQR: string;
    codeSecret: string;
    dateExpiration?: Date;
  }): Promise<any> {
    return await this.prisma.qRCodeEmploye.create({
      data: {
        employeId: qrCodeData.employeId,
        codeQR: qrCodeData.codeQR,
        codeSecret: qrCodeData.codeSecret,
        dateExpiration: qrCodeData.dateExpiration,
        dateGeneration: new Date(),
        actif: true,
        nombreUtilisations: 0
      },
      include: {
        employe: {
          select: {
            id: true,
            nomComplet: true,
            poste: true,
            email: true
          }
        }
      }
    });
  }

  /**
   * Trouve un QR Code par son code
   */
  async trouverParCode(codeQR: string): Promise<any> {
    return await this.prisma.qRCodeEmploye.findFirst({
      where: {
        codeQR: codeQR,
        actif: true
      },
      include: {
        employe: {
          select: {
            id: true,
            nomComplet: true,
            poste: true,
            email: true,
            entrepriseId: true,
            actif: true
          }
        }
      }
    });
  }

  /**
   * Trouve le QR Code d'un employé
   */
  async trouverParEmployeId(employeId: string): Promise<any> {
    return await this.prisma.qRCodeEmploye.findFirst({
      where: {
        employeId: employeId,
        actif: true
      },
      include: {
        employe: {
          select: {
            id: true,
            nomComplet: true,
            poste: true,
            email: true
          }
        }
      }
    });
  }

  /**
   * Met à jour l'utilisation d'un QR Code
   */
  async enregistrerUtilisation(qrCodeId: string): Promise<any> {
    return await this.prisma.qRCodeEmploye.update({
      where: { id: qrCodeId },
      data: {
        nombreUtilisations: { increment: 1 },
        derniereUtilisation: new Date()
      }
    });
  }

  /**
   * Désactive un QR Code
   */
  async desactiver(qrCodeId: string): Promise<any> {
    return await this.prisma.qRCodeEmploye.update({
      where: { id: qrCodeId },
      data: { actif: false }
    });
  }

  /**
   * Renouvelle un QR Code (nouveau code + secret)
   */
  async renouveler(employeId: string, nouveauCode: string, nouveauSecret: string): Promise<any> {
    // Désactiver l'ancien code
    await this.prisma.qRCodeEmploye.updateMany({
      where: { employeId: employeId },
      data: { actif: false }
    });

    // Créer le nouveau code
    return await this.creerQRCode({
      employeId: employeId,
      codeQR: nouveauCode,
      codeSecret: nouveauSecret
    });
  }

  /**
   * Obtient tous les QR Codes d'une entreprise
   */
  async obtenirParEntreprise(entrepriseId: string): Promise<any[]> {
    return await this.prisma.qRCodeEmploye.findMany({
      where: {
        employe: {
          entrepriseId: entrepriseId
        }
      },
      include: {
        employe: {
          select: {
            id: true,
            nomComplet: true,
            poste: true,
            email: true,
            actif: true
          }
        }
      },
      orderBy: {
        dateGeneration: 'desc'
      }
    });
  }

  /**
   * Nettoie les QR Codes expirés
   */
  async nettoyerExpires(): Promise<number> {
    const result = await this.prisma.qRCodeEmploye.updateMany({
      where: {
        dateExpiration: {
          lt: new Date()
        },
        actif: true
      },
      data: {
        actif: false
      }
    });
    return result.count;
  }

  /**
   * Vérifie si un QR Code existe et est valide
   */
  async verifierValidite(codeQR: string, codeSecret: string): Promise<{
    valide: boolean;
    qrCode?: any;
    raison?: string;
  }> {
    const qrCode = await this.trouverParCode(codeQR);
    
    if (!qrCode) {
      return { valide: false, raison: 'QR Code non trouvé' };
    }

    if (qrCode.codeSecret !== codeSecret) {
      return { valide: false, raison: 'Code secret invalide' };
    }

    if (!qrCode.actif) {
      return { valide: false, raison: 'QR Code désactivé' };
    }

    if (qrCode.dateExpiration && new Date() > qrCode.dateExpiration) {
      return { valide: false, raison: 'QR Code expiré' };
    }

    if (!qrCode.employe?.actif) {
      return { valide: false, raison: 'Employé inactif' };
    }

    return { valide: true, qrCode: qrCode };
  }

  /**
   * Génère des statistiques sur l'utilisation des QR Codes
   */
  async obtenirStatistiques(entrepriseId: string): Promise<any> {
    const [total, actifs, utilises] = await Promise.all([
      this.prisma.qRCodeEmploye.count({
        where: {
          employe: { entrepriseId: entrepriseId }
        }
      }),
      this.prisma.qRCodeEmploye.count({
        where: {
          employe: { entrepriseId: entrepriseId },
          actif: true
        }
      }),
      this.prisma.qRCodeEmploye.count({
        where: {
          employe: { entrepriseId: entrepriseId },
          derniereUtilisation: {
            gte: new Date(new Date().setHours(0, 0, 0, 0))
          }
        }
      })
    ]);

    return {
      total,
      actifs,
      utilises,
      nonUtilises: actifs - utilises
    };
  }

  /**
   * Obtient l'historique d'utilisation d'un QR Code
   */
  async obtenirHistorique(employeId: string, limite: number = 50): Promise<any[]> {
    return await this.prisma.pointage.findMany({
      where: {
        employeId: employeId
      },
      include: {
        employe: {
          select: {
            nomComplet: true,
            poste: true
          }
        }
      },
      orderBy: {
        tempsTraite: 'desc'
      },
      take: limite
    });
  }
}