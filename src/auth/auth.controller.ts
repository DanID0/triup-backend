import { Controller, Post, Request } from '@nestjs/common';
import { AuthService } from './auth.service';

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}
  @Post('login')
  async login(@Request() req){
    const token = this.authService.login(req.user.id);
    return {id:req.user.id, token}
  }
}
