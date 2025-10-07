-- CreateTable
CREATE TABLE `autorisations_acces` (
    `id` VARCHAR(191) NOT NULL,
    `entrepriseId` VARCHAR(191) NOT NULL,
    `superAdminId` VARCHAR(191) NOT NULL,
    `adminId` VARCHAR(191) NOT NULL,
    `dateCreation` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `dateExpiration` DATETIME(3) NOT NULL,
    `estActif` BOOLEAN NOT NULL DEFAULT true,
    `raisonAcces` VARCHAR(191) NULL,
    `dateDesactivation` DATETIME(3) NULL,

    INDEX `autorisations_acces_entrepriseId_idx`(`entrepriseId`),
    INDEX `autorisations_acces_superAdminId_idx`(`superAdminId`),
    INDEX `autorisations_acces_adminId_idx`(`adminId`),
    INDEX `autorisations_acces_dateExpiration_idx`(`dateExpiration`),
    INDEX `autorisations_acces_estActif_idx`(`estActif`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `autorisations_acces` ADD CONSTRAINT `autorisations_acces_entrepriseId_fkey` FOREIGN KEY (`entrepriseId`) REFERENCES `entreprises`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `autorisations_acces` ADD CONSTRAINT `autorisations_acces_superAdminId_fkey` FOREIGN KEY (`superAdminId`) REFERENCES `utilisateurs`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `autorisations_acces` ADD CONSTRAINT `autorisations_acces_adminId_fkey` FOREIGN KEY (`adminId`) REFERENCES `utilisateurs`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;
