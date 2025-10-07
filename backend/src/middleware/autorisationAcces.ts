import { Request, Response, NextFunction } from 'express';
import { ServiceAutorisationAcces } from '../services/ServiceAutorisationAcces';
import { AutorisationAccesRepository } from '../repositories/AutorisationAccesRepository';
import { UtilisateurRepository } from '../repositories/UtilisateurRepository';
import { EntrepriseRepository } from '../repositories/EntrepriseRepository';
import { RoleUtilisateur } from '../enums';

/**
 * Middleware qui vérifie si un SuperAdmin a l'autorisation d'accéder à une entreprise
 * Ce middleware doit être utilisé sur les routes qui nécessitent un accès spécifique à une entreprise
 */
export async function middlewareAutorisationEntreprise(req: Request, res: Response, next: NextFunction) {
  try {
    const utilisateur = (req as any).utilisateur;
    
    // Si l'utilisateur n'est pas SuperAdmin, passer au middleware suivant
    // (les autres contrôles d'autorisation se feront dans les contrôleurs)
    if (utilisateur.role !== RoleUtilisateur.SUPER_ADMIN) {
      return next();
    }

    // Extraire l'ID de l'entreprise depuis différentes sources possibles
    let entrepriseId: string | null = null;

    // 1. Paramètre d'URL
    if (req.params.entrepriseId) {
      entrepriseId = req.params.entrepriseId;
    }
    // 2. Query parameter
    else if (req.query.entrepriseId) {
      entrepriseId = req.query.entrepriseId as string;
    }
    // 3. Corps de la requête
    else if (req.body.entrepriseId) {
      entrepriseId = req.body.entrepriseId;
    }
    // 4. Header personnalisé
    else if (req.headers['x-entreprise-id']) {
      entrepriseId = req.headers['x-entreprise-id'] as string;
    }

    // Si aucun ID d'entreprise n'est fourni, on ne peut pas vérifier l'autorisation
    if (!entrepriseId) {
      return res.status(403).json({
        succes: false,
        message: 'Accès refusé - ID d\'entreprise requis pour vérifier l\'autorisation'
      });
    }

    // Initialiser le service d'autorisation
    const autorisationRepository = new AutorisationAccesRepository();
    const utilisateurRepository = new UtilisateurRepository();
    const entrepriseRepository = new EntrepriseRepository();
    
    const serviceAutorisation = new ServiceAutorisationAcces(
      autorisationRepository,
      utilisateurRepository,
      entrepriseRepository
    );

    // Vérifier l'autorisation
    const resultatVerification = await serviceAutorisation.verifierAcces(utilisateur.id, entrepriseId);

    if (!resultatVerification.succes) {
      return res.status(500).json({
        succes: false,
        message: 'Erreur lors de la vérification d\'autorisation'
      });
    }

    const { aAcces, message, autorisation } = resultatVerification.donnees!;

    if (!aAcces) {
      return res.status(403).json({
        succes: false,
        message: message
      });
    }

    // Ajouter les informations d'autorisation à la requête pour les contrôleurs
    (req as any).autorisationAcces = autorisation;
    (req as any).entrepriseAutorisee = entrepriseId;

    console.log(`✅ [AUTORISATION] SuperAdmin ${utilisateur.id} autorisé pour l'entreprise ${entrepriseId}`);
    
    next();

  } catch (error) {
    console.error('❌ [MIDDLEWARE-AUTORISATION] Erreur:', error);
    res.status(500).json({
      succes: false,
      message: 'Erreur interne lors de la vérification d\'autorisation'
    });
  }
}

/**
 * Middleware spécialisé pour les routes avec :entrepriseId
 * Utilise automatiquement le paramètre entrepriseId de l'URL
 */
export function middlewareAutorisationParEntrepriseId(req: Request, res: Response, next: NextFunction) {
  // S'assurer que l'ID d'entreprise est disponible dans les paramètres
  if (!req.params.entrepriseId) {
    return res.status(400).json({
      succes: false,
      message: 'ID d\'entreprise manquant dans l\'URL'
    });
  }

  return middlewareAutorisationEntreprise(req, res, next);
}

