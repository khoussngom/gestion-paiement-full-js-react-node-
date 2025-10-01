import { Router } from 'express';
import multer from 'multer';
import path from 'path';
import fs from 'fs';
import { EntrepriseRepository } from '@/repositories/EntrepriseRepository';
import { UtilisateurRepository } from '@/repositories/UtilisateurRepository';
import { schemaCreerEntreprise } from '@/validators';
import { MESSAGES_SUCCES, MESSAGES_ERREUR } from '@/enums/messages';
import { RoleUtilisateur } from '@prisma/client';
import bcrypt from 'bcryptjs';
import { sendAdminWelcomeMail } from '@/services/mailService';

const routeurEntreprises = Router();
const entrepriseRepo = new EntrepriseRepository();
const utilisateurRepo = new UtilisateurRepository();

// Configuration de multer pour l'upload de logos
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const uploadPath = path.join(__dirname, '../../uploads/logos');
    // Créer le dossier s'il n'existe pas
    if (!fs.existsSync(uploadPath)) {
      fs.mkdirSync(uploadPath, { recursive: true });
    }
    cb(null, uploadPath);
  },
  filename: (req, file, cb) => {
    // Générer un nom unique avec timestamp
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    const extension = path.extname(file.originalname);
    cb(null, `logo-${uniqueSuffix}${extension}`);
  }
});

const fileFilter = (req: any, file: any, cb: any) => {
  // Accepter seulement les images
  if (file.mimetype.startsWith('image/')) {
    cb(null, true);
  } else {
    cb(new Error('Seuls les fichiers image sont autorisés'), false);
  }
};

