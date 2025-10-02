-- AlterTable
ALTER TABLE `utilisateurs` MODIFY `role` ENUM('SUPER_ADMIN', 'ADMIN_ENTREPRISE', 'CAISSIER', 'VIGILE') NOT NULL;

-- CreateTable
CREATE TABLE `qr_codes_employes` (
    `id` VARCHAR(191) NOT NULL,
    `employeId` VARCHAR(191) NOT NULL,
    `codeQR` VARCHAR(191) NOT NULL,
    `codeSecret` VARCHAR(191) NOT NULL,
    `dateGeneration` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `dateExpiration` DATETIME(3) NULL,
    `actif` BOOLEAN NOT NULL DEFAULT true,
    `nombreUtilisations` INTEGER NOT NULL DEFAULT 0,
    `derniereUtilisation` DATETIME(3) NULL,

    UNIQUE INDEX `qr_codes_employes_employeId_key`(`employeId`),
    UNIQUE INDEX `qr_codes_employes_codeQR_key`(`codeQR`),
    INDEX `qr_codes_employes_codeQR_idx`(`codeQR`),
    INDEX `qr_codes_employes_employeId_idx`(`employeId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `pointages` (
    `id` VARCHAR(191) NOT NULL,
    `employeId` VARCHAR(191) NOT NULL,
    `entrepriseId` VARCHAR(191) NOT NULL,
    `date` DATE NOT NULL,
    `heureArrivee` DATETIME(3) NULL,
    `heureSortie` DATETIME(3) NULL,
    `typePointage` ENUM('ENTREE', 'SORTIE') NOT NULL,
    `statutPresence` ENUM('PRESENT', 'RETARD', 'ABSENT', 'CONGE', 'MALADIE') NOT NULL DEFAULT 'PRESENT',
    `tempsTraite` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `adresseIP` VARCHAR(191) NULL,
    `userAgent` VARCHAR(191) NULL,
    `notes` VARCHAR(191) NULL,
    `valideParVigile` BOOLEAN NOT NULL DEFAULT false,
    `vigileId` VARCHAR(191) NULL,

    INDEX `pointages_date_idx`(`date`),
    INDEX `pointages_employeId_idx`(`employeId`),
    INDEX `pointages_entrepriseId_idx`(`entrepriseId`),
    INDEX `pointages_statutPresence_idx`(`statutPresence`),
    UNIQUE INDEX `pointages_employeId_date_typePointage_key`(`employeId`, `date`, `typePointage`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `qr_codes_employes` ADD CONSTRAINT `qr_codes_employes_employeId_fkey` FOREIGN KEY (`employeId`) REFERENCES `employes`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `pointages` ADD CONSTRAINT `pointages_employeId_fkey` FOREIGN KEY (`employeId`) REFERENCES `employes`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `pointages` ADD CONSTRAINT `pointages_entrepriseId_fkey` FOREIGN KEY (`entrepriseId`) REFERENCES `entreprises`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `pointages` ADD CONSTRAINT `pointages_vigileId_fkey` FOREIGN KEY (`vigileId`) REFERENCES `utilisateurs`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;
