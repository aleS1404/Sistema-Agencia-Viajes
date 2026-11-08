import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { randomUUID } from 'crypto';
import { DataSource } from 'typeorm';
import {
  BookingDto,
  CancellationDto,
  CatalogQueryDto,
  ComplaintDto,
  ComplaintUpdateDto,
  PaymentDto,
  PolicyDto,
  ProfileDto,
  ProviderDto,
  RefundDto,
  ResolutionDto,
  ServiceDto,
  ServiceUpdateDto,
  UserUpdateDto,
} from './dto';
import type { AuthUser } from './security';

type Row = Record<string, unknown>;

@Injectable()
export class DomainService {
  constructor(private readonly db: DataSource) {}

  async metadata(): Promise<Record<string, unknown>> {
    const [destinations, categories, interests] = await Promise.all([
      this.db.query('SELECT id, city, department, country FROM destinations ORDER BY city'),
      this.db.query('SELECT id, code, name FROM service_categories ORDER BY name'),
      this.db.query('SELECT id, code, name FROM interests ORDER BY name'),
    ]);
    return { destinations, categories, interests };
  }

  async services(query: CatalogQueryDto): Promise<Row[]> {
    const conditions = ["s.status = 'available'"];
    const values: unknown[] = [];
    if (query.q) {
      conditions.push('(s.name LIKE ? OR s.description LIKE ? OR d.city LIKE ?)');
      const term = `%${query.q}%`;
      values.push(term, term, term);
    }
    if (query.destinationId) { conditions.push('s.destination_id = ?'); values.push(query.destinationId); }
    if (query.categoryId) { conditions.push('s.category_id = ?'); values.push(query.categoryId); }
    if (query.maxPrice !== undefined) { conditions.push('s.price_bob <= ?'); values.push(query.maxPrice); }
    if (query.maxDays !== undefined) { conditions.push('s.duration_days <= ?'); values.push(query.maxDays); }
    if (query.ids?.length) {
      conditions.push(`s.id IN (${query.ids.map(() => '?').join(',')})`);
      values.push(...query.ids);
    }
    return (await this.db.query(
      `SELECT s.id, s.code, s.name, s.description, s.duration_days AS durationDays,
              s.price_bob AS priceBob, s.capacity, s.status,
              p.id AS providerId, p.trade_name AS provider,
              d.id AS destinationId, d.city, d.department,
              c.id AS categoryId, c.name AS category,
              GROUP_CONCAT(DISTINCT i.name ORDER BY i.name SEPARATOR ', ') AS interests
       FROM tourist_services s
       JOIN providers p ON p.id = s.provider_id
       JOIN destinations d ON d.id = s.destination_id
       JOIN service_categories c ON c.id = s.category_id
       LEFT JOIN service_interests si ON si.service_id = s.id
       LEFT JOIN interests i ON i.id = si.interest_id
       WHERE ${conditions.join(' AND ')}
       GROUP BY s.id, s.code, s.name, s.description, s.duration_days, s.price_bob, s.capacity,
                s.status, p.id, p.trade_name, d.id, d.city, d.department, c.id, c.name
       ORDER BY s.name`,
      values,
    )) as Row[];
  }

  async service(id: number): Promise<Row> {
    const rows = await this.services({ ids: [id] });
    if (!rows.length) throw new NotFoundException('Servicio no encontrado');
    return rows[0];
  }

