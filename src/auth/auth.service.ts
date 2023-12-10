import { HttpService } from '@nestjs/axios';
import { Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { Response } from 'express';
import { authenticator } from 'otplib';
import { lastValueFrom } from 'rxjs';
import { Player } from 'src/users/entities/player.entity';
import { UsersService } from 'src/users/users.service';
import { toFileStream } from "qrcode";

@Injectable()
export class AuthService {
  constructor(
    private jwtService: JwtService,
    private usersService: UsersService,
    private httpService: HttpService
  ) { }

  async getCookieWithAccessToken(username:string, id: number) {
    const payload = { username: username, sub: id };
    const token = this.jwtService.sign(payload, {
      secret: 'accessSecret',
      expiresIn: '900s'
    });
    return {
      accessToken: token,
      domain: 'localhost',
      path: '/',
      httpOnly: true,
      maxAge: 15 * 60 * 1000
    };
  }

  async getCookieWithRefreshToken(username:string, id: number) {
    const payload = { username: username, sub: id };
    const token = this.jwtService.sign(payload, {
      secret: 'refreshSecret',
      expiresIn: '604800s'
    });
    return ({
      refreshToken: token,
      domain: 'localhost',
      path: '/',
      httpOnly: true,
      maxAge: 604800 * 1000
    });
  }

  async removeCookieWithTokens() {
    return {
      accessOption: {
        domain: 'localhost',
        path: '/',
        httpOnly: true,
        maxAge: 0,
      },
      refreshOption: {
        domain: 'localhost',
        path: '/',
        httpOnly: true,
        maxAge: 0,
      },
      userIdOption: {
        httpOnly: true,
        maxAge: 0,
      }
    };
  }

  async getAccessTokenWithOauth(code: string): Promise<string> {
    const body = {
      'grant_type': process.env.GRANT_TYPE,
      'code': code,
      'client_id': process.env.CLIENT_ID,
      'client_secret': process.env.CLIENT_SECRET,
      'redirect_uri': process.env.CALLBACK_URL
    };
    const req = await this.httpService.post(process.env.TOKEN_URL, body);
    try {
      const { data } = await lastValueFrom(req);
      if (!data) throw new DOMException();
      return (data.access_token);
    } catch (error) { }

    throw new UnauthorizedException();
  }

  async getUserWithOauth(token) {
    const req = this.httpService.get('https://api.intra.42.fr/v2/me', {
      headers: { Authorization: `Bearer ${token}` },
    });
    try {
      const { data } = await lastValueFrom(req);
      if (!data) throw new DOMException();
      return (data);
    } catch (error) { }

    throw new UnauthorizedException();
  }

  async signUpUser(data): Promise<Player> {
    let user = await this.usersService.readOnePurePlayer(data.id);
    if (!user) {
      const newPlayer = {
        id: data.id,
        name: data.login,
        avatar: data.image.link,
        status: 3
      };
      user = await this.usersService.createPlayer(newPlayer);
      await this.usersService.createUserAuth(user.id);
      await this.usersService.createUserSocket(user.id);
      await this.usersService.createUserGameRecord({ user: user.id, win: 0, loss: 0, rating: 1500 });
    }
    return (user);
  }

  async generateTwoFactorAuthenticationSecret(payload) {
    const secret = authenticator.generateSecret();
    const optAuthUrl = authenticator.keyuri(payload.userName, "otpauth://", secret);
    
    await this.usersService.updateTwoFactorAuthSecret(secret, payload.userId);

    return ({ secret, optAuthUrl });
  }

  async pipeQrCodeStream(stream: Response, otpAuthUrl: string): Promise<void> {
    return (toFileStream(stream, otpAuthUrl));
  }

  async isVaildTwoFactorAuthCode(code: string, payload) {
    const userAuth = await this.usersService.readUserAuth(payload.userId);
    const secret = userAuth.twoFactorAuthSecret;
    return (authenticator.verify({ token: code, secret: secret}));
  }
}
