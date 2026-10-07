-- CreateTable
CREATE TABLE `users` (
    `id` CHAR(36) NOT NULL,
    `email` VARCHAR(255) NOT NULL,
    `role` ENUM('CLIENT', 'EMPLOYEE', 'ADMIN') NOT NULL DEFAULT 'CLIENT',
    `status` ENUM('ACTIVE', 'SUSPENDED') NOT NULL DEFAULT 'ACTIVE',
    `first_name` VARCHAR(100) NOT NULL,
    `last_name` VARCHAR(100) NOT NULL,
    `phone` VARCHAR(30) NULL,
    `password_hash` VARCHAR(255) NULL,
    `auth_provider` ENUM('LOCAL', 'GOOGLE', 'APPLE') NOT NULL DEFAULT 'LOCAL',
    `must_change_password` BOOLEAN NOT NULL DEFAULT false,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updated_at` DATETIME(3) NOT NULL,

    UNIQUE INDEX `users_email_key`(`email`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `refresh_tokens` (
    `id` CHAR(36) NOT NULL,
    `user_id` CHAR(36) NOT NULL,
    `token_hash` VARCHAR(255) NOT NULL,
    `expires_at` DATETIME(3) NOT NULL,
    `revoked_at` DATETIME(3) NULL,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    INDEX `refresh_tokens_user_id_idx`(`user_id`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `addresses` (
    `id` CHAR(36) NOT NULL,
    `user_id` CHAR(36) NOT NULL,
    `label` VARCHAR(100) NOT NULL,
    `line1` VARCHAR(255) NOT NULL,
    `line2` VARCHAR(255) NULL,
    `city` VARCHAR(100) NOT NULL,
    `province` VARCHAR(50) NOT NULL,
    `postal_code` VARCHAR(10) NOT NULL,
    `access_notes` TEXT NULL,

    INDEX `addresses_user_id_idx`(`user_id`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `service_requests` (
    `id` CHAR(36) NOT NULL,
    `client_id` CHAR(36) NOT NULL,
    `address_id` CHAR(36) NOT NULL,
    `request_type` ENUM('RESIDENTIAL', 'BUSINESS') NOT NULL,
    `description` TEXT NULL,
    `status` ENUM('NEW', 'UNDER_REVIEW', 'AWAITING_CLIENT', 'SCHEDULING', 'ACTIVE', 'COMPLETED', 'CANCELLED', 'CLOSED') NOT NULL DEFAULT 'NEW',
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updated_at` DATETIME(3) NOT NULL,

    INDEX `service_requests_client_id_idx`(`client_id`),
    INDEX `service_requests_status_idx`(`status`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `residential_details` (
    `request_id` CHAR(36) NOT NULL,
    `housing_type` ENUM('APARTMENT', 'HOUSE', 'CONDO', 'OTHER') NOT NULL,
    `bedrooms` INTEGER NOT NULL,
    `bathrooms` INTEGER NOT NULL,
    `floors` INTEGER NOT NULL DEFAULT 1,
    `area_sqft` INTEGER NULL,
    `has_pets` BOOLEAN NOT NULL DEFAULT false,
    `special_notes` TEXT NULL,

    PRIMARY KEY (`request_id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `business_details` (
    `request_id` CHAR(36) NOT NULL,
    `business_type` VARCHAR(100) NOT NULL,
    `company_name` VARCHAR(150) NOT NULL,
    `area_sqft` INTEGER NULL,
    `areas_to_clean` JSON NULL,
    `scope_description` TEXT NOT NULL,
    `frequency` ENUM('ONE_TIME', 'DAILY', 'WEEKLY', 'CUSTOM') NOT NULL,
    `constraints` TEXT NULL,

    PRIMARY KEY (`request_id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `request_availabilities` (
    `id` CHAR(36) NOT NULL,
    `request_id` CHAR(36) NOT NULL,
    `start_at` DATETIME(3) NOT NULL,
    `end_at` DATETIME(3) NOT NULL,
    `priority` INTEGER NOT NULL DEFAULT 1,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    INDEX `request_availabilities_request_id_idx`(`request_id`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `request_photos` (
    `id` CHAR(36) NOT NULL,
    `request_id` CHAR(36) NOT NULL,
    `file_key` VARCHAR(255) NOT NULL,
    `caption` VARCHAR(255) NULL,
    `sort_order` INTEGER NOT NULL DEFAULT 0,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    INDEX `request_photos_request_id_idx`(`request_id`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `refresh_tokens` ADD CONSTRAINT `refresh_tokens_user_id_fkey` FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `addresses` ADD CONSTRAINT `addresses_user_id_fkey` FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `service_requests` ADD CONSTRAINT `service_requests_client_id_fkey` FOREIGN KEY (`client_id`) REFERENCES `users`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `service_requests` ADD CONSTRAINT `service_requests_address_id_fkey` FOREIGN KEY (`address_id`) REFERENCES `addresses`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `residential_details` ADD CONSTRAINT `residential_details_request_id_fkey` FOREIGN KEY (`request_id`) REFERENCES `service_requests`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `business_details` ADD CONSTRAINT `business_details_request_id_fkey` FOREIGN KEY (`request_id`) REFERENCES `service_requests`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `request_availabilities` ADD CONSTRAINT `request_availabilities_request_id_fkey` FOREIGN KEY (`request_id`) REFERENCES `service_requests`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `request_photos` ADD CONSTRAINT `request_photos_request_id_fkey` FOREIGN KEY (`request_id`) REFERENCES `service_requests`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;
