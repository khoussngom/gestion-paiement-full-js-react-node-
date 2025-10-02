import { PrismaClient } from '@prisma/client';
import { PointageRepository } from '../repositories/PointageRepository';
import { ServiceQRCode } from './ServiceQRCode';
import { Pointage } from '../entities/Pointage';
import { StatutPresence, TypePointage } from '../enums';

export class ServicePointage {
  private prisma: PrismaClient;
  private pointageRepository: PointageRepository;
  private serviceQRCode: ServiceQRCode;

  constructor() {
    this.prisma = new PrismaClient();
    this.pointageRepository = new PointageRepository();
    this.serviceQRCode = new ServiceQRCode();
  }

  /**
   * Traite un scan de QR Code et enregistre le pointage
   */
  async traiterScanQRCode(
    donneesJson: string,
    vigileId?: string,
    adresseIP?: string,
    userAgent?: string
  ): Promise<{
    succes: boolean;
    pointage?: any;
    message: string;
    employe?: any;
  }> {
    try {
      // Valider le QR Code
      const validationQR = await this.serviceQRCode.validerScanQRCode(donneesJson, adresseIP);
      
      if (!validationQR.valide) {
        return {
          succes: false,
          message: validationQR.message || 'QR Code invalide'
        };
      }

      const employe = validationQR.employe;
      const maintenant = new Date();
      const dateSeule = new Date(maintenant.getFullYear(), maintenant.getMonth(), maintenant.getDate());

      // Vérifier s'il y a déjà un pointage d'entrée aujourd'hui
      const pointageExistant = await this.pointageRepository.trouverPointageDuJour(
        employe.id,
        dateSeule,
        TypePointage.ENTREE
      );

      let pointage;

      if (pointageExistant) {
        // Vérifier s'il y a déjà une sortie
        const pointageSortie = await this.pointageRepository.trouverPointageDuJour(
          employe.id,
          dateSeule,
          TypePointage.SORTIE
        );

        if (pointageSortie) {
          return {
            succes: false,
            message: 'Pointage d\'entrée et de sortie déjà effectués aujourd\'hui'
          };
        }

        // Enregistrer la sortie
        pointage = await this.pointageRepository.creerPointage({
          employeId: employe.id,
          entrepriseId: employe.entrepriseId,
          date: dateSeule,
          heureSortie: maintenant,
          typePointage: TypePointage.SORTIE,
          statutPresence: pointageExistant.statutPresence,
          adresseIP,
          userAgent,
          vigileId,
          notes: 'Pointage de sortie via QR Code'
        });

        return {
          succes: true,
          pointage,
          message: `Sortie enregistrée à ${maintenant.toLocaleTimeString('fr-FR')}`,
          employe
        };

      } else {
        // Enregistrer l'entrée
        const statutPresence = Pointage.determinerStatutPresence(maintenant);
        
        pointage = await this.pointageRepository.creerPointage({
          employeId: employe.id,
          entrepriseId: employe.entrepriseId,
          date: dateSeule,
          heureArrivee: maintenant,
          typePointage: TypePointage.ENTREE,
          statutPresence,
          adresseIP,
          userAgent,
          vigileId,
          notes: 'Pointage d\'entrée via QR Code'
        });

        const messageStatut = statutPresence === StatutPresence.PRESENT 
          ? 'Présent' 
          : `En retard (arrivée: ${maintenant.toLocaleTimeString('fr-FR')})`;

        return {
          succes: true,
          pointage,
          message: `Entrée enregistrée - ${messageStatut}`,
          employe
        };
      }

    } catch (error: any) {
      return {
        succes: false,
        message: `Erreur lors du traitement: ${error.message}`
      };
    }
  }

  /**
   * Enregistre manuellement un pointage (pour les admins)
   */
  async enregistrerPointageManuel(donneesPointage: {
    employeId: string;
    entrepriseId: string;
    date: Date;
    heureArrivee?: Date;
    heureSortie?: Date;
    statutPresence: StatutPresence;
    notes?: string;
    utilisateurId: string;
  }): Promise<any> {
    try {
      // Vérifier que l'employé existe et appartient à l'entreprise
      const employe = await this.prisma.employe.findFirst({
        where: {
          id: donneesPointage.employeId,
          entrepriseId: donneesPointage.entrepriseId,
          actif: true
        }
      });

      if (!employe) {
        throw new Error('Employé non trouvé ou inactif');
      }

      const dateSeule = new Date(
        donneesPointage.date.getFullYear(),
        donneesPointage.date.getMonth(),
        donneesPointage.date.getDate()
      );

      // Créer le pointage
      const pointage = await this.pointageRepository.creerPointage({
        employeId: donneesPointage.employeId,
        entrepriseId: donneesPointage.entrepriseId,
        date: dateSeule,
        heureArrivee: donneesPointage.heureArrivee,
        heureSortie: donneesPointage.heureSortie,
        typePointage: donneesPointage.heureArrivee ? TypePointage.ENTREE : TypePointage.SORTIE,
        statutPresence: donneesPointage.statutPresence,
        notes: `${donneesPointage.notes || ''} (Enregistrement manuel)`,
        vigileId: donneesPointage.utilisateurId
      });

      return pointage;

    } catch (error: any) {
      throw new Error(`Erreur lors de l'enregistrement manuel: ${error.message}`);
    }
  }

