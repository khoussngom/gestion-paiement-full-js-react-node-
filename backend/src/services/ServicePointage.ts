import { PrismaClient } from '@prisma/client';
import { StatutPointage } from '@/enums';
import { ServiceQRCode } from './ServiceQRCode';

const prisma = new PrismaClient();

export class ServicePointage {
  private serviceQRCode: ServiceQRCode;

  constructor() {
    this.serviceQRCode = new ServiceQRCode();
  }

  /**
   * Enregistre un pointage pour un employé
   * @param codeQR - Code QR scanné
   * @param entrepriseId - ID de l'entreprise
   * @param latitude - Latitude optionnelle (géolocalisation)
   * @param longitude - Longitude optionnelle (géolocalisation)
   * @returns Pointage créé
   */
  public async enregistrerPointage(
    codeQR: string,
    entrepriseId: string,
    latitude?: string,
    longitude?: string
  ) {
    // Décoder le code QR
    const decoded = this.serviceQRCode.decoderCodeQR(codeQR);
    
    // Valider le code QR
    if (!this.serviceQRCode.validerCodeQR(codeQR, entrepriseId)) {
      throw new Error('Code QR invalide pour cette entreprise');
    }

    // Récupérer l'employé
    const employe = await prisma.employe.findUnique({
      where: { id: decoded.employeId }
    });

    if (!employe) {
      throw new Error('Employé non trouvé');
    }

    if (!employe.actif) {
      throw new Error('Employé inactif');
    }

    // Vérifier si un pointage existe déjà aujourd'hui
    const aujourdhui = new Date();
    aujourdhui.setHours(0, 0, 0, 0);
    const demain = new Date(aujourdhui);
    demain.setDate(demain.getDate() + 1);

    const pointageExistant = await prisma.pointage.findFirst({
      where: {
        employeId: decoded.employeId,
        datePointage: {
          gte: aujourdhui,
          lt: demain
        }
      }
    });

    if (pointageExistant) {
      throw new Error('Un pointage a déjà été enregistré aujourd\'hui');
    }

    // Déterminer le statut selon l'heure
    const maintenant = new Date();
    const heure = maintenant.getHours();
    const minutes = maintenant.getMinutes();
    const heureEnMinutes = heure * 60 + minutes;

    let statut: StatutPointage;
    
    // Avant ou à 8h30 (510 minutes) → Présent
    if (heureEnMinutes <= 510) {
      statut = StatutPointage.PRESENT;
    } 
    // Après 8h30 → Retard
    else {
      statut = StatutPointage.RETARD;
    }

    // Créer le pointage
    const pointage = await prisma.pointage.create({
      data: {
        employeId: decoded.employeId,
        entrepriseId,
        datePointage: aujourdhui,
        heurePointage: maintenant,
        statut,
        latitude,
        longitude
      },
      include: {
        employe: {
          select: {
            id: true,
            nomComplet: true,
            poste: true
          }
        }
      }
    });

    return pointage;
  }

  /**
   * Marque automatiquement les employés absents après 16h
   * @param entrepriseId - ID de l'entreprise
   */
  public async marquerAbsents(entrepriseId: string) {
    const aujourdhui = new Date();
    aujourdhui.setHours(0, 0, 0, 0);
    const demain = new Date(aujourdhui);
    demain.setDate(demain.getDate() + 1);

    // Récupérer tous les employés actifs
    const employes = await prisma.employe.findMany({
      where: {
        entrepriseId,
        actif: true
      }
    });

    // Récupérer les pointages du jour
    const pointages = await prisma.pointage.findMany({
      where: {
        entrepriseId,
        datePointage: {
          gte: aujourdhui,
          lt: demain
        }
      }
    });

    const employesPointes = new Set(pointages.map(p => p.employeId));

    // Créer des pointages "ABSENT" pour les employés non pointés
    const absents = employes.filter(e => !employesPointes.has(e.id));
    
    const pointagesAbsents = await Promise.all(
      absents.map(employe =>
        prisma.pointage.create({
          data: {
            employeId: employe.id,
            entrepriseId,
            datePointage: aujourdhui,
            heurePointage: new Date(),
            statut: StatutPointage.ABSENT,
            notes: 'Marqué automatiquement comme absent après 16h00'
          }
        })
      )
    );

    return pointagesAbsents;
  }

