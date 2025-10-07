import { Request } from 'express';
import { RoleUtilisateur } from '@/enums';

/**
 * Utilitaire pour obtenir l'ID de l'entreprise à utiliser dans les opérations.
 * Prend en compte le contexte des super administrateurs qui peuvent accéder à d'autres entreprises
 * via le header x-entreprise-id.
 * 
 * @param req - L'objet Request Express
 * @returns L'ID de l'entreprise à utiliser ou null si non autorisé
 */
export function obtenirEntrepriseId(req: Request): string | null {
  const utilisateur = (req as any).utilisateur; // Cast nécessaire pour accéder aux propriétés étendues
  
  if (!utilisateur) {
    return null;
  }

  // Pour les super administrateurs en mode accès entreprise, utiliser l'entreprise temporaire
  if (utilisateur.originalRole === RoleUtilisateur.SUPER_ADMIN && utilisateur.isSuperAdminAccess && utilisateur.targetEntrepriseId) {
    console.log(`[SuperAdmin temporaire] Utilisation de l'entreprise cible: ${utilisateur.targetEntrepriseId}`);
    return utilisateur.targetEntrepriseId;
  }
  
  // Pour tous les autres utilisateurs
  const entrepriseId = utilisateur.entrepriseId;
  console.log(`[User] Utilisation de l'entreprise de l'utilisateur: ${entrepriseId} - Rôle: ${utilisateur.role}`);
  return entrepriseId || null;
}