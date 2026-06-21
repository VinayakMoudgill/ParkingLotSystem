import {
  CanActivate,
  ExecutionContext,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { Request } from 'express';

/**
 * Protects routes by requiring a valid `Authorization: Bearer <token>` header.
 * On success, the decoded admin payload is attached to the request.
 */
@Injectable()
export class JwtAuthGuard implements CanActivate {
  constructor(private readonly jwt: JwtService) {}

  canActivate(context: ExecutionContext): boolean {
    const req = context.switchToHttp().getRequest<Request>();
    const token = extractBearerToken(req);
    if (!token) {
      throw new UnauthorizedException('Missing authentication token');
    }
    try {
      (req as any).admin = this.jwt.verify(token);
      return true;
    } catch {
      throw new UnauthorizedException('Invalid or expired token');
    }
  }
}

export function extractBearerToken(req: Request): string | undefined {
  const header = req.headers.authorization;
  if (!header) return undefined;
  const [type, token] = header.split(' ');
  return type === 'Bearer' && token ? token : undefined;
}