/**
 * Factory pour créer un middleware d'autorisation avec un ID d'entreprise fixe
 * Utile pour des routes spécifiques à une entreprise
 */
export function creerMiddlewareAutorisationPourEntreprise(entrepriseId: string) {
  return async (req: Request, res: Response, next: NextFunction) => {
    // Injecter l'ID d'entreprise dans les paramètres de la requête
    req.params.entrepriseId = entrepriseId;
    return middlewareAutorisationEntreprise(req, res, next);
  };
}

/**
 * Middleware pour vérifier que l'utilisateur connecté peut accéder aux données d'une entreprise
 * Logique :
 * - SuperAdmin : doit avoir une autorisation explicite
 * - Admin d'entreprise : peut accéder uniquement à sa propre entreprise
 * - Autres rôles : selon les règles métier définies
 */
export async function middlewareAccesEntreprise(req: Request, res: Response, next: NextFunction) {
  try {
    const utilisateur = (req as any).utilisateur;
    
    // Extraire l'ID de l'entreprise
    let entrepriseId: string | null = null;
    
    if (req.params.entrepriseId) {
      entrepriseId = req.params.entrepriseId;
    } else if (req.body.entrepriseId) {
      entrepriseId = req.body.entrepriseId;
    } else if (req.query.entrepriseId) {
      entrepriseId = req.query.entrepriseId as string;
    }

    if (!entrepriseId) {
      return res.status(400).json({
        succes: false,
        message: 'ID d\'entreprise requis'
      });
    }

    // Vérification selon le rôle
    switch (utilisateur.role) {
      case RoleUtilisateur.SUPER_ADMIN:
        // Pour SuperAdmin, utiliser le middleware d'autorisation
        return middlewareAutorisationEntreprise(req, res, next);

      case RoleUtilisateur.ADMIN_ENTREPRISE:
      case RoleUtilisateur.CAISSIER:
      case RoleUtilisateur.VIGILE:
        // Pour les autres rôles, vérifier qu'ils accèdent à leur propre entreprise
        if (utilisateur.entrepriseId !== entrepriseId) {
          return res.status(403).json({
            succes: false,
            message: 'Vous ne pouvez accéder qu\'aux données de votre entreprise'
          });
        }
        return next();

      default:
        return res.status(403).json({
          succes: false,
          message: 'Rôle non autorisé'
        });
    }

  } catch (error) {
    console.error('❌ [MIDDLEWARE-ACCES-ENTREPRISE] Erreur:', error);
    res.status(500).json({
      succes: false,
      message: 'Erreur interne lors de la vérification d\'accès'
    });
  }
}

/**
 * Middleware pour ajouter automatiquement l'entrepriseId dans les requêtes
 * basé sur le rôle de l'utilisateur connecté
 */
export function middlewareInjectionEntrepriseId(req: Request, res: Response, next: NextFunction) {
  const utilisateur = (req as any).utilisateur;
  
  // Pour les non-SuperAdmin, injecter automatiquement leur entrepriseId
  if (utilisateur.role !== RoleUtilisateur.SUPER_ADMIN && utilisateur.entrepriseId) {
    // Ajouter dans les paramètres si pas déjà présent
    if (!req.params.entrepriseId) {
      req.params.entrepriseId = utilisateur.entrepriseId;
    }
    
    // Ajouter dans le body si pas déjà présent
    if (!req.body.entrepriseId) {
      req.body.entrepriseId = utilisateur.entrepriseId;
    }
  }
  
  next();
}

export default {
  middlewareAutorisationEntreprise,
  middlewareAutorisationParEntrepriseId,
  creerMiddlewareAutorisationPourEntreprise,
  middlewareAccesEntreprise,
  middlewareInjectionEntrepriseId
};