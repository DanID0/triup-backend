import {
  Controller,
  HttpCode,
  HttpStatus,
  Post,
  Req,
  Request,
  Res,
  UseGuards,
} from '@nestjs/common';
import type { Response } from 'express';
import { AuthService } from './auth.service';
import { LocalAuthGuard } from './guard/jwt-auth/local-auth/local-auth.guard';
import { RefreshAuthGuard } from './guard/refresh-auth/refresh-auth.guard';
import { JwtAuthGuard } from './guard/jwt-auth/jwt-auth.guard';

const ACCESS_COOKIE = 'token';
const REFRESH_COOKIE = 'refresh_token';

const accessCookieOptions = {
  httpOnly: true,
  secure: false,
  sameSite: 'lax' as const,
  maxAge: 1000 * 60 * 60 * 24 * 7,
};

const refreshCookieOptions = {
  httpOnly: true,
  secure: false,
  sameSite: 'lax' as const,
  path: '/auth',
  maxAge: 1000 * 60 * 60 * 24 * 7,
};

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @HttpCode(HttpStatus.OK)
  @UseGuards(LocalAuthGuard)
  @Post('login')
  async login(@Request() req, @Res({ passthrough: true }) res: Response) {
    const token = await this.authService.login(req.user.id);
    res.cookie(ACCESS_COOKIE, token.accessToken, accessCookieOptions);
    res.cookie(REFRESH_COOKIE, token.refreshToken, refreshCookieOptions);
    return { id: token.id };
  }

  @UseGuards(RefreshAuthGuard)
  @Post('refresh')
  async refreshToken(@Req() req, @Res({ passthrough: true }) res: Response) {
    const token = await this.authService.refreshToken(req.user.id);
    res.cookie(ACCESS_COOKIE, token.accessToken, accessCookieOptions);
    res.cookie(REFRESH_COOKIE, token.refreshToken, refreshCookieOptions);
    return { id: token.id };
  }

  @HttpCode(HttpStatus.OK)
  @UseGuards(JwtAuthGuard)
  @Post('logout')
  async logout(@Req() req, @Res({ passthrough: true }) res: Response) {
    await this.authService.logout(req.user.id);
    res.clearCookie(ACCESS_COOKIE, { path: '/' });
    res.clearCookie(REFRESH_COOKIE, { path: '/auth' });
    return { success: true };
  }
}
