import { Module } from '@nestjs/common';
import { AuthService } from './auth.service';
import { AuthController } from './auth.controller';
import { JwtModule } from '@nestjs/jwt';
import jwtConfig from './config/jwt.config';
import { ConfigModule } from '@nestjs/config';
import { JwtStrategy } from './strats/jwt.auth';
import { UserService } from 'src/user/user.service';
import { LocalStrategy } from './strats/local.strat';
import refreshJwtConfig from './config/refresh-jwt.config';
import { RefreshAuthTokenStrategy } from './strats/refresh.authToken';
@Module({
  imports: [
    JwtModule.registerAsync(jwtConfig.asProvider()),
          ConfigModule.forFeature(jwtConfig),
          ConfigModule.forFeature(refreshJwtConfig),
  ],
  controllers: [AuthController],
  providers: [AuthService, JwtStrategy, UserService, LocalStrategy, RefreshAuthTokenStrategy],
})
export class AuthModule {}
