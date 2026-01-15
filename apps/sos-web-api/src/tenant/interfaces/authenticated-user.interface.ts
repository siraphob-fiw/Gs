import { RequestContext, UserRole } from '@strengthos/shared-types';

export interface AuthenticatedUser extends RequestContext {
  id: string;
  role: UserRole;
  tenantId: string;
}
