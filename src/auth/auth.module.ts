import { Module } from '@nestjs/common';
import { AuthService } from './auth.service';
import { AuthController } from './auth.controller';
import { JwtModule } from '@nestjs/jwt';
import jwtConfig from './config/jwt.config';
import { ConfigModule } from '@nestjs/config';
import { JwtStrategy } from './strats/jwt.auth';
import { LocalStrategy } from './strats/local.strat';
import refreshJwtConfig from './config/refresh-jwt.config';
import { RefreshAuthTokenStrategy } from './strats/refresh.authToken';
import { UserModule } from 'src/user/user.module';

@Module({
  imports: [
    UserModule,
    JwtModule.registerAsync(jwtConfig.asProvider()),
    ConfigModule.forFeature(jwtConfig),
    ConfigModule.forFeature(refreshJwtConfig),
  ],
  controllers: [AuthController],
  providers: [AuthService, JwtStrategy, LocalStrategy, RefreshAuthTokenStrategy],
})
export class AuthModule {}
