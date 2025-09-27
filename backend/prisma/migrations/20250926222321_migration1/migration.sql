-- CreateTable
CREATE TABLE `entreprises` (
    `id` VARCHAR(191) NOT NULL,
    `nom` VARCHAR(191) NOT NULL,
    `adresse` VARCHAR(191) NULL,
    `telephone` VARCHAR(191) NULL,
    `email` VARCHAR(191) NULL,
    `logo` VARCHAR(191) NULL,
    `devise` VARCHAR(191) NOT NULL DEFAULT 'FCFA',
    `typePeriode` VARCHAR(191) NOT NULL DEFAULT 'MENSUEL',
    `dateCreation` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `dateModification` DATETIME(3) NOT NULL,
    `actif` BOOLEAN NOT NULL DEFAULT true,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `utilisateurs` (
    `id` VARCHAR(191) NOT NULL,
    `nom` VARCHAR(191) NOT NULL,
    `prenom` VARCHAR(191) NOT NULL,
    `email` VARCHAR(191) NOT NULL,
    `motDePasse` VARCHAR(191) NOT NULL,
    `role` ENUM('SUPER_ADMIN', 'ADMIN', 'CAISSIER') NOT NULL,
    `entrepriseId` VARCHAR(191) NULL,
    `dateCreation` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `dateModification` DATETIME(3) NOT NULL,
    `actif` BOOLEAN NOT NULL DEFAULT true,

    UNIQUE INDEX `utilisateurs_email_key`(`email`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `employes` (
    `id` VARCHAR(191) NOT NULL,
    `nomComplet` VARCHAR(191) NOT NULL,
    `poste` VARCHAR(191) NOT NULL,
    `typeContrat` ENUM('JOURNALIER', 'SALAIRE_FIXE', 'HONORAIRE') NOT NULL,
    `tauxSalaireHoraire` DECIMAL(65, 30) NULL,
    `salaireFixe` DECIMAL(65, 30) NULL,
    `tauxHonoraire` DECIMAL(65, 30) NULL,
    `coordonneesBancaires` VARCHAR(191) NULL,
    `telephone` VARCHAR(191) NULL,
    `email` VARCHAR(191) NULL,
    `adresse` VARCHAR(191) NULL,
    `entrepriseId` VARCHAR(191) NOT NULL,
    `dateEmbauche` DATETIME(3) NOT NULL,
    `dateCreation` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `dateModification` DATETIME(3) NOT NULL,
    `actif` BOOLEAN NOT NULL DEFAULT true,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `cycles_paie` (
    `id` VARCHAR(191) NOT NULL,
    `nom` VARCHAR(191) NOT NULL,
    `dateDebut` DATETIME(3) NOT NULL,
    `dateFin` DATETIME(3) NOT NULL,
    `statut` ENUM('BROUILLON', 'APPROUVE', 'CLOTURE') NOT NULL DEFAULT 'BROUILLON',
    `entrepriseId` VARCHAR(191) NOT NULL,
    `dateCreation` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `dateModification` DATETIME(3) NOT NULL,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `bulletins_paie` (
    `id` VARCHAR(191) NOT NULL,
    `employeId` VARCHAR(191) NOT NULL,
    `cycleId` VARCHAR(191) NOT NULL,
    `entrepriseId` VARCHAR(191) NOT NULL,
    `salaireBrut` DECIMAL(65, 30) NOT NULL,
    `deductions` DECIMAL(65, 30) NOT NULL DEFAULT 0,
    `salaireNet` DECIMAL(65, 30) NOT NULL,
    `joursTravailles` INTEGER NULL,
    `heuresTravailleurs` INTEGER NULL,
    `statut` ENUM('EN_ATTENTE', 'PARTIEL', 'PAYE') NOT NULL DEFAULT 'EN_ATTENTE',
    `dateCreation` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `dateModification` DATETIME(3) NOT NULL,

    UNIQUE INDEX `bulletins_paie_employeId_cycleId_key`(`employeId`, `cycleId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `paiements` (
    `id` VARCHAR(191) NOT NULL,
    `bulletinPaieId` VARCHAR(191) NOT NULL,
    `employeId` VARCHAR(191) NOT NULL,
    `entrepriseId` VARCHAR(191) NOT NULL,
    `utilisateurId` VARCHAR(191) NOT NULL,
    `montant` DECIMAL(65, 30) NOT NULL,
    `modePaiement` ENUM('ESPECES', 'VIREMENT_BANCAIRE', 'ORANGE_MONEY', 'WAVE', 'AUTRE') NOT NULL,
    `reference` VARCHAR(191) NULL,
    `notes` VARCHAR(191) NULL,
    `datePaiement` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `dateCreation` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `utilisateurs` ADD CONSTRAINT `utilisateurs_entrepriseId_fkey` FOREIGN KEY (`entrepriseId`) REFERENCES `entreprises`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `employes` ADD CONSTRAINT `employes_entrepriseId_fkey` FOREIGN KEY (`entrepriseId`) REFERENCES `entreprises`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `cycles_paie` ADD CONSTRAINT `cycles_paie_entrepriseId_fkey` FOREIGN KEY (`entrepriseId`) REFERENCES `entreprises`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `bulletins_paie` ADD CONSTRAINT `bulletins_paie_employeId_fkey` FOREIGN KEY (`employeId`) REFERENCES `employes`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `bulletins_paie` ADD CONSTRAINT `bulletins_paie_cycleId_fkey` FOREIGN KEY (`cycleId`) REFERENCES `cycles_paie`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `bulletins_paie` ADD CONSTRAINT `bulletins_paie_entrepriseId_fkey` FOREIGN KEY (`entrepriseId`) REFERENCES `entreprises`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `paiements` ADD CONSTRAINT `paiements_bulletinPaieId_fkey` FOREIGN KEY (`bulletinPaieId`) REFERENCES `bulletins_paie`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `paiements` ADD CONSTRAINT `paiements_employeId_fkey` FOREIGN KEY (`employeId`) REFERENCES `employes`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `paiements` ADD CONSTRAINT `paiements_entrepriseId_fkey` FOREIGN KEY (`entrepriseId`) REFERENCES `entreprises`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `paiements` ADD CONSTRAINT `paiements_utilisateurId_fkey` FOREIGN KEY (`utilisateurId`) REFERENCES `utilisateurs`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;
