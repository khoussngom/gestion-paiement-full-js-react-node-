export enum TypeContrat {
  JOURNALIER = 'JOURNALIER',
  SALAIRE_FIXE = 'SALAIRE_FIXE',
  HONORAIRE = 'HONORAIRE'
}

export enum RoleUtilisateur {
  SUPER_ADMIN = 'SUPER_ADMIN',
  ADMIN_ENTREPRISE = 'ADMIN_ENTREPRISE',
  CAISSIER = 'CAISSIER',
  VIGILE = 'VIGILE'
}

export enum TypeCyclePaie {
  MENSUEL = 'MENSUEL',
  HEBDOMADAIRE = 'HEBDOMADAIRE'
}

export enum StatutCyclePaie {
  BROUILLON = 'BROUILLON',
  APPROUVE = 'APPROUVE',
  CLOTURE = 'CLOTURE'
}

export enum StatutBulletinPaie {
  EN_ATTENTE = 'EN_ATTENTE',
  PARTIEL = 'PARTIEL',
  PAYE = 'PAYE'
}

export enum ModePaiement {
  ESPECES = 'ESPECES',
  VIREMENT_BANCAIRE = 'VIREMENT_BANCAIRE',
  ORANGE_MONEY = 'ORANGE_MONEY',
  WAVE = 'WAVE',
  KKIAPAY = 'KKIAPAY',
  AUTRE = 'AUTRE'
}

export enum TypePeriode {
  MENSUEL = 'MENSUEL',
  HEBDOMADAIRE = 'HEBDOMADAIRE',
  JOURNALIER = 'JOURNALIER'
}

export enum StatutPresence {
  PRESENT = 'PRESENT',
  RETARD = 'RETARD',
  ABSENT = 'ABSENT',
  CONGE = 'CONGE',
  MALADIE = 'MALADIE'
}

export enum TypePointage {
  ENTREE = 'ENTREE',
  SORTIE = 'SORTIE'
}
