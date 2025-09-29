import { Request, Response } from 'express';
import { ServiceDashboard } from '../services/ServiceDashboard';
import { PrismaClient } from '@prisma/client';
import { MESSAGES_ERREUR } from '../enums/messages';

export class DashboardController {
    private serviceDashboard: ServiceDashboard;
    private prisma: PrismaClient;

    constructor() {
        this.serviceDashboard = new ServiceDashboard();
        this.prisma = new PrismaClient();
    }

    async obtenirStatistiques(req: Request, res: Response) {
        try {

            let entrepriseId = req.utilisateur?.entrepriseId;
        
        console.log('Dashboard statistiques demandées pour entreprise:', entrepriseId);
        console.log('[DEBUG] Controller Dashboard utilisé');
        
        if (!entrepriseId) {
            console.log('Mode test: utilisation de la première entreprise');
            const premiereEntreprise = await this.prisma.entreprise.findFirst();
            if (premiereEntreprise) {
            entrepriseId = premiereEntreprise.id;
            } else {
            return res.status(400).json({
                succes: false,
                message: 'Aucune entreprise trouvée'
            });
            }
        }

        const statistiques = await this.serviceDashboard.obtenirStatistiquesCompletes(entrepriseId);
        
        console.log('Statistiques obtenues:', {
            employes: statistiques.employes,
            paiements: statistiques.paiements
        });

        res.status(200).json({
            succes: true,
            donnees: statistiques
        });

        } catch (error: any) {
        console.error('Erreur lors de l\'obtention des statistiques dashboard:', error);
        res.status(500).json({
            succes: false,
            message: MESSAGES_ERREUR.ERREUR_SERVEUR,
            erreur: error.message
        });
        }
    }

    async exporterEmployes(req: Request, res: Response) {
        try {
        const entrepriseId = req.utilisateur?.entrepriseId;
        
        if (!entrepriseId) {
            return res.status(403).json({
            succes: false,
            message: MESSAGES_ERREUR.ENTREPRISE_NON_AUTORISEE
            });
        }

        const employes = await this.serviceDashboard.exporterEmployes(entrepriseId);

        res.status(200).json({
            succes: true,
            donnees: employes
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
