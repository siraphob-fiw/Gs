import { createParamDecorator, ExecutionContext } from '@nestjs/common';
import { RequestContext } from '@strengthos/shared-types';

export const User = createParamDecorator(
  (data: keyof RequestContext | undefined, ctx: ExecutionContext): any => {
    const request = ctx.switchToHttp().getRequest();
    const headers = request.headers || {};
    const user = request.user || {};

    const payload: RequestContext = {
      userId: headers['x-user-id'] || user.userId,
      tenantId: headers['x-tenant-id'] || user.tenantId,
      sessionId: user.sessionId,
      ipAddress: request.ip,
      userAgent:
        typeof request.get === 'function'
          ? request.get('User-Agent')
          : headers['user-agent'],
      requestId: request.requestId || headers['x-request-id'],
    };

    if (data) {
      return payload?.[data];
    }

    return payload;
  },
);
