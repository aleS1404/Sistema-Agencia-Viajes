import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { hash } from 'bcryptjs';
import mysql from 'mysql2/promise';

function readRootEnv() {
  try {
    const text = readFileSync(resolve(process.cwd(), '../../.env'), 'utf8');
    return Object.fromEntries(text.split(/\r?\n/).filter((line) => line && !line.startsWith('#') && line.includes('='))
      .map((line) => { const at = line.indexOf('='); return [line.slice(0, at), line.slice(at + 1)]; }));
  } catch { return {}; }
}

const fileEnv = readRootEnv();
const config = {
  host: process.env.DB_HOST || '127.0.0.1',
  port: Number(process.env.DB_PORT || fileEnv.MYSQL_PORT || 3307),
  user: process.env.DB_USER || fileEnv.MYSQL_USER || 'booking_app',
  password: process.env.DB_PASSWORD || fileEnv.MYSQL_PASSWORD || '',
  database: process.env.DB_NAME || fileEnv.MYSQL_DATABASE || 'booking_demo',
  charset: 'utf8mb4',
};

const credentials = [
  ['ADMIN', 'admin@andesgo.demo', 'Ada', 'Administradora'],
  ['CUSTOMER', 'cliente@andesgo.demo', 'Carla', 'Viajera'],
  ['SUPPORT', 'soporte@andesgo.demo', 'Sofía', 'Atención'],
  ['PROVIDER', 'proveedor@andesgo.demo', 'Pablo', 'Proveedor'],
];

