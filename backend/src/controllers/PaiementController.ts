import { Request, Response } from 'express';
import { PaiementService } from '../services/PaiementService';
import { schemaCreerPaiement } from '../validators';
import { MESSAGES_SUCCES, MESSAGES_ERREUR } from '../enums/messages';

export class PaiementController {
    private paiementService: PaiementService;

    constructor() {
        this.paiementService = new PaiementService();
    }

    async obtenirTous(req: Request, res: Response) {
        try {
        const entrepriseId = req.utilisateur?.entrepriseId;
        
        if (!entrepriseId) {
            return res.status(403).json({
            succes: false,
            message: MESSAGES_ERREUR.ENTREPRISE_NON_AUTORISEE
            });
        }

        const paiements = await this.paiementService.obtenirTousPaiements(entrepriseId);
        
        res.status(200).json({
            succes: true,
            donnees: paiements
        });
        } catch (error: any) {
        res.status(500).json({
            succes: false,
            message: MESSAGES_ERREUR.ERREUR_SERVEUR,
            erreur: error.message
        });
        }
    }

    async obtenirStatistiques(req: Request, res: Response) {
        try {
        const entrepriseId = req.utilisateur?.entrepriseId;
        
        if (!entrepriseId) {
            return res.status(403).json({
            succes: false,
            message: MESSAGES_ERREUR.ENTREPRISE_NON_AUTORISEE
            });
        }

        const stats = await this.paiementService.obtenirStatistiques(entrepriseId);
        
        console.log('Stats formatées pour frontend:', stats);
        
        res.status(200).json({
            succes: true,
            donnees: stats
        });
        } catch (error: any) {
        res.status(500).json({
            succes: false,
            message: MESSAGES_ERREUR.ERREUR_SERVEUR,
            erreur: error.message
        });
        }
    }

    async creer(req: Request, res: Response) {
        try {
        const entrepriseId = req.utilisateur?.entrepriseId;
        const utilisateurId = req.utilisateur?.id;
        
        if (!entrepriseId || !utilisateurId) {
            return res.status(403).json({
            succes: false,
            message: MESSAGES_ERREUR.ENTREPRISE_NON_AUTORISEE
            });
        }

        const validation = schemaCreerPaiement.safeParse(req.body);
        if (!validation.success) {
            return res.status(400).json({
            succes: false,
            message: MESSAGES_ERREUR.DONNEES_INVALIDES,
            erreurs: validation.error.errors
            });
        }

        const paiement = await this.paiementService.creerPaiement(
            entrepriseId,
            utilisateurId,
            validation.data
        );

        res.status(201).json({
            succes: true,
            message: "Paiement créé avec succès",
            donnees: paiement
        });
        } catch (error: any) {
        res.status(500).json({
            succes: false,
            message: MESSAGES_ERREUR.ERREUR_SERVEUR,
            erreur: error.message
        });
        }
    }

    async exporterCSV(req: Request, res: Response) {
        try {
        const entrepriseId = req.utilisateur?.entrepriseId;
        
        if (!entrepriseId) {
            return res.status(403).json({
            succes: false,
            message: MESSAGES_ERREUR.ENTREPRISE_NON_AUTORISEE
            });
        }

        const csvContent = await this.paiementService.exporterCSV(entrepriseId);

        res.setHeader('Content-Type', 'text/csv');
        res.setHeader('Content-Disposition', `attachment; filename=paiements_${new Date().toISOString().split('T')[0]}.csv`);
        res.send(csvContent);

        } catch (error: any) {
        res.status(500).json({
            succes: false,
            message: MESSAGES_ERREUR.ERREUR_SERVEUR,
            erreur: error.message
        });
        }
    }

    async genererRapport(req: Request, res: Response) {
        try {
        const entrepriseId = req.utilisateur?.entrepriseId;
        
        if (!entrepriseId) {
            return res.status(403).json({
            succes: false,
            message: MESSAGES_ERREUR.ENTREPRISE_NON_AUTORISEE
            });
        }

        const rapport = await this.paiementService.genererRapport(entrepriseId);

        res.setHeader('Content-Type', 'application/pdf');
        res.setHeader('Content-Disposition', `attachment; filename=rapport_paiements_${new Date().toISOString().split('T')[0]}.pdf`);

        res.setHeader('Content-Type', 'text/plain');
        res.send(rapport);

        } catch (error: any) {
        res.status(500).json({
            succes: false,
            message: MESSAGES_ERREUR.ERREUR_SERVEUR,
            erreur: error.message
        });
        }
    }
}
