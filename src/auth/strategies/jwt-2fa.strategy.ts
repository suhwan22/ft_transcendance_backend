import { PassportStrategy } from '@nestjs/passport';
import { Request } from 'express';
import { ExtractJwt, Strategy } from 'passport-jwt';

export class JwtTFAStrategy extends PassportStrategy(Strategy, 'jwt-2fa') {
  constructor() {
    super({
      jwtFromRequest: ExtractJwt.fromExtractors([
        (request: Request) => {
          return (request?.cookies?.TwoFactorAuth);
        },
      ]),
      ignoreExpiration: false,
      secretOrKey: 'accessSecret',
    });
  }

  async validate(payload: any) {
    console.log("2fa");
    return { userId: payload.sub, userName: payload.username };
  }
}