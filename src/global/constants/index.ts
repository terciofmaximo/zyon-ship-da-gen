export const PDA_STATUS = {
  IN_PROGRESS: 'IN_PROGRESS',
  SENT: 'SENT',
  APPROVED: 'APPROVED',
  REJECTED: 'REJECTED'
} as const;

export const ROLE_TYPES = {
  PLATFORM_ADMIN: 'platformAdmin',
  TENANT_ADMIN: 'tenantAdmin',
  USER: 'user'
} as const;

export const GLOBAL_BASE_VERSION = '1.0.0';

export type PDAStatus = typeof PDA_STATUS[keyof typeof PDA_STATUS];
export type RoleType = typeof ROLE_TYPES[keyof typeof ROLE_TYPES];