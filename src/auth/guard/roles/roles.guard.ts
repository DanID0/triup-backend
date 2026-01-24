import { CanActivate, ExecutionContext, Injectable } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { Observable } from 'rxjs';
import { InvitedUserRights } from '@prisma/client';
import { ROLES_KEY } from 'src/auth/decorators/roles.decorator';
@Injectable()
export class RolesGuard implements CanActivate {
  constructor(private reflector: Reflector) {}
  canActivate(
    context: ExecutionContext,
  ): boolean  {
   
    const requiredRoles = this.reflector.getAllAndOverride<InvitedUserRights[]>(ROLES_KEY, [
      context.getHandler(),
      context.getClass(),
    ])
    if (!requiredRoles) {
      return true;
    }
    const { user } = context.switchToHttp().getRequest().user;
    return requiredRoles.some((role) => user.role === role);
  }

}
