import { SetMetadata } from '@nestjs/common';
import { ROLES_KEY } from 'src/libs/constants/metadata.constant';
import type { UserRole } from 'src/libs/constants/user.constant';

export const Roles = (...roles: UserRole[]) => SetMetadata(ROLES_KEY, roles);
