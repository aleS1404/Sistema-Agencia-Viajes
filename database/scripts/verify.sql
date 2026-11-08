SELECT 'roles' AS entity, COUNT(*) AS records FROM roles
UNION ALL SELECT 'providers', COUNT(*) FROM providers
UNION ALL SELECT 'destinations', COUNT(*) FROM destinations
UNION ALL SELECT 'services', COUNT(*) FROM tourist_services
UNION ALL SELECT 'interests', COUNT(*) FROM interests
UNION ALL SELECT 'commercial_policies', COUNT(*) FROM commercial_policies
UNION ALL SELECT 'provider_users', COUNT(*) FROM provider_users;

SELECT
    s.code,
    s.name,
    d.city AS destination,
    c.name AS category,
    s.duration_days,
    s.price_bob,
    GROUP_CONCAT(i.name ORDER BY i.name SEPARATOR ', ') AS interests
FROM tourist_services s
JOIN destinations d ON d.id = s.destination_id
JOIN service_categories c ON c.id = s.category_id
LEFT JOIN service_interests si ON si.service_id = s.id
LEFT JOIN interests i ON i.id = si.interest_id
GROUP BY s.id, s.code, s.name, d.city, c.name, s.duration_days, s.price_bob
ORDER BY s.code;

