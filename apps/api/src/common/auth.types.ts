import { Role } from '@prisma/client';

export type AuthUser = {
  id: string;
  companyId: string;
  email: string;
  role: Role;
};
