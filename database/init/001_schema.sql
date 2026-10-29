SET NAMES utf8mb4;
SET time_zone = '-04:00';

CREATE TABLE roles (
    id TINYINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    code VARCHAR(30) NOT NULL UNIQUE,
    name VARCHAR(80) NOT NULL,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB;

CREATE TABLE app_users (
    id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    role_id TINYINT UNSIGNED NOT NULL,
    email VARCHAR(190) NOT NULL UNIQUE,
    password_hash VARCHAR(255) NOT NULL,
    first_name VARCHAR(100) NOT NULL,
    last_name VARCHAR(120) NOT NULL,
    phone VARCHAR(30) NULL,
    status ENUM('pending', 'active', 'blocked', 'disabled') NOT NULL DEFAULT 'pending',
    last_login_at DATETIME NULL,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    CONSTRAINT fk_users_role FOREIGN KEY (role_id) REFERENCES roles (id),
    CONSTRAINT chk_users_email CHECK (email LIKE '%_@_%._%')
) ENGINE=InnoDB;

CREATE TABLE customer_profiles (
    user_id BIGINT UNSIGNED PRIMARY KEY,
    max_budget_bob DECIMAL(12,2) NULL,
    available_days SMALLINT UNSIGNED NULL,
    notes VARCHAR(500) NULL,
    CONSTRAINT fk_customer_user FOREIGN KEY (user_id) REFERENCES app_users (id),
    CONSTRAINT chk_customer_budget CHECK (max_budget_bob IS NULL OR max_budget_bob >= 0),
    CONSTRAINT chk_customer_days CHECK (available_days IS NULL OR available_days > 0)
) ENGINE=InnoDB;

CREATE TABLE interests (
    id SMALLINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    code VARCHAR(40) NOT NULL UNIQUE,
    name VARCHAR(80) NOT NULL
) ENGINE=InnoDB;

CREATE TABLE customer_interests (
    user_id BIGINT UNSIGNED NOT NULL,
    interest_id SMALLINT UNSIGNED NOT NULL,
    weight DECIMAL(3,2) NOT NULL DEFAULT 1.00,
    PRIMARY KEY (user_id, interest_id),
    CONSTRAINT fk_customer_interest_user FOREIGN KEY (user_id) REFERENCES customer_profiles (user_id) ON DELETE CASCADE,
    CONSTRAINT fk_customer_interest_interest FOREIGN KEY (interest_id) REFERENCES interests (id),
    CONSTRAINT chk_customer_interest_weight CHECK (weight > 0 AND weight <= 1)
) ENGINE=InnoDB;

CREATE TABLE providers (
    id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    code VARCHAR(30) NOT NULL UNIQUE,
    legal_name VARCHAR(180) NOT NULL,
    trade_name VARCHAR(180) NOT NULL,
    email VARCHAR(190) NOT NULL,
    phone VARCHAR(30) NULL,
    status ENUM('pending', 'active', 'suspended') NOT NULL DEFAULT 'pending',
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB;

CREATE TABLE destinations (
    id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    city VARCHAR(120) NOT NULL,
    department VARCHAR(120) NOT NULL,
    country VARCHAR(120) NOT NULL DEFAULT 'Bolivia',
    UNIQUE KEY uq_destination (city, department, country)
) ENGINE=InnoDB;

CREATE TABLE service_categories (
    id SMALLINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    code VARCHAR(40) NOT NULL UNIQUE,
    name VARCHAR(100) NOT NULL
) ENGINE=InnoDB;

CREATE TABLE tourist_services (
    id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    provider_id BIGINT UNSIGNED NOT NULL,
    destination_id BIGINT UNSIGNED NOT NULL,
    category_id SMALLINT UNSIGNED NOT NULL,
    code VARCHAR(30) NOT NULL UNIQUE,
    name VARCHAR(180) NOT NULL,
    description TEXT NOT NULL,
    duration_days SMALLINT UNSIGNED NOT NULL,
    price_bob DECIMAL(12,2) NOT NULL,
    capacity SMALLINT UNSIGNED NOT NULL DEFAULT 1,
    status ENUM('draft', 'available', 'unavailable', 'archived') NOT NULL DEFAULT 'draft',
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    CONSTRAINT fk_service_provider FOREIGN KEY (provider_id) REFERENCES providers (id),
    CONSTRAINT fk_service_destination FOREIGN KEY (destination_id) REFERENCES destinations (id),
    CONSTRAINT fk_service_category FOREIGN KEY (category_id) REFERENCES service_categories (id),
    CONSTRAINT chk_service_duration CHECK (duration_days > 0),
    CONSTRAINT chk_service_price CHECK (price_bob >= 0),
    CONSTRAINT chk_service_capacity CHECK (capacity > 0),
    INDEX idx_service_search (destination_id, category_id, status, price_bob)
) ENGINE=InnoDB;

CREATE TABLE service_interests (
    service_id BIGINT UNSIGNED NOT NULL,
    interest_id SMALLINT UNSIGNED NOT NULL,
    PRIMARY KEY (service_id, interest_id),
    CONSTRAINT fk_service_interest_service FOREIGN KEY (service_id) REFERENCES tourist_services (id) ON DELETE CASCADE,
    CONSTRAINT fk_service_interest_interest FOREIGN KEY (interest_id) REFERENCES interests (id)
) ENGINE=InnoDB;

CREATE TABLE bookings (
    id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    code VARCHAR(30) NOT NULL UNIQUE,
    customer_user_id BIGINT UNSIGNED NOT NULL,
    created_by_user_id BIGINT UNSIGNED NOT NULL,
    status ENUM('pending', 'confirmed', 'cancelled', 'partially_refunded', 'refunded', 'completed') NOT NULL DEFAULT 'pending',
    currency CHAR(3) NOT NULL DEFAULT 'BOB',
    total_amount DECIMAL(12,2) NOT NULL,
    booked_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    CONSTRAINT fk_booking_customer FOREIGN KEY (customer_user_id) REFERENCES app_users (id),
    CONSTRAINT fk_booking_creator FOREIGN KEY (created_by_user_id) REFERENCES app_users (id),
    CONSTRAINT chk_booking_total CHECK (total_amount >= 0),
    INDEX idx_booking_customer_status (customer_user_id, status),
    INDEX idx_booking_date (booked_at)
) ENGINE=InnoDB;

CREATE TABLE booking_items (
    id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    booking_id BIGINT UNSIGNED NOT NULL,
    service_id BIGINT UNSIGNED NOT NULL,
    quantity SMALLINT UNSIGNED NOT NULL DEFAULT 1,
    unit_price DECIMAL(12,2) NOT NULL,
    service_date DATE NOT NULL,
    CONSTRAINT fk_item_booking FOREIGN KEY (booking_id) REFERENCES bookings (id) ON DELETE CASCADE,
    CONSTRAINT fk_item_service FOREIGN KEY (service_id) REFERENCES tourist_services (id),
    CONSTRAINT chk_item_quantity CHECK (quantity > 0),
    CONSTRAINT chk_item_price CHECK (unit_price >= 0)
) ENGINE=InnoDB;

CREATE TABLE payments (
    id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    booking_id BIGINT UNSIGNED NOT NULL,
    reference_code VARCHAR(60) NOT NULL UNIQUE,
    method ENUM('cash', 'card_simulated', 'transfer_simulated') NOT NULL,
    status ENUM('pending', 'approved', 'rejected', 'refunded', 'partially_refunded') NOT NULL DEFAULT 'pending',
    amount DECIMAL(12,2) NOT NULL,
    paid_at DATETIME NULL,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_payment_booking FOREIGN KEY (booking_id) REFERENCES bookings (id),
    CONSTRAINT chk_payment_amount CHECK (amount > 0),
    INDEX idx_payment_booking_status (booking_id, status)
) ENGINE=InnoDB;

CREATE TABLE cancellations (
    id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    booking_id BIGINT UNSIGNED NOT NULL,
    requested_by_user_id BIGINT UNSIGNED NOT NULL,
    reason VARCHAR(500) NOT NULL,
    status ENUM('requested', 'approved', 'rejected') NOT NULL DEFAULT 'requested',
    requested_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    resolved_at DATETIME NULL,
    CONSTRAINT fk_cancellation_booking FOREIGN KEY (booking_id) REFERENCES bookings (id),
    CONSTRAINT fk_cancellation_requester FOREIGN KEY (requested_by_user_id) REFERENCES app_users (id),
    INDEX idx_cancellation_booking_status (booking_id, status)
) ENGINE=InnoDB;

CREATE TABLE refunds (
    id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    cancellation_id BIGINT UNSIGNED NOT NULL,
    payment_id BIGINT UNSIGNED NOT NULL,
    reference_code VARCHAR(60) NOT NULL UNIQUE,
    amount DECIMAL(12,2) NOT NULL,
    status ENUM('pending', 'approved', 'rejected') NOT NULL DEFAULT 'pending',
    processed_at DATETIME NULL,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_refund_cancellation FOREIGN KEY (cancellation_id) REFERENCES cancellations (id),
    CONSTRAINT fk_refund_payment FOREIGN KEY (payment_id) REFERENCES payments (id),
    CONSTRAINT chk_refund_amount CHECK (amount > 0)
) ENGINE=InnoDB;

CREATE TABLE complaints (
    id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    code VARCHAR(30) NOT NULL UNIQUE,
    customer_user_id BIGINT UNSIGNED NOT NULL,
    booking_id BIGINT UNSIGNED NULL,
    assigned_to_user_id BIGINT UNSIGNED NULL,
    subject VARCHAR(180) NOT NULL,
    description TEXT NOT NULL,
    status ENUM('open', 'in_progress', 'resolved', 'closed') NOT NULL DEFAULT 'open',
    resolution TEXT NULL,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    resolved_at DATETIME NULL,
    CONSTRAINT fk_complaint_customer FOREIGN KEY (customer_user_id) REFERENCES app_users (id),
    CONSTRAINT fk_complaint_booking FOREIGN KEY (booking_id) REFERENCES bookings (id),
    CONSTRAINT fk_complaint_assignee FOREIGN KEY (assigned_to_user_id) REFERENCES app_users (id),
    INDEX idx_complaint_status_created (status, created_at)
) ENGINE=InnoDB;

CREATE TABLE audit_logs (
    id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    actor_user_id BIGINT UNSIGNED NULL,
    action VARCHAR(80) NOT NULL,
    entity_type VARCHAR(80) NOT NULL,
    entity_id VARCHAR(80) NULL,
    details JSON NULL,
    ip_address VARCHAR(45) NULL,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_audit_actor FOREIGN KEY (actor_user_id) REFERENCES app_users (id),
    INDEX idx_audit_entity (entity_type, entity_id),
    INDEX idx_audit_created (created_at)
) ENGINE=InnoDB;

