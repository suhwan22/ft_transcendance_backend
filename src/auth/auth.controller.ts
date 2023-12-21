import { Controller, Post, UseGuards, Get, Res, Req, Body, UnauthorizedException, ForbiddenException } from '@nestjs/common';
import { AuthService } from './auth.service';
import { JwtAuthGuard } from './guards/jwt-auth.guard';
import { Request, Response } from 'express';
import { UsersService } from 'src/users/users.service';
import { JwtRefreshGuard } from './guards/jwt-refresh.guard';
import { ApiBody, ApiOkResponse, ApiOperation, ApiTags } from '@nestjs/swagger';
import { CodeRequestDto } from './dtos/codeRequestDto';
import { JwtTwoFactorAuthGuard } from './guards/jwt-2fa.guard';
import { STATUS } from 'src/sockets/sockets.type';

@ApiTags('Auth')
@Controller('auth')
export class AuthController {
  constructor (
    private authService: AuthService,
    private usersService: UsersService,
    ) { }

  @ApiOperation({ summary: '로그인 API' })
  @ApiBody({ type: CodeRequestDto })
  @ApiOkResponse({ description: 'Ok'})
  @Post('/login')
  async login(@Req() request: Request, @Body('code') code: string, @Res({ passthrough: true }) response: Response) {
    if (!request.cookies.Authentication) {
      const token = await this.authService.getAccessTokenWithOauth(code);
      const oauthUser = await this.authService.getUserWithOauth(token);
      const user = await this.authService.signUpUser(oauthUser);
      if (user.status !== STATUS.OFFLINE) {
        throw new ForbiddenException('Duplicated Access');
      }
      const accessToken = await this.authService.getCookieWithJwtToken(user.name, user.id, -1, process.env.ACCESS_TOKEN_SECRET);
  
      response.cookie('Authentication', accessToken.token, accessToken.option);
    }
    else {
      const token = request.cookies.Authentication;
      try {
        this.authService.verifyBearToken(token, process.env.ACCESS_TOKEN_SECRET);
      }
      catch(e) {
        throw new UnauthorizedException('Invaild AccessToken');
      }
    }
    return ('login success');
  }

  @ApiOperation({ summary: '로그아웃 API' })
  @ApiOkResponse({ description: 'Ok' })
  @UseGuards(JwtTwoFactorAuthGuard)
  @Post('/logout')
  async logout(@Req() request, @Res({ passthrough: true }) response: Response) {
    const { removeAccessOption, removeRefreshOption } = await this.authService.removeCookieWithTokens();
    await this.usersService.updateRefreshToken(null, request.user.userId);
    response.cookie('Authentication', '', removeAccessOption);
    response.cookie('TwoFactorAuth', '', removeAccessOption);
    response.cookie('Refresh', '', removeRefreshOption);
    return ('logout success');
  }

  @ApiOperation({ summary: '토큰 재발급 API' })
  @ApiOkResponse({ description: 'Ok' })
  @UseGuards(JwtRefreshGuard)
  @Get('refresh/2fa')
  async refreshTFA(@Req() request, @Res({ passthrough: true }) response: Response) {
    const accessToken = await this.authService.getCookieWithJwtToken(request.user.name, request.user.id, 3600, process.env.ACCESS_TOKEN_SECRET);
    this.authService.updateTokenToSocket(accessToken.token, 'TwoFactorAuth', request.user);
    response.cookie('TwoFactorAuth', accessToken.token, accessToken.option);
    return ('2fa token refresh success');
  }

  @ApiOperation({ summary: '2FA 구글 인증 OTP API' })
  @ApiBody({ type: CodeRequestDto })
  @ApiOkResponse({ description: 'Ok'})
  @UseGuards(JwtAuthGuard)
  @Post('2fa')
  async authenticateTwoFactorAuth(@Req() request,
                                  @Body('code') code: string,
                                  @Res({ passthrough: true }) response: Response) {
    const check = await this.authService.isVaildTwoFactorAuthCode(code, request.user);
    if (!check)
      throw new UnauthorizedException('Invaild Authentication-Code');
    const user = await this.usersService.readOnePlayer(request.user.userId);
    if (user.status !== STATUS.OFFLINE) {
      throw new ForbiddenException('Duplicated Access');
    }
    const accessToken = await this.authService.getCookieWithJwtToken(user.name, user.id, 3600, process.env.ACCESS_TOKEN_SECRET);
    const refreshToken = await this.authService.getCookieWithJwtToken(user.name, user.id, 604800,  process.env.REFRESH_TOKEN_SECRET);
    const { removeAccessOption } = await this.authService.removeCookieWithTokens();
    

    await this.usersService.updateRefreshToken(refreshToken.token, user.id);

    response.cookie('TwoFactorAuth', accessToken.token, accessToken.option);
    response.cookie('Refresh', refreshToken.token, refreshToken.option);
    response.cookie('Authentication', '', removeAccessOption);
    return (user);
  }
  
  @ApiOperation({ summary: '2FA 구글 인증 등록 API' })
  @ApiOkResponse({ description: 'Ok' })
  @UseGuards(JwtAuthGuard)
  @Post('2fa/generate')
  async getQrImageWithTwoFactorAuth(@Req() request: Request, @Res() response: Response) {
    const { optAuthUrl } = await this.authService.generateTwoFactorAuthenticationSecret(request.user);
    return (await this.authService.pipeQrCodeStream(response, optAuthUrl));
  }

  @ApiOperation({ summary: '로그인 / 2차 인증 확인 API' })
  @ApiOkResponse({ description: 'Ok' })
  @UseGuards(JwtTwoFactorAuthGuard)
  @Post('check/login')
  async checkLoginAndTfa() {
    return ("login already");
  }

  @ApiOperation({ summary: '소켓 인증 API' })
  @ApiOkResponse({ description: 'Ok' })
  @Get('check/socket') 
  async checkSocketAndTfa(@Req() request: Request, @Res({ passthrough: true }) response: Response) {
    try {
      const user = await this.authService.checkSocketAndTfa(request.cookies);
      if (!user)
        throw new UnauthorizedException('Unauthorized');
      const accessToken = await this.authService.getCookieWithJwtToken(user.name, user.id, 3600, process.env.ACCESS_TOKEN_SECRET);
      this.authService.updateTokenToSocket(accessToken.token, 'TwoFactorAuth', user);
      response.cookie('TwoFactorAuth', accessToken.token, accessToken.option);
    }
    catch(e) {
      throw new UnauthorizedException('Unauthorized');
    }
  }
}
