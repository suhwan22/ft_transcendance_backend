import { HttpService } from '@nestjs/axios';
import { ForbiddenException, Inject, Injectable, UnauthorizedException, forwardRef } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { Response } from 'express';
import { authenticator } from 'otplib';
import { lastValueFrom } from 'rxjs';
import { Player } from 'src/users/entities/player.entity';
import { UsersService } from 'src/users/users.service';
import { toFileStream } from "qrcode";
import { LobbyGateway } from 'src/sockets/lobby/lobby.gateway';
import { ChatsGateway } from 'src/sockets/chat/chats.gateway';
import { GamesGateway } from 'src/sockets/game/games.gateway';
import { Socket } from 'socket.io';
import { WsException } from '@nestjs/websockets';
import { STATUS } from 'src/sockets/sockets.type';

@Injectable()
export class AuthService {
  constructor(
    private jwtService: JwtService,
    private usersService: UsersService,
    private httpService: HttpService,

    @Inject(forwardRef(() => LobbyGateway))
    private lobbyGateway: LobbyGateway,
    @Inject(forwardRef(() => ChatsGateway))
    private chatsGateway: ChatsGateway,
    @Inject(forwardRef(() => GamesGateway))
    private gamesGateway: GamesGateway,
  ) { }

  async makeJwtToken(payload: any, secret: string, sec: number) {
    if (sec > 0)
      return (this.jwtService.sign(payload, { secret: secret, expiresIn: `${sec}s` }));
    else
      return (this.jwtService.sign(payload, { secret: secret}));
  }

  async getCookieWithJwtToken(username: string, id: number, sec: number, secret: string) {
    const payload = { username: username, sub: id };
    const token = await this.makeJwtToken(payload, secret, sec);
    if (sec > 0)
      return ({ token: token, option: { 
        domain: process.env.ORIGIN_DOMAIN,
        path: '/',
        httpOnly: true,
        maxAge: sec * 1000 }});
    else
      return ({ token: token, option: { 
        domain: process.env.ORIGIN_DOMAIN,
        path: '/',
        httpOnly: true}});
  }

  async removeCookieWithTokens() {
    return {
      removeAccessOption: {
        domain: process.env.ORIGIN_DOMAIN,
        path: '/',
        httpOnly: true,
        maxAge: 0,
      },
      removeRefreshOption: {
        domain: process.env.ORIGIN_DOMAIN,
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
        status: STATUS.OFFLINE
      };
      user = await this.usersService.createPlayer(newPlayer);
      await this.usersService.createUserAuth(user.id);
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
    const opts = { token: code, secret: secret };
    if (secret === null)
      opts.secret = "";
    return (authenticator.verify(opts));
  }

  verifyBearToken(token: string, secret: string) {
    return (this.jwtService.verify(token, { secret: secret }));
  }

  verifyBearTokenWithCookies(cookies: string, key: string) {
    let token: string = null;
    cookies.split('; ').forEach((v) => {
      const cookie = v.split('=');
      if (cookie[0] === key) {
        token = cookie[1];
        return;
      }
    })
    if (token === null)
      throw new WsException('TokenExpiredError');
    return (this.jwtService.verify(token, { secret: process.env.ACCESS_TOKEN_SECRET }));
  }

  updateTokenToSocket(token: string, key: string, user: Player) {
    let client: Socket = null;
    let updateCookie = "";
    if (user.status >= STATUS.LOBBY && user.status <= STATUS.RANK)
      client = this.lobbyGateway.clients.get(user.id);
    else if (user.status === STATUS.CHAT) 
      client = this.chatsGateway.clients.get(user.id);
    else if (user.status === STATUS.GAME) 
      client = this.gamesGateway.clients.get(user.id);
    else
      return ;
    const cookies = client.request.headers.cookie;
    const arr = cookies.split('; ');
    for (let i = 0; i < arr.length; i++) {
      const cookie = arr[i].split('=');
      if (cookie[0] === key) {
        updateCookie += key + "=";
        updateCookie += token;
      }
      else {
        updateCookie += arr[i];
      }
      if (i !== arr.length - 1)
        updateCookie += "; ";
    }
    client.request.headers.cookie = updateCookie;
    client.handshake.headers.cookie = updateCookie;
  }

  async checkSocketAndTfa(cookies: any) {
    try {
      const payload = await this.jwtService.verify(cookies.TwoFactorAuth, { secret: process.env.ACCESS_TOKEN_SECRET });
      return (await this.usersService.readOnePurePlayer(payload.sub));
    }
    catch(e) {
      const payload = await this.jwtService.verify(cookies.Refresh, { secret: process.env.REFRESH_TOKEN_SECRET })
      return (await this.usersService.compareRefreshToken(cookies.Refresh, payload.sub));
    }
  }
}
