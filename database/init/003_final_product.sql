SET NAMES utf8mb4;

INSERT INTO roles (code, name) VALUES
    ('PROVIDER', 'Proveedor turístico')
ON DUPLICATE KEY UPDATE name = VALUES(name);

DELETE FROM roles
WHERE code = 'AGENT'
  AND NOT EXISTS (
      SELECT 1 FROM app_users WHERE app_users.role_id = roles.id
  );

CREATE TABLE IF NOT EXISTS provider_users (
    user_id BIGINT UNSIGNED PRIMARY KEY,
    provider_id BIGINT UNSIGNED NOT NULL UNIQUE,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_provider_user_account FOREIGN KEY (user_id) REFERENCES app_users (id) ON DELETE CASCADE,
    CONSTRAINT fk_provider_user_provider FOREIGN KEY (provider_id) REFERENCES providers (id) ON DELETE CASCADE
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS commercial_policies (
    id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    code VARCHAR(40) NOT NULL UNIQUE,
    name VARCHAR(140) NOT NULL,
    description VARCHAR(500) NOT NULL,
    minimum_hours_before_service SMALLINT UNSIGNED NOT NULL DEFAULT 24,
    refund_percentage DECIMAL(5,2) NOT NULL DEFAULT 100.00,
    active BOOLEAN NOT NULL DEFAULT TRUE,
    created_by_user_id BIGINT UNSIGNED NULL,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    CONSTRAINT fk_policy_creator FOREIGN KEY (created_by_user_id) REFERENCES app_users (id),
    CONSTRAINT chk_policy_refund_percentage CHECK (refund_percentage >= 0 AND refund_percentage <= 100)
) ENGINE=InnoDB;

INSERT INTO commercial_policies
    (code, name, description, minimum_hours_before_service, refund_percentage, active)
VALUES
    ('STANDARD-24H', 'Política estándar de cancelación',
     'Permite reembolso total cuando la cancelación se aprueba al menos 24 horas antes del servicio.',
     24, 100.00, TRUE)
ON DUPLICATE KEY UPDATE
    name = VALUES(name),
    description = VALUES(description),
    minimum_hours_before_service = VALUES(minimum_hours_before_service),
    refund_percentage = VALUES(refund_percentage),
    active = VALUES(active);
