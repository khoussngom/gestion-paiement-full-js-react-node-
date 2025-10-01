import { Router } from 'express';
import { UtilisateurRepository } from '@/repositories/UtilisateurRepository';
import { schemaCreerUtilisateur } from '@/validators';
import { MESSAGES_SUCCES, MESSAGES_ERREUR } from '@/enums/messages';
import { RoleUtilisateur } from '@prisma/client';
import bcrypt from 'bcryptjs';

const routeurUtilisateurs = Router();
const utilisateurRepo = new UtilisateurRepository();

// GET /utilisateurs - Obtenir tous les utilisateurs avec filtres
routeurUtilisateurs.get('/', async (req, res) => {
  try {
    const utilisateur = req.utilisateur;
    
    // Les super-admins peuvent voir tous les utilisateurs
    // Les admins d'entreprise peuvent voir seulement les utilisateurs de leur entreprise
    if (utilisateur?.role === 'SUPER_ADMIN') {
      const utilisateurs = await utilisateurRepo.getAll();
      res.status(200).json({
        succes: true,
        donnees: utilisateurs,
        total: utilisateurs.length
      });
    } else if (utilisateur?.role === RoleUtilisateur.ADMIN_ENTREPRISE && utilisateur.entrepriseId) {
      const utilisateurs = await utilisateurRepo.getByEntreprise(utilisateur.entrepriseId);
      res.status(200).json({
        succes: true,
        donnees: utilisateurs,
        total: utilisateurs.length
      });
    } else {
      return res.status(403).json({
        succes: false,
        message: MESSAGES_ERREUR.ACCES_REFUSE
      });
    }
  } catch (error: any) {
    res.status(500).json({
      succes: false,
      message: MESSAGES_ERREUR.ERREUR_SERVEUR,
      erreur: error.message
    });
  }
});

// GET /utilisateurs/:id - Obtenir un utilisateur par ID
routeurUtilisateurs.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const utilisateur = req.utilisateur;
    
    const utilisateurCible = await utilisateurRepo.getById(id);
    
    if (!utilisateurCible) {
      return res.status(404).json({
        succes: false,
        message: "Utilisateur introuvable"
      });
    }

    // Vérifier les permissions
    if (utilisateur?.role !== 'SUPER_ADMIN' && 
        utilisateur?.entrepriseId !== utilisateurCible.entrepriseId) {
      return res.status(403).json({
        succes: false,
        message: MESSAGES_ERREUR.ACCES_REFUSE
      });
    }

    res.status(200).json({
      succes: true,
      donnees: utilisateurCible
    });
  } catch (error: any) {
    res.status(500).json({
      succes: false,
      message: MESSAGES_ERREUR.ERREUR_SERVEUR,
      erreur: error.message
    });
  }
});

// POST /utilisateurs - Créer un nouvel utilisateur
routeurUtilisateurs.post('/', async (req, res) => {
  try {
    const utilisateur = req.utilisateur;
    
    // Vérifier les permissions
    if (utilisateur?.role !== RoleUtilisateur.SUPER_ADMIN && utilisateur?.role !== RoleUtilisateur.ADMIN_ENTREPRISE) {
      return res.status(403).json({
        succes: false,
        message: MESSAGES_ERREUR.ACCES_REFUSE
      });
    }

    const donneesValidees = schemaCreerUtilisateur.parse(req.body);
    
    // Si c'est un admin d'entreprise, forcer l'entrepriseId
    if (utilisateur?.role === RoleUtilisateur.ADMIN_ENTREPRISE) {
      donneesValidees.entrepriseId = utilisateur.entrepriseId;
      // Les admins d'entreprise ne peuvent créer que des caissiers
      if (donneesValidees.role !== 'CAISSIER') {
        return res.status(403).json({
          succes: false,
          message: "Vous ne pouvez créer que des comptes caissiers"
        });
      }
    }

    // Hacher le mot de passe
    const motDePasseHache = await bcrypt.hash(donneesValidees.motDePasse, 10);
    donneesValidees.motDePasse = motDePasseHache;

    const nouvelUtilisateur = await utilisateurRepo.create(donneesValidees);

    // Enlever le mot de passe de la réponse
    const { motDePasse, ...utilisateurSansMotDePasse } = nouvelUtilisateur;

    res.status(201).json({
      succes: true,
      message: MESSAGES_SUCCES.UTILISATEUR_CREE,
      donnees: utilisateurSansMotDePasse
    });
  } catch (error: any) {
    res.status(400).json({
      succes: false,
      message: MESSAGES_ERREUR.DONNEES_INVALIDES,
      erreurs: error.errors || error.message
    });
  }
});

