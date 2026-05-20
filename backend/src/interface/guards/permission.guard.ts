import { Injectable, CanActivate, ExecutionContext, ForbiddenException } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { PERMISSION_KEY } from '../decorators/require-permission.decorator';

@Injectable()
export class PermissionGuard implements CanActivate {
  constructor(private readonly reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const required = this.reflector.get<string>(PERMISSION_KEY, context.getHandler());
    if (!required) return true;

    const request = context.switchToHttp().getRequest();
    const user = request.user;

    if (!user || !user.permissions || !user.permissions.includes(required)) {
      throw new ForbiddenException('Insufficient permissions');
    }

    return true;
  }
}