const upload = multer({
  storage: storage,
  fileFilter: fileFilter,
  limits: {
    fileSize: 5 * 1024 * 1024 // 5MB max
  }
});

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

    console.log('🔍 [VALIDATION] Tentative validation des données...');
    const donneesValidees = schemaCreerEntreprise.parse(req.body);
    console.log('✅ [VALIDATION] Données validées avec succès:', donneesValidees);
    
    console.log('🏗️ [CREATION] Création entreprise en cours...');
    const nouvelleEntreprise = await entrepriseRepo.create(donneesValidees);
    console.log('✅ [CREATION] Entreprise créée avec succès:', nouvelleEntreprise.id, nouvelleEntreprise.nom);

    console.log('🏢 [ENTREPRISE CREATION] Données reçues:', req.body);

    let motDePasseAdmin = req.body.adminMotDePasse;
    // Créer automatiquement un admin pour cette entreprise si fourni
    if (req.body.adminEmail && motDePasseAdmin) {
      console.log('👤 [ADMIN CREATION] Création admin pour entreprise:', nouvelleEntreprise.nom);
      console.log('👤 [ADMIN CREATION] Email admin:', req.body.adminEmail);
      
      const motDePasseHache = await bcrypt.hash(motDePasseAdmin, 10);
      const nouvelAdmin = await utilisateurRepo.create({
        nom: req.body.adminNom || 'Admin',
        prenom: req.body.adminPrenom || 'Entreprise',
        email: req.body.adminEmail,
        motDePasse: motDePasseHache,
        role: RoleUtilisateur.ADMIN_ENTREPRISE,
        entrepriseId: nouvelleEntreprise.id,
        doitChangerMotDePasse: true
      });
      
      console.log('✅ [ADMIN CREATION] Admin créé avec ID:', nouvelAdmin.id);
      
      // Envoi de l'email à l'admin
      try {
        console.log('📧 [EMAIL TRIGGER] Déclenchement envoi email à:', req.body.adminEmail);
        await sendAdminWelcomeMail({
          to: req.body.adminEmail,
          nomEntreprise: nouvelleEntreprise.nom,
          emailAdmin: req.body.adminEmail,
          motDePasse: motDePasseAdmin
        });
        console.log('✅ [EMAIL TRIGGER] Email envoyé avec succès');
      } catch (err) {
        console.error('❌ [EMAIL TRIGGER] Erreur envoi email admin:', err);
      }
    } else {
      console.log('⚠️ [ADMIN CREATION] Pas d\'admin à créer - email ou mot de passe manquant');
    }

    res.status(201).json({
      succes: true,
      message: MESSAGES_SUCCES.ENTREPRISE_CREEE,
      donnees: {
        entreprise: nouvelleEntreprise,
        adminCreated: req.body.adminEmail ? {
          email: req.body.adminEmail,
          tempPassword: motDePasseAdmin,
          needsPasswordChange: true
        } : null
      }
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

// POST /entreprises/logo - Télécharger un logo
routeurEntreprises.post('/logo', upload.single('logo'), async (req, res) => {
  try {
    const utilisateur = req.utilisateur;
    console.log('📁 Upload logo - Utilisateur:', utilisateur?.id, 'Entreprise:', utilisateur?.entrepriseId);
    
    if (!req.file) {
      return res.status(400).json({
        succes: false,
        message: 'Aucun fichier fourni'
      });
    }

    if (!utilisateur?.entrepriseId) {
      console.log('❌ Upload logo - Pas d\'entreprise associée');
      return res.status(404).json({
        succes: false,
        message: 'Entreprise non trouvée'
      });
    }

    // Récupérer l'entreprise actuelle pour supprimer l'ancien logo
    const entrepriseActuelle = await entrepriseRepo.getById(utilisateur.entrepriseId);
    
    // Supprimer l'ancien logo s'il existe
    if (entrepriseActuelle?.logo) {
      const oldLogoPath = path.join(__dirname, '../../uploads/logos', path.basename(entrepriseActuelle.logo));
      if (fs.existsSync(oldLogoPath)) {
        fs.unlinkSync(oldLogoPath);
      }
    }

    // Construire l'URL du nouveau logo
    const logoUrl = `http://localhost:3001/uploads/logos/${req.file.filename}`;
    console.log('🔗 Upload logo - URL générée:', logoUrl);

    // Mettre à jour l'entreprise avec le nouveau logo
    console.log('💾 Upload logo - Mise à jour de l\'entreprise:', utilisateur.entrepriseId);
    const entrepriseUpdated = await entrepriseRepo.updateLogo(utilisateur.entrepriseId, logoUrl);
    console.log('✅ Upload logo - Entreprise mise à jour:', entrepriseUpdated.logo);

    res.json({
      succes: true,
      message: 'Logo téléchargé avec succès',
      donnees: {
        logoUrl: logoUrl
      }
    });

  } catch (error: any) {
    console.error('Erreur upload logo:', error);
    
    // Supprimer le fichier en cas d'erreur
    if (req.file) {
      const filePath = req.file.path;
      if (fs.existsSync(filePath)) {
        fs.unlinkSync(filePath);
      }
    }

    res.status(500).json({
      succes: false,
      message: 'Erreur lors du téléchargement du logo'
    });
  }
});

// DELETE /entreprises/:id/logo - Supprimer un logo
routeurEntreprises.delete('/:id/logo', async (req, res) => {
  try {
    const utilisateur = req.utilisateur;
    const entrepriseId = req.params.id;

    // Vérifier les droits d'accès
    if (utilisateur?.role !== RoleUtilisateur.SUPER_ADMIN && utilisateur?.entrepriseId !== entrepriseId) {
      return res.status(403).json({
        succes: false,
        message: MESSAGES_ERREUR.ACCES_REFUSE
      });
    }

    // Récupérer l'entreprise
    const entreprise = await entrepriseRepo.getById(entrepriseId);

    if (!entreprise) {
      return res.status(404).json({
        succes: false,
        message: 'Entreprise non trouvée'
      });
    }

    // Supprimer le fichier logo s'il existe
    if (entreprise.logo) {
      const logoPath = path.join(__dirname, '../../uploads/logos', path.basename(entreprise.logo));
      if (fs.existsSync(logoPath)) {
        fs.unlinkSync(logoPath);
      }
    }

        // Mettre à jour l'entreprise pour supprimer le logo
    await entrepriseRepo.removeLogo(entrepriseId);

    res.json({
      succes: true,
      message: 'Logo supprimé avec succès'
    });

  } catch (error: any) {
    console.error('Erreur suppression logo:', error);
    res.status(500).json({
      succes: false,
      message: 'Erreur lors de la suppression du logo'
    });
  }
});

export default routeurEntreprises;
