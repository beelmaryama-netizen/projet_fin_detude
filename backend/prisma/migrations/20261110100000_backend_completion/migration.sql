-- AlterTable
ALTER TABLE `notifications` ADD COLUMN `dedupeKey` VARCHAR(191) NULL;

-- AlterTable
ALTER TABLE `users` ADD COLUMN `emailVerificationRequired` BOOLEAN NOT NULL DEFAULT false,
    ADD COLUMN `emailVerifiedAt` DATETIME(3) NULL,
    ADD COLUMN `mfaEnabled` BOOLEAN NOT NULL DEFAULT false,
    ADD COLUMN `providerSubject` VARCHAR(255) NULL,
    ADD COLUMN `tokenVersion` INTEGER NOT NULL DEFAULT 0;

-- CreateTable
CREATE TABLE `AuthChallenge` (
    `id` CHAR(36) NOT NULL,
    `userId` CHAR(36) NULL,
    `email` VARCHAR(255) NOT NULL,
    `purpose` VARCHAR(30) NOT NULL,
    `codeHash` VARCHAR(64) NOT NULL,
    `payload` JSON NULL,
    `attempts` INTEGER NOT NULL DEFAULT 0,
    `expiresAt` DATETIME(3) NOT NULL,
    `resendAt` DATETIME(3) NOT NULL,
    `consumedAt` DATETIME(3) NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    INDEX `AuthChallenge_userId_purpose_idx`(`userId`, `purpose`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `ServiceCatalogItem` (
    `id` CHAR(36) NOT NULL,
    `name` VARCHAR(150) NOT NULL,
    `category` VARCHAR(30) NOT NULL,
    `description` TEXT NOT NULL,
    `active` BOOLEAN NOT NULL DEFAULT true,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `RequestDocument` (
    `id` CHAR(36) NOT NULL,
    `requestId` CHAR(36) NOT NULL,
    `clientKey` VARCHAR(150) NOT NULL,
    `fileKey` VARCHAR(255) NOT NULL,
    `name` VARCHAR(255) NOT NULL,
    `size` INTEGER NOT NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    UNIQUE INDEX `RequestDocument_fileKey_key`(`fileKey`),
    UNIQUE INDEX `RequestDocument_requestId_clientKey_key`(`requestId`, `clientKey`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateIndex
CREATE UNIQUE INDEX `notifications_dedupeKey_key` ON `notifications`(`dedupeKey`);

-- CreateIndex
CREATE UNIQUE INDEX `users_auth_provider_providerSubject_key` ON `users`(`auth_provider`, `providerSubject`);

-- AddForeignKey
ALTER TABLE `RequestDocument` ADD CONSTRAINT `RequestDocument_requestId_fkey` FOREIGN KEY (`requestId`) REFERENCES `service_requests`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;
