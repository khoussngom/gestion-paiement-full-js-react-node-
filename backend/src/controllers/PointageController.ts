import { Request, Response } from 'express';
import { ServicePointage } from '../services/ServicePointage';
import { ServiceQRCode } from '../services/ServiceQRCode';
import { StatutPresence } from '../enums';
import { MESSAGES_SUCCES, MESSAGES_ERREUR } from '../enums/messages';

export class PointageController {
  private servicePointage: ServicePointage;
  private serviceQRCode: ServiceQRCode;

  constructor() {
    this.servicePointage = new ServicePointage();
    this.serviceQRCode = new ServiceQRCode();
  }

  /**
   * Génère un QR Code pour un employé
   * POST /pointages/qr-code/generer
   */
  async genererQRCode(req: Request, res: Response) {
    try {
      const { employeId, dureeValidite } = req.body;
      const entrepriseId = req.utilisateur?.entrepriseId;

      if (!entrepriseId) {
        return res.status(403).json({
          succes: false,
          message: MESSAGES_ERREUR.ENTREPRISE_NON_AUTORISEE
        });
      }

      if (!employeId) {
        return res.status(400).json({
          succes: false,
          message: 'ID de l\'employé requis'
        });
      }

      const resultat = await this.serviceQRCode.genererQRCodeEmploye(employeId, dureeValidite);

      res.status(201).json({
        succes: true,
        message: 'QR Code généré avec succès',
        donnees: resultat
      });

    } catch (error: any) {
      res.status(500).json({
        succes: false,
        message: MESSAGES_ERREUR.ERREUR_SERVEUR,
        erreur: error.message
      });
    }
  }

  /**
   * Traite un scan de QR Code (pour les vigiles)
   * POST /pointages/scanner
   */
  async scannerQRCode(req: Request, res: Response) {
    try {
      const { donneesQR, notes } = req.body;
      const vigileId = req.utilisateur?.id;
      const adresseIP = req.ip || req.socket.remoteAddress;
      const userAgent = req.get('User-Agent');

      // Vérifier que l'utilisateur est un vigile
      if (req.utilisateur?.role !== 'VIGILE') {
        return res.status(403).json({
          succes: false,
          message: 'Accès réservé aux vigiles'
        });
      }

      if (!donneesQR) {
        return res.status(400).json({
          succes: false,
          message: 'Données QR Code requises'
        });
      }

      const resultat = await this.servicePointage.traiterScanQRCode(
        donneesQR,
        vigileId,
        adresseIP,
        userAgent
      );

      if (resultat.succes) {
        res.status(200).json({
          succes: true,
          message: resultat.message,
          donnees: {
            pointage: resultat.pointage,
            employe: resultat.employe
          }
        });
      } else {
        res.status(400).json({
          succes: false,
          message: resultat.message
        });
      }

    } catch (error: any) {
      res.status(500).json({
        succes: false,
        message: MESSAGES_ERREUR.ERREUR_SERVEUR,
        erreur: error.message
      });
    }
  }

  /**
   * Obtient les pointages avec filtres
   * GET /pointages
   */
  async obtenirPointages(req: Request, res: Response) {
    try {
      const entrepriseId = req.utilisateur?.entrepriseId;

      if (!entrepriseId) {
        return res.status(403).json({
          succes: false,
          message: MESSAGES_ERREUR.ENTREPRISE_NON_AUTORISEE
        });
      }

      const {
        dateDebut,
        dateFin,
        employeId,
        statutPresence,
        page = 1,
        limite = 50
      } = req.query;

      const filtres: any = {
        page: parseInt(page as string),
        limite: parseInt(limite as string)
      };

      if (dateDebut) filtres.dateDebut = new Date(dateDebut as string);
      if (dateFin) filtres.dateFin = new Date(dateFin as string);
      if (employeId) filtres.employeId = employeId;
      if (statutPresence) filtres.statutPresence = statutPresence as StatutPresence;

      const resultat = await this.servicePointage.obtenirPointages(entrepriseId, filtres);

      res.status(200).json({
        succes: true,
        donnees: resultat
      });

    } catch (error: any) {
      res.status(500).json({
        succes: false,
        message: MESSAGES_ERREUR.ERREUR_SERVEUR,
        erreur: error.message
      });
    }
  }

