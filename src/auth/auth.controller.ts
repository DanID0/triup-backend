import { Controller, HttpCode, HttpStatus, Post, Req, Request, UseGuards } from '@nestjs/common';
import { AuthService } from './auth.service';
import { AuthGuard } from '@nestjs/passport';
import { LocalAuthGuard } from './guard/jwt-auth/local-auth/local-auth.guard';
import { RefreshAuthGuard } from './guard/refresh-auth/refresh-auth.guard';
import { JwtAuthGuard } from './guard/jwt-auth/jwt-auth.guard';

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @HttpCode(HttpStatus.OK) 
  @UseGuards(LocalAuthGuard)
  @Post('login')
  async login(@Request() req){
    return this.authService.login(req.user.id);
  
  }
  @UseGuards(RefreshAuthGuard)
  @Post('refresh')
  async refreshToken(@Req() req){
    return this.authService.refreshToken(req.user.id);
  }
  @UseGuards(JwtAuthGuard)
  @Post('logout')
  logout(@Req() req){
    this.authService.logout(req.user.id);
  }
}
