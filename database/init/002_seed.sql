SET NAMES utf8mb4;

INSERT INTO roles (code, name) VALUES
    ('ADMIN', 'Administrador'),
    ('AGENT', 'Agente de viajes'),
    ('CUSTOMER', 'Cliente/Viajero'),
    ('SUPPORT', 'Personal de atención al cliente')
ON DUPLICATE KEY UPDATE name = VALUES(name);

INSERT INTO interests (code, name) VALUES
    ('CULTURE', 'Cultura'),
    ('NATURE', 'Naturaleza'),
    ('ADVENTURE', 'Aventura'),
    ('GASTRONOMY', 'Gastronomía'),
    ('HISTORY', 'Historia'),
    ('RELAX', 'Descanso')
ON DUPLICATE KEY UPDATE name = VALUES(name);

INSERT INTO service_categories (code, name) VALUES
    ('LODGING', 'Alojamiento'),
    ('EXPERIENCE', 'Experiencia'),
    ('PACKAGE', 'Paquete turístico')
ON DUPLICATE KEY UPDATE name = VALUES(name);

INSERT INTO destinations (city, department, country) VALUES
    ('La Paz', 'La Paz', 'Bolivia'),
    ('Copacabana', 'La Paz', 'Bolivia'),
    ('Coroico', 'La Paz', 'Bolivia')
ON DUPLICATE KEY UPDATE city = VALUES(city);

INSERT INTO providers (code, legal_name, trade_name, email, phone, status) VALUES
    ('PROV-001', 'Andes Demo S.R.L.', 'Andes Demo', 'contacto@andes-demo.invalid', '000-00001', 'active'),
    ('PROV-002', 'Altiplano Experiencias Demo', 'Altiplano Demo', 'contacto@altiplano-demo.invalid', '000-00002', 'active')
ON DUPLICATE KEY UPDATE trade_name = VALUES(trade_name), status = VALUES(status);

INSERT INTO tourist_services
    (provider_id, destination_id, category_id, code, name, description, duration_days, price_bob, capacity, status)
SELECT p.id, d.id, c.id, 'SRV-001', 'Ruta cultural por La Paz',
       'Recorrido demostrativo por sitios culturales de la ciudad de La Paz.', 1, 180.00, 12, 'available'
FROM providers p
JOIN destinations d ON d.city = 'La Paz' AND d.department = 'La Paz'
JOIN service_categories c ON c.code = 'EXPERIENCE'
WHERE p.code = 'PROV-001'
ON DUPLICATE KEY UPDATE name = VALUES(name), price_bob = VALUES(price_bob), status = VALUES(status);

INSERT INTO tourist_services
    (provider_id, destination_id, category_id, code, name, description, duration_days, price_bob, capacity, status)
SELECT p.id, d.id, c.id, 'SRV-002', 'Escapada demostrativa a Copacabana',
       'Paquete sintético de dos días con actividades de naturaleza y cultura.', 2, 650.00, 8, 'available'
FROM providers p
JOIN destinations d ON d.city = 'Copacabana' AND d.department = 'La Paz'
JOIN service_categories c ON c.code = 'PACKAGE'
WHERE p.code = 'PROV-002'
ON DUPLICATE KEY UPDATE name = VALUES(name), price_bob = VALUES(price_bob), status = VALUES(status);

INSERT IGNORE INTO service_interests (service_id, interest_id)
SELECT s.id, i.id FROM tourist_services s CROSS JOIN interests i
WHERE s.code = 'SRV-001' AND i.code IN ('CULTURE', 'HISTORY');

INSERT IGNORE INTO service_interests (service_id, interest_id)
SELECT s.id, i.id FROM tourist_services s CROSS JOIN interests i
WHERE s.code = 'SRV-002' AND i.code IN ('CULTURE', 'NATURE', 'RELAX');

