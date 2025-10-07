import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { MESSAGES_ERREUR } from '@/enums/messages';
import { RoleUtilisateur } from '@/enums';

// Étendre l'interface Request pour inclure l'utilisateur
declare global {
  namespace Express {
    interface Request {
      utilisateur?: {
        id: string;
        email: string;
        role: RoleUtilisateur;
        entrepriseId?: string;
      };
    }
  }
}

export const middlewareAuthentification = (req: Request, res: Response, next: NextFunction) => {
  try {
    const authHeader = req.headers.authorization;
    
    if (!authHeader) {
      return res.status(401).json({
        succes: false,
        message: MESSAGES_ERREUR.TOKEN_INVALIDE
      });
    }

    const token = authHeader.split(' ')[1];

    if (!token) {
      return res.status(401).json({
        succes: false,
        message: MESSAGES_ERREUR.TOKEN_INVALIDE
      });
    }

    const payload = jwt.verify(token, process.env.JWT_SECRET || 'secret-key') as any;
    
    const utilisateur: any = {
      id: payload.id,
      nom: payload.nom,
      prenom: payload.prenom,
      email: payload.email,
      role: payload.role,
      entrepriseId: payload.entrepriseId
    };

    // Gestion du contexte SuperAdmin avec accès entreprise
    if (payload.role === 'SUPER_ADMIN') {
      const targetEntrepriseId = req.headers['x-entreprise-id'] as string;
      if (targetEntrepriseId) {
        utilisateur.isSuperAdminAccess = true;
        utilisateur.targetEntrepriseId = targetEntrepriseId;
        console.log('🔧 SuperAdmin accès entreprise détecté - ID cible:', targetEntrepriseId);
      }
    }

    (req as any).utilisateur = utilisateur;    next();
  } catch (error) {
    return res.status(401).json({
      succes: false,
      message: MESSAGES_ERREUR.TOKEN_EXPIRE
    });
  }
};

// Middleware pour vérifier les rôles
export const middlewareRole = (rolesAutorises: RoleUtilisateur[]) => {
  return (req: Request, res: Response, next: NextFunction) => {
    if (!req.utilisateur) {
      return res.status(401).json({
        succes: false,
        message: MESSAGES_ERREUR.TOKEN_INVALIDE
      });
    }

    if (!rolesAutorises.includes(req.utilisateur.role)) {
      return res.status(403).json({
        succes: false,
        message: MESSAGES_ERREUR.PERMISSION_INSUFFISANTE
      });
    }

    next();
  };
};

// Middleware pour vérifier si l'utilisateur peut gérer l'entreprise
export const middlewareEntreprise = (req: Request, res: Response, next: NextFunction) => {
  if (!req.utilisateur) {
    return res.status(401).json({
      succes: false,
      message: MESSAGES_ERREUR.TOKEN_INVALIDE
    });
  }

  // Super-admin peut accéder à toutes les entreprises
  if (req.utilisateur.role === RoleUtilisateur.SUPER_ADMIN) {
    return next();
  }

  // Vérifier si l'utilisateur appartient à l'entreprise
  const entrepriseId = req.params.entrepriseId || req.body.entrepriseId || req.query.entrepriseId;
  
  if (entrepriseId && req.utilisateur.entrepriseId !== entrepriseId) {
    return res.status(403).json({
      succes: false,
      message: MESSAGES_ERREUR.ENTREPRISE_NON_AUTORISEE
    });
  }

  next();
};

// Middleware pour les permissions de paiement
export const middlewarePaiement = (req: Request, res: Response, next: NextFunction) => {
  if (!req.utilisateur) {
    return res.status(401).json({
      succes: false,
      message: MESSAGES_ERREUR.TOKEN_INVALIDE
    });
  }

  const rolesAutorises = [RoleUtilisateur.ADMIN_ENTREPRISE, RoleUtilisateur.CAISSIER];
  
  if (!rolesAutorises.includes(req.utilisateur.role)) {
    return res.status(403).json({
      succes: false,
      message: MESSAGES_ERREUR.PERMISSION_INSUFFISANTE
    });
  }

  next();
};

// Middleware pour les permissions d'administration
export const middlewareAdmin = middlewareRole([RoleUtilisateur.ADMIN_ENTREPRISE, RoleUtilisateur.SUPER_ADMIN]);

// Middleware pour les super-administrateurs uniquement
export const middlewareSuperAdmin = middlewareRole([RoleUtilisateur.SUPER_ADMIN]);
