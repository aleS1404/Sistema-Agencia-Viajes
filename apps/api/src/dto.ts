import { Transform, Type } from 'class-transformer';
import {
  ArrayMinSize,
  IsArray,
  IsEmail,
  IsIn,
  IsInt,
  IsNumber,
  IsOptional,
  IsPositive,
  IsString,
  Length,
  MaxLength,
  Min,
  MinLength,
  ValidateNested,
} from 'class-validator';
import type { RoleCode } from './security';

export class RegisterDto {
  @IsEmail() email!: string;
  @MinLength(8) @MaxLength(72) password!: string;
  @IsString() @Length(2, 100) firstName!: string;
  @IsString() @Length(2, 120) lastName!: string;
  @IsOptional() @IsString() @MaxLength(30) phone?: string;
  @IsOptional() @IsIn(['CUSTOMER', 'PROVIDER']) role?: 'CUSTOMER' | 'PROVIDER';
  @IsOptional() @IsString() @Length(2, 180) providerTradeName?: string;
}

export class LoginDto {
  @IsEmail() email!: string;
  @IsString() password!: string;
}

export class ProfileDto {
  @IsOptional() @IsString() @Length(2, 100) firstName?: string;
  @IsOptional() @IsString() @Length(2, 120) lastName?: string;
  @IsOptional() @IsString() @MaxLength(30) phone?: string;
  @IsOptional() @IsNumber() @Min(0) maxBudgetBob?: number;
  @IsOptional() @IsInt() @IsPositive() availableDays?: number;
  @IsOptional() @IsString() @MaxLength(500) notes?: string;
  @IsOptional() @IsArray() @IsInt({ each: true }) interestIds?: number[];
}

export class UserUpdateDto {
  @IsOptional() @IsIn(['pending', 'active', 'blocked', 'disabled']) status?: string;
  @IsOptional() @IsIn(['ADMIN', 'CUSTOMER', 'SUPPORT', 'PROVIDER']) role?: RoleCode;
}

export class ProviderDto {
  @IsString() @Length(2, 30) code!: string;
  @IsString() @Length(2, 180) legalName!: string;
  @IsString() @Length(2, 180) tradeName!: string;
  @IsEmail() email!: string;
  @IsOptional() @IsString() @MaxLength(30) phone?: string;
  @IsOptional() @IsInt() userId?: number;
}

export class ServiceDto {
  @IsOptional() @IsInt() providerId?: number;
  @IsOptional() @IsInt() destinationId?: number;
  @IsOptional() @IsInt() categoryId?: number;
  @IsString() @Length(2, 30) code!: string;
  @IsString() @Length(2, 180) name!: string;
  @IsString() @MinLength(10) description!: string;
  @IsInt() @IsPositive() durationDays!: number;
  @IsNumber() @Min(0) priceBob!: number;
  @IsInt() @IsPositive() capacity!: number;
  @IsOptional() @IsArray() @IsInt({ each: true }) interestIds?: number[];
}

export class ServiceUpdateDto {
  @IsOptional() @IsString() @Length(2, 180) name?: string;
  @IsOptional() @IsString() @MinLength(10) description?: string;
  @IsOptional() @IsInt() @IsPositive() durationDays?: number;
  @IsOptional() @IsNumber() @Min(0) priceBob?: number;
  @IsOptional() @IsInt() @IsPositive() capacity?: number;
  @IsOptional() @IsIn(['draft', 'available', 'unavailable', 'archived']) status?: string;
}

export class BookingItemDto {
  @IsInt() serviceId!: number;
  @IsInt() @IsPositive() quantity!: number;
  @IsString() serviceDate!: string;
}

export class BookingDto {
  @IsArray() @ArrayMinSize(1) @ValidateNested({ each: true }) @Type(() => BookingItemDto)
  items!: BookingItemDto[];
}

export class PaymentDto {
  @IsIn(['cash', 'card_simulated', 'transfer_simulated']) method!: string;
  @IsOptional() @IsIn(['approved', 'rejected']) result?: string;
}

export class CancellationDto {
  @IsString() @Length(5, 500) reason!: string;
}

export class RefundDto {
  @IsNumber() @IsPositive() amount!: number;
}

export class ComplaintDto {
  @IsOptional() @IsInt() bookingId?: number;
  @IsString() @Length(3, 180) subject!: string;
  @IsString() @MinLength(10) description!: string;
}

export class ResolutionDto {
  @IsIn(['approved', 'rejected']) status!: string;
  @IsOptional() @IsString() @MaxLength(500) resolution?: string;
}

export class ComplaintUpdateDto {
  @IsOptional() @IsIn(['open', 'in_progress', 'resolved', 'closed']) status?: string;
  @IsOptional() @IsInt() assignedToUserId?: number;
  @IsOptional() @IsString() @MaxLength(1000) resolution?: string;
}

export class PolicyDto {
  @IsOptional() @IsString() @Length(2, 60) code?: string;
  @IsString() @Length(3, 120) name!: string;
  @IsInt() @Min(0) cancellationHours!: number;
  @IsNumber() @Min(0) refundPercentage!: number;
  @IsOptional() @IsString() @MaxLength(500) description?: string;
}

export class CatalogQueryDto {
  @IsOptional() @IsString() q?: string;
  @IsOptional() @Type(() => Number) @IsInt() destinationId?: number;
  @IsOptional() @Type(() => Number) @IsInt() categoryId?: number;
  @IsOptional() @Type(() => Number) @IsNumber() maxPrice?: number;
  @IsOptional() @Type(() => Number) @IsInt() maxDays?: number;
  @IsOptional() @Transform(({ value }: { value: string }) => value?.split(',').map(Number))
  @IsArray() @IsInt({ each: true }) ids?: number[];
}
