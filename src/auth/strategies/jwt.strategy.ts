import { PassportStrategy } from '@nestjs/passport';
import { Request } from 'express';
import { ExtractJwt, Strategy } from 'passport-jwt';

export class JwtStrategy extends PassportStrategy(Strategy, 'jwt') {
  constructor() {
    super({
      jwtFromRequest: ExtractJwt.fromExtractors([
        (request: Request) => {
          return (request?.cookies?.Authentication);
        },
      ]),
      ignoreExpiration: false,
      secretOrKey: 'accessSecret',
    });
  }

  async validate(payload: any) {
    console.log("login");
    return { userId: payload.sub, userName: payload.username };
  }
}