import { Body, Controller, Get, Patch, Post, UseGuards } from '@nestjs/common';
import { AuthService } from './auth.service';
import { LoginDto, ProfileDto, RegisterDto } from './dto';
import { CurrentUser, JwtAuthGuard, type AuthUser } from './security';

@Controller('auth')
export class AuthController {
  constructor(private readonly auth: AuthService) {}

  @Post('register')
  register(@Body() dto: RegisterDto): Promise<Record<string, unknown>> { return this.auth.register(dto); }

  @Post('login')
  login(@Body() dto: LoginDto): Promise<Record<string, unknown>> { return this.auth.login(dto); }

  @Get('me')
  @UseGuards(JwtAuthGuard)
  profile(@CurrentUser() user: AuthUser): Promise<Record<string, unknown>> { return this.auth.getProfile(user); }

  @Patch('me')
  @UseGuards(JwtAuthGuard)
  updateProfile(@CurrentUser() user: AuthUser, @Body() dto: ProfileDto): Promise<Record<string, unknown>> {
    return this.auth.updateProfile(user, dto);
  }
}
