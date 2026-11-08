import {
  Body,
  Controller,
  Get,
  Param,
  ParseIntPipe,
  Patch,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import {
  BookingDto,
  AssistantDto,
  CancellationDto,
  CatalogQueryDto,
  DashboardQueryDto,
  ComplaintDto,
  ComplaintUpdateDto,
  PaymentDto,
  PolicyDto,
  ProviderDto,
  RefundDto,
  ResolutionDto,
  ServiceDto,
  ServiceUpdateDto,
  UserUpdateDto,
} from './dto';
import { DomainService } from './domain.service';
import { CurrentUser, JwtAuthGuard, Roles, RolesGuard, type AuthUser } from './security';

@Controller()
export class DomainController {
  constructor(private readonly domain: DomainService) {}

  @Get('catalog/metadata')
  metadata(): Promise<Record<string, unknown>> { return this.domain.metadata(); }

  @Get('catalog/services')
  services(@Query() query: CatalogQueryDto): Promise<Record<string, unknown>[]> {
    return this.domain.services(query);
  }

  @Get('catalog/services/:id')
  service(@Param('id', ParseIntPipe) id: number): Promise<Record<string, unknown>> {
    return this.domain.service(id);
  }

  @Get('recommendations')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('CUSTOMER')
  recommendations(@CurrentUser() user: AuthUser): Promise<Record<string, unknown>[]> {
    return this.domain.recommendations(user);
  }

  @Get('admin/users')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN')
  users(): Promise<Record<string, unknown>[]> { return this.domain.users(); }

  @Patch('admin/users/:id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN')
  updateUser(
    @CurrentUser() user: AuthUser,
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: UserUpdateDto,
  ): Promise<Record<string, unknown>> { return this.domain.updateUser(user, id, dto); }

  @Get('providers')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN', 'PROVIDER')
  providers(): Promise<Record<string, unknown>[]> { return this.domain.providers(); }

  @Post('admin/providers')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN')
  createProvider(@CurrentUser() user: AuthUser, @Body() dto: ProviderDto): Promise<Record<string, unknown>> {
    return this.domain.createProvider(user, dto);
  }

  @Post('services')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN', 'PROVIDER')
  createService(@CurrentUser() user: AuthUser, @Body() dto: ServiceDto): Promise<Record<string, unknown>> {
    return this.domain.createService(user, dto);
  }

  @Patch('services/:id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN', 'PROVIDER')
  updateService(
    @CurrentUser() user: AuthUser,
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: ServiceUpdateDto,
  ): Promise<Record<string, unknown>> { return this.domain.updateService(user, id, dto); }

  @Get('provider/services')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('PROVIDER')
  providerServices(@CurrentUser() user: AuthUser): Promise<Record<string, unknown>[]> {
    return this.domain.providerServices(user);
  }

  @Get('bookings')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('CUSTOMER', 'ADMIN')
  bookings(@CurrentUser() user: AuthUser): Promise<Record<string, unknown>[]> { return this.domain.bookings(user); }

  @Post('bookings')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('CUSTOMER')
  createBooking(@CurrentUser() user: AuthUser, @Body() dto: BookingDto): Promise<Record<string, unknown>> {
    return this.domain.createBooking(user, dto);
  }

  @Get('bookings/:id/itinerary')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('CUSTOMER', 'ADMIN')
  itinerary(@CurrentUser() user: AuthUser, @Param('id', ParseIntPipe) id: number): Promise<Record<string, unknown>> {
    return this.domain.itinerary(user, id);
  }

  @Get('bookings/:id/status')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('CUSTOMER', 'ADMIN')
  status(@CurrentUser() user: AuthUser, @Param('id', ParseIntPipe) id: number): Promise<Record<string, unknown>> {
    return this.domain.itinerary(user, id);
  }

  @Post('bookings/:id/payments')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('CUSTOMER')
  pay(
    @CurrentUser() user: AuthUser,
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: PaymentDto,
  ): Promise<Record<string, unknown>> { return this.domain.pay(user, id, dto); }

  @Post('bookings/:id/cancellations')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('CUSTOMER')
  cancel(
    @CurrentUser() user: AuthUser,
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: CancellationDto,
  ): Promise<Record<string, unknown>> { return this.domain.cancel(user, id, dto); }

  @Post('bookings/:id/refunds')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('CUSTOMER')
  requestRefund(
    @CurrentUser() user: AuthUser,
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: CancellationDto,
  ): Promise<Record<string, unknown>> { return this.domain.requestRefund(user, id, dto); }

  @Get('complaints')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('CUSTOMER', 'SUPPORT', 'ADMIN')
  complaints(@CurrentUser() user: AuthUser): Promise<Record<string, unknown>[]> { return this.domain.complaints(user); }

  @Post('complaints')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('CUSTOMER')
  complaint(@CurrentUser() user: AuthUser, @Body() dto: ComplaintDto): Promise<Record<string, unknown>> {
    return this.domain.createComplaint(user, dto);
  }

  @Get('support/cancellations')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('SUPPORT', 'ADMIN')
  cancellations(): Promise<Record<string, unknown>[]> { return this.domain.supportCancellations(); }

  @Patch('support/cancellations/:id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('SUPPORT', 'ADMIN')
  resolveCancellation(
    @CurrentUser() user: AuthUser,
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: ResolutionDto,
  ): Promise<Record<string, unknown>> { return this.domain.resolveCancellation(user, id, dto); }

  @Post('support/cancellations/:id/refunds')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('SUPPORT', 'ADMIN')
  refund(
    @CurrentUser() user: AuthUser,
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: RefundDto,
  ): Promise<Record<string, unknown>> { return this.domain.refund(user, id, dto); }

  @Patch('support/complaints/:id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('SUPPORT', 'ADMIN')
  updateComplaint(
    @CurrentUser() user: AuthUser,
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: ComplaintUpdateDto,
  ): Promise<Record<string, unknown>> { return this.domain.updateComplaint(user, id, dto); }

  @Get('policies')
  policies(): Promise<Record<string, unknown>[]> { return this.domain.policies(true); }

  @Post('admin/policies')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN')
  createPolicy(@CurrentUser() user: AuthUser, @Body() dto: PolicyDto): Promise<Record<string, unknown>> {
    return this.domain.createPolicy(user, dto);
  }

  @Get('admin/reports')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN')
  report(): Promise<Record<string, unknown>> { return this.domain.report(); }

  @Get('admin/dashboard')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN')
  dashboard(@Query() query: DashboardQueryDto): Promise<Record<string, unknown>> {
    return this.domain.dashboard(query);
  }

  @Get('admin/cancellation-risk')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN')
  cancellationRisk(@Query() query: DashboardQueryDto): Promise<Record<string, unknown>[]> {
    return this.domain.cancellationRisks(query);
  }

  @Post('admin/assistant')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN')
  assistant(@Body() dto: AssistantDto): Promise<Record<string, unknown>> {
    return this.domain.adminAssistant(dto.message);
  }

  @Get('admin/audit')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN')
  audit(): Promise<Record<string, unknown>[]> { return this.domain.auditLogs(); }
}
