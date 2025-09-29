/*
  Warnings:

  - The values [ADMIN] on the enum `utilisateurs_role` will be removed. If these variants are still used in the database, this will fail.

*/
-- AlterTable
ALTER TABLE `entreprises` ADD COLUMN `secteurActivite` VARCHAR(191) NULL;

-- AlterTable
ALTER TABLE `utilisateurs` MODIFY `role` ENUM('SUPER_ADMIN', 'ADMIN_ENTREPRISE', 'CAISSIER') NOT NULL;

-- CreateTable
CREATE TABLE `demandes_acces` (
    `id` VARCHAR(191) NOT NULL,
    `nomEntreprise` VARCHAR(191) NOT NULL,
    `nomResponsable` VARCHAR(191) NOT NULL,
    `email` VARCHAR(191) NOT NULL,
    `telephone` VARCHAR(191) NOT NULL,
    `secteurActivite` VARCHAR(191) NOT NULL,
    `nombreEmployes` VARCHAR(191) NOT NULL,
    `message` VARCHAR(191) NULL,
    `statut` ENUM('EN_ATTENTE', 'ACCEPTEE', 'REJETEE') NOT NULL DEFAULT 'EN_ATTENTE',
    `dateCreation` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `dateTraitement` DATETIME(3) NULL,
    `traitePar` VARCHAR(191) NULL,
    `motifRejet` VARCHAR(191) NULL,
    `motDePasseTemporaire` VARCHAR(191) NULL,
    `entrepriseCreeeId` VARCHAR(191) NULL,

    UNIQUE INDEX `demandes_acces_entrepriseCreeeId_key`(`entrepriseCreeeId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `demandes_acces` ADD CONSTRAINT `demandes_acces_entrepriseCreeeId_fkey` FOREIGN KEY (`entrepriseCreeeId`) REFERENCES `entreprises`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;
