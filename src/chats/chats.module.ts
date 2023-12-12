import { Module, forwardRef } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ChatsController } from './chats.controller';
import { ChatsService } from './chats.service';
import { ChatMute } from './entities/chat-mute.entity';
import { ChatLog } from './entities/chat-log.entity';
import { GamesModule } from 'src/games/games.module';
import { UsersModule } from 'src/users/users.module';
import { ChatsSocketService } from '../sockets/chat/chats-socket.service';
import { ChannelPassword } from './entities/channel-password.entity';
import { SocketsModule } from 'src/sockets/sockets.module';
import { ChatBanRepositroy } from './repositories/chat-ban.repository';
import { ChannelConfigRepositroy } from './repositories/channel-config.repository';
import { ChannelMemberRepositroy } from './repositories/channel-member.repository';

@Module({
  imports: [
    forwardRef(() => GamesModule),
    forwardRef(() => UsersModule),
    forwardRef(() => SocketsModule),
    TypeOrmModule.forFeature([
      ChatLog,
      ChatMute,
      ChannelPassword
    ])
  ],
  controllers: [ChatsController],
  providers: [
    ChatsService, 
    ChatsSocketService, 
    ChatBanRepositroy, 
    ChannelConfigRepositroy, 
    ChannelMemberRepositroy],
  exports: [TypeOrmModule, ChatsService]
})
export class ChatsModule {}
