import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import type { ConfigType } from '@nestjs/config';
import jwtConfig from '../config/jwt.config';
import { AuthJwtPayload } from '../types/auth-jwtPayload';
import { Inject, Injectable } from '@nestjs/common';
import type { Request } from 'express';
const cookieExtractor = (req: Request): string | null => {
    console.log(req.cookies)
    if (req && req.cookies) {
      return req.cookies['token'];
    }
    return null;
  };
  
@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
    constructor(
        @Inject(jwtConfig.KEY) private jwtConfiguration: ConfigType<typeof jwtConfig>,
    ) {
        super({
            jwtFromRequest: cookieExtractor,
            secretOrKey: jwtConfiguration.secret as string,
            ignoreExpiration: false,
        });
    }
    validate(payload: AuthJwtPayload) {
        return { id: payload.sub };
    }
}