  /**
   * Obtient les pointages avec filtres
   */
  async obtenirPointages(entrepriseId: string, filtres?: {
    dateDebut?: Date;
    dateFin?: Date;
    employeId?: string;
    statutPresence?: StatutPresence;
    page?: number;
    limite?: number;
  }): Promise<{
    pointages: any[];
    total: number;
    page: number;
    totalPages: number;
  }> {
    const page = filtres?.page || 1;
    const limite = filtres?.limite || 50;

    const [pointages, total] = await Promise.all([
      this.pointageRepository.obtenirPointages(entrepriseId, filtres),
      this.pointageRepository.compterPointages(entrepriseId, filtres)
    ]);

    return {
      pointages,
      total,
      page,
      totalPages: Math.ceil(total / limite)
    };
  }

  /**
   * Obtient les statistiques de pointage
   */
  async obtenirStatistiques(entrepriseId: string, periode?: {
    dateDebut: Date;
    dateFin: Date;
  }): Promise<any> {
    const stats = await this.pointageRepository.obtenirStatistiques(entrepriseId, periode);
    
    // Ajouter des statistiques additionnelles
    const employesActifs = await this.prisma.employe.count({
      where: {
        entrepriseId: entrepriseId,
        actif: true
      }
    });

    const presentsAujourdhui = await this.pointageRepository.obtenirPresentsEnTempsReel(entrepriseId);

    return {
      ...stats,
      employesActifs,
      presentsAujourdhui: presentsAujourdhui.length,
      tauxPresenceAujourdhui: employesActifs > 0 
        ? (presentsAujourdhui.length / employesActifs) * 100 
        : 0
    };
  }

  /**
   * Obtient le rapport détaillé par employé
   */
  async obtenirRapportParEmploye(entrepriseId: string, periode: {
    dateDebut: Date;
    dateFin: Date;
  }): Promise<any[]> {
    const rapport = await this.pointageRepository.obtenirRapportParEmploye(entrepriseId, periode);
    
    // Enrichir avec des calculs
    return rapport.map(employe => {
      const pointagesEntree = employe.pointages.filter((p: any) => p.typePointage === TypePointage.ENTREE);
      const pointagesSortie = employe.pointages.filter((p: any) => p.typePointage === TypePointage.SORTIE);
      
      const joursPresents = pointagesEntree.filter((p: any) => p.statutPresence === StatutPresence.PRESENT).length;
      const joursRetard = pointagesEntree.filter((p: any) => p.statutPresence === StatutPresence.RETARD).length;
      const joursAbsents = pointagesEntree.filter((p: any) => p.statutPresence === StatutPresence.ABSENT).length;

      // Calculer les heures totales
      let totalHeures = 0;
      pointagesEntree.forEach((entree: any) => {
        const sortieCorrespondante = pointagesSortie.find((sortie: any) => 
          sortie.date.getTime() === entree.date.getTime()
        );
        
        if (entree.heureArrivee && sortieCorrespondante?.heureSortie) {
          const heures = (new Date(sortieCorrespondante.heureSortie).getTime() - 
                        new Date(entree.heureArrivee).getTime()) / (1000 * 60 * 60);
          totalHeures += heures;
        }
      });

      return {
        ...employe,
        statistiques: {
          joursPresents,
          joursRetard,
          joursAbsents,
          totalHeures: Math.round(totalHeures * 100) / 100,
          tauxPresence: pointagesEntree.length > 0 
            ? ((joursPresents + joursRetard) / pointagesEntree.length) * 100 
            : 0
        }
      };
    });
  }

  /**
   * Marque automatiquement les absents (processus planifié)
   */
  async marquerAbsentsAutomatiquement(entrepriseId?: string): Promise<{
    entreprisesTraitees: number;
    employes: { entrepriseId: string; absents: number }[];
  }> {
    try {
      const aujourd = new Date();
      const heureActuelle = aujourd.getHours();

      // Ne traiter qu'après 16h
      if (heureActuelle < 16) {
        throw new Error('Les absences ne peuvent être marquées qu\'après 16h00');
      }

      const entreprises = entrepriseId 
        ? [{ id: entrepriseId }]
        : await this.prisma.entreprise.findMany({
            where: { actif: true },
            select: { id: true }
          });

      const resultats = [];

      for (const entreprise of entreprises) {
        const absents = await this.pointageRepository.marquerAbsents(entreprise.id, aujourd);
        resultats.push({
          entrepriseId: entreprise.id,
          absents
        });
      }

      return {
        entreprisesTraitees: entreprises.length,
        employes: resultats
      };

    } catch (error: any) {
      throw new Error(`Erreur lors du marquage automatique: ${error.message}`);
    }
  }

