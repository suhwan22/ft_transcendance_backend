import { Module, forwardRef } from '@nestjs/common';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';
import { JwtModule } from '@nestjs/jwt';
import { PassportModule } from '@nestjs/passport';
import { JwtStrategy } from './strategies/jwt.strategy';
import { HttpModule } from '@nestjs/axios';
import { UsersModule } from 'src/users/users.module';
import { JwtRefreshStrategy } from './strategies/jwt-refresh.strategy';
import { JwtTFAStrategy } from './strategies/jwt-2fa.strategy';
import { ChatsModule } from 'src/chats/chats.module';
import { GamesModule } from 'src/games/games.module';
import { SocketsModule } from 'src/sockets/sockets.module';

@Module({
  imports: [
    HttpModule,
    PassportModule,
    forwardRef(() => UsersModule),
    forwardRef(() => ChatsModule),
    forwardRef(() => GamesModule),
    forwardRef(() => SocketsModule),
    JwtModule.register({
          secret: "mysecret",
          signOptions: { expiresIn: "60s" },
        }),
  ],
  controllers: [AuthController],
  providers: [AuthService, JwtStrategy, JwtRefreshStrategy, JwtTFAStrategy],
  exports: [AuthService, JwtModule],
})
export class AuthModule {}
