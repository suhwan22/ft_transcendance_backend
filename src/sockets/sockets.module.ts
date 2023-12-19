import { forwardRef, Module } from '@nestjs/common';
import { LobbyGateway } from './lobby/lobby.gateway';
import { LobbySocketService } from './lobby/lobby-socket.service';
import { ChatsModule } from 'src/chats/chats.module';
import { UsersModule } from 'src/users/users.module';
import { GamesGateway } from './game/games.gateway';
import { GamesSocketService } from './game/games-socket.service';
import { ChatsGateway } from './chat/chats.gateway';
import { ChatsSocketService } from './chat/chats-socket.service';
import { GamesModule } from 'src/games/games.module';
import { AuthModule } from 'src/auth/auth.module';

@Module({
  imports: [
    forwardRef(() => AuthModule),
    forwardRef(() => ChatsModule),
    forwardRef(() => UsersModule),
    forwardRef(() => GamesModule)],
  providers: [LobbyGateway, LobbySocketService, GamesGateway, GamesSocketService, ChatsGateway, ChatsSocketService],
  exports: [LobbyGateway, GamesGateway, ChatsGateway]
})
export class SocketsModule {}
