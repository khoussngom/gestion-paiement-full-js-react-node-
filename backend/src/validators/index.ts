import { z } from 'zod';
import { TypeContrat, StatutCyclePaie, ModePaiement } from '@/enums';
import { RoleUtilisateur } from '@prisma/client';
import { MESSAGES_VALIDATION } from '@/enums/messages';

// Validateur pour l'entreprise
export const schemaCreerEntreprise = z.object({
  nom: z.string().min(1, MESSAGES_VALIDATION.NOM_REQUIS),
  adresse: z.string().optional(),
  telephone: z.string().optional(),
  email: z.string().email(MESSAGES_VALIDATION.EMAIL_INVALIDE).optional(),
  logo: z.string().optional(),
  couleurPrimaire: z.string().regex(/^#[0-9A-Fa-f]{6}$/, 'Format de couleur invalide').default('#007BFF'),
  devise: z.string().default('FCFA'),
  typePeriode: z.string().default('MENSUEL')
});

export const schemaModifierEntreprise = schemaCreerEntreprise.partial();

// Validateur pour l'utilisateur
export const schemaCreerUtilisateur = z.object({
  nom: z.string().min(1, MESSAGES_VALIDATION.NOM_REQUIS),
  prenom: z.string().min(1, MESSAGES_VALIDATION.PRENOM_REQUIS),
  email: z.string().email(MESSAGES_VALIDATION.EMAIL_INVALIDE),
  motDePasse: z.string().min(6, MESSAGES_VALIDATION.MOT_DE_PASSE_TROP_COURT),
  role: z.nativeEnum(RoleUtilisateur),
  entrepriseId: z.string().optional()
});

export const schemaConnexion = z.object({
  email: z.string().email(MESSAGES_VALIDATION.EMAIL_INVALIDE),
  motDePasse: z.string().min(1, MESSAGES_VALIDATION.CHAMP_REQUIS)
});

// Schéma de base pour l'employé
const schemaEmployeBase = z.object({
  nomComplet: z.string().min(1, MESSAGES_VALIDATION.NOM_REQUIS),
  poste: z.string().min(1, MESSAGES_VALIDATION.CHAMP_REQUIS),
  typeContrat: z.nativeEnum(TypeContrat),
  tauxSalaireHoraire: z.number().positive(MESSAGES_VALIDATION.MONTANT_POSITIF).optional(),
  salaireFixe: z.number().positive(MESSAGES_VALIDATION.MONTANT_POSITIF).optional(),
  tauxHonoraire: z.number().positive(MESSAGES_VALIDATION.MONTANT_POSITIF).optional(),
  coordonneesBancaires: z.string().optional(),
  telephone: z.string().optional(),
  email: z.string().email(MESSAGES_VALIDATION.EMAIL_INVALIDE).optional(),
  adresse: z.string().optional(),
  entrepriseId: z.string().min(1, MESSAGES_VALIDATION.CHAMP_REQUIS),
  dateEmbauche: z.coerce.date()
});

// Validateur pour créer un employé avec validation conditionnelle
export const schemaCreerEmploye = schemaEmployeBase.refine((data: any) => {
  // Validation conditionnelle selon le type de contrat
  if (data.typeContrat === TypeContrat.SALAIRE_FIXE && !data.salaireFixe) {
    return false;
  }
  if (data.typeContrat === TypeContrat.JOURNALIER && !data.tauxSalaireHoraire) {
    return false;
  }
  if (data.typeContrat === TypeContrat.HONORAIRE && !data.tauxHonoraire) {
    return false;
  }
  return true;
}, {
  message: "Le salaire doit être défini selon le type de contrat"
});

// Validateur pour modifier un employé (sans entrepriseId et optionnel)
export const schemaModifierEmploye = schemaEmployeBase.omit({ entrepriseId: true }).partial();

// Validateur pour les filtres d'employés
export const schemaFiltresEmploye = z.object({
  statut: z.string().optional(),
  poste: z.string().optional(),
  typeContrat: z.nativeEnum(TypeContrat).optional(),
  actif: z.boolean().optional(),
  recherche: z.string().optional()
});

// Schéma de base pour le cycle de paie
const schemaCyclePaieBase = z.object({
  nom: z.string().min(1, MESSAGES_VALIDATION.NOM_REQUIS),
  dateDebut: z.coerce.date(),
  dateFin: z.coerce.date(),
  entrepriseId: z.string().min(1, MESSAGES_VALIDATION.CHAMP_REQUIS)
});

// Validateur pour créer un cycle de paie avec validation conditionnelle
export const schemaCreerCyclePaie = schemaCyclePaieBase.refine((data: any) => data.dateFin > data.dateDebut, {
  message: "La date de fin doit être postérieure à la date de début"
});

// Validateur pour modifier un cycle de paie
export const schemaModifierCyclePaie = schemaCyclePaieBase.omit({ entrepriseId: true }).partial();

// Validateur pour le bulletin de paie
export const schemaCreerBulletinPaie = z.object({
  employeId: z.string().min(1, MESSAGES_VALIDATION.CHAMP_REQUIS),
  cycleId: z.string().min(1, MESSAGES_VALIDATION.CHAMP_REQUIS),
  entrepriseId: z.string().min(1, MESSAGES_VALIDATION.CHAMP_REQUIS),
  salaireBrut: z.number().positive(MESSAGES_VALIDATION.MONTANT_POSITIF),
  deductions: z.number().min(0).default(0),
  joursTravailles: z.number().positive().optional(),
  heuresTravailleurs: z.number().positive().optional()
});

export const schemaModifierBulletinPaie = schemaCreerBulletinPaie.partial().omit({ 
  employeId: true, 
  cycleId: true, 
  entrepriseId: true 
});

// Validateur pour le paiement
export const schemaCreerPaiement = z.object({
  bulletinPaieId: z.string().min(1, MESSAGES_VALIDATION.CHAMP_REQUIS),
  employeId: z.string().min(1, MESSAGES_VALIDATION.CHAMP_REQUIS),
  entrepriseId: z.string().min(1, MESSAGES_VALIDATION.CHAMP_REQUIS),
  utilisateurId: z.string().min(1, MESSAGES_VALIDATION.CHAMP_REQUIS),
  montant: z.number().positive(MESSAGES_VALIDATION.MONTANT_POSITIF),
  modePaiement: z.nativeEnum(ModePaiement),
  reference: z.string().optional(),
  notes: z.string().optional(),
  datePaiement: z.coerce.date().optional()
});

// Types TypeScript dérivés des schémas Zod
export type CreerEntrepriseDto = z.infer<typeof schemaCreerEntreprise>;
export type ModifierEntrepriseDto = z.infer<typeof schemaModifierEntreprise>;
export type CreerUtilisateurDto = z.infer<typeof schemaCreerUtilisateur>;
export type ConnexionDto = z.infer<typeof schemaConnexion>;
export type CreerEmployeDto = z.infer<typeof schemaCreerEmploye>;
export type ModifierEmployeDto = z.infer<typeof schemaModifierEmploye>;
export type FiltresEmployeDto = z.infer<typeof schemaFiltresEmploye>;
export type CreerCyclePaieDto = z.infer<typeof schemaCreerCyclePaie>;
export type ModifierCyclePaieDto = z.infer<typeof schemaModifierCyclePaie>;
export type CreerBulletinPaieDto = z.infer<typeof schemaCreerBulletinPaie>;
export type ModifierBulletinPaieDto = z.infer<typeof schemaModifierBulletinPaie>;
export type CreerPaiementDto = z.infer<typeof schemaCreerPaiement>;
