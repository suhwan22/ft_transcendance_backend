import { Controller, Post, UseGuards, Get, Res, Req, Body } from '@nestjs/common';
import { AuthService } from './auth.service';
import { JwtAuthGuard } from './guards/jwt-auth.guard';
import { Request, Response } from 'express';
import { OauthGuard } from './guards/oauth.guard';
import { UsersService } from 'src/users/users.service';
import { JwtRefreshGuard } from './guards/jwt-refresh.guard';
import { Player } from 'src/users/entities/player.entity';

@Controller('auth')
export class AuthController {
  constructor (
    private authService: AuthService,
    private usersService: UsersService,
    ) { }

  // @UseGuards(OauthGuard)
  // @Get('/login')
  // async login(@Req() request, @Res({ passthrough: true }) response: Response) {
  //   const user = await this.authService.getUserWithOauth(request.user);
  //   const { accessToken, ...accessOption } = await this.authService.getCookieWithAccessToken(user);
  //   const { refreshToken, ...refreshOption } = await this.authService.getCookieWithRefreshToken(user);
    
  //   await this.usersService.updateUserToken(refreshToken, user.id);

  //   response.cookie('Authentication', accessToken, accessOption);
  //   response.cookie('Refresh', refreshToken, refreshOption);
  //   return (user);
  // }
  @Post('/login')
  async login(@Body('code') code: string, @Res({ passthrough: true }) response: Response) {
    const token = await this.authService.getAccessTokenWithOauth(code);
    const oauthUser = await this.authService.getUserWithOauth(token);
    const user = await this.authService.signUpUser(oauthUser);
    const { accessToken, ...accessOption } = await this.authService.getCookieWithAccessToken(user);
    const { refreshToken, ...refreshOption } = await this.authService.getCookieWithRefreshToken(user);
    
    await this.usersService.updateUserToken(refreshToken, user.id);

    response.cookie('Authentication', accessToken, accessOption);
    response.cookie('Refresh', refreshToken, refreshOption);
    return (user);
  }

  @UseGuards(JwtAuthGuard)
  @Get('/logout')
  async logout(@Req() request, @Res({ passthrough: true }) response: Response) {
    const { accessOption, refreshOption } = await this.authService.removeCookieWithTokens();
    await this.usersService.updateUserToken(null, request.user.userId);
    response.cookie('Authentication', '', accessOption);
    response.cookie('Refresh', '', refreshOption);
  }

  @UseGuards(JwtAuthGuard)
  @Get('/test')
  test() {
    return 'test success';
  }

  
  @UseGuards(JwtRefreshGuard)
  @Get('refresh')
  async refresh(@Req() request, @Res({ passthrough: true }) response: Response) {
    const { accessToken, ...accessOption } = await this.authService.getCookieWithAccessToken(request.user);
    response.cookie('Authentication', accessToken, accessOption);
    return (request.user);
  }
}
