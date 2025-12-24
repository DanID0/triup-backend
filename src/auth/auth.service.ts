import { Injectable } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { AuthJwtPayload } from './types/auth-jwtPayload';

@Injectable()
export class AuthService {
    constructor(private jwtService: JwtService) {}
    login(userId:number) {
        const payload: AuthJwtPayload = { sub: userId };
        return this.jwtService.sign(payload);
    }
}
