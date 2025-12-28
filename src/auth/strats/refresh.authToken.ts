import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import type { ConfigType } from '@nestjs/config';
import jwtConfig from '../config/jwt.config';
import { AuthJwtPayload } from '../types/auth-jwtPayload';
import { Inject, Injectable } from '@nestjs/common';
import refreshJwtConfig from '../config/refresh-jwt.config';
import { Request } from 'express';
import { AuthService } from '../auth.service';

@Injectable()
export class RefreshAuthTokenStrategy extends PassportStrategy(Strategy, 'refresh-auth-token') {
    constructor(
        @Inject(refreshJwtConfig.KEY) private refreshJwtConfiguration: ConfigType<typeof refreshJwtConfig>,
        private authService: AuthService,
    ) {
        super({
            jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
            secretOrKey: refreshJwtConfiguration.secret as string,
            ignoreExpiration: false,
            passReqToCallback: true,
        });
    }
    // authorization: Bearer ksadoawdokod';dsadswawd
    validate(req: Request, payload: AuthJwtPayload) {
        const refreshToken = req.get('authorization')!.replace('Bearer', '').trim();
        const userId = payload.sub;
        return this.authService.validateRefreshToken(refreshToken, userId);
    }
}