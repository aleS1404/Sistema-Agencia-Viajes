-- AndesGo: instalación local sin Docker.
-- ADVERTENCIA: elimina y recrea exclusivamente la base académica booking_demo.
DROP DATABASE IF EXISTS booking_demo;
CREATE DATABASE booking_demo CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

CREATE USER IF NOT EXISTS 'booking_app'@'localhost' IDENTIFIED BY 'AndesGo2026!';
ALTER USER 'booking_app'@'localhost' IDENTIFIED BY 'AndesGo2026!';
CREATE USER IF NOT EXISTS 'booking_app'@'127.0.0.1' IDENTIFIED BY 'AndesGo2026!';
ALTER USER 'booking_app'@'127.0.0.1' IDENTIFIED BY 'AndesGo2026!';

GRANT ALL PRIVILEGES ON booking_demo.* TO 'booking_app'@'localhost';
GRANT ALL PRIVILEGES ON booking_demo.* TO 'booking_app'@'127.0.0.1';
FLUSH PRIVILEGES;