  /**
   * Obtient les statistiques de pointage
   * GET /pointages/statistiques
   */
  async obtenirStatistiques(req: Request, res: Response) {
    try {
      const entrepriseId = req.utilisateur?.entrepriseId;

      if (!entrepriseId) {
        return res.status(403).json({
          succes: false,
          message: MESSAGES_ERREUR.ENTREPRISE_NON_AUTORISEE
        });
      }

      const { dateDebut, dateFin } = req.query;

      let periode: { dateDebut: Date; dateFin: Date } | undefined;
      if (dateDebut && dateFin) {
        periode = {
          dateDebut: new Date(dateDebut as string),
          dateFin: new Date(dateFin as string)
        };
      }

      const statistiques = await this.servicePointage.obtenirStatistiques(entrepriseId, periode);

      res.status(200).json({
        succes: true,
        donnees: statistiques
      });

    } catch (error: any) {
      res.status(500).json({
        succes: false,
        message: MESSAGES_ERREUR.ERREUR_SERVEUR,
        erreur: error.message
      });
    }
  }

  /**
   * Obtient le rapport par employé
   * GET /pointages/rapport-employes
   */
  async obtenirRapportEmployes(req: Request, res: Response) {
    try {
      const entrepriseId = req.utilisateur?.entrepriseId;

      if (!entrepriseId) {
        return res.status(403).json({
          succes: false,
          message: MESSAGES_ERREUR.ENTREPRISE_NON_AUTORISEE
        });
      }

      const { dateDebut, dateFin } = req.query;

      if (!dateDebut || !dateFin) {
        return res.status(400).json({
          succes: false,
          message: 'Période (dateDebut, dateFin) requise'
        });
      }

      const periode = {
        dateDebut: new Date(dateDebut as string),
        dateFin: new Date(dateFin as string)
      };

      const rapport = await this.servicePointage.obtenirRapportParEmploye(entrepriseId, periode);

      res.status(200).json({
        succes: true,
        donnees: rapport
      });

    } catch (error: any) {
      res.status(500).json({
        succes: false,
        message: MESSAGES_ERREUR.ERREUR_SERVEUR,
        erreur: error.message
      });
    }
  }

  /**
   * Obtient les employés présents en temps réel
   * GET /pointages/presents
   */
  async obtenirPresentsEnTempsReel(req: Request, res: Response) {
    try {
      const entrepriseId = req.utilisateur?.entrepriseId;

      if (!entrepriseId) {
        return res.status(403).json({
          succes: false,
          message: MESSAGES_ERREUR.ENTREPRISE_NON_AUTORISEE
        });
      }

      const presents = await this.servicePointage.obtenirPresentsEnTempsReel(entrepriseId);

      res.status(200).json({
        succes: true,
        donnees: presents
      });

    } catch (error: any) {
      res.status(500).json({
        succes: false,
        message: MESSAGES_ERREUR.ERREUR_SERVEUR,
        erreur: error.message
      });
    }
  }

