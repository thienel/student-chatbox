import { Injectable, NestInterceptor, ExecutionContext, CallHandler } from '@nestjs/common';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { Request } from 'express';

@Injectable()
export class ResponseTransformInterceptor implements NestInterceptor {
  intercept(context: ExecutionContext, next: CallHandler): Observable<unknown> {
    const ctx = context.switchToHttp();
    const request = ctx.getRequest<Request>();

    // Skip SSE endpoints
    const acceptHeader = request.headers['accept'] ?? '';
    if (acceptHeader.includes('text/event-stream')) {
      return next.handle();
    }

    return next.handle().pipe(
      map((data) => ({
        success: true,
        data,
        message: 'OK',
      })),
    );
  }
}