  async recommendations(user: AuthUser): Promise<Row[]> {
    const profiles = (await this.db.query(
      'SELECT max_budget_bob, available_days FROM customer_profiles WHERE user_id = ?', [user.sub],
    )) as Array<{ max_budget_bob: string | null; available_days: number | null }>;
    const selected = (await this.db.query(
      'SELECT interest_id FROM customer_interests WHERE user_id = ?', [user.sub],
    )) as Array<{ interest_id: number }>;
    const profile = profiles[0] ?? { max_budget_bob: null, available_days: null };
    const interestIds = new Set(selected.map((row) => Number(row.interest_id)));
    const rows = (await this.db.query(
      `SELECT s.id, s.code, s.name, s.description, s.duration_days AS durationDays,
              s.price_bob AS priceBob, s.capacity, s.status,
              d.id AS destinationId, d.city, d.department, d.country,
              c.id AS categoryId, c.name AS category,
              p.id AS providerId, p.trade_name AS provider,
              GROUP_CONCAT(DISTINCT si.interest_id ORDER BY si.interest_id) AS interestIds,
              GROUP_CONCAT(DISTINCT i.name ORDER BY i.name SEPARATOR ', ') AS interests
       FROM tourist_services s
       JOIN providers p ON p.id = s.provider_id
       JOIN destinations d ON d.id = s.destination_id
       JOIN service_categories c ON c.id = s.category_id
       LEFT JOIN service_interests si ON si.service_id = s.id
       LEFT JOIN interests i ON i.id = si.interest_id
       WHERE s.status = 'available'
       GROUP BY s.id, s.code, s.name, s.description, s.duration_days, s.price_bob, s.capacity, s.status,
                d.id, d.city, d.department, d.country, c.id, c.name, p.id, p.trade_name`,
    )) as Array<Row & { durationDays: number; priceBob: string; interestIds: string | null }>;

    return rows
      .map((row) => {
        const tags = new Set((row.interestIds ?? '').split(',').filter(Boolean).map(Number));
        const matches = [...interestIds].filter((id) => tags.has(id)).length;
        const budget = profile.max_budget_bob === null || Number(row.priceBob) <= Number(profile.max_budget_bob);
        const days = profile.available_days === null || Number(row.durationDays) <= Number(profile.available_days);
        const score = matches * 30 + (budget ? 20 : 0) + (days ? 20 : 0) + 10;
        const reasons = [
          matches ? `${matches} interés(es) coincidente(s)` : 'opción de catálogo disponible',
          budget ? 'dentro del presupuesto' : 'supera el presupuesto indicado',
          days ? 'compatible con los días disponibles' : 'requiere más días',
        ];
        return { ...row, score, explanation: reasons.join('; ') };
      })
      .filter((row) => row.score >= 40)
      .sort((a, b) => Number(b.score) - Number(a.score) || Number(a.priceBob) - Number(b.priceBob))
      .slice(0, 5);
  }

  async users(): Promise<Row[]> {
    return (await this.db.query(
      `SELECT u.id, u.email, u.first_name AS firstName, u.last_name AS lastName, u.phone,
              u.status, r.code AS role, u.last_login_at AS lastLoginAt, u.created_at AS createdAt
       FROM app_users u JOIN roles r ON r.id = u.role_id ORDER BY u.created_at DESC`,
    )) as Row[];
  }

  async updateUser(actor: AuthUser, id: number, dto: UserUpdateDto): Promise<Row> {
    if (actor.sub === id && dto.status && dto.status !== 'active') {
      throw new BadRequestException('No puede desactivar su propia cuenta');
    }
    if (dto.status) await this.db.query('UPDATE app_users SET status = ? WHERE id = ?', [dto.status, id]);
    if (dto.role) {
      await this.db.query(
        'UPDATE app_users u JOIN roles r ON r.code = ? SET u.role_id = r.id WHERE u.id = ?',
        [dto.role, id],
      );
    }
    await this.audit(actor.sub, 'USER_ADMIN_UPDATED', 'app_users', id, dto);
    const rows = (await this.db.query(
      `SELECT u.id, u.email, u.status, r.code AS role FROM app_users u
       JOIN roles r ON r.id = u.role_id WHERE u.id = ?`, [id],
    )) as Row[];
    if (!rows.length) throw new NotFoundException('Usuario no encontrado');
    return rows[0];
  }

  async providers(): Promise<Row[]> {
    return (await this.db.query(
      `SELECT p.id, p.code, p.legal_name AS legalName, p.trade_name AS tradeName,
              p.email, p.phone, p.status, pu.user_id AS userId
       FROM providers p LEFT JOIN provider_users pu ON pu.provider_id = p.id ORDER BY p.trade_name`,
    )) as Row[];
  }

