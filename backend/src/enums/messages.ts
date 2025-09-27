export const MESSAGES_SUCCES = {
  // Authentification
  CONNEXION_REUSSIE: 'Connexion réussie',
  DECONNEXION_REUSSIE: 'Déconnexion réussie',
  
  // Entreprises
  ENTREPRISE_CREEE: 'Entreprise créée avec succès',
  ENTREPRISE_MODIFIEE: 'Entreprise modifiée avec succès',
  ENTREPRISE_SUPPRIMEE: 'Entreprise supprimée avec succès',
  
  // Employés
  EMPLOYE_CREE: 'Employé créé avec succès',
  EMPLOYE_MODIFIE: 'Employé modifié avec succès',
  EMPLOYE_SUPPRIME: 'Employé supprimé avec succès',
  EMPLOYE_ACTIVE: 'Employé activé avec succès',
  EMPLOYE_DESACTIVE: 'Employé désactivé avec succès',
  
  // Cycles de paie
  CYCLE_PAIE_CREE: 'Cycle de paie créé avec succès',
  CYCLE_PAIE_MODIFIE: 'Cycle de paie modifié avec succès',
  CYCLE_PAIE_APPROUVE: 'Cycle de paie approuvé avec succès',
  CYCLE_PAIE_CLOTURE: 'Cycle de paie clôturé avec succès',
  
  // Bulletins de paie
  BULLETINS_GENERES: 'Bulletins de paie générés avec succès',
  BULLETIN_MODIFIE: 'Bulletin de paie modifié avec succès',
  
  // Paiements
  PAIEMENT_ENREGISTRE: 'Paiement enregistré avec succès',
  RECU_GENERE: 'Reçu généré avec succès',
  
  // Documents
  DOCUMENT_GENERE: 'Document généré avec succès'
} as const;

export const MESSAGES_ERREUR = {
  // Authentification
  IDENTIFIANTS_INVALIDES: 'Email ou mot de passe incorrect',
  TOKEN_INVALIDE: 'Token d\'authentification invalide',
  TOKEN_EXPIRE: 'Token d\'authentification expiré',
  ACCES_REFUSE: 'Accès refusé',
  UTILISATEUR_INEXISTANT: 'Utilisateur inexistant',
  EMAIL_DEJA_UTILISE: 'Cet email est déjà utilisé',
  
  // Général
  DONNEES_INVALIDES: 'Données invalides',
  ELEMENT_INTROUVABLE: 'Élément introuvable',
  ERREUR_SERVEUR: 'Erreur interne du serveur',
  PARAMETRES_MANQUANTS: 'Paramètres manquants',
  
  // Entreprises
  ENTREPRISE_INTROUVABLE: 'Entreprise introuvable',
  ENTREPRISE_DEJA_EXISTANTE: 'Une entreprise avec ce nom existe déjà',
  
  // Employés
  EMPLOYE_INTROUVABLE: 'Employé introuvable',
  EMPLOYE_DEJA_EXISTANT: 'Un employé avec ce nom existe déjà',
  EMPLOYE_INACTIF: 'Cet employé est inactif',
  
  // Cycles de paie
  CYCLE_PAIE_INTROUVABLE: 'Cycle de paie introuvable',
  CYCLE_PAIE_DEJA_APPROUVE: 'Ce cycle de paie est déjà approuvé',
  CYCLE_PAIE_DEJA_CLOTURE: 'Ce cycle de paie est déjà clôturé',
  CYCLE_PAIE_NON_MODIFIABLE: 'Ce cycle de paie n\'est plus modifiable',
  
  // Bulletins de paie
  BULLETIN_PAIE_INTROUVABLE: 'Bulletin de paie introuvable',
  BULLETIN_PAIE_DEJA_PAYE: 'Ce bulletin de paie est déjà payé',
  BULLETIN_PAIE_NON_MODIFIABLE: 'Ce bulletin de paie n\'est plus modifiable',
  
  // Paiements
  MONTANT_INVALIDE: 'Montant de paiement invalide',
  MONTANT_SUPERIEUR_SOLDE: 'Le montant dépasse le solde restant',
  MODE_PAIEMENT_INVALIDE: 'Mode de paiement invalide',
  
  // Permissions
  PERMISSION_INSUFFISANTE: 'Permissions insuffisantes',
  ENTREPRISE_NON_AUTORISEE: 'Accès à cette entreprise non autorisé'
} as const;

export const MESSAGES_VALIDATION = {
  EMAIL_INVALIDE: 'Format d\'email invalide',
  MOT_DE_PASSE_TROP_COURT: 'Le mot de passe doit contenir au moins 6 caractères',
  NOM_REQUIS: 'Le nom est requis',
  PRENOM_REQUIS: 'Le prénom est requis',
  TELEPHONE_INVALIDE: 'Format de téléphone invalide',
  MONTANT_POSITIF: 'Le montant doit être positif',
  DATE_INVALIDE: 'Format de date invalide',
  CHAMP_REQUIS: 'Ce champ est requis'
} as const;
