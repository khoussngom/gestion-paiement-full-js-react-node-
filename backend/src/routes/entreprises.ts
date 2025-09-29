import { Router } from 'express';
import { EntrepriseRepository } from '@/repositories/EntrepriseRepository';
import { UtilisateurRepository } from '@/repositories/UtilisateurRepository';
import { schemaCreerEntreprise } from '@/validators';
import { MESSAGES_SUCCES, MESSAGES_ERREUR } from '@/enums/messages';
import { RoleUtilisateur } from '@prisma/client';
import bcrypt from 'bcryptjs';

const routeurEntreprises = Router();
const entrepriseRepo = new EntrepriseRepository();
const utilisateurRepo = new UtilisateurRepository();

// GET /entreprises - Obtenir toutes les entreprises (Super-Admin seulement)
routeurEntreprises.get('/', async (req, res) => {
  try {
    const utilisateur = req.utilisateur;
    
    // Vérifier que l'utilisateur est un super-admin
    if (utilisateur?.role !== RoleUtilisateur.SUPER_ADMIN) {
      return res.status(403).json({
        succes: false,
        message: MESSAGES_ERREUR.ACCES_REFUSE
      });
    }

    const entreprises = await entrepriseRepo.getAllWithStats();

    res.status(200).json({
      succes: true,
      donnees: entreprises,
      total: entreprises.length
    });
  } catch (error: any) {
    res.status(500).json({
      succes: false,
      message: MESSAGES_ERREUR.ERREUR_SERVEUR,
      erreur: error.message
    });
  }
});

// GET /entreprises/:id - Obtenir une entreprise par ID
routeurEntreprises.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const utilisateur = req.utilisateur;
    
    // Vérifier que l'utilisateur est un super-admin ou admin de cette entreprise
    if (utilisateur?.role !== RoleUtilisateur.SUPER_ADMIN && utilisateur?.entrepriseId !== id) {
      return res.status(403).json({
        succes: false,
        message: MESSAGES_ERREUR.ACCES_REFUSE
      });
    }

    const entreprise = await entrepriseRepo.getById(id);
    
    if (!entreprise) {
      return res.status(404).json({
        succes: false,
        message: "Entreprise introuvable"
      });
    }

    res.status(200).json({
      succes: true,
      donnees: entreprise
    });
  } catch (error: any) {
    res.status(500).json({
      succes: false,
      message: MESSAGES_ERREUR.ERREUR_SERVEUR,
      erreur: error.message
    });
  }
});

// POST /entreprises - Créer une nouvelle entreprise (Super-Admin seulement)
routeurEntreprises.post('/', async (req, res) => {
  try {
    const utilisateur = req.utilisateur;
    
    // Vérifier que l'utilisateur est un super-admin
    if (utilisateur?.role !== RoleUtilisateur.SUPER_ADMIN) {
      return res.status(403).json({
        succes: false,
        message: MESSAGES_ERREUR.ACCES_REFUSE
      });
    }

    const donneesValidees = schemaCreerEntreprise.parse(req.body);
    const nouvelleEntreprise = await entrepriseRepo.create(donneesValidees);

    // Créer automatiquement un admin pour cette entreprise si fourni
    if (req.body.adminEmail && req.body.adminMotDePasse) {
      const motDePasseHache = await bcrypt.hash(req.body.adminMotDePasse, 10);
      
      await utilisateurRepo.create({
        nom: req.body.adminNom || 'Admin',
        prenom: req.body.adminPrenom || 'Entreprise',
        email: req.body.adminEmail,
        motDePasse: motDePasseHache,
        role: RoleUtilisateur.ADMIN_ENTREPRISE,
        entrepriseId: nouvelleEntreprise.id
      });
    }

    res.status(201).json({
      succes: true,
      message: MESSAGES_SUCCES.ENTREPRISE_CREEE,
      donnees: nouvelleEntreprise
    });
  } catch (error: any) {
    res.status(400).json({
      succes: false,
      message: MESSAGES_ERREUR.DONNEES_INVALIDES,
      erreurs: error.errors || error.message
    });
  }
});

// PUT /entreprises/:id - Modifier une entreprise
routeurEntreprises.put('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const utilisateur = req.utilisateur;
    
    // Vérifier que l'utilisateur est un super-admin ou admin de cette entreprise
    if (utilisateur?.role !== RoleUtilisateur.SUPER_ADMIN && utilisateur?.entrepriseId !== id) {
      return res.status(403).json({
        succes: false,
        message: MESSAGES_ERREUR.ACCES_REFUSE
      });
    }

    const donneesValidees = schemaCreerEntreprise.partial().parse(req.body);
    const entrepriseModifiee = await entrepriseRepo.update(id, donneesValidees);

    res.status(200).json({
      succes: true,
      message: MESSAGES_SUCCES.ENTREPRISE_MODIFIEE,
      donnees: entrepriseModifiee
    });
  } catch (error: any) {
    res.status(400).json({
      succes: false,
      message: MESSAGES_ERREUR.DONNEES_INVALIDES,
      erreurs: error.errors || error.message
    });
  }
});

// DELETE /entreprises/:id - Supprimer une entreprise (Super-Admin seulement)
routeurEntreprises.delete('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const utilisateur = req.utilisateur;
    
    // Vérifier que l'utilisateur est un super-admin
    if (utilisateur?.role !== RoleUtilisateur.SUPER_ADMIN) {
      return res.status(403).json({
        succes: false,
        message: MESSAGES_ERREUR.ACCES_REFUSE
      });
    }

    await entrepriseRepo.delete(id);

    res.status(200).json({
      succes: true,
      message: MESSAGES_SUCCES.ENTREPRISE_SUPPRIMEE
    });
  } catch (error: any) {
    res.status(500).json({
      succes: false,
      message: MESSAGES_ERREUR.ERREUR_SERVEUR,
      erreur: error.message
    });
  }
});

// GET /entreprises/:id/dashboard - Obtenir les stats d'une entreprise (Super-Admin)
routeurEntreprises.get('/:id/dashboard', async (req, res) => {
  try {
    const { id } = req.params;
    const utilisateur = req.utilisateur;
    
    // Vérifier que l'utilisateur est un super-admin
    if (utilisateur?.role !== RoleUtilisateur.SUPER_ADMIN) {
      return res.status(403).json({
        succes: false,
        message: MESSAGES_ERREUR.ACCES_REFUSE
      });
    }

    const { ServiceDashboard } = await import('@/services/ServiceDashboard');
    const serviceDashboard = new ServiceDashboard();
    
    const statistiques = await serviceDashboard.obtenirStatistiquesCompletes(id);

    res.status(200).json({
      succes: true,
      donnees: statistiques
    });
  } catch (error: any) {
    res.status(500).json({
      succes: false,
      message: MESSAGES_ERREUR.ERREUR_SERVEUR,
      erreur: error.message
    });
  }
});

export default routeurEntreprises;
