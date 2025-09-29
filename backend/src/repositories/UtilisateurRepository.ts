import { PrismaClient } from '@prisma/client';
import { BasePrismaRepository } from './BasePrismaRepository';
import { Utilisateur } from '@/entities/Utilisateur';
import { CreerUtilisateurDto } from '@/validators';

export class UtilisateurRepository extends BasePrismaRepository {
  
  async getAll(): Promise<Utilisateur[]> {
    const utilisateurs = await this.prisma.utilisateur.findMany({
      include: {
        entreprise: true
      }
    });
    return utilisateurs.map(u => new Utilisateur(u));
  }

  async getById(id: string): Promise<Utilisateur | null> {
    const utilisateur = await this.prisma.utilisateur.findUnique({
      where: { id },
      include: {
        entreprise: true
      }
    });
    return utilisateur ? new Utilisateur(utilisateur) : null;
  }

  async getByEmail(email: string): Promise<Utilisateur | null> {
    const utilisateur = await this.prisma.utilisateur.findUnique({
      where: { email },
      include: {
        entreprise: true
      }
    });
    return utilisateur ? new Utilisateur(utilisateur) : null;
  }

  async getByEntreprise(entrepriseId: string): Promise<Utilisateur[]> {
    const utilisateurs = await this.prisma.utilisateur.findMany({
      where: { entrepriseId },
      include: {
        entreprise: true
      }
    });
    return utilisateurs.map(u => new Utilisateur(u));
  }

  async create(donnees: CreerUtilisateurDto): Promise<Utilisateur> {
    const utilisateur = await this.prisma.utilisateur.create({
      data: donnees,
      include: {
        entreprise: true
      }
    });
    return new Utilisateur(utilisateur);
  }

  async update(id: string, donnees: Partial<CreerUtilisateurDto>): Promise<Utilisateur> {
    const utilisateur = await this.prisma.utilisateur.update({
      where: { id },
      data: {
        ...donnees,
        dateModification: new Date()
      },
      include: {
        entreprise: true
      }
    });
    return new Utilisateur(utilisateur);
  }

  async delete(id: string): Promise<void> {
    await this.prisma.utilisateur.delete({
      where: { id }
    });
  }

  async activate(id: string): Promise<Utilisateur> {
    const utilisateur = await this.prisma.utilisateur.update({
      where: { id },
      data: {
        actif: true,
        dateModification: new Date()
      },
      include: {
        entreprise: true
      }
    });
    return new Utilisateur(utilisateur);
  }

  async deactivate(id: string): Promise<Utilisateur> {
    const utilisateur = await this.prisma.utilisateur.update({
      where: { id },
      data: {
        actif: false,
        dateModification: new Date()
      },
      include: {
        entreprise: true
      }
    });
    return new Utilisateur(utilisateur);
  }

  async checkEmailExists(email: string, excluId?: string): Promise<boolean> {
    const utilisateur = await this.prisma.utilisateur.findFirst({
      where: {
        email,
        ...(excluId && { id: { not: excluId } })
      }
    });
    return !!utilisateur;
  }

  async verifierExistenceEmail(email: string, excluId?: string): Promise<boolean> {
    return this.checkEmailExists(email, excluId);
  }

  async creer(donnees: CreerUtilisateurDto): Promise<Utilisateur> {
    return this.create(donnees);
  }

  async countByEntreprise(entrepriseId: string): Promise<number> {
    return await this.prisma.utilisateur.count({
      where: { entrepriseId }
    });
  }

  async getActiveUsers(): Promise<Utilisateur[]> {
    const utilisateurs = await this.prisma.utilisateur.findMany({
      where: { actif: true },
      include: {
        entreprise: true
      }
    });
    return utilisateurs.map(u => new Utilisateur(u));
  }

  async toggleActive(id: string, actif: boolean): Promise<Utilisateur> {
    const utilisateur = await this.prisma.utilisateur.update({
      where: { id },
      data: { actif },
      include: {
        entreprise: true
      }
    });
    return new Utilisateur(utilisateur);
  }
}