const connection = await mysql.createConnection(config);
try {
  await connection.beginTransaction();
  const passwordHash = await hash('Demo1234!', 12);
  const userIds = {};
  for (const [role, email, firstName, lastName] of credentials) {
    const [[roleRow]] = await connection.query('SELECT id FROM roles WHERE code = ?', [role]);
    if (!roleRow) throw new Error(`Rol ${role} no encontrado`);
    await connection.query(
      `INSERT INTO app_users (role_id, email, password_hash, first_name, last_name, phone, status)
       VALUES (?, ?, ?, ?, ?, '70000000', 'active')
       ON DUPLICATE KEY UPDATE role_id = VALUES(role_id), password_hash = VALUES(password_hash),
         first_name = VALUES(first_name), last_name = VALUES(last_name), status = 'active'`,
      [roleRow.id, email, passwordHash, firstName, lastName],
    );
    const [[user]] = await connection.query('SELECT id FROM app_users WHERE email = ?', [email]);
    userIds[role] = user.id;
  }

  await connection.query(
    `INSERT INTO customer_profiles (user_id, max_budget_bob, available_days, notes)
     VALUES (?, 900.00, 3, 'Perfil sintético para demostración')
     ON DUPLICATE KEY UPDATE max_budget_bob = VALUES(max_budget_bob), available_days = VALUES(available_days), notes = VALUES(notes)`,
    [userIds.CUSTOMER],
  );
  for (const code of ['CULTURE', 'NATURE', 'RELAX']) {
    const [[interest]] = await connection.query('SELECT id FROM interests WHERE code = ?', [code]);
    if (interest) await connection.query(
      `INSERT INTO customer_interests (user_id, interest_id, weight) VALUES (?, ?, 1.00)
       ON DUPLICATE KEY UPDATE weight = VALUES(weight)`, [userIds.CUSTOMER, interest.id],
    );
  }

  const [[provider]] = await connection.query("SELECT id FROM providers WHERE code = 'PROV-001'");
  if (!provider) throw new Error('Proveedor PROV-001 no encontrado');
  await connection.query(
    `INSERT INTO provider_users (user_id, provider_id) VALUES (?, ?)
     ON DUPLICATE KEY UPDATE provider_id = VALUES(provider_id)`,
    [userIds.PROVIDER, provider.id],
  );

  const [destinations] = await connection.query('SELECT id, city FROM destinations ORDER BY id');
  const [categories] = await connection.query('SELECT id, code FROM service_categories ORDER BY id');
  const [providers] = await connection.query("SELECT id FROM providers WHERE status = 'active' ORDER BY id");
  const serviceNames = [
    'Caminata panorámica por La Paz', 'Experiencia gastronómica paceña', 'Ruta de naturaleza en Coroico',
    'Fin de semana cultural', 'Aventura de altura', 'Descanso junto al lago', 'Historia viva del altiplano',
    'Miradores y fotografía urbana', 'Sabores y mercados tradicionales', 'Escapada de naturaleza y café',
  ];
  for (let index = 0; index < serviceNames.length; index += 1) {
    const code = `SRV-${String(index + 3).padStart(3, '0')}`;
    const destination = destinations[index % destinations.length];
    const category = categories[index % categories.length];
    const owner = providers[index % providers.length];
    await connection.query(
      `INSERT INTO tourist_services
       (provider_id, destination_id, category_id, code, name, description, duration_days, price_bob, capacity, status)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 'available')
       ON DUPLICATE KEY UPDATE name = VALUES(name), description = VALUES(description), price_bob = VALUES(price_bob), status = 'available'`,
      [owner.id, destination.id, category.id, code, serviceNames[index],
       `Servicio turístico sintético en ${destination.city}, preparado para la demostración académica.`,
       (index % 3) + 1, 150 + index * 55, 6 + (index % 8)],
    );
  }

  const [[service]] = await connection.query("SELECT id, price_bob FROM tourist_services WHERE code = 'SRV-001'");
  await connection.query(
    `INSERT INTO bookings (code, customer_user_id, created_by_user_id, status, total_amount)
     VALUES ('RES-DEMO-001', ?, ?, 'confirmed', ?)
     ON DUPLICATE KEY UPDATE status = VALUES(status), total_amount = VALUES(total_amount)`,
    [userIds.CUSTOMER, userIds.CUSTOMER, service.price_bob],
  );
  const [[booking]] = await connection.query("SELECT id FROM bookings WHERE code = 'RES-DEMO-001'");
  const [[item]] = await connection.query('SELECT id FROM booking_items WHERE booking_id = ? AND service_id = ?', [booking.id, service.id]);
  if (!item) await connection.query(
    'INSERT INTO booking_items (booking_id, service_id, quantity, unit_price, service_date) VALUES (?, ?, 1, ?, DATE_ADD(CURDATE(), INTERVAL 14 DAY))',
    [booking.id, service.id, service.price_bob],
  );
  await connection.query(
    `INSERT INTO payments (booking_id, reference_code, method, status, amount, paid_at)
     VALUES (?, 'PAY-DEMO-001', 'card_simulated', 'approved', ?, NOW())
     ON DUPLICATE KEY UPDATE status = 'approved', amount = VALUES(amount), paid_at = NOW()`,
    [booking.id, service.price_bob],
  );
  const [[cancellation]] = await connection.query('SELECT id FROM cancellations WHERE booking_id = ?', [booking.id]);
  if (!cancellation) await connection.query(
    `INSERT INTO cancellations (booking_id, requested_by_user_id, reason, status)
     VALUES (?, ?, 'Solicitud de reembolso: cambio de fechas para demostración', 'requested')`,
    [booking.id, userIds.CUSTOMER],
  );
  await connection.query(
    `INSERT INTO complaints (code, customer_user_id, booking_id, subject, description, status)
     VALUES ('REC-DEMO-001', ?, ?, 'Consulta sobre el itinerario', 'Reclamo sintético para demostrar la bandeja de atención.', 'open')
     ON DUPLICATE KEY UPDATE subject = VALUES(subject), description = VALUES(description), status = 'open', resolution = NULL`,
    [userIds.CUSTOMER, booking.id],
  );
  await connection.commit();
  process.stdout.write(JSON.stringify({ ok: true, password: 'Demo1234!', accounts: credentials.map(([role, email]) => ({ role, email })) }, null, 2));
} catch (error) {
  await connection.rollback();
  throw error;
} finally {
  await connection.end();
}
