import { HttpService } from '@nestjs/axios';
import { Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { firstValueFrom, lastValueFrom } from 'rxjs';
import { Player } from 'src/users/entities/player.entity';
import { UsersService } from 'src/users/users.service';

@Injectable()
export class AuthService {
  constructor(
    private jwtService: JwtService,
    private usersService: UsersService,
    private httpService: HttpService
  ) { }

  async getCookieWithAccessToken(user: Player) {
    const payload = { username: user.name, sub: user.id };
    const token = this.jwtService.sign(payload, {
      secret: 'accessSecret',
      expiresIn: '60s'
    });
    return {
      accessToken: token,
      domain: 'localhost',
      path: '/',
      httpOnly: true,
      maxAge: 1 * 60 * 1000
    };
  }

  async getCookieWithRefreshToken(user: Player) {
    const payload = { username: user.name, sub: user.id };
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

  // async getUserWithOauth(data): Promise<Player> {
  //   let user = await this.usersService.readOnePurePlayer(data.id);
  //   if (!user) {
  //     const newPlayer = {
  //       id: data.id,
  //       name: data.login,
  //       avatar: data.image.link,
  //       status: 1
  //     };
  //     user = await this.usersService.createPlayer(newPlayer);
  //     this.usersService.createUserToken(user.id);
  //   }
  //   return (user);
  // }

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
        status: 1
      };
      user = await this.usersService.createPlayer(newPlayer);
      this.usersService.createUserToken(user.id);
    }
    return (user);
  }
}