// PUT /utilisateurs/:id - Modifier un utilisateur
routeurUtilisateurs.put('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const utilisateur = req.utilisateur;
    
    const utilisateurCible = await utilisateurRepo.getById(id);
    
    if (!utilisateurCible) {
      return res.status(404).json({
        succes: false,
        message: "Utilisateur introuvable"
      });
    }

    // Vérifier les permissions
    if (utilisateur?.role !== 'SUPER_ADMIN' && 
        utilisateur?.entrepriseId !== utilisateurCible.entrepriseId) {
      return res.status(403).json({
        succes: false,
        message: MESSAGES_ERREUR.ACCES_REFUSE
      });
    }

    const donneesValidees = schemaCreerUtilisateur.partial().parse(req.body);
    
    // Si le mot de passe est fourni, le hacher
    if (donneesValidees.motDePasse) {
      donneesValidees.motDePasse = await bcrypt.hash(donneesValidees.motDePasse, 10);
    }

    const utilisateurModifie = await utilisateurRepo.update(id, donneesValidees);

    // Enlever le mot de passe de la réponse
    const { motDePasse, ...utilisateurSansMotDePasse } = utilisateurModifie;

    res.status(200).json({
      succes: true,
      message: MESSAGES_SUCCES.UTILISATEUR_MODIFIE,
      donnees: utilisateurSansMotDePasse
    });
  } catch (error: any) {
    res.status(400).json({
      succes: false,
      message: MESSAGES_ERREUR.DONNEES_INVALIDES,
      erreurs: error.errors || error.message
    });
  }
});

// DELETE /utilisateurs/:id - Supprimer un utilisateur
routeurUtilisateurs.delete('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const utilisateur = req.utilisateur;
    
    const utilisateurCible = await utilisateurRepo.getById(id);
    
    if (!utilisateurCible) {
      return res.status(404).json({
        succes: false,
        message: "Utilisateur introuvable"
      });
    }

    // Vérifier les permissions
    if (utilisateur?.role !== 'SUPER_ADMIN' && 
        utilisateur?.entrepriseId !== utilisateurCible.entrepriseId) {
      return res.status(403).json({
        succes: false,
        message: MESSAGES_ERREUR.ACCES_REFUSE
      });
    }

    // Empêcher la suppression de son propre compte
    if (utilisateur?.id === id) {
      return res.status(400).json({
        succes: false,
        message: "Vous ne pouvez pas supprimer votre propre compte"
      });
    }

    await utilisateurRepo.delete(id);

    res.status(200).json({
      succes: true,
      message: MESSAGES_SUCCES.UTILISATEUR_SUPPRIME
    });
  } catch (error: any) {
    res.status(500).json({
      succes: false,
      message: MESSAGES_ERREUR.ERREUR_SERVEUR,
      erreur: error.message
    });
  }
});

// PATCH /utilisateurs/:id/toggle-status - Activer/Désactiver un utilisateur
routeurUtilisateurs.patch('/:id/toggle-status', async (req, res) => {
  try {
    const { id } = req.params;
    const utilisateur = req.utilisateur;
    
    const utilisateurCible = await utilisateurRepo.getById(id);
    
    if (!utilisateurCible) {
      return res.status(404).json({
        succes: false,
        message: "Utilisateur introuvable"
      });
    }

    // Vérifier les permissions
    if (utilisateur?.role !== 'SUPER_ADMIN' && 
        utilisateur?.entrepriseId !== utilisateurCible.entrepriseId) {
      return res.status(403).json({
        succes: false,
        message: MESSAGES_ERREUR.ACCES_REFUSE
      });
    }

    const utilisateurModifie = await utilisateurRepo.toggleActive(id, !utilisateurCible.actif);

    res.status(200).json({
      succes: true,
      message: utilisateurModifie.actif ? 'Utilisateur activé' : 'Utilisateur désactivé',
      donnees: utilisateurModifie
    });
  } catch (error: any) {
    res.status(500).json({
      succes: false,
      message: MESSAGES_ERREUR.ERREUR_SERVEUR,
      erreur: error.message
    });
  }
});

// PUT /utilisateurs/:id/password - Changer le mot de passe (admin)
routeurUtilisateurs.put('/:id/password', async (req, res) => {
  try {
    const { id } = req.params;
    const { ancienMotDePasse, nouveauMotDePasse, motDePasse } = req.body;
    const utilisateur = await utilisateurRepo.getById(id);
    
    if (!utilisateur) {
      return res.status(404).json({ succes: false, message: 'Utilisateur introuvable' });
    }

    // Pour la première connexion (doitChangerMotDePasse = true), pas besoin de l'ancien mot de passe
    if (utilisateur.doitChangerMotDePasse && motDePasse) {
      // Première connexion : utiliser motDePasse directement
      const motDePasseHache = await bcrypt.hash(motDePasse, 10);
      await utilisateurRepo.update(id, {
        motDePasse: motDePasseHache,
        doitChangerMotDePasse: false
      });
      
      res.status(200).json({ 
        succes: true, 
        message: 'Mot de passe mis à jour avec succès' 
      });
    } else {
      // Changement normal : vérifier l'ancien mot de passe
      if (!ancienMotDePasse || !nouveauMotDePasse) {
        return res.status(400).json({ 
          succes: false, 
          message: 'Ancien et nouveau mot de passe requis' 
        });
      }
      
      const match = await bcrypt.compare(ancienMotDePasse, utilisateur.motDePasse);
      if (!match) {
        return res.status(400).json({ 
          succes: false, 
          message: 'Ancien mot de passe incorrect' 
        });
      }
      
      const motDePasseHache = await bcrypt.hash(nouveauMotDePasse, 10);
      await utilisateurRepo.update(id, {
        motDePasse: motDePasseHache,
        doitChangerMotDePasse: false
      });
      
      res.status(200).json({ 
        succes: true, 
        message: 'Mot de passe mis à jour avec succès' 
      });
    }
  } catch (error: any) {
    res.status(500).json({ 
      succes: false, 
      message: 'Erreur serveur', 
      erreur: error.message 
    });
  }
});

export default routeurUtilisateurs;