  /**
   * Enregistre un pointage manuel (admins)
   * POST /pointages/manuel
   */
  async enregistrerPointageManuel(req: Request, res: Response) {
    try {
      const entrepriseId = req.utilisateur?.entrepriseId;
      const utilisateurId = req.utilisateur?.id;

      if (!entrepriseId) {
        return res.status(403).json({
          succes: false,
          message: MESSAGES_ERREUR.ENTREPRISE_NON_AUTORISEE
        });
      }

      // Vérifier les permissions (admin ou vigile)
      if (!['ADMIN_ENTREPRISE', 'VIGILE'].includes(req.utilisateur?.role || '')) {
        return res.status(403).json({
          succes: false,
          message: 'Accès réservé aux administrateurs et vigiles'
        });
      }

      const {
        employeId,
        date,
        heureArrivee,
        heureSortie,
        statutPresence,
        notes
      } = req.body;

      if (!employeId || !date || !statutPresence) {
        return res.status(400).json({
          succes: false,
          message: 'Données requises: employeId, date, statutPresence'
        });
      }

      const pointage = await this.servicePointage.enregistrerPointageManuel({
        employeId,
        entrepriseId,
        date: new Date(date),
        heureArrivee: heureArrivee ? new Date(heureArrivee) : undefined,
        heureSortie: heureSortie ? new Date(heureSortie) : undefined,
        statutPresence,
        notes,
        utilisateurId: utilisateurId!
      });

      res.status(201).json({
        succes: true,
        message: 'Pointage manuel enregistré',
        donnees: pointage
      });

    } catch (error: any) {
      res.status(500).json({
        succes: false,
        message: MESSAGES_ERREUR.ERREUR_SERVEUR,
        erreur: error.message
      });
    }
  }

  /**
   * Obtient le QR Code d'un employé
   * GET /pointages/qr-code/:employeId
   */
  async obtenirQRCodeEmploye(req: Request, res: Response) {
    try {
      const { employeId } = req.params;
      const entrepriseId = req.utilisateur?.entrepriseId;

      if (!entrepriseId) {
        return res.status(403).json({
          succes: false,
          message: MESSAGES_ERREUR.ENTREPRISE_NON_AUTORISEE
        });
      }

      const resultat = await this.serviceQRCode.obtenirQRCodeEmploye(employeId);

      if (!resultat.existe) {
        return res.status(404).json({
          succes: false,
          message: 'QR Code non trouvé pour cet employé'
        });
      }

      res.status(200).json({
        succes: true,
        donnees: resultat
      });

    } catch (error: any) {
      res.status(500).json({
        succes: false,
        message: MESSAGES_ERREUR.ERREUR_SERVEUR,
        erreur: error.message
      });
    }
  }

  /**
   * Renouvelle un QR Code
   * POST /pointages/qr-code/renouveler
   */
  async renouverrQRCode(req: Request, res: Response) {
    try {
      const { employeId } = req.body;
      const entrepriseId = req.utilisateur?.entrepriseId;

      if (!entrepriseId) {
        return res.status(403).json({
          succes: false,
          message: MESSAGES_ERREUR.ENTREPRISE_NON_AUTORISEE
        });
      }

      if (!employeId) {
        return res.status(400).json({
          succes: false,
          message: 'ID de l\'employé requis'
        });
      }

      const resultat = await this.serviceQRCode.renouverrQRCode(employeId);

      res.status(200).json({
        succes: true,
        message: 'QR Code renouvelé avec succès',
        donnees: resultat
      });

    } catch (error: any) {
      res.status(500).json({
        succes: false,
        message: MESSAGES_ERREUR.ERREUR_SERVEUR,
        erreur: error.message
      });
    }
  }

  /**
   * Marque automatiquement les absents
   * POST /pointages/marquer-absents
   */
  async marquerAbsents(req: Request, res: Response) {
    try {
      const entrepriseId = req.utilisateur?.entrepriseId;

      if (!entrepriseId) {
        return res.status(403).json({
          succes: false,
          message: MESSAGES_ERREUR.ENTREPRISE_NON_AUTORISEE
        });
      }

      // Vérifier les permissions (admin seulement)
      if (req.utilisateur?.role !== 'ADMIN_ENTREPRISE') {
        return res.status(403).json({
          succes: false,
          message: 'Accès réservé aux administrateurs'
        });
      }

      const resultat = await this.servicePointage.marquerAbsentsAutomatiquement(entrepriseId);

      res.status(200).json({
        succes: true,
        message: 'Absences marquées automatiquement',
        donnees: resultat
      });

    } catch (error: any) {
      res.status(500).json({
        succes: false,
        message: MESSAGES_ERREUR.ERREUR_SERVEUR,
        erreur: error.message
      });
    }
  }

