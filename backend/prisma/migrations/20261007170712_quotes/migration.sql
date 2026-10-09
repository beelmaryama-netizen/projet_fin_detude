-- CreateTable
CREATE TABLE `quotes` (
    `id` CHAR(36) NOT NULL,
    `request_id` CHAR(36) NOT NULL,
    `created_by_admin_id` CHAR(36) NOT NULL,
    `version` INTEGER NOT NULL,
    `subtotal` DECIMAL(10, 2) NOT NULL,
    `taxes` DECIMAL(10, 2) NOT NULL,
    `total` DECIMAL(10, 2) NOT NULL,
    `estimated_minutes` INTEGER NULL,
    `employees_needed` INTEGER NOT NULL DEFAULT 1,
    `message_to_client` TEXT NULL,
    `client_comment` TEXT NULL,
    `status` ENUM('DRAFT', 'SENT', 'ACCEPTED', 'REJECTED', 'EXPIRED', 'SUPERSEDED') NOT NULL DEFAULT 'DRAFT',
    `expires_at` DATETIME(3) NULL,
    `sent_at` DATETIME(3) NULL,
    `responded_at` DATETIME(3) NULL,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updated_at` DATETIME(3) NOT NULL,

    INDEX `quotes_status_idx`(`status`),
    UNIQUE INDEX `quotes_request_id_version_key`(`request_id`, `version`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `quote_items` (
    `id` CHAR(36) NOT NULL,
    `quote_id` CHAR(36) NOT NULL,
    `description` VARCHAR(255) NOT NULL,
    `qty` DECIMAL(10, 2) NOT NULL,
    `unit_price` DECIMAL(10, 2) NOT NULL,
    `line_total` DECIMAL(10, 2) NOT NULL,
    `sort_order` INTEGER NOT NULL DEFAULT 0,

    INDEX `quote_items_quote_id_idx`(`quote_id`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `quotes` ADD CONSTRAINT `quotes_request_id_fkey` FOREIGN KEY (`request_id`) REFERENCES `service_requests`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `quotes` ADD CONSTRAINT `quotes_created_by_admin_id_fkey` FOREIGN KEY (`created_by_admin_id`) REFERENCES `users`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `quote_items` ADD CONSTRAINT `quote_items_quote_id_fkey` FOREIGN KEY (`quote_id`) REFERENCES `quotes`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;
