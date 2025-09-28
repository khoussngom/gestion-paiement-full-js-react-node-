import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';

export class AuthentificationService {
  private prisma: PrismaClient;

  constructor() {
    this.prisma = new PrismaClient();
  }

  async connexion(email: string, motDePasse: string) {
    // Rechercher l'utilisateur
    const utilisateur = await this.prisma.utilisateur.findUnique({
      where: { email },
      include: { entreprise: true }
    });

    if (!utilisateur) {
      throw new Error('Email ou mot de passe incorrect');
    }

    // Vérifier le mot de passe
    const motDePasseValide = await bcrypt.compare(motDePasse, utilisateur.motDePasse);
    if (!motDePasseValide) {
      throw new Error('Email ou mot de passe incorrect');
    }

    // Générer le token JWT
    const token = jwt.sign(
      {
        id: utilisateur.id,
        email: utilisateur.email,
        entrepriseId: utilisateur.entrepriseId,
        role: utilisateur.role
      },
      process.env.JWT_SECRET || 'secret-key',
      { expiresIn: '24h' }
    );

    return {
      token,
      utilisateur: {
        id: utilisateur.id,
        nom: utilisateur.nom,
        email: utilisateur.email,
        role: utilisateur.role,
        entreprise: utilisateur.entreprise
      }
    };
  }

  async inscription(donneesUtilisateur: any) {
    // Vérifier si l'email existe déjà
    const utilisateurExistant = await this.prisma.utilisateur.findUnique({
      where: { email: donneesUtilisateur.email }
    });

    if (utilisateurExistant) {
      throw new Error('Un utilisateur avec cet email existe déjà');
    }

    // Hasher le mot de passe
    const motDePasseHache = await bcrypt.hash(donneesUtilisateur.motDePasse, 10);

    // Créer l'utilisateur
    const utilisateur = await this.prisma.utilisateur.create({
      data: {
        ...donneesUtilisateur,
        motDePasse: motDePasseHache
      },
      include: { entreprise: true }
    });

    // Générer le token JWT
    const token = jwt.sign(
      {
        id: utilisateur.id,
        email: utilisateur.email,
        entrepriseId: utilisateur.entrepriseId,
        role: utilisateur.role
      },
      process.env.JWT_SECRET || 'secret-key',
      { expiresIn: '24h' }
    );

    return {
      token,
      utilisateur: {
        id: utilisateur.id,
        nom: utilisateur.nom,
        email: utilisateur.email,
        role: utilisateur.role,
        entreprise: utilisateur.entreprise
      }
    };
  }

  async verifierToken(token: string) {
    try {
      const payload = jwt.verify(token, process.env.JWT_SECRET || 'secret-key') as any;
      
      // Récupérer l'utilisateur complet
      const utilisateur = await this.prisma.utilisateur.findUnique({
        where: { id: payload.id },
        include: { entreprise: true }
      });

      if (!utilisateur) {
        throw new Error('Utilisateur non trouvé');
      }

      return utilisateur;
    } catch (error) {
      throw new Error('Token invalide');
    }
  }

  async changerMotDePasse(utilisateurId: string, ancienMotDePasse: string, nouveauMotDePasse: string) {
    const utilisateur = await this.prisma.utilisateur.findUnique({
      where: { id: utilisateurId }
    });

    if (!utilisateur) {
      throw new Error('Utilisateur non trouvé');
    }

    // Vérifier l'ancien mot de passe
    const ancienMotDePasseValide = await bcrypt.compare(ancienMotDePasse, utilisateur.motDePasse);
    if (!ancienMotDePasseValide) {
      throw new Error('Ancien mot de passe incorrect');
    }

    // Hasher le nouveau mot de passe
    const nouveauMotDePasseHache = await bcrypt.hash(nouveauMotDePasse, 10);

    // Mettre à jour le mot de passe
    return await this.prisma.utilisateur.update({
      where: { id: utilisateurId },
      data: { motDePasse: nouveauMotDePasseHache }
    });
  }
}
