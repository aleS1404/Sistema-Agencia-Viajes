import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { JwtModule } from '@nestjs/jwt';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AppController } from './app.controller';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';
import { DomainController } from './domain.controller';
import { DomainService } from './domain.service';
import { JwtAuthGuard, RolesGuard } from './security';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    JwtModule.registerAsync({
      global: true,
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (config: ConfigService) => ({
        secret: config.get<string>('JWT_SECRET', 'cambiar-esta-clave-en-produccion'),
        signOptions: { expiresIn: '8h' },
      }),
    }),
    TypeOrmModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (config: ConfigService) => ({
        type: 'mysql' as const,
        host: config.get<string>('DB_HOST', 'db'),
        port: config.get<number>('DB_PORT', 3306),
        username: config.get<string>('DB_USER', 'booking_app'),
        password: config.get<string>('DB_PASSWORD', ''),
        database: config.get<string>('DB_NAME', 'booking_demo'),
        synchronize: false,
        retryAttempts: 20,
        retryDelay: 3000,
        timezone: '-04:00',
      }),
    }),
  ],
  controllers: [AppController, AuthController, DomainController],
  providers: [AuthService, DomainService, JwtAuthGuard, RolesGuard],
})
export class AppModule {}
