/*
  Warnings:

  - You are about to drop the column `sort_order` on the `quote_items` table. All the data in the column will be lost.
  - You are about to drop the column `client_comment` on the `quotes` table. All the data in the column will be lost.
  - You are about to drop the column `created_at` on the `quotes` table. All the data in the column will be lost.
  - You are about to drop the column `message_to_client` on the `quotes` table. All the data in the column will be lost.
  - You are about to drop the column `updated_at` on the `quotes` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE `quote_items` DROP COLUMN `sort_order`;

-- AlterTable
ALTER TABLE `quotes` DROP COLUMN `client_comment`,
    DROP COLUMN `created_at`,
    DROP COLUMN `message_to_client`,
    DROP COLUMN `updated_at`;

-- CreateTable
CREATE TABLE `service_appointments` (
    `id` CHAR(36) NOT NULL,
    `request_id` CHAR(36) NOT NULL,
    `accepted_quote_id` CHAR(36) NOT NULL,
    `scheduled_start` DATETIME(3) NULL,
    `scheduled_end` DATETIME(3) NULL,
    `status` ENUM('PENDING_CONFIRMATION', 'CONFIRMED', 'IN_PROGRESS', 'COMPLETED', 'CANCELLED') NOT NULL DEFAULT 'PENDING_CONFIRMATION',
    `client_notes` TEXT NULL,
    `confirmed_by_admin_id` CHAR(36) NULL,

    INDEX `service_appointments_request_id_idx`(`request_id`),
    INDEX `service_appointments_status_idx`(`status`),
    INDEX `service_appointments_scheduled_start_idx`(`scheduled_start`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `service_appointments` ADD CONSTRAINT `service_appointments_request_id_fkey` FOREIGN KEY (`request_id`) REFERENCES `service_requests`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `service_appointments` ADD CONSTRAINT `service_appointments_accepted_quote_id_fkey` FOREIGN KEY (`accepted_quote_id`) REFERENCES `quotes`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `service_appointments` ADD CONSTRAINT `service_appointments_confirmed_by_admin_id_fkey` FOREIGN KEY (`confirmed_by_admin_id`) REFERENCES `users`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;
