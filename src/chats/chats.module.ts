import { Module, forwardRef } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ChatsController } from './chats.controller';
import { ChatsService } from './chats.service';
import { ChatLog } from './entities/chat-log.entity';
import { GamesModule } from 'src/games/games.module';
import { UsersModule } from 'src/users/users.module';
import { ChatsSocketService } from '../sockets/chat/chats-socket.service';
import { ChannelPassword } from './entities/channel-password.entity';
import { SocketsModule } from 'src/sockets/sockets.module';
import { ChatBanRepositroy } from './repositories/chat-ban.repository';
import { ChannelConfigRepositroy } from './repositories/channel-config.repository';
import { ChannelMemberRepositroy } from './repositories/channel-member.repository';
import { ChatMuteRepositroy } from './repositories/chat-mute.repository';
import { ChatLogRepositroy } from './repositories/chat-log.repository';

@Module({
  imports: [
    forwardRef(() => GamesModule),
    forwardRef(() => UsersModule),
    forwardRef(() => SocketsModule),
    TypeOrmModule.forFeature([
      ChannelPassword
    ])
  ],
  controllers: [ChatsController],
  providers: [
    ChatsService, 
    ChatsSocketService, 
    ChannelConfigRepositroy, 
    ChannelMemberRepositroy,
    ChatBanRepositroy,
    ChatMuteRepositroy,
    ChatLogRepositroy],
  exports: [TypeOrmModule, ChatsService]
})
export class ChatsModule {}
