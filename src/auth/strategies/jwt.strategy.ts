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
      secretOrKey: `${process.env.ACCESS_TOKEN_SECRET}`,
    });
  }

  async validate(payload: any) {
    return { userId: payload.sub, userName: payload.username };
  }
}