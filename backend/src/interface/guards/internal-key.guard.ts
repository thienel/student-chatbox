import { Injectable, CanActivate, ExecutionContext, ForbiddenException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Request } from 'express';

@Injectable()
export class InternalKeyGuard implements CanActivate {
  constructor(private readonly config: ConfigService) {}

  canActivate(context: ExecutionContext): boolean {
    const req = context.switchToHttp().getRequest<Request>();
    const key = req.headers['x-internal-key'];
    const expected = this.config.get<string>('AI_SERVICE_SECRET', '');
    if (!expected || key !== expected) {
      throw new ForbiddenException('Invalid internal key');
    }
    return true;
  }
}
