import { forwardRef, Module } from '@nestjs/common';
import { LobbyGateway } from './lobby/lobby.gateway';
import { LobbySocketService } from './lobby/lobby-socket.service';
import { ChatsModule } from 'src/chats/chats.module';
import { UsersModule } from 'src/users/users.module';

@Module({
  imports: [
    forwardRef(() => ChatsModule),
    forwardRef(() => UsersModule)],
  providers: [LobbyGateway, LobbySocketService],
  exports: [LobbyGateway]
})
export class SocketsModule {}
