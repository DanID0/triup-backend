import { SetMetadata } from "@nestjs/common";
import { InvitedUserRights } from "@prisma/client";

export const ROLES_KEY = 'roles';
export const Roles = (...roles:[InvitedUserRights, ...InvitedUserRights[]])=> SetMetadata(ROLES_KEY, roles);
