/*
  Warnings:

  - Added the required column `typeCycle` to the `cycles_paie` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable: Ajouter d'abord la colonne avec une valeur par défaut
ALTER TABLE `cycles_paie` ADD COLUMN `typeCycle` ENUM('MENSUEL', 'HEBDOMADAIRE') NOT NULL DEFAULT 'MENSUEL';

-- Mettre à jour les cycles existants (on suppose qu'ils sont mensuels par défaut)
UPDATE `cycles_paie` SET `typeCycle` = 'MENSUEL' WHERE `typeCycle` IS NULL;
