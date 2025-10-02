import { PrismaClient } from '@prisma/client';
import { Pointage } from '@/entities/Pointage';
import { StatutPointage } from '@/enums';

const prisma = new PrismaClient();

export class PointageRepository {
  /**
   * Crée un nouveau pointage
   */
  public async create(donnees: {
    employeId: string;
    entrepriseId: string;
    datePointage: Date;
    heurePointage: Date;
    statut: StatutPointage;
    latitude?: string;
    longitude?: string;
    notes?: string;
  }): Promise<Pointage> {
    const pointage = await prisma.pointage.create({
      data: donnees
    });

    return new Pointage(pointage);
  }

  /**
   * Récupère un pointage par ID
   */
  public async getById(id: string): Promise<Pointage | null> {
    const pointage = await prisma.pointage.findUnique({
      where: { id },
      include: {
        employe: true
      }
    });

    return pointage ? new Pointage(pointage) : null;
  }

  /**
   * Récupère les pointages d'un employé
   */
  public async getByEmploye(employeId: string, dateDebut?: Date, dateFin?: Date): Promise<Pointage[]> {
    const where: any = { employeId };

    if (dateDebut || dateFin) {
      where.datePointage = {};
      if (dateDebut) {
        where.datePointage.gte = dateDebut;
      }
      if (dateFin) {
        where.datePointage.lte = dateFin;
      }
    }

    const pointages = await prisma.pointage.findMany({
      where,
      orderBy: {
        heurePointage: 'desc'
      }
    });

    return pointages.map(p => new Pointage(p));
  }

  /**
   * Récupère les pointages d'une entreprise
   */
  public async getByEntreprise(entrepriseId: string, dateDebut?: Date, dateFin?: Date): Promise<Pointage[]> {
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

    const pointages = await prisma.pointage.findMany({
      where,
      include: {
        employe: true
      },
      orderBy: {
        heurePointage: 'desc'
      }
    });

    return pointages.map(p => new Pointage(p));
  }

  /**
   * Vérifie si un pointage existe pour un employé à une date donnée
   */
  public async existePointageJour(employeId: string, date: Date): Promise<boolean> {
    const debut = new Date(date);
    debut.setHours(0, 0, 0, 0);
    const fin = new Date(debut);
    fin.setDate(fin.getDate() + 1);

    const pointage = await prisma.pointage.findFirst({
      where: {
        employeId,
        datePointage: {
          gte: debut,
          lt: fin
        }
      }
    });

    return pointage !== null;
  }

  /**
   * Compte les pointages par statut pour une entreprise
   */
  public async compterParStatut(entrepriseId: string, dateDebut?: Date, dateFin?: Date) {
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

    const [presents, retards, absents] = await Promise.all([
      prisma.pointage.count({ where: { ...where, statut: StatutPointage.PRESENT } }),
      prisma.pointage.count({ where: { ...where, statut: StatutPointage.RETARD } }),
      prisma.pointage.count({ where: { ...where, statut: StatutPointage.ABSENT } })
    ]);

    return { presents, retards, absents, total: presents + retards + absents };
  }
}
