-- CreateTable
CREATE TABLE `mission_photos` (
    `id` CHAR(36) NOT NULL,
    `mission_id` CHAR(36) NOT NULL,
    `employee_id` CHAR(36) NOT NULL,
    `photo_type` ENUM('BEFORE', 'AFTER', 'OTHER') NOT NULL,
    `file_key` VARCHAR(255) NOT NULL,
    `caption` VARCHAR(255) NULL,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    INDEX `mission_photos_mission_id_idx`(`mission_id`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `mission_checklist_items` (
    `id` CHAR(36) NOT NULL,
    `mission_id` CHAR(36) NOT NULL,
    `label` VARCHAR(255) NOT NULL,
    `is_done` BOOLEAN NOT NULL DEFAULT false,
    `done_by_id` CHAR(36) NULL,
    `done_at` DATETIME(3) NULL,
    `sort_order` INTEGER NOT NULL DEFAULT 0,

    INDEX `mission_checklist_items_mission_id_idx`(`mission_id`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `notifications` (
    `id` CHAR(36) NOT NULL,
    `user_id` CHAR(36) NOT NULL,
    `type` VARCHAR(50) NOT NULL,
    `title` VARCHAR(150) NOT NULL,
    `body` VARCHAR(500) NOT NULL,
    `related_entity_type` VARCHAR(50) NULL,
    `related_entity_id` CHAR(36) NULL,
    `read_at` DATETIME(3) NULL,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    INDEX `notifications_user_id_read_at_idx`(`user_id`, `read_at`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `device_tokens` (
    `id` CHAR(36) NOT NULL,
    `user_id` CHAR(36) NOT NULL,
    `token` VARCHAR(255) NOT NULL,
    `platform` ENUM('ANDROID', 'IOS') NOT NULL,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    UNIQUE INDEX `device_tokens_token_key`(`token`),
    INDEX `device_tokens_user_id_idx`(`user_id`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `mission_photos` ADD CONSTRAINT `mission_photos_mission_id_fkey` FOREIGN KEY (`mission_id`) REFERENCES `missions`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `mission_photos` ADD CONSTRAINT `mission_photos_employee_id_fkey` FOREIGN KEY (`employee_id`) REFERENCES `users`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `mission_checklist_items` ADD CONSTRAINT `mission_checklist_items_mission_id_fkey` FOREIGN KEY (`mission_id`) REFERENCES `missions`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `mission_checklist_items` ADD CONSTRAINT `mission_checklist_items_done_by_id_fkey` FOREIGN KEY (`done_by_id`) REFERENCES `users`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `notifications` ADD CONSTRAINT `notifications_user_id_fkey` FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `device_tokens` ADD CONSTRAINT `device_tokens_user_id_fkey` FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;
