import { HttpService } from '@nestjs/axios';
import { Injectable, UnauthorizedException } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { Strategy } from 'passport-oauth2';
import { lastValueFrom } from 'rxjs';

@Injectable()
export class OAuth2Strategy extends PassportStrategy(Strategy, 'oauth') {
  constructor(
    private httpService: HttpService,) {
    super({
      authorizationURL: process.env.AUTH_URL,
      tokenURL: process.env.TOKEN_URL,
      clientID: process.env.CLIENT_ID,
      clientSecret: process.env.CLIENT_SECRET,
      callbackURL: process.env.CALLBACK_URL,
    });
  }

  async validate(accessToken: string, refreshToken: string) {
    const req = this.httpService.get('https://api.intra.42.fr/v2/me', {
      headers: { Authorization: `Bearer ${accessToken}` },
    });
    try {
      const { data } = await lastValueFrom(req);
      if (!data) throw new DOMException();
      return (data);
    } catch (error) {}

    throw new UnauthorizedException();
  }
}