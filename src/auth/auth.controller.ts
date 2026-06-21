import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  Post,
  Req,
  UseGuards,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { Request } from 'express';
import { AuthService, Requester } from './auth.service';
import { extractBearerToken, JwtAuthGuard } from './jwt-auth.guard';
import { LoginDto } from './dto/login.dto';
import { RegisterDto } from './dto/register.dto';

@Controller('auth')
export class AuthController {
  constructor(
    private readonly authService: AuthService,
    private readonly jwt: JwtService,
  ) {}

  // GET /auth/status  →  Tells the frontend whether a first admin exists yet
  @Get('status')
  status() {
    return { hasAdmin: this.authService.hasAdmin() };
  }

  // POST /auth/register  →  Bootstrap first admin (open) or add more (super admin only)
  @Post('register')
  @HttpCode(HttpStatus.CREATED)
  register(@Body() dto: RegisterDto, @Req() req: Request) {
    return this.authService.register(dto.username, dto.password, this.requesterFrom(req));
  }

  // POST /auth/login  →  Returns a JWT access token
  @Post('login')
  @HttpCode(HttpStatus.OK)
  login(@Body() dto: LoginDto) {
    return this.authService.login(dto.username, dto.password);
  }

  // GET /auth/me  →  Current logged-in admin + role (protected)
  @Get('me')
  @UseGuards(JwtAuthGuard)
  me(@Req() req: Request) {
    const admin = (req as any).admin;
    return { username: admin.username, isSuperAdmin: !!admin.isSuperAdmin };
  }

  // GET /auth/admins  →  List all admins (protected)
  @Get('admins')
  @UseGuards(JwtAuthGuard)
  admins() {
    return this.authService.listAdmins();
  }

  // DELETE /auth/admins/:username  →  Remove an admin (super admin only)
  @Delete('admins/:username')
  @UseGuards(JwtAuthGuard)
  remove(@Param('username') username: string, @Req() req: Request) {
    return this.authService.removeAdmin(username, {
      isSuperAdmin: !!(req as any).admin.isSuperAdmin,
    });
  }

  /** Build a Requester from the token if present & valid, else null. */
  private requesterFrom(req: Request): Requester | null {
    const token = extractBearerToken(req);
    if (!token) return null;
    try {
      const payload = this.jwt.verify(token);
      return { isSuperAdmin: !!payload.isSuperAdmin };
    } catch {
      return null;
    }
  }
}
