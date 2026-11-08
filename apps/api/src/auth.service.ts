import {
  ConflictException,
  Injectable,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { compare, hash } from 'bcryptjs';
import { DataSource } from 'typeorm';
import { LoginDto, ProfileDto, RegisterDto } from './dto';
import type { AuthUser, RoleCode } from './security';

interface UserRow {
  id: number;
  email: string;
  password_hash: string;
  first_name: string;
  last_name: string;
  phone: string | null;
  status: string;
  role_code: RoleCode;
}

@Injectable()
export class AuthService {
  constructor(
    private readonly db: DataSource,
    private readonly jwt: JwtService,
  ) {}

  async register(dto: RegisterDto): Promise<Record<string, unknown>> {
    const existing = (await this.db.query('SELECT id FROM app_users WHERE email = ? LIMIT 1', [
      dto.email.toLowerCase(),
    ])) as Array<{ id: number }>;
    if (existing.length) throw new ConflictException('El correo ya está registrado');

    const runner = this.db.createQueryRunner();
    await runner.connect();
    await runner.startTransaction();
    try {
      const roleCode: 'CUSTOMER' | 'PROVIDER' = dto.role ?? 'CUSTOMER';
      const roles = (await runner.query('SELECT id FROM roles WHERE code = ? LIMIT 1', [roleCode])) as Array<{
        id: number;
      }>;
      if (!roles.length) throw new NotFoundException(`Rol ${roleCode} no configurado`);
      const passwordHash = await hash(dto.password, 12);
      const result = (await runner.query(
        `INSERT INTO app_users (role_id, email, password_hash, first_name, last_name, phone, status)
         VALUES (?, ?, ?, ?, ?, ?, 'active')`,
        [roles[0].id, dto.email.toLowerCase(), passwordHash, dto.firstName, dto.lastName, dto.phone ?? null],
      )) as { insertId: number };
      if (roleCode === 'CUSTOMER') {
        await runner.query('INSERT INTO customer_profiles (user_id) VALUES (?)', [result.insertId]);
      } else {
        const tradeName = dto.providerTradeName ?? `${dto.firstName} ${dto.lastName}`;
        const provider = (await runner.query(
          `INSERT INTO providers (code, legal_name, trade_name, email, phone, status)
           VALUES (?, ?, ?, ?, ?, 'active')`,
          [`PROV-U${result.insertId}`, tradeName, tradeName, dto.email.toLowerCase(), dto.phone ?? null],
        )) as { insertId: number };
        await runner.query('INSERT INTO provider_users (user_id, provider_id) VALUES (?, ?)', [
          result.insertId,
          provider.insertId,
        ]);
      }
      await runner.query(
        `INSERT INTO audit_logs (actor_user_id, action, entity_type, entity_id, details)
         VALUES (?, 'USER_REGISTERED', 'app_users', ?, JSON_OBJECT('role', ?))`,
        [result.insertId, String(result.insertId), roleCode],
      );
      await runner.commitTransaction();
      return this.issueToken({
        id: result.insertId,
        email: dto.email.toLowerCase(),
        role: roleCode,
        firstName: dto.firstName,
        lastName: dto.lastName,
      });
    } catch (error) {
      await runner.rollbackTransaction();
      throw error;
    } finally {
      await runner.release();
    }
  }

  async login(dto: LoginDto): Promise<Record<string, unknown>> {
    const rows = (await this.db.query(
      `SELECT u.id, u.email, u.password_hash, u.first_name, u.last_name, u.phone, u.status,
              r.code AS role_code
       FROM app_users u JOIN roles r ON r.id = u.role_id
       WHERE u.email = ? LIMIT 1`,
      [dto.email.toLowerCase()],
    )) as UserRow[];
    const user = rows[0];
    if (!user || !(await compare(dto.password, user.password_hash))) {
      throw new UnauthorizedException('Correo o contraseña incorrectos');
    }
    if (user.status !== 'active') throw new UnauthorizedException(`Cuenta ${user.status}`);
    await this.db.query('UPDATE app_users SET last_login_at = NOW() WHERE id = ?', [user.id]);
    await this.audit(user.id, 'USER_LOGIN', 'app_users', user.id);
    return this.issueToken({
      id: user.id,
      email: user.email,
      role: user.role_code,
      firstName: user.first_name,
      lastName: user.last_name,
    });
  }

  async getProfile(user: AuthUser): Promise<Record<string, unknown>> {
    const accounts = (await this.db.query(
      `SELECT u.id, u.email, u.first_name AS firstName, u.last_name AS lastName, u.phone,
              u.status, u.last_login_at AS lastLoginAt, r.code AS role,
              cp.max_budget_bob AS maxBudgetBob, cp.available_days AS availableDays, cp.notes
       FROM app_users u JOIN roles r ON r.id = u.role_id
       LEFT JOIN customer_profiles cp ON cp.user_id = u.id
       WHERE u.id = ?`,
      [user.sub],
    )) as Array<Record<string, unknown>>;
    if (!accounts.length) throw new NotFoundException('Usuario no encontrado');
    const interests = (await this.db.query(
      `SELECT i.id, i.code, i.name, ci.weight
       FROM customer_interests ci JOIN interests i ON i.id = ci.interest_id
       WHERE ci.user_id = ? ORDER BY i.name`,
      [user.sub],
    )) as Array<Record<string, unknown>>;
    const provider = (await this.db.query(
      `SELECT p.id, p.code, p.trade_name AS tradeName, p.status
       FROM provider_users pu JOIN providers p ON p.id = pu.provider_id WHERE pu.user_id = ?`,
      [user.sub],
    )) as Array<Record<string, unknown>>;
    return { ...accounts[0], interests, provider: provider[0] ?? null };
  }

  async updateProfile(user: AuthUser, dto: ProfileDto): Promise<Record<string, unknown>> {
    const accountColumns: string[] = [];
    const accountValues: unknown[] = [];
    const map: Array<[keyof ProfileDto, string]> = [
      ['firstName', 'first_name'],
      ['lastName', 'last_name'],
      ['phone', 'phone'],
    ];
    for (const [property, column] of map) {
      if (dto[property] !== undefined) {
        accountColumns.push(`${column} = ?`);
        accountValues.push(dto[property]);
      }
    }
    if (accountColumns.length) {
      await this.db.query(`UPDATE app_users SET ${accountColumns.join(', ')} WHERE id = ?`, [
        ...accountValues,
        user.sub,
      ]);
    }
    if (user.role === 'CUSTOMER') {
      await this.db.query('INSERT IGNORE INTO customer_profiles (user_id) VALUES (?)', [user.sub]);
      const profileColumns: string[] = [];
      const profileValues: unknown[] = [];
      const profileMap: Array<[keyof ProfileDto, string]> = [
        ['maxBudgetBob', 'max_budget_bob'],
        ['availableDays', 'available_days'],
        ['notes', 'notes'],
      ];
      for (const [property, column] of profileMap) {
        if (dto[property] !== undefined) {
          profileColumns.push(`${column} = ?`);
          profileValues.push(dto[property]);
        }
      }
      if (profileColumns.length) {
        await this.db.query(`UPDATE customer_profiles SET ${profileColumns.join(', ')} WHERE user_id = ?`, [
          ...profileValues,
          user.sub,
        ]);
      }
      if (dto.interestIds) {
        const runner = this.db.createQueryRunner();
        await runner.connect();
        await runner.startTransaction();
        try {
          await runner.query('DELETE FROM customer_interests WHERE user_id = ?', [user.sub]);
          for (const interestId of dto.interestIds) {
            await runner.query(
              'INSERT INTO customer_interests (user_id, interest_id, weight) VALUES (?, ?, 1.00)',
              [user.sub, interestId],
            );
          }
          await runner.commitTransaction();
        } catch (error) {
          await runner.rollbackTransaction();
          throw error;
        } finally {
          await runner.release();
        }
      }
    }
    await this.audit(user.sub, 'PROFILE_UPDATED', 'app_users', user.sub);
    return this.getProfile(user);
  }

  private issueToken(input: { id: number; email: string; role: RoleCode; firstName: string; lastName: string }): Record<string, unknown> {
    const payload: AuthUser = { sub: input.id, email: input.email, role: input.role };
    return {
      accessToken: this.jwt.sign(payload),
      user: { id: input.id, email: input.email, role: input.role, firstName: input.firstName, lastName: input.lastName },
    };
  }

  private async audit(userId: number, action: string, entityType: string, entityId: number): Promise<void> {
    await this.db.query(
      'INSERT INTO audit_logs (actor_user_id, action, entity_type, entity_id) VALUES (?, ?, ?, ?)',
      [userId, action, entityType, String(entityId)],
    );
  }
}