  /**
   * Obtient les employés présents en temps réel
   */
  async obtenirPresentsEnTempsReel(entrepriseId: string): Promise<any[]> {
    return await this.pointageRepository.obtenirPresentsEnTempsReel(entrepriseId);
  }

  /**
   * Calcule les heures travaillées pour la paie
   */
  async calculerHeuresPourPaie(entrepriseId: string, periode: {
    dateDebut: Date;
    dateFin: Date;
  }): Promise<any[]> {
    return await this.pointageRepository.calculerHeuresTravaillees(entrepriseId, periode);
  }

  /**
   * Corrige un pointage (pour les admins)
   */
  async corrigerPointage(pointageId: string, corrections: {
    heureArrivee?: Date;
    heureSortie?: Date;
    statutPresence?: StatutPresence;
    notes?: string;
    utilisateurId: string;
  }): Promise<any> {
    try {
      const noteCorrection = `Corrigé par admin (${corrections.utilisateurId}) - ${corrections.notes || ''}`;
      
      return await this.pointageRepository.mettreAJour(pointageId, {
        heureSortie: corrections.heureSortie,
        statutPresence: corrections.statutPresence,
        notes: noteCorrection,
        vigileId: corrections.utilisateurId
      });

    } catch (error: any) {
      throw new Error(`Erreur lors de la correction: ${error.message}`);
    }
  }

  /**
   * Obtient l'historique d'un employé
   */
  async obtenirHistoriqueEmploye(employeId: string, limite: number = 100): Promise<any[]> {
    return await this.pointageRepository.obtenirHistoriqueEmploye(employeId, limite);
  }

  /**
   * Valide la cohérence d'un pointage
   */
  async validerCoherencePointage(pointage: any): Promise<{
    valide: boolean;
    alertes: string[];
  }> {
    const alertes: string[] = [];

    // Vérifier l'heure d'arrivée tardive
    if (pointage.heureArrivee) {
      const heureArrivee = new Date(pointage.heureArrivee);
      const heures = heureArrivee.getHours();
      const minutes = heureArrivee.getMinutes();
      
      if (heures > 10 || (heures === 10 && minutes > 0)) {
        alertes.push('Arrivée très tardive (après 10h)');
      }
      
      if (heures < 6) {
        alertes.push('Arrivée très précoce (avant 6h)');
      }
    }

    // Vérifier la cohérence sortie
    if (pointage.heureSortie && pointage.heureArrivee) {
      const duree = (new Date(pointage.heureSortie).getTime() - 
                    new Date(pointage.heureArrivee).getTime()) / (1000 * 60 * 60);
      
      if (duree > 12) {
        alertes.push('Durée de travail excessive (> 12h)');
      }
      
      if (duree < 1) {
        alertes.push('Durée de travail très courte (< 1h)');
      }
    }

    // Vérifier les week-ends
    const datePointage = new Date(pointage.date);
    const jourSemaine = datePointage.getDay();
    if (jourSemaine === 0 || jourSemaine === 6) {
      alertes.push('Pointage en week-end');
    }

    return {
      valide: alertes.length === 0,
      alertes
    };
  }

  /**
   * Exporte les données de pointage au format CSV
   */
  async exporterPointagesCSV(entrepriseId: string, periode?: {
    dateDebut: Date;
    dateFin: Date;
  }): Promise<string> {
    const pointages = await this.pointageRepository.obtenirPointages(entrepriseId, {
      dateDebut: periode?.dateDebut,
      dateFin: periode?.dateFin,
      limite: 10000 // Grande limite pour l'export
    });

    const headers = [
      'Date',
      'Employé',
      'Poste',
      'Heure Arrivée',
      'Heure Sortie',
      'Statut',
      'Type',
      'Heures Travaillées',
      'Notes',
      'Validé par'
    ];

    const lignes = pointages.map((p: any) => {
      const heuresTravaillees = p.heureArrivee && p.heureSortie
        ? ((new Date(p.heureSortie).getTime() - new Date(p.heureArrivee).getTime()) / (1000 * 60 * 60)).toFixed(2)
        : '0';

      return [
        new Date(p.date).toLocaleDateString('fr-FR'),
        p.employe?.nomComplet || 'N/A',
        p.employe?.poste || 'N/A',
        p.heureArrivee ? new Date(p.heureArrivee).toLocaleTimeString('fr-FR') : '',
        p.heureSortie ? new Date(p.heureSortie).toLocaleTimeString('fr-FR') : '',
        p.statutPresence,
        p.typePointage,
        heuresTravaillees,
        p.notes || '',
        p.vigile ? `${p.vigile.nom} ${p.vigile.prenom}` : ''
      ].map(cell => `"${cell}"`).join(',');
    });

    return [headers.join(','), ...lignes].join('\n');
  }
}