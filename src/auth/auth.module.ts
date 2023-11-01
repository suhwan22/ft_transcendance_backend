import { Module } from '@nestjs/common';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';
import { JwtModule } from '@nestjs/jwt';
import { PassportModule } from '@nestjs/passport';
import { JwtStrategy } from './strategies/jwt.strategy';
import { HttpModule } from '@nestjs/axios';
import { OAuth2Strategy } from './strategies/oauth.strategy';

@Module({
  imports: [
    HttpModule,
    PassportModule,
    JwtModule.register({
          secret: "mysecret",
          signOptions: { expiresIn: "60s" },
        }),
  ],
  controllers: [AuthController],
  providers: [AuthService, JwtStrategy, OAuth2Strategy],
  exports: [AuthService, JwtModule],
})
export class AuthModule {}
