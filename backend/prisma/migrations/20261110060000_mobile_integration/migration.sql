-- AlterTable
ALTER TABLE `users` ADD COLUMN `employeeDetails` JSON NULL,
    ADD COLUMN `notificationPreferences` JSON NULL;

-- AlterTable
ALTER TABLE `addresses` ADD COLUMN `isDefault` BOOLEAN NOT NULL DEFAULT false;

-- AlterTable
ALTER TABLE `service_requests` ADD COLUMN `submissionKey` VARCHAR(150) NULL,
    ADD COLUMN `uiDetails` JSON NULL;

-- AlterTable
ALTER TABLE `quotes` ADD COLUMN `notes` TEXT NULL,
    ADD COLUMN `proposedEnd` DATETIME(3) NULL,
    ADD COLUMN `proposedStart` DATETIME(3) NULL,
    ADD COLUMN `requiresAfterPhotos` BOOLEAN NOT NULL DEFAULT false,
    ADD COLUMN `requiresBeforePhotos` BOOLEAN NOT NULL DEFAULT false;

-- AlterTable
ALTER TABLE `missions` ADD COLUMN `incident` TEXT NULL,
    ADD COLUMN `report` TEXT NULL;

-- AlterTable
ALTER TABLE `mission_checklist_items` ADD COLUMN `note` VARCHAR(500) NULL;

-- CreateTable
CREATE TABLE `SupportTicket` (
    `id` CHAR(36) NOT NULL,
    `ownerId` CHAR(36) NOT NULL,
    `author` VARCHAR(210) NOT NULL,
    `role` ENUM('CLIENT', 'EMPLOYEE', 'ADMIN') NOT NULL,
    `subject` VARCHAR(150) NOT NULL,
    `message` TEXT NOT NULL,
    `reference` VARCHAR(150) NULL,
    `reply` TEXT NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    INDEX `SupportTicket_ownerId_idx`(`ownerId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `AppSetting` (
    `id` VARCHAR(50) NOT NULL,
    `value` JSON NOT NULL,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateIndex
CREATE UNIQUE INDEX `service_requests_client_id_submissionKey_key` ON `service_requests`(`client_id`, `submissionKey`);
