import { Controller, Post, UseGuards, Get, Res, Req } from '@nestjs/common';
import { AuthService } from './auth.service';
import { JwtAuthGuard } from './guards/jwt-auth.guard';
import { Request, Response } from 'express';
import { OauthGuard } from './guards/oauth.guard';

@Controller('auth')
export class AuthController {
  constructor(private authService: AuthService) { }

  @Get()
  @UseGuards(OauthGuard)
  ftOauth() {}

  @Get('/login')
  @UseGuards(OauthGuard)
  async login(@Req() request) {
    return this.authService.logIn(request.user);
    // const { token, ...option} = await this.authService.logIn();
    // res.cookie('Authentication', token, option);
  }

  @UseGuards(JwtAuthGuard)
  @Post('/logout')
  async logout(@Req() req: Request, @Res() res: Response) {
    const { token, ...option} = await this.authService.logOut();
    res.cookie('Authentication', token, option);
    return (res.send({ message: 'logout success' }));
  }

}