  /**
   * Récupère les pointages d'une entreprise avec filtres
   * @param entrepriseId - ID de l'entreprise
   * @param filtres - Filtres optionnels (date, employé, statut)
   */
  public async obtenirPointages(
    entrepriseId: string,
    filtres?: {
      dateDebut?: Date;
      dateFin?: Date;
      employeId?: string;
      statut?: StatutPointage;
    }
  ) {
    const where: any = { entrepriseId };

    if (filtres?.dateDebut || filtres?.dateFin) {
      where.datePointage = {};
      if (filtres.dateDebut) {
        where.datePointage.gte = filtres.dateDebut;
      }
      if (filtres.dateFin) {
        where.datePointage.lte = filtres.dateFin;
      }
    }

    if (filtres?.employeId) {
      where.employeId = filtres.employeId;
    }

    if (filtres?.statut) {
      where.statut = filtres.statut;
    }

    const pointages = await prisma.pointage.findMany({
      where,
      include: {
        employe: {
          select: {
            id: true,
            nomComplet: true,
            poste: true,
            email: true,
            telephone: true
          }
        }
      },
      orderBy: {
        heurePointage: 'desc'
      }
    });

    return pointages;
  }

  /**
   * Obtient les statistiques de pointage
   * @param entrepriseId - ID de l'entreprise
   * @param dateDebut - Date de début
   * @param dateFin - Date de fin
   */
  public async obtenirStatistiques(
    entrepriseId: string,
    dateDebut?: Date,
    dateFin?: Date
  ) {
    const where: any = { entrepriseId };

    if (dateDebut || dateFin) {
      where.datePointage = {};
      if (dateDebut) {
        where.datePointage.gte = dateDebut;
      }
      if (dateFin) {
        where.datePointage.lte = dateFin;
      }
    }

    const pointages = await prisma.pointage.findMany({ where });

    const stats = {
      total: pointages.length,
      presents: pointages.filter(p => p.statut === StatutPointage.PRESENT).length,
      retards: pointages.filter(p => p.statut === StatutPointage.RETARD).length,
      absents: pointages.filter(p => p.statut === StatutPointage.ABSENT).length,
      tauxPresence: 0,
      tauxRetard: 0,
      tauxAbsence: 0
    };

    if (stats.total > 0) {
      stats.tauxPresence = (stats.presents / stats.total) * 100;
      stats.tauxRetard = (stats.retards / stats.total) * 100;
      stats.tauxAbsence = (stats.absents / stats.total) * 100;
    }

    return stats;
  }

  /**
   * Obtient le rapport de pointage par employé
   * @param entrepriseId - ID de l'entreprise
   * @param dateDebut - Date de début
   * @param dateFin - Date de fin
   */
  public async obtenirRapportParEmploye(
    entrepriseId: string,
    dateDebut?: Date,
    dateFin?: Date
  ) {
    const pointages = await this.obtenirPointages(entrepriseId, {
      dateDebut,
      dateFin
    });

    // Grouper par employé
    const rapportParEmploye = new Map<string, any>();

    pointages.forEach(pointage => {
      const employeId = pointage.employeId;
      
      if (!rapportParEmploye.has(employeId)) {
        rapportParEmploye.set(employeId, {
          employe: pointage.employe,
          presents: 0,
          retards: 0,
          absents: 0,
          total: 0
        });
      }

      const rapport = rapportParEmploye.get(employeId);
      rapport.total++;
      
      if (pointage.statut === StatutPointage.PRESENT) {
        rapport.presents++;
      } else if (pointage.statut === StatutPointage.RETARD) {
        rapport.retards++;
      } else if (pointage.statut === StatutPointage.ABSENT) {
        rapport.absents++;
      }
    });

    // Calculer les taux pour chaque employé
    const rapports = Array.from(rapportParEmploye.values()).map(rapport => ({
      ...rapport,
      tauxPresence: rapport.total > 0 ? (rapport.presents / rapport.total) * 100 : 0,
      tauxRetard: rapport.total > 0 ? (rapport.retards / rapport.total) * 100 : 0,
      tauxAbsence: rapport.total > 0 ? (rapport.absents / rapport.total) * 100 : 0
    }));

    return rapports;
  }
}