  /**
   * Exporte les pointages au format CSV
   * GET /pointages/export/csv
   */
  async exporterCSV(req: Request, res: Response) {
    try {
      const entrepriseId = req.utilisateur?.entrepriseId;

      if (!entrepriseId) {
        return res.status(403).json({
          succes: false,
          message: MESSAGES_ERREUR.ENTREPRISE_NON_AUTORISEE
        });
      }

      const { dateDebut, dateFin } = req.query;

      let periode: { dateDebut: Date; dateFin: Date } | undefined;
      if (dateDebut && dateFin) {
        periode = {
          dateDebut: new Date(dateDebut as string),
          dateFin: new Date(dateFin as string)
        };
      }

      const csvData = await this.servicePointage.exporterPointagesCSV(entrepriseId, periode);

      res.setHeader('Content-Type', 'text/csv');
      res.setHeader('Content-Disposition', `attachment; filename=pointages_${new Date().toISOString().split('T')[0]}.csv`);
      res.status(200).send(csvData);

    } catch (error: any) {
      res.status(500).json({
        succes: false,
        message: MESSAGES_ERREUR.ERREUR_SERVEUR,
        erreur: error.message
      });
    }
  }

  /**
   * Obtient l'historique d'un employé
   * GET /pointages/historique/:employeId
   */
  async obtenirHistoriqueEmploye(req: Request, res: Response) {
    try {
      const { employeId } = req.params;
      const { limite = 100 } = req.query;

      const historique = await this.servicePointage.obtenirHistoriqueEmploye(
        employeId,
        parseInt(limite as string)
      );

      res.status(200).json({
        succes: true,
        donnees: historique
      });

    } catch (error: any) {
      res.status(500).json({
        succes: false,
        message: MESSAGES_ERREUR.ERREUR_SERVEUR,
        erreur: error.message
      });
    }
  }

  /**
   * Corrige un pointage
   * PUT /pointages/:id/corriger
   */
  async corrigerPointage(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const { heureArrivee, heureSortie, statutPresence, notes } = req.body;
      const utilisateurId = req.utilisateur?.id;

      // Vérifier les permissions
      if (!['ADMIN_ENTREPRISE', 'VIGILE'].includes(req.utilisateur?.role || '')) {
        return res.status(403).json({
          succes: false,
          message: 'Accès réservé aux administrateurs et vigiles'
        });
      }

      const pointageCorrige = await this.servicePointage.corrigerPointage(id, {
        heureArrivee: heureArrivee ? new Date(heureArrivee) : undefined,
        heureSortie: heureSortie ? new Date(heureSortie) : undefined,
        statutPresence,
        notes,
        utilisateurId: utilisateurId!
      });

      res.status(200).json({
        succes: true,
        message: 'Pointage corrigé avec succès',
        donnees: pointageCorrige
      });

    } catch (error: any) {
      res.status(500).json({
        succes: false,
        message: MESSAGES_ERREUR.ERREUR_SERVEUR,
        erreur: error.message
      });
    }
  }

  /**
   * Génère des QR Codes pour tous les employés
   * POST /pointages/qr-code/generer-tous
   */
  async genererQRCodesPourTous(req: Request, res: Response) {
    try {
      const entrepriseId = req.utilisateur?.entrepriseId;

      if (!entrepriseId) {
        return res.status(403).json({
          succes: false,
          message: MESSAGES_ERREUR.ENTREPRISE_NON_AUTORISEE
        });
      }

      // Vérifier les permissions (admin seulement)
      if (req.utilisateur?.role !== 'ADMIN_ENTREPRISE') {
        return res.status(403).json({
          succes: false,
          message: 'Accès réservé aux administrateurs'
        });
      }

      const resultat = await this.serviceQRCode.genererQRCodesPourTousEmployes(entrepriseId);

      res.status(200).json({
        succes: true,
        message: `Génération terminée: ${resultat.succes} réussies, ${resultat.echecs} échecs`,
        donnees: resultat
      });

    } catch (error: any) {
      res.status(500).json({
        succes: false,
        message: MESSAGES_ERREUR.ERREUR_SERVEUR,
        erreur: error.message
      });
    }
  }
}