  async createProvider(actor: AuthUser, dto: ProviderDto): Promise<Row> {
    const result = (await this.db.query(
      `INSERT INTO providers (code, legal_name, trade_name, email, phone, status)
       VALUES (?, ?, ?, ?, ?, 'active')`,
      [dto.code, dto.legalName, dto.tradeName, dto.email, dto.phone ?? null],
    )) as { insertId: number };
    if (dto.userId) {
      await this.db.query('INSERT INTO provider_users (user_id, provider_id) VALUES (?, ?)', [dto.userId, result.insertId]);
    }
    await this.audit(actor.sub, 'PROVIDER_CREATED', 'providers', result.insertId, dto);
    return { id: result.insertId, ...dto, status: 'active' };
  }

  async createService(actor: AuthUser, dto: ServiceDto): Promise<Row> {
    let providerId = dto.providerId;
    if (actor.role === 'PROVIDER') {
      const owned = (await this.db.query('SELECT provider_id FROM provider_users WHERE user_id = ?', [actor.sub])) as Array<{ provider_id: number }>;
      if (!owned.length) throw new ForbiddenException('La cuenta no está vinculada con un proveedor');
      providerId = owned[0].provider_id;
    }
    if (!providerId) {
      const providers = (await this.db.query("SELECT id FROM providers WHERE status = 'active' ORDER BY id LIMIT 1")) as Array<{ id: number }>;
      providerId = providers[0]?.id;
    }
    let destinationId = dto.destinationId;
    let categoryId = dto.categoryId;
    if (!destinationId) {
      const destinations = (await this.db.query('SELECT id FROM destinations ORDER BY id LIMIT 1')) as Array<{ id: number }>;
      destinationId = destinations[0]?.id;
    }
    if (!categoryId) {
      const categories = (await this.db.query('SELECT id FROM service_categories ORDER BY id LIMIT 1')) as Array<{ id: number }>;
      categoryId = categories[0]?.id;
    }
    if (!providerId || !destinationId || !categoryId) throw new BadRequestException('Faltan datos base de catálogo');
    const result = (await this.db.query(
      `INSERT INTO tourist_services
       (provider_id, destination_id, category_id, code, name, description, duration_days, price_bob, capacity, status)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [providerId, destinationId, categoryId, dto.code, dto.name, dto.description,
       dto.durationDays, dto.priceBob, dto.capacity, actor.role === 'ADMIN' ? 'available' : 'draft'],
    )) as { insertId: number };
    for (const interestId of dto.interestIds ?? []) {
      await this.db.query('INSERT INTO service_interests (service_id, interest_id) VALUES (?, ?)', [result.insertId, interestId]);
    }
    await this.audit(actor.sub, 'SERVICE_CREATED', 'tourist_services', result.insertId, { code: dto.code });
    return { id: result.insertId, ...dto, providerId, destinationId, categoryId, status: actor.role === 'ADMIN' ? 'available' : 'draft' };
  }

  async providerServices(user: AuthUser): Promise<Row[]> {
    return (await this.db.query(
      `SELECT s.id, s.code, s.name, s.description, s.duration_days AS durationDays,
              s.price_bob AS priceBob, s.capacity, s.status,
              p.id AS providerId, p.trade_name AS provider,
              d.id AS destinationId, d.city, d.department,
              c.id AS categoryId, c.name AS category
       FROM tourist_services s
       JOIN providers p ON p.id = s.provider_id
       JOIN provider_users pu ON pu.provider_id = p.id
       JOIN destinations d ON d.id = s.destination_id
       JOIN service_categories c ON c.id = s.category_id
       WHERE pu.user_id = ? ORDER BY s.updated_at DESC`,
      [user.sub],
    )) as Row[];
  }

  async updateService(actor: AuthUser, id: number, dto: ServiceUpdateDto): Promise<Row> {
    if (actor.role === 'PROVIDER') {
      const ownership = (await this.db.query(
        `SELECT s.id FROM tourist_services s JOIN provider_users pu ON pu.provider_id = s.provider_id
         WHERE s.id = ? AND pu.user_id = ?`, [id, actor.sub],
      )) as Row[];
      if (!ownership.length) throw new ForbiddenException('El servicio no pertenece al proveedor');
    }
    const map: Array<[keyof ServiceUpdateDto, string]> = [
      ['name', 'name'], ['description', 'description'], ['durationDays', 'duration_days'],
      ['priceBob', 'price_bob'], ['capacity', 'capacity'], ['status', 'status'],
    ];
    const columns: string[] = [];
    const values: unknown[] = [];
    for (const [property, column] of map) {
      if (dto[property] !== undefined) { columns.push(`${column} = ?`); values.push(dto[property]); }
    }
    if (actor.role === 'PROVIDER') { columns.push("status = 'draft'"); }
    if (columns.length) await this.db.query(`UPDATE tourist_services SET ${columns.join(', ')} WHERE id = ?`, [...values, id]);
    await this.audit(actor.sub, 'SERVICE_UPDATED', 'tourist_services', id, dto);
    const rows = (await this.db.query('SELECT * FROM tourist_services WHERE id = ?', [id])) as Row[];
    if (!rows.length) throw new NotFoundException('Servicio no encontrado');
    return rows[0];
  }

  async bookings(user: AuthUser): Promise<Row[]> {
    const where = user.role === 'ADMIN' ? '' : 'WHERE b.customer_user_id = ?';
    const values = user.role === 'ADMIN' ? [] : [user.sub];
    return (await this.db.query(
      `SELECT b.id, b.code, b.customer_user_id AS customerUserId, b.status, b.currency,
              b.total_amount AS totalAmount, b.booked_at AS bookedAt,
              COUNT(bi.id) AS itemCount
       FROM bookings b LEFT JOIN booking_items bi ON bi.booking_id = b.id
       ${where} GROUP BY b.id ORDER BY b.booked_at DESC`, values,
    )) as Row[];
  }

  async createBooking(user: AuthUser, dto: BookingDto): Promise<Row> {
    const ids = dto.items.map((item) => item.serviceId);
    const rows = (await this.db.query(
      `SELECT id, price_bob, capacity, status FROM tourist_services WHERE id IN (${ids.map(() => '?').join(',')})`, ids,
    )) as Array<{ id: number; price_bob: string; capacity: number; status: string }>;
    if (rows.length !== new Set(ids).size) throw new BadRequestException('Uno o más servicios no existen');
    const byId = new Map(rows.map((row) => [Number(row.id), row]));
    let total = 0;
    for (const item of dto.items) {
      const service = byId.get(item.serviceId);
      if (!service || service.status !== 'available') throw new BadRequestException('Servicio no disponible');
      if (item.quantity > service.capacity) throw new BadRequestException('Cantidad superior a la capacidad');
      total += Number(service.price_bob) * item.quantity;
    }
    const runner = this.db.createQueryRunner();
    await runner.connect(); await runner.startTransaction();
    try {
      const code = `RES-${randomUUID().slice(0, 8).toUpperCase()}`;
      const result = (await runner.query(
        `INSERT INTO bookings (code, customer_user_id, created_by_user_id, status, total_amount)
         VALUES (?, ?, ?, 'pending', ?)`, [code, user.sub, user.sub, total],
      )) as { insertId: number };
      for (const item of dto.items) {
        const service = byId.get(item.serviceId)!;
        await runner.query(
          `INSERT INTO booking_items (booking_id, service_id, quantity, unit_price, service_date)
           VALUES (?, ?, ?, ?, ?)`,
          [result.insertId, item.serviceId, item.quantity, service.price_bob, item.serviceDate],
        );
      }
      await runner.query(
        `INSERT INTO audit_logs (actor_user_id, action, entity_type, entity_id, details)
         VALUES (?, 'BOOKING_CREATED', 'bookings', ?, JSON_OBJECT('total', ?))`,
        [user.sub, String(result.insertId), total],
      );
      await runner.commitTransaction();
      return { id: result.insertId, code, status: 'pending', totalAmount: total, items: dto.items };
    } catch (error) { await runner.rollbackTransaction(); throw error; }
    finally { await runner.release(); }
  }

  async itinerary(user: AuthUser, bookingId: number): Promise<Record<string, unknown>> {
    const booking = await this.assertBooking(user, bookingId);
    const items = (await this.db.query(
      `SELECT bi.id, bi.quantity, bi.unit_price AS unitPrice, bi.service_date AS serviceDate,
              s.id AS serviceId, s.name, s.duration_days AS durationDays,
              d.city, d.department, p.trade_name AS provider
       FROM booking_items bi JOIN tourist_services s ON s.id = bi.service_id
       JOIN destinations d ON d.id = s.destination_id JOIN providers p ON p.id = s.provider_id
       WHERE bi.booking_id = ? ORDER BY bi.service_date`, [bookingId],
    )) as Row[];
    const payments = (await this.db.query(
      'SELECT reference_code AS referenceCode, method, status, amount, paid_at AS paidAt FROM payments WHERE booking_id = ?',
      [bookingId],
    )) as Row[];
    return { booking, items, payments };
  }

  async pay(user: AuthUser, bookingId: number, dto: PaymentDto): Promise<Row> {
    const booking = await this.assertBooking(user, bookingId);
    if (!['pending', 'confirmed'].includes(String(booking.status))) throw new BadRequestException('La reserva no admite pagos');
    const amount = Number(booking.totalAmount);
    const resultStatus = dto.result ?? 'approved';
    const reference = `PAY-${randomUUID().slice(0, 12).toUpperCase()}`;
    const result = (await this.db.query(
      `INSERT INTO payments (booking_id, reference_code, method, status, amount, paid_at)
       VALUES (?, ?, ?, ?, ?, IF(? = 'approved', NOW(), NULL))`,
      [bookingId, reference, dto.method, resultStatus, amount, resultStatus],
    )) as { insertId: number };
    if (resultStatus === 'approved') await this.db.query("UPDATE bookings SET status = 'confirmed' WHERE id = ?", [bookingId]);
    await this.audit(user.sub, 'PAYMENT_RECORDED', 'payments', result.insertId, { bookingId, status: resultStatus, amount });
    return { id: result.insertId, referenceCode: reference, method: dto.method, status: resultStatus, amount };
  }

  async cancel(user: AuthUser, bookingId: number, dto: CancellationDto): Promise<Row> {
    const booking = await this.assertBooking(user, bookingId);
    if (!['pending', 'confirmed'].includes(String(booking.status))) throw new BadRequestException('La reserva no admite cancelación');
    const result = (await this.db.query(
      'INSERT INTO cancellations (booking_id, requested_by_user_id, reason) VALUES (?, ?, ?)',
      [bookingId, user.sub, dto.reason],
    )) as { insertId: number };
    await this.audit(user.sub, 'CANCELLATION_REQUESTED', 'cancellations', result.insertId, { bookingId });
    return { id: result.insertId, bookingId, reason: dto.reason, status: 'requested' };
  }

  async requestRefund(user: AuthUser, bookingId: number, dto: CancellationDto): Promise<Row> {
    await this.assertBooking(user, bookingId);
    const existing = (await this.db.query(
      `SELECT id, status, reason FROM cancellations
       WHERE booking_id = ? AND status IN ('requested', 'approved') ORDER BY id DESC LIMIT 1`,
      [bookingId],
    )) as Row[];
    if (existing.length) return { ...existing[0], bookingId, requestType: 'refund' };
    const result = (await this.db.query(
      `INSERT INTO cancellations (booking_id, requested_by_user_id, reason)
       VALUES (?, ?, ?)`,
      [bookingId, user.sub, `Solicitud de reembolso: ${dto.reason}`],
    )) as { insertId: number };
    await this.audit(user.sub, 'REFUND_REQUESTED', 'cancellations', result.insertId, { bookingId });
    return { id: result.insertId, bookingId, reason: dto.reason, status: 'requested', requestType: 'refund' };
  }

  async supportCancellations(): Promise<Row[]> {
    return (await this.db.query(
      `SELECT c.id, c.booking_id AS bookingId, c.reason, c.status, c.requested_at AS requestedAt,
              b.code AS bookingCode, b.total_amount AS totalAmount,
              CONCAT(u.first_name, ' ', u.last_name) AS customer
       FROM cancellations c JOIN bookings b ON b.id = c.booking_id
       JOIN app_users u ON u.id = b.customer_user_id ORDER BY c.requested_at DESC`,
    )) as Row[];
  }

  async resolveCancellation(actor: AuthUser, id: number, dto: ResolutionDto): Promise<Row> {
    const rows = (await this.db.query('SELECT booking_id FROM cancellations WHERE id = ?', [id])) as Array<{ booking_id: number }>;
    if (!rows.length) throw new NotFoundException('Cancelación no encontrada');
    await this.db.query('UPDATE cancellations SET status = ?, resolved_at = NOW() WHERE id = ?', [dto.status, id]);
    if (dto.status === 'approved') await this.db.query("UPDATE bookings SET status = 'cancelled' WHERE id = ?", [rows[0].booking_id]);
    await this.audit(actor.sub, 'CANCELLATION_RESOLVED', 'cancellations', id, dto);
    return { id, bookingId: rows[0].booking_id, status: dto.status };
  }

  async refund(actor: AuthUser, cancellationId: number, dto: RefundDto): Promise<Row> {
    const rows = (await this.db.query(
      `SELECT c.booking_id, c.status AS cancellation_status, p.id AS payment_id,
              p.amount AS paid_amount, p.status AS payment_status
       FROM cancellations c JOIN payments p ON p.booking_id = c.booking_id
       WHERE c.id = ? AND p.status IN ('approved', 'partially_refunded') ORDER BY p.id DESC LIMIT 1`, [cancellationId],
    )) as Array<{ booking_id: number; cancellation_status: string; payment_id: number; paid_amount: string; payment_status: string }>;
    const row = rows[0];
    if (!row || row.cancellation_status !== 'approved') throw new BadRequestException('Se requiere cancelación aprobada y pago válido');
    const prior = (await this.db.query(
      "SELECT COALESCE(SUM(amount), 0) AS refunded FROM refunds WHERE payment_id = ? AND status = 'approved'", [row.payment_id],
    )) as Array<{ refunded: string }>;
    if (dto.amount > Number(row.paid_amount) - Number(prior[0].refunded)) throw new BadRequestException('El reembolso supera el saldo pagado');
    const reference = `REF-${randomUUID().slice(0, 12).toUpperCase()}`;
    const result = (await this.db.query(
      `INSERT INTO refunds (cancellation_id, payment_id, reference_code, amount, status, processed_at)
       VALUES (?, ?, ?, ?, 'approved', NOW())`, [cancellationId, row.payment_id, reference, dto.amount],
    )) as { insertId: number };
    const full = dto.amount + Number(prior[0].refunded) >= Number(row.paid_amount);
    await this.db.query(`UPDATE payments SET status = ? WHERE id = ?`, [full ? 'refunded' : 'partially_refunded', row.payment_id]);
    await this.db.query(`UPDATE bookings SET status = ? WHERE id = ?`, [full ? 'refunded' : 'partially_refunded', row.booking_id]);
    await this.audit(actor.sub, 'REFUND_APPROVED', 'refunds', result.insertId, { amount: dto.amount });
    return { id: result.insertId, referenceCode: reference, amount: dto.amount, status: 'approved' };
  }

  async createComplaint(user: AuthUser, dto: ComplaintDto): Promise<Row> {
    if (dto.bookingId) await this.assertBooking(user, dto.bookingId);
    const code = `REC-${randomUUID().slice(0, 8).toUpperCase()}`;
    const result = (await this.db.query(
      `INSERT INTO complaints (code, customer_user_id, booking_id, subject, description)
       VALUES (?, ?, ?, ?, ?)`, [code, user.sub, dto.bookingId ?? null, dto.subject, dto.description],
    )) as { insertId: number };
    await this.audit(user.sub, 'COMPLAINT_CREATED', 'complaints', result.insertId, { code });
    return { id: result.insertId, code, status: 'open', ...dto };
  }

  async complaints(user: AuthUser): Promise<Row[]> {
    const limited = user.role === 'CUSTOMER';
    return (await this.db.query(
      `SELECT c.id, c.code, c.booking_id AS bookingId, c.subject, c.description, c.status,
              c.assigned_to_user_id AS assignedToUserId, c.resolution, c.created_at AS createdAt,
              CONCAT(u.first_name, ' ', u.last_name) AS customer
       FROM complaints c JOIN app_users u ON u.id = c.customer_user_id
       ${limited ? 'WHERE c.customer_user_id = ?' : ''} ORDER BY c.created_at DESC`, limited ? [user.sub] : [],
    )) as Row[];
  }

  async updateComplaint(actor: AuthUser, id: number, dto: ComplaintUpdateDto): Promise<Row> {
    const columns: string[] = []; const values: unknown[] = [];
    if (dto.status) { columns.push('status = ?'); values.push(dto.status); }
    if (dto.assignedToUserId) { columns.push('assigned_to_user_id = ?'); values.push(dto.assignedToUserId); }
    if (dto.resolution !== undefined) { columns.push('resolution = ?'); values.push(dto.resolution); }
    if (dto.status && ['resolved', 'closed'].includes(dto.status)) columns.push('resolved_at = NOW()');
    if (!columns.length) throw new BadRequestException('No hay cambios');
    await this.db.query(`UPDATE complaints SET ${columns.join(', ')} WHERE id = ?`, [...values, id]);
    await this.audit(actor.sub, 'COMPLAINT_UPDATED', 'complaints', id, dto);
    const rows = (await this.db.query('SELECT * FROM complaints WHERE id = ?', [id])) as Row[];
    if (!rows.length) throw new NotFoundException('Reclamo no encontrado');
    return rows[0];
  }

  async policies(activeOnly = false): Promise<Row[]> {
    return (await this.db.query(
      `SELECT id, code, name, description, minimum_hours_before_service AS minimumHoursBeforeService,
              refund_percentage AS refundPercentage, active, created_at AS createdAt, updated_at AS updatedAt
       FROM commercial_policies ${activeOnly ? 'WHERE active = 1' : ''} ORDER BY name`,
    )) as Row[];
  }

  async createPolicy(actor: AuthUser, dto: PolicyDto): Promise<Row> {
    if (dto.refundPercentage > 100) throw new BadRequestException('El porcentaje no puede superar 100');
    const result = (await this.db.query(
      `INSERT INTO commercial_policies
       (code, name, description, minimum_hours_before_service, refund_percentage, active, created_by_user_id)
       VALUES (?, ?, ?, ?, ?, 1, ?)`,
      [dto.code ?? `POL-${Date.now()}`, dto.name, dto.description ?? 'Política comercial del prototipo', dto.cancellationHours, dto.refundPercentage, actor.sub],
    )) as { insertId: number };
    await this.audit(actor.sub, 'POLICY_CREATED', 'commercial_policies', result.insertId, dto);
    return { id: result.insertId, ...dto, active: true };
  }

  async report(): Promise<Record<string, unknown>> {
    const [bookings, payments, cancellations, complaints, popular, users] = await Promise.all([
      this.db.query('SELECT status, COUNT(*) AS total, SUM(total_amount) AS amount FROM bookings GROUP BY status'),
      this.db.query('SELECT status, COUNT(*) AS total, SUM(amount) AS amount FROM payments GROUP BY status'),
      this.db.query('SELECT status, COUNT(*) AS total FROM cancellations GROUP BY status'),
      this.db.query('SELECT status, COUNT(*) AS total FROM complaints GROUP BY status'),
      this.db.query(
        `SELECT s.id, s.name, SUM(bi.quantity) AS reservations
         FROM booking_items bi JOIN tourist_services s ON s.id = bi.service_id
         GROUP BY s.id, s.name ORDER BY reservations DESC LIMIT 5`,
      ),
      this.db.query(
        `SELECT r.code AS role, u.status, COUNT(*) AS total
         FROM app_users u JOIN roles r ON r.id = u.role_id
         GROUP BY r.code, u.status ORDER BY r.code, u.status`,
      ),
    ]);
    const bookingCount = bookings.reduce((sum: number, row: Row) => sum + Number(row.total ?? 0), 0);
    const confirmedBookings = bookings
      .filter((row: Row) => ['confirmed', 'completed'].includes(String(row.status)))
      .reduce((sum: number, row: Row) => sum + Number(row.total ?? 0), 0);
    const totalRevenueBob = payments
      .filter((row: Row) => ['approved', 'partially_refunded'].includes(String(row.status)))
      .reduce((sum: number, row: Row) => sum + Number(row.amount ?? 0), 0);
    const cancellationCount = cancellations.reduce((sum: number, row: Row) => sum + Number(row.total ?? 0), 0);
    const openComplaints = complaints
      .filter((row: Row) => ['open', 'in_progress'].includes(String(row.status)))
      .reduce((sum: number, row: Row) => sum + Number(row.total ?? 0), 0);
    const totalUsers = users.reduce((sum: number, row: Row) => sum + Number(row.total ?? 0), 0);
    const activeUsers = users
      .filter((row: Row) => String(row.status) === 'active')
      .reduce((sum: number, row: Row) => sum + Number(row.total ?? 0), 0);
    const usersByRole = (users as Row[]).reduce((summary: Record<string, number>, row: Row) => {
      const role = String(row.role);
      summary[role] = (summary[role] ?? 0) + Number(row.total ?? 0);
      return summary;
    }, {});
    const activeRows = (await this.db.query("SELECT COUNT(*) AS total FROM tourist_services WHERE status = 'available'")) as Row[];
    return {
      generatedAt: new Date().toISOString(),
      bookings: bookingCount,
      confirmedBookings,
      totalRevenueBob,
      cancellations: cancellationCount,
      openComplaints,
      activeServices: Number(activeRows[0]?.total ?? 0),
      totalUsers,
      activeUsers,
      usersByRole,
      topServices: popular.map((row: Row) => ({ name: row.name, bookings: Number(row.reservations ?? 0) })),
      detail: { bookings, payments, cancellations, complaints, users },
    };
  }

  async auditLogs(): Promise<Row[]> {
    return (await this.db.query(
      `SELECT a.id, a.action, a.entity_type AS entityType, a.entity_id AS entityId,
              a.details, a.ip_address AS ipAddress, a.created_at AS createdAt,
              CONCAT(u.first_name, ' ', u.last_name) AS actor
       FROM audit_logs a LEFT JOIN app_users u ON u.id = a.actor_user_id
       ORDER BY a.created_at DESC LIMIT 200`,
    )) as Row[];
  }

  private async assertBooking(user: AuthUser, bookingId: number): Promise<Row> {
    const rows = (await this.db.query(
      `SELECT id, code, customer_user_id AS customerUserId, status, total_amount AS totalAmount,
              currency, booked_at AS bookedAt FROM bookings WHERE id = ?`, [bookingId],
    )) as Row[];
    if (!rows.length) throw new NotFoundException('Reserva no encontrada');
    if (user.role === 'CUSTOMER' && Number(rows[0].customerUserId) !== Number(user.sub)) {
      throw new ForbiddenException('La reserva pertenece a otro cliente');
    }
    return rows[0];
  }

  private async audit(userId: number, action: string, entity: string, entityId: number, details?: object): Promise<void> {
    await this.db.query(
      `INSERT INTO audit_logs (actor_user_id, action, entity_type, entity_id, details)
       VALUES (?, ?, ?, ?, ?)`,
      [userId, action, entity, String(entityId), details ? JSON.stringify(details) : null],
    );
  }
}
