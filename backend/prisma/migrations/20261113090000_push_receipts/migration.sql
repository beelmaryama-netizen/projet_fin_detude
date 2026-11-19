CREATE TABLE `PushReceipt` (
 `id` VARCHAR(100) NOT NULL,
 `token` VARCHAR(255) NOT NULL,
 `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
 INDEX `PushReceipt_createdAt_idx` (`createdAt`),
 PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
