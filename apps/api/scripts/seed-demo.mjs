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
  ['ADMIN', 'ADMIN', 'admin@andesgo.demo', 'Ada', 'Administradora'],
  ['ADMIN_ANALYTICS', 'ADMIN', 'analitica@andesgo.demo', 'Elena', 'Analista'],
  ['CUSTOMER', 'CUSTOMER', 'cliente@andesgo.demo', 'Carla', 'Viajera'],
  ['CUSTOMER_LAURA', 'CUSTOMER', 'laura@andesgo.demo', 'Laura', 'Quispe'],
  ['CUSTOMER_DIEGO', 'CUSTOMER', 'diego@andesgo.demo', 'Diego', 'Mamani'],
  ['CUSTOMER_CAMILA', 'CUSTOMER', 'camila@andesgo.demo', 'Camila', 'Flores'],
  ['CUSTOMER_MATEO', 'CUSTOMER', 'mateo@andesgo.demo', 'Mateo', 'Rojas'],
  ['CUSTOMER_VALERIA', 'CUSTOMER', 'valeria@andesgo.demo', 'Valeria', 'Choque'],
  ['CUSTOMER_LUCAS', 'CUSTOMER', 'lucas@andesgo.demo', 'Lucas', 'Vargas'],
  ['CUSTOMER_FERNANDA', 'CUSTOMER', 'fernanda@andesgo.demo', 'Fernanda', 'Paredes'],
  ['CUSTOMER_RENATO', 'CUSTOMER', 'renato@andesgo.demo', 'Renato', 'Condori'],
  ['SUPPORT', 'SUPPORT', 'soporte@andesgo.demo', 'Sofía', 'Atención'],
  ['SUPPORT_MARIANA', 'SUPPORT', 'mariana.soporte@andesgo.demo', 'Mariana', 'López'],
  ['PROVIDER', 'PROVIDER', 'proveedor@andesgo.demo', 'Pablo', 'Proveedor'],
  ['PROVIDER_ALTIPLANO', 'PROVIDER', 'altiplano@andesgo.demo', 'Alonso', 'Altiplano'],
  ['PROVIDER_LAGO', 'PROVIDER', 'lago@andesgo.demo', 'Lucía', 'Lago'],
];

