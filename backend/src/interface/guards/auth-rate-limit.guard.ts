import { CanActivate, ExecutionContext, Injectable, HttpException, HttpStatus } from '@nestjs/common';

interface RateLimitWindow {
  count: number;
  resetAt: number;
}

/**
 * A process-local guard for sensitive authentication routes. It constrains
 * both the caller IP and the submitted email; production deployments with
 * multiple backend replicas should replace this store with a shared cache.
 */
@Injectable()
export class AuthRateLimitGuard implements CanActivate {
  private readonly windows = new Map<string, RateLimitWindow>();

  canActivate(context: ExecutionContext): boolean {
    const request = context.switchToHttp().getRequest();
    const path = String(request.route?.path ?? request.path ?? 'auth');
    const email = String(request.body?.email ?? '').trim().toLowerCase() || 'unknown';
    const ip = request.ip || request.socket?.remoteAddress || 'unknown';
    const { limit, windowMs } = this.policyFor(path);

    this.consume(`${path}:ip:${ip}`, limit, windowMs);
    this.consume(`${path}:email:${email}`, limit, windowMs);
    return true;
  }

  private policyFor(path: string): { limit: number; windowMs: number } {
    // Relaxed limits for school project testing/demo to prevent blocking
    if (path.includes('login')) return { limit: 100, windowMs: 15 * 60_000 };
    if (path.includes('resend-otp') || path.includes('forgot-password')) {
      return { limit: 20, windowMs: 15 * 60_000 };
    }
    return { limit: 100, windowMs: 15 * 60_000 };
  }

  private consume(key: string, limit: number, windowMs: number): void {
    const now = Date.now();
    const current = this.windows.get(key);
    if (!current || current.resetAt <= now) {
      this.windows.set(key, { count: 1, resetAt: now + windowMs });
      return;
    }
    if (current.count >= limit) {
      throw new HttpException('Too many authentication attempts. Please try again later.', HttpStatus.TOO_MANY_REQUESTS);
    }
    current.count += 1;
  }
}
