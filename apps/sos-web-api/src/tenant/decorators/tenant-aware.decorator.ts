import { createParamDecorator, ExecutionContext } from '@nestjs/common';
import { TenantAwareRequest } from '../middleware/tenant-context.middleware';

// Decorator to get current tenant ID from request
export const CurrentTenant = createParamDecorator(
  (data: unknown, ctx: ExecutionContext): string | null => {
    const request = ctx.switchToHttp().getRequest<TenantAwareRequest>();
    return request.tenantId || null;
  },
);

// Decorator to get full tenant context from request
export const TenantContext = createParamDecorator(
  (data: unknown, ctx: ExecutionContext) => {
    const request = ctx.switchToHttp().getRequest<TenantAwareRequest>();
    return request.tenantContext || null;
  },
);

// Decorator to ensure tenant context is available
export const RequireTenantContext = () => {
  return (target: any, propertyKey: string, descriptor: PropertyDescriptor) => {
    const originalMethod = descriptor.value;

    descriptor.value = async function (...args: any[]) {
      // This will be handled by the TenantAccessGuard
      return originalMethod.apply(this, args);
    };

    return descriptor;
  };
};