const connection = await mysql.createConnection(config);
try {
  await connection.beginTransaction();
  const passwordHash = await hash('Demo1234!', 12);
  const userIds = {};
  for (const [key, role, email, firstName, lastName] of credentials) {
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
    userIds[key] = user.id;
  }

  const customerProfiles = [
    ['CUSTOMER', 900, 3, ['CULTURE', 'NATURE', 'RELAX']],
    ['CUSTOMER_LAURA', 500, 2, ['CULTURE', 'HISTORY']],
    ['CUSTOMER_DIEGO', 1200, 4, ['ADVENTURE', 'NATURE']],
    ['CUSTOMER_CAMILA', 750, 3, ['GASTRONOMY', 'CULTURE']],
    ['CUSTOMER_MATEO', 350, 1, ['HISTORY', 'CULTURE']],
    ['CUSTOMER_VALERIA', 1500, 5, ['RELAX', 'NATURE']],
    ['CUSTOMER_LUCAS', 680, 2, ['ADVENTURE', 'GASTRONOMY']],
    ['CUSTOMER_FERNANDA', 820, 3, ['CULTURE', 'RELAX']],
    ['CUSTOMER_RENATO', 1000, 4, ['NATURE', 'HISTORY']],
  ];
  for (const [key, budget, days, interestCodes] of customerProfiles) {
    await connection.query(
      `INSERT INTO customer_profiles (user_id, max_budget_bob, available_days, notes)
       VALUES (?, ?, ?, 'Perfil sintético para demostración administrativa')
       ON DUPLICATE KEY UPDATE max_budget_bob = VALUES(max_budget_bob), available_days = VALUES(available_days), notes = VALUES(notes)`,
      [userIds[key], budget, days],
    );
    for (const code of interestCodes) {
      const [[interest]] = await connection.query('SELECT id FROM interests WHERE code = ?', [code]);
      if (interest) await connection.query(
        `INSERT INTO customer_interests (user_id, interest_id, weight) VALUES (?, ?, 1.00)
         ON DUPLICATE KEY UPDATE weight = VALUES(weight)`, [userIds[key], interest.id],
      );
    }
  }

  const [[provider]] = await connection.query("SELECT id FROM providers WHERE code = 'PROV-001'");
  if (!provider) throw new Error('Proveedor PROV-001 no encontrado');
  await connection.query(
    `INSERT INTO provider_users (user_id, provider_id) VALUES (?, ?)
     ON DUPLICATE KEY UPDATE provider_id = VALUES(provider_id)`,
    [userIds.PROVIDER, provider.id],
  );
  const [[altiplanoProvider]] = await connection.query("SELECT id FROM providers WHERE code = 'PROV-002'");
  for (const [key, providerId] of [
    ['PROVIDER_ALTIPLANO', altiplanoProvider?.id ?? provider.id],
    ['PROVIDER_LAGO', provider.id],
  ]) {
    await connection.query(
      `INSERT INTO provider_users (user_id, provider_id) VALUES (?, ?)
       ON DUPLICATE KEY UPDATE provider_id = VALUES(provider_id)`,
      [userIds[key], providerId],
    );
  }

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

  const serviceInterestMap = {
    'SRV-003': ['ADVENTURE', 'NATURE'], 'SRV-004': ['GASTRONOMY', 'CULTURE'],
    'SRV-005': ['NATURE', 'ADVENTURE'], 'SRV-006': ['CULTURE', 'HISTORY'],
    'SRV-007': ['ADVENTURE', 'NATURE'], 'SRV-008': ['RELAX', 'NATURE'],
    'SRV-009': ['HISTORY', 'CULTURE'], 'SRV-010': ['CULTURE', 'ADVENTURE'],
    'SRV-011': ['GASTRONOMY', 'CULTURE'], 'SRV-012': ['NATURE', 'RELAX'],
  };
  for (const [serviceCode, interestCodes] of Object.entries(serviceInterestMap)) {
    for (const interestCode of interestCodes) {
      await connection.query(
        `INSERT IGNORE INTO service_interests (service_id, interest_id)
         SELECT s.id, i.id FROM tourist_services s JOIN interests i ON i.code = ? WHERE s.code = ?`,
        [interestCode, serviceCode],
      );
    }
  }

  const demoBookings = [
    ['RES-DEMO-001', 'CUSTOMER', 'SRV-001', 1, 'confirmed', 2],
    ['RES-DEMO-002', 'CUSTOMER_LAURA', 'SRV-002', 2, 'confirmed', 6],
    ['RES-DEMO-003', 'CUSTOMER_DIEGO', 'SRV-007', 1, 'completed', 18],
    ['RES-DEMO-004', 'CUSTOMER_CAMILA', 'SRV-004', 2, 'pending', 1],
    ['RES-DEMO-005', 'CUSTOMER_MATEO', 'SRV-006', 1, 'cancelled', 12],
    ['RES-DEMO-006', 'CUSTOMER_VALERIA', 'SRV-008', 2, 'confirmed', 4],
    ['RES-DEMO-007', 'CUSTOMER_LUCAS', 'SRV-010', 1, 'completed', 25],
    ['RES-DEMO-008', 'CUSTOMER_FERNANDA', 'SRV-011', 3, 'partially_refunded', 10],
    ['RES-DEMO-009', 'CUSTOMER_RENATO', 'SRV-005', 1, 'refunded', 16],
    ['RES-DEMO-010', 'CUSTOMER_LAURA', 'SRV-003', 2, 'confirmed', 3],
    ['RES-DEMO-011', 'CUSTOMER_DIEGO', 'SRV-012', 1, 'pending', 0],
    ['RES-DEMO-012', 'CUSTOMER_CAMILA', 'SRV-001', 4, 'completed', 30],
  ];
  const bookingIds = {};
  for (const [code, customerKey, serviceCode, quantity, status, daysAgo] of demoBookings) {
    const [[service]] = await connection.query('SELECT id, price_bob FROM tourist_services WHERE code = ?', [serviceCode]);
    const amount = Number(service.price_bob) * quantity;
    await connection.query(
      `INSERT INTO bookings (code, customer_user_id, created_by_user_id, status, total_amount, booked_at)
       VALUES (?, ?, ?, ?, ?, DATE_SUB(NOW(), INTERVAL ? DAY))
       ON DUPLICATE KEY UPDATE customer_user_id = VALUES(customer_user_id), status = VALUES(status),
         total_amount = VALUES(total_amount), booked_at = VALUES(booked_at)`,
      [code, userIds[customerKey], userIds[customerKey], status, amount, daysAgo],
    );
    const [[booking]] = await connection.query('SELECT id FROM bookings WHERE code = ?', [code]);
    bookingIds[code] = booking.id;
    const [[item]] = await connection.query('SELECT id FROM booking_items WHERE booking_id = ? AND service_id = ?', [booking.id, service.id]);
    if (!item) await connection.query(
      `INSERT INTO booking_items (booking_id, service_id, quantity, unit_price, service_date)
       VALUES (?, ?, ?, ?, DATE_ADD(CURDATE(), INTERVAL 14 DAY))`,
      [booking.id, service.id, quantity, service.price_bob],
    );
    if (status !== 'pending' && status !== 'cancelled') {
      const paymentStatus = status === 'refunded' ? 'refunded' : status === 'partially_refunded' ? 'partially_refunded' : 'approved';
      const reference = `PAY-${code.replace('RES-', '')}`;
      await connection.query(
        `INSERT INTO payments (booking_id, reference_code, method, status, amount, paid_at)
         VALUES (?, ?, 'card_simulated', ?, ?, DATE_SUB(NOW(), INTERVAL ? DAY))
         ON DUPLICATE KEY UPDATE status = VALUES(status), amount = VALUES(amount), paid_at = VALUES(paid_at)`,
        [booking.id, reference, paymentStatus, amount, daysAgo],
      );
    }
  }

  const cancellationSeeds = [
    ['RES-DEMO-001', 'CUSTOMER', 'Solicitud de reembolso: cambio de fechas para demostración', 'requested'],
    ['RES-DEMO-005', 'CUSTOMER_MATEO', 'Cancelación por cambio de agenda', 'approved'],
    ['RES-DEMO-008', 'CUSTOMER_FERNANDA', 'Reembolso parcial por actividad no realizada', 'approved'],
    ['RES-DEMO-009', 'CUSTOMER_RENATO', 'Reembolso total por clima', 'approved'],
    ['RES-DEMO-010', 'CUSTOMER_LAURA', 'Consulta de cancelación fuera de plazo', 'rejected'],
  ];
  for (const [bookingCode, customerKey, reason, status] of cancellationSeeds) {
    const bookingId = bookingIds[bookingCode];
    const [[existing]] = await connection.query('SELECT id FROM cancellations WHERE booking_id = ? AND reason = ?', [bookingId, reason]);
    if (!existing) await connection.query(
      `INSERT INTO cancellations (booking_id, requested_by_user_id, reason, status, resolved_at)
       VALUES (?, ?, ?, ?, IF(? = 'requested', NULL, NOW()))`,
      [bookingId, userIds[customerKey], reason, status, status],
    );
  }

  const complaintSeeds = [
    ['REC-DEMO-001', 'CUSTOMER', 'RES-DEMO-001', 'Consulta sobre el itinerario', 'open'],
    ['REC-DEMO-002', 'CUSTOMER_LAURA', 'RES-DEMO-002', 'Confirmación del punto de encuentro', 'resolved'],
    ['REC-DEMO-003', 'CUSTOMER_DIEGO', 'RES-DEMO-003', 'Demora en la salida', 'in_progress'],
    ['REC-DEMO-004', 'CUSTOMER_CAMILA', 'RES-DEMO-004', 'Consulta sobre equipaje', 'closed'],
    ['REC-DEMO-005', 'CUSTOMER_MATEO', 'RES-DEMO-005', 'Seguimiento de cancelación', 'resolved'],
    ['REC-DEMO-006', 'CUSTOMER_VALERIA', 'RES-DEMO-006', 'Solicitud de opción vegetariana', 'open'],
    ['REC-DEMO-007', 'CUSTOMER_FERNANDA', 'RES-DEMO-008', 'Actividad incompleta', 'in_progress'],
    ['REC-DEMO-008', 'CUSTOMER_RENATO', 'RES-DEMO-009', 'Estado del reembolso', 'resolved'],
  ];
  for (const [code, customerKey, bookingCode, subject, status] of complaintSeeds) {
    const resolved = ['resolved', 'closed'].includes(status);
    await connection.query(
      `INSERT INTO complaints
       (code, customer_user_id, booking_id, assigned_to_user_id, subject, description, status, resolution, resolved_at)
       VALUES (?, ?, ?, ?, ?, 'Caso sintético para demostrar la gestión administrativa.', ?, ?, ?)
       ON DUPLICATE KEY UPDATE assigned_to_user_id = VALUES(assigned_to_user_id), subject = VALUES(subject),
         status = VALUES(status), resolution = VALUES(resolution), resolved_at = VALUES(resolved_at)`,
      [code, userIds[customerKey], bookingIds[bookingCode], userIds.SUPPORT, subject, status,
       resolved ? 'Caso atendido satisfactoriamente en la demostración.' : null, resolved ? new Date() : null],
    );
  }
  await connection.commit();
  process.stdout.write(JSON.stringify({
    ok: true,
    password: 'Demo1234!',
    accounts: credentials.map(([, role, email]) => ({ role, email })),
    seeded: { users: credentials.length, bookings: demoBookings.length, complaints: complaintSeeds.length },
  }, null, 2));
} catch (error) {
  await connection.rollback();
  throw error;
} finally {
  await connection.end();
}
