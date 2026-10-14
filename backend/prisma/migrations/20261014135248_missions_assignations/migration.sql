-- CreateTable
CREATE TABLE `missions` (
    `id` CHAR(36) NOT NULL,
    `appointment_id` CHAR(36) NOT NULL,
    `status` ENUM('TO_ASSIGN', 'PLANNED', 'IN_PROGRESS', 'COMPLETED', 'CANCELLED') NOT NULL DEFAULT 'TO_ASSIGN',
    `internal_instructions` TEXT NULL,
    `started_at` DATETIME(3) NULL,
    `completed_at` DATETIME(3) NULL,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updated_at` DATETIME(3) NOT NULL,

    UNIQUE INDEX `missions_appointment_id_key`(`appointment_id`),
    INDEX `missions_status_idx`(`status`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `mission_assignments` (
    `id` CHAR(36) NOT NULL,
    `mission_id` CHAR(36) NOT NULL,
    `employee_id` CHAR(36) NOT NULL,
    `assigned_by_admin_id` CHAR(36) NOT NULL,
    `status` ENUM('ACTIVE', 'REMOVED') NOT NULL DEFAULT 'ACTIVE',
    `assigned_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `removed_at` DATETIME(3) NULL,

    INDEX `mission_assignments_mission_id_idx`(`mission_id`),
    INDEX `mission_assignments_employee_id_status_idx`(`employee_id`, `status`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `mission_logs` (
    `id` CHAR(36) NOT NULL,
    `mission_id` CHAR(36) NOT NULL,
    `actor_user_id` CHAR(36) NOT NULL,
    `event_type` VARCHAR(50) NOT NULL,
    `note` TEXT NULL,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    INDEX `mission_logs_mission_id_idx`(`mission_id`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `missions` ADD CONSTRAINT `missions_appointment_id_fkey` FOREIGN KEY (`appointment_id`) REFERENCES `service_appointments`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `mission_assignments` ADD CONSTRAINT `mission_assignments_mission_id_fkey` FOREIGN KEY (`mission_id`) REFERENCES `missions`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `mission_assignments` ADD CONSTRAINT `mission_assignments_employee_id_fkey` FOREIGN KEY (`employee_id`) REFERENCES `users`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `mission_assignments` ADD CONSTRAINT `mission_assignments_assigned_by_admin_id_fkey` FOREIGN KEY (`assigned_by_admin_id`) REFERENCES `users`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `mission_logs` ADD CONSTRAINT `mission_logs_mission_id_fkey` FOREIGN KEY (`mission_id`) REFERENCES `missions`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `mission_logs` ADD CONSTRAINT `mission_logs_actor_user_id_fkey` FOREIGN KEY (`actor_user_id`) REFERENCES `users`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;
