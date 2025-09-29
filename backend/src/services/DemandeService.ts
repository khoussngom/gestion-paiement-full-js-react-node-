import { PrismaClient, StatutDemande, RoleUtilisateur } from '@prisma/client';
import bcrypt from 'bcryptjs';

export class DemandeService {
  private prisma: PrismaClient;

  constructor() {
    this.prisma = new PrismaClient();
  }

  async creerDemande(donneesDemande: any) {
    return await this.prisma.demandeAcces.create({
      data: {
        ...donneesDemande,
        statut: StatutDemande.EN_ATTENTE,
        dateCreation: new Date()
      }
    });
  }

  async obtenirToutesDemandes() {
    return await this.prisma.demandeAcces.findMany({
      orderBy: { dateCreation: 'desc' },
      include: {
        entrepriseCreee: true
      }
    });
  }

  async obtenirDemandeParId(id: string) {
    return await this.prisma.demandeAcces.findUnique({
      where: { id },
      include: {
        entrepriseCreee: true
      }
    });
  }

  async accepterDemande(id: string, superAdminId: string) {
    const demande = await this.prisma.demandeAcces.findUnique({
      where: { id }
    });

    if (!demande) {
      throw new Error('Demande non trouvée');
    }

    if (demande.statut !== StatutDemande.EN_ATTENTE) {
      throw new Error('Cette demande a déjà été traitée');
    }

    // Créer l'entreprise
    const entreprise = await this.prisma.entreprise.create({
      data: {
        nom: demande.nomEntreprise,
        secteurActivite: demande.secteurActivite,
        adresse: '', // À compléter plus tard
        telephone: demande.telephone,
        email: demande.email,
        actif: true
      }
    });

    // Créer le compte administrateur de l'entreprise
    const motDePasseTemporaire = this.genererMotDePasseTemporaire();
    const bcrypt = require('bcryptjs');
    const motDePasseHache = await bcrypt.hash(motDePasseTemporaire, 10);

    const utilisateur = await this.prisma.utilisateur.create({
      data: {
        nom: demande.nomResponsable,
        prenom: '', // Prénom vide par défaut, peut être mis à jour par l'utilisateur
        email: demande.email,
        motDePasse: motDePasseHache,
        role: RoleUtilisateur.ADMIN_ENTREPRISE,
        entrepriseId: entreprise.id,
        actif: true
      }
    });

    // Mettre à jour la demande
    const demandeAcceptee = await this.prisma.demandeAcces.update({
      where: { id },
      data: {
        statut: StatutDemande.ACCEPTEE,
        dateTraitement: new Date(),
        traitePar: superAdminId,
        entrepriseCreeeId: entreprise.id,
        motDePasseTemporaire
      },
      include: {
        entrepriseCreee: true
      }
    });

    return {
      demande: demandeAcceptee,
      entreprise,
      utilisateur,
      motDePasseTemporaire
    };
  }

  async rejeterDemande(id: string, superAdminId: string, motifRejet: string) {
    const demande = await this.prisma.demandeAcces.findUnique({
      where: { id }
    });

    if (!demande) {
      throw new Error('Demande non trouvée');
    }

    if (demande.statut !== StatutDemande.EN_ATTENTE) {
      throw new Error('Cette demande a déjà été traitée');
    }

    return await this.prisma.demandeAcces.update({
      where: { id },
      data: {
        statut: StatutDemande.REJETEE,
        dateTraitement: new Date(),
        traitePar: superAdminId,
        motifRejet
      }
    });
  }

  private genererMotDePasseTemporaire(): string {
    const chars = 'ABCDEFGHJKMNPQRSTUVWXYZabcdefghijkmnpqrstuvwxyz23456789';
    let result = '';
    for (let i = 0; i < 8; i++) {
      result += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return result;
  }

  async obtenirStatistiques() {
    const [total, enAttente, acceptees, rejetees] = await Promise.all([
      this.prisma.demandeAcces.count(),
      this.prisma.demandeAcces.count({ where: { statut: StatutDemande.EN_ATTENTE } }),
      this.prisma.demandeAcces.count({ where: { statut: StatutDemande.ACCEPTEE } }),
      this.prisma.demandeAcces.count({ where: { statut: StatutDemande.REJETEE } })
    ]);

    return {
      total,
      enAttente,
      acceptees,
      rejetees
    };
  }
}
