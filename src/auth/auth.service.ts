import { Inject, Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { AuthJwtPayload } from './types/auth-jwtPayload';
import { UserService } from 'src/user/user.service';
import * as bcrypt from 'bcrypt';
import type { ConfigType } from '@nestjs/config';
import refreshJwtConfig from './config/refresh-jwt.config';

@Injectable()
export class AuthService {
    constructor(private userService: UserService, private jwtService: JwtService, @Inject(refreshJwtConfig.KEY) private refreshTokenConfig: ConfigType<typeof refreshJwtConfig>) {}
    async validateUser(email: string, password: string) {
        const user = await this.userService.findByEmail(email);
        if (!user) {
            throw new UnauthorizedException('User not found!');
        }
        const isPasswordValid = await bcrypt.compare(password, user.password);
        if (!isPasswordValid) {
            throw new UnauthorizedException('Invalid credentials');
        }
        return {id: user.id};
    }

    login(userId:number) {
        const payload: AuthJwtPayload = { sub: userId };
        const token = this.jwtService.sign(payload);
        const refreshToken = this.jwtService.sign(payload, this.refreshTokenConfig);
        return {
            id: userId,
            token,
            refreshToken,
        };
    }
    refreshToken(userId:number){
        const payload: AuthJwtPayload = { sub: userId };
        const token = this.jwtService.sign(payload);
        return{
            id: userId,
            token,
        }
    }
}
