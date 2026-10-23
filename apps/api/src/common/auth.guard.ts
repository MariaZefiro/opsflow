import {
  Injectable,
  CanActivate,
  ExecutionContext,
  UnauthorizedException,
  SetMetadata,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { JwtService } from '@nestjs/jwt';
import { Role } from '@prisma/client';
import { Request } from 'express';
import { AuthUser } from './auth.types';

export const ROLES_KEY = 'roles';
export const Roles = (...roles: Role[]) => SetMetadata(ROLES_KEY, roles);

@Injectable()
export class AuthGuard implements CanActivate {
  constructor(
    private readonly jwt: JwtService,
    private readonly reflector: Reflector,
  ) {}

  canActivate(context: ExecutionContext): boolean {
    const request = context.switchToHttp().getRequest<Request & { user?: AuthUser }>();
    const header = request.headers.authorization;
    if (!header?.startsWith('Bearer ')) throw new UnauthorizedException();
    try {
      const payload = this.jwt.verify<AuthUser & { sub: string }>(header.slice(7), {
        secret: process.env.JWT_ACCESS_SECRET ?? 'development-access-secret',
      });
      request.user = { ...payload, id: payload.sub };
    } catch {
      throw new UnauthorizedException('Invalid or expired access token');
    }
    const required = this.reflector.getAllAndOverride<Role[]>(ROLES_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);
    if (required?.length && !required.includes(request.user.role))
      throw new UnauthorizedException('Insufficient role');
    return true;
  }
}

@Injectable()
export class TenantGuard implements CanActivate {
  canActivate(context: ExecutionContext): boolean {
    const request = context.switchToHttp().getRequest<Request & { user?: AuthUser }>();
    if (!request.user?.companyId) throw new UnauthorizedException('Tenant context is missing');
    return true;
  }
}
