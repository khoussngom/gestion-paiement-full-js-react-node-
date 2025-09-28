import { Request, Response } from 'express';
import { AuthentificationService } from '../services/AuthentificationService';
import { MESSAGES_SUCCES, MESSAGES_ERREUR } from '../enums/messages';

export class AuthentificationController {
  private authentificationService: AuthentificationService;

  constructor() {
    this.authentificationService = new AuthentificationService();
  }

  async connexion(req: Request, res: Response) {
    try {
      const { email, motDePasse } = req.body;

      if (!email || !motDePasse) {
        return res.status(400).json({
          succes: false,
          message: MESSAGES_ERREUR.DONNEES_INVALIDES
        });
      }

      const resultat = await this.authentificationService.connexion(email, motDePasse);

      res.status(200).json({
        succes: true,
        message: MESSAGES_SUCCES.CONNEXION_REUSSIE,
        donnees: resultat
      });
    } catch (error: any) {
      res.status(401).json({
        succes: false,
        message: error.message || MESSAGES_ERREUR.ERREUR_SERVEUR
      });
    }
  }

  async inscription(req: Request, res: Response) {
    try {
      const resultat = await this.authentificationService.inscription(req.body);

      res.status(201).json({
        succes: true,
        message: "Inscription réussie",
        donnees: resultat
      });
    } catch (error: any) {
      res.status(400).json({
        succes: false,
        message: error.message || MESSAGES_ERREUR.ERREUR_SERVEUR
      });
    }
  }

  async profil(req: Request, res: Response) {
    try {
      const utilisateur = req.utilisateur;
      
      res.status(200).json({
        succes: true,
        donnees: {
          id: utilisateur?.id,
          email: utilisateur?.email,
          role: utilisateur?.role,
          entrepriseId: utilisateur?.entrepriseId
        }
      });
    } catch (error: any) {
      res.status(500).json({
        succes: false,
        message: MESSAGES_ERREUR.ERREUR_SERVEUR,
        erreur: error.message
      });
    }
  }

  async deconnexion(req: Request, res: Response) {
    try {
      // Dans une vraie application, on pourrait invalider le token
      res.status(200).json({
        succes: true,
        message: MESSAGES_SUCCES.DECONNEXION_REUSSIE
      });
    } catch (error: any) {
      res.status(500).json({
        succes: false,
        message: MESSAGES_ERREUR.ERREUR_SERVEUR,
        erreur: error.message
      });
    }
  }

  async changerMotDePasse(req: Request, res: Response) {
    try {
      const utilisateurId = req.utilisateur?.id;
      const { ancienMotDePasse, nouveauMotDePasse } = req.body;

      if (!utilisateurId) {
        return res.status(401).json({
          succes: false,
          message: MESSAGES_ERREUR.TOKEN_INVALIDE
        });
      }

      if (!ancienMotDePasse || !nouveauMotDePasse) {
        return res.status(400).json({
          succes: false,
          message: MESSAGES_ERREUR.DONNEES_INVALIDES
        });
      }

      await this.authentificationService.changerMotDePasse(
        utilisateurId,
        ancienMotDePasse,
        nouveauMotDePasse
      );

      res.status(200).json({
        succes: true,
        message: "Mot de passe modifié avec succès"
      });
    } catch (error: any) {
      res.status(400).json({
        succes: false,
        message: error.message || MESSAGES_ERREUR.ERREUR_SERVEUR
      });
    }
  }
}
