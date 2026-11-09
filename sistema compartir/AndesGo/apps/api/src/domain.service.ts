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
  DashboardQueryDto,
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

  async dashboard(query: DashboardQueryDto): Promise<Record<string, unknown>> {
    const today = new Date();
    const defaultFrom = new Date(today);
    defaultFrom.setDate(defaultFrom.getDate() - 29);
    const dateFrom = query.dateFrom ?? defaultFrom.toISOString().slice(0, 10);
    const dateTo = query.dateTo ?? today.toISOString().slice(0, 10);
    if (dateFrom > dateTo) throw new BadRequestException('La fecha inicial no puede ser posterior a la fecha final');

    const conditions = ['DATE(b.booked_at) BETWEEN ? AND ?'];
    const values: unknown[] = [dateFrom, dateTo];
    if (query.status) { conditions.push('b.status = ?'); values.push(query.status); }
    if (query.destinationId) {
      conditions.push(`EXISTS (
        SELECT 1 FROM booking_items bx
        JOIN tourist_services sx ON sx.id = bx.service_id
        WHERE bx.booking_id = b.id AND sx.destination_id = ?
      )`);
      values.push(query.destinationId);
    }
    const where = conditions.join(' AND ');

    const [bookingRows, dailyRows, statusRows, destinationRows, topRows, revenueRows, cancellationRows, complaintRows, userRows, serviceRows] = await Promise.all([
      this.db.query(
        `SELECT b.id, b.code, b.status, b.total_amount AS totalAmount, b.booked_at AS bookedAt
         FROM bookings b WHERE ${where} ORDER BY b.booked_at DESC`, values,
      ),
      this.db.query(
        `SELECT DATE_FORMAT(DATE(b.booked_at), '%Y-%m-%d') AS date,
                COUNT(*) AS bookings, SUM(b.total_amount) AS amount
         FROM bookings b WHERE ${where}
         GROUP BY DATE_FORMAT(DATE(b.booked_at), '%Y-%m-%d')
         ORDER BY DATE_FORMAT(DATE(b.booked_at), '%Y-%m-%d')`, values,
      ),
      this.db.query(
        `SELECT b.status, COUNT(*) AS total FROM bookings b
         WHERE ${where} GROUP BY b.status ORDER BY b.status`, values,
      ),
      this.db.query(
        `SELECT d.id, d.city, COUNT(DISTINCT b.id) AS bookings, SUM(bi.quantity) AS travelers,
                SUM(bi.quantity * bi.unit_price) AS amount
         FROM bookings b
         JOIN booking_items bi ON bi.booking_id = b.id
         JOIN tourist_services s ON s.id = bi.service_id
         JOIN destinations d ON d.id = s.destination_id
         WHERE ${where}
         GROUP BY d.id, d.city ORDER BY bookings DESC, amount DESC`, values,
      ),
      this.db.query(
        `SELECT s.id, s.name, d.city, SUM(bi.quantity) AS bookings
         FROM bookings b
         JOIN booking_items bi ON bi.booking_id = b.id
         JOIN tourist_services s ON s.id = bi.service_id
         JOIN destinations d ON d.id = s.destination_id
         WHERE ${where}
         GROUP BY s.id, s.name, d.city ORDER BY bookings DESC LIMIT 5`, values,
      ),
      this.db.query(
        `SELECT COALESCE(SUM(p.amount), 0) AS total
         FROM payments p JOIN bookings b ON b.id = p.booking_id
         WHERE p.status IN ('approved', 'partially_refunded') AND ${where}`, values,
      ),
      this.db.query(
        `SELECT COUNT(*) AS total FROM cancellations c
         JOIN bookings b ON b.id = c.booking_id WHERE ${where}`, values,
      ),
      this.db.query(
        `SELECT COUNT(*) AS total FROM complaints
         WHERE status IN ('open', 'in_progress') AND DATE(created_at) BETWEEN ? AND ?`, [dateFrom, dateTo],
      ),
      this.db.query(
        `SELECT r.code AS role, u.status, COUNT(*) AS total
         FROM app_users u JOIN roles r ON r.id = u.role_id
         GROUP BY r.code, u.status ORDER BY r.code`,
      ),
      this.db.query("SELECT COUNT(*) AS total FROM tourist_services WHERE status = 'available'"),
    ]) as Row[][];

    const revenue = Number(revenueRows[0]?.total ?? 0);
    const totalUsers = userRows.reduce((sum, row) => sum + Number(row.total ?? 0), 0);
    const activeUsers = userRows
      .filter((row) => String(row.status) === 'active')
      .reduce((sum, row) => sum + Number(row.total ?? 0), 0);
    const usersByRole = userRows.reduce((summary: Record<string, number>, row) => {
      const role = String(row.role);
      summary[role] = (summary[role] ?? 0) + Number(row.total ?? 0);
      return summary;
    }, {});
    const bookingStatus = statusRows.map((row) => ({ status: String(row.status), total: Number(row.total ?? 0) }));
    const daily = dailyRows.map((row) => ({ date: String(row.date), bookings: Number(row.bookings ?? 0), amount: Number(row.amount ?? 0) }));
    const forecast = this.buildForecast(daily, dateFrom, dateTo, query.forecastDays ?? 7, bookingRows);
    const cancellationRisks = await this.cancellationRisks({ ...query, dateFrom: undefined, dateTo: undefined });
    const highRisk = cancellationRisks.filter((row) => row.level === 'high').length;
    const openComplaints = Number(complaintRows[0]?.total ?? 0);
    const cancellationCount = Number(cancellationRows[0]?.total ?? 0);
    const alerts: Row[] = [];
    if (openComplaints > 0) alerts.push({ severity: openComplaints >= 5 ? 'high' : 'medium', title: `${openComplaints} reclamo(s) requieren atención`, route: '/soporte' });
    if (highRisk > 0) alerts.push({ severity: 'high', title: `${highRisk} reserva(s) con riesgo alto de cancelación`, route: '/admin/reportes' });
    if (cancellationCount > 0) alerts.push({ severity: 'medium', title: `${cancellationCount} solicitud(es) de cancelación en el periodo`, route: '/soporte' });
    if (destinationRows.length) alerts.push({ severity: 'info', title: `${destinationRows[0].city} lidera la demanda del periodo`, route: '/admin/reportes' });

    return {
      generatedAt: new Date().toISOString(),
      filters: { dateFrom, dateTo, destinationId: query.destinationId ?? null, status: query.status ?? null, forecastDays: query.forecastDays ?? 7 },
      kpis: {
        bookings: bookingRows.length,
        confirmedBookings: bookingRows.filter((row) => ['confirmed', 'completed'].includes(String(row.status))).length,
        revenueBob: revenue,
        averageTicketBob: bookingRows.length ? Number((revenue / bookingRows.length).toFixed(2)) : 0,
        cancellations: cancellationCount,
        openComplaints,
        activeServices: Number(serviceRows[0]?.total ?? 0),
        totalUsers,
        activeUsers,
      },
      bookingStatus,
      daily,
      destinationDemand: destinationRows.map((row) => ({ ...row, bookings: Number(row.bookings), travelers: Number(row.travelers), amount: Number(row.amount) })),
      topServices: topRows.map((row) => ({ ...row, bookings: Number(row.bookings) })),
      usersByRole,
      forecast,
      cancellationRisks: cancellationRisks.slice(0, 10),
      alerts,
    };
  }

  async cancellationRisks(query: DashboardQueryDto = {}): Promise<Row[]> {
    const conditions = [query.status ? 'b.status = ?' : "b.status IN ('pending', 'confirmed')"];
    const values: unknown[] = query.status ? [query.status] : [];
    if (query.destinationId) {
      conditions.push(`EXISTS (
        SELECT 1 FROM booking_items bx JOIN tourist_services sx ON sx.id = bx.service_id
        WHERE bx.booking_id = b.id AND sx.destination_id = ?
      )`);
      values.push(query.destinationId);
    }
    const rows = (await this.db.query(
      `SELECT b.id, b.code, b.status, b.total_amount AS totalAmount, b.booked_at AS bookedAt,
              CONCAT(u.first_name, ' ', u.last_name) AS customer, u.email,
              DATEDIFF(MIN(bi.service_date), CURDATE()) AS daysUntilService,
              (SELECT COUNT(*) FROM cancellations c2
               JOIN bookings b2 ON b2.id = c2.booking_id
               WHERE b2.customer_user_id = b.customer_user_id AND b2.id <> b.id) AS priorCancellations,
              (SELECT COUNT(*) FROM complaints cp WHERE cp.customer_user_id = b.customer_user_id) AS complaints,
              EXISTS(SELECT 1 FROM payments p WHERE p.booking_id = b.id AND p.status IN ('approved', 'partially_refunded')) AS hasPayment
       FROM bookings b
       JOIN app_users u ON u.id = b.customer_user_id
       LEFT JOIN booking_items bi ON bi.booking_id = b.id
       WHERE ${conditions.join(' AND ')}
       GROUP BY b.id, b.code, b.status, b.total_amount, b.booked_at, u.first_name, u.last_name, u.email
       ORDER BY b.booked_at DESC LIMIT 60`, values,
    )) as Row[];

    return rows.map((row) => {
      const factors: string[] = [];
      const prior = Number(row.priorCancellations ?? 0);
      const complaints = Number(row.complaints ?? 0);
      const amount = Number(row.totalAmount ?? 0);
      const days = Number(row.daysUntilService ?? 0);
      const hasPayment = Boolean(row.hasPayment);
      let score = 10;
      if (String(row.status) === 'pending') { score += 10; factors.push('reserva pendiente'); }
      if (!hasPayment) { score += 15; factors.push('sin pago aprobado'); }
      if (prior > 0) { score += Math.min(30, prior * 12); factors.push(`${prior} cancelación(es) previas`); }
      if (complaints > 0) { score += Math.min(15, complaints * 5); factors.push(`${complaints} reclamo(s) asociado(s)`); }
      if (amount >= 800) { score += 10; factors.push('importe elevado'); }
      if (days >= 0 && days <= 3) { score += 15; factors.push('salida próxima'); }
      if (days > 30) { score += 5; factors.push('reserva con mucha anticipación'); }
      score = Math.min(100, score);
      const level = score >= 60 ? 'high' : score >= 35 ? 'medium' : 'low';
      return { ...row, totalAmount: amount, daysUntilService: days, score, level, factors: factors.length ? factors : ['sin señales relevantes'] };
    }).sort((a, b) => Number(b.score) - Number(a.score));
  }

  async adminAssistant(message: string): Promise<Record<string, unknown>> {
    const normalized = message.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase();
    const [report, risks, destinationRows] = await Promise.all([
      this.report(),
      this.cancellationRisks(),
      this.db.query(
        `SELECT d.city, COUNT(DISTINCT b.id) AS bookings
         FROM bookings b JOIN booking_items bi ON bi.booking_id = b.id
         JOIN tourist_services s ON s.id = bi.service_id
         JOIN destinations d ON d.id = s.destination_id
         GROUP BY d.id, d.city ORDER BY bookings DESC LIMIT 1`,
      ) as Promise<Row[]>,
    ]);
    const suggestedQuestions = [
      '¿Cuántas reservas están confirmadas?',
      '¿Cuál es el servicio más reservado?',
      '¿Cuántos reclamos están abiertos?',
      '¿Hay reservas con riesgo alto?',
    ];
    let intent = 'help';
    let answer = 'Puedo consultar reservas, ingresos, usuarios, reclamos, destinos, servicios populares y riesgo de cancelación.';
    let data: unknown = null;
    let actions = [{ label: 'Abrir dashboard', route: '/admin/reportes' }];

    if (/riesgo|cancelacion|cancelar/.test(normalized)) {
      intent = 'cancellation_risk';
      const high = risks.filter((row) => row.level === 'high');
      answer = high.length
        ? `Hay ${high.length} reserva(s) con riesgo alto. La de mayor puntuación es ${high[0].code} con ${high[0].score}/100.`
        : 'No hay reservas con riesgo alto en este momento.';
      data = high.slice(0, 5);
    } else if (/reclamo|queja|soporte/.test(normalized)) {
      intent = 'open_complaints';
      answer = `Actualmente existen ${Number(report.openComplaints ?? 0)} reclamo(s) abiertos o en progreso.`;
      data = { openComplaints: report.openComplaints };
      actions = [{ label: 'Abrir bandeja de atención', route: '/soporte' }];
    } else if (/ingreso|importe|venta|recaud/.test(normalized)) {
      intent = 'revenue';
      answer = `El importe aprobado o parcialmente reembolsado registrado es Bs ${Number(report.totalRevenueBob ?? 0).toFixed(2)}.`;
      data = { totalRevenueBob: report.totalRevenueBob };
    } else if (/usuario|cliente|proveedor|rol/.test(normalized)) {
      intent = 'users';
      answer = `Hay ${report.totalUsers} usuarios registrados y ${report.activeUsers} activos. La distribución por rol está disponible en el dashboard.`;
      data = { totalUsers: report.totalUsers, activeUsers: report.activeUsers, usersByRole: report.usersByRole };
      actions = [{ label: 'Administrar usuarios', route: '/admin/usuarios' }];
    } else if (/servicio|popular|mas reservado|más reservado/.test(normalized)) {
      intent = 'top_service';
      const top = (report.topServices as Row[] | undefined)?.[0];
      answer = top ? `${top.name} es el servicio más reservado, con ${top.bookings} reserva(s).` : 'Todavía no hay reservas suficientes para identificar un servicio líder.';
      data = top ?? null;
    } else if (/destino|ciudad|lugar/.test(normalized)) {
      intent = 'top_destination';
      const top = destinationRows[0];
      answer = top ? `${top.city} es el destino con mayor demanda, con ${top.bookings} reserva(s).` : 'Todavía no hay datos suficientes por destino.';
      data = top ?? null;
    } else if (/reserva|confirmada|pendiente/.test(normalized)) {
      intent = 'bookings';
      answer = `Hay ${report.bookings} reservas registradas; ${report.confirmedBookings} están confirmadas o completadas.`;
      data = { bookings: report.bookings, confirmedBookings: report.confirmedBookings };
    }

    return { intent, answer, data, actions, suggestedQuestions, confidence: intent === 'help' ? 0.55 : 0.92, mode: 'asistente determinístico con datos del sistema' };
  }

  private buildForecast(
    dailyRows: Array<{ date: string; bookings: number; amount: number }>,
    dateFrom: string,
    dateTo: string,
    forecastDays: number,
    bookingRows: Row[],
  ): Record<string, unknown> {
    const byDate = new Map(dailyRows.map((row) => [row.date, row]));
    const end = new Date(`${dateTo}T00:00:00Z`);
    const requestedStart = new Date(`${dateFrom}T00:00:00Z`);
    const earliest = new Date(end);
    earliest.setUTCDate(earliest.getUTCDate() - 59);
    const start = requestedStart > earliest ? requestedStart : earliest;
    const history: Array<{ date: string; bookings: number; amount: number }> = [];
    for (const cursor = new Date(start); cursor <= end; cursor.setUTCDate(cursor.getUTCDate() + 1)) {
      const date = cursor.toISOString().slice(0, 10);
      history.push(byDate.get(date) ?? { date, bookings: 0, amount: 0 });
    }
    const values = history.map((point) => point.bookings);
    const n = Math.max(1, values.length);
    const sumX = values.reduce((sum, _value, index) => sum + index, 0);
    const sumY = values.reduce((sum, value) => sum + value, 0);
    const sumXY = values.reduce((sum, value, index) => sum + index * value, 0);
    const sumXX = values.reduce((sum, _value, index) => sum + index * index, 0);
    const denominator = n * sumXX - sumX * sumX;
    const slope = denominator ? (n * sumXY - sumX * sumY) / denominator : 0;
    const intercept = (sumY - slope * sumX) / n;
    const mean = sumY / n;
    const residual = values.reduce((sum, value, index) => sum + (value - (intercept + slope * index)) ** 2, 0);
    const totalVariance = values.reduce((sum, value) => sum + (value - mean) ** 2, 0);
    const rSquared = totalVariance ? Math.max(0, 1 - residual / totalVariance) : 0.5;
    const averageTicket = bookingRows.length
      ? bookingRows.reduce((sum, row) => sum + Number(row.totalAmount ?? 0), 0) / bookingRows.length
      : 0;
    const points = Array.from({ length: forecastDays }, (_value, offset) => {
      const date = new Date(end);
      date.setUTCDate(date.getUTCDate() + offset + 1);
      const bookings = Number(Math.max(0, intercept + slope * (history.length + offset)).toFixed(1));
      return { date: date.toISOString().slice(0, 10), bookings, revenueBob: Number((bookings * averageTicket).toFixed(2)) };
    });
    const projectedBookings = Number(points.reduce((sum, point) => sum + point.bookings, 0).toFixed(1));
    const nonZeroDays = values.filter((value) => value > 0).length;
    const confidence = Math.round(Math.max(35, Math.min(88, 42 + rSquared * 30 + Math.min(12, nonZeroDays))));
    return {
      model: 'regresión lineal simple',
      history,
      points,
      projectedBookings,
      projectedRevenueBob: Number(points.reduce((sum, point) => sum + point.revenueBob, 0).toFixed(2)),
      trend: slope > 0.03 ? 'creciente' : slope < -0.03 ? 'decreciente' : 'estable',
      slope: Number(slope.toFixed(4)),
      confidence,
      disclaimer: 'Estimación académica basada en datos sintéticos; no constituye una predicción comercial.',
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
