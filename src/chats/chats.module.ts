import { Module, forwardRef } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ChatsController } from './chats.controller';
import { ChatsService } from './chats.service';
import { GamesModule } from 'src/games/games.module';
import { UsersModule } from 'src/users/users.module';
import { ChatsSocketService } from '../sockets/chat/chats-socket.service';
import { SocketsModule } from 'src/sockets/sockets.module';
import { ChatBanRepository } from './repositories/chat-ban.repository';
import { ChannelConfigRepository,  } from './repositories/channel-config.repository';
import { ChannelMemberRepository } from './repositories/channel-member.repository';
import { ChatMuteRepository } from './repositories/chat-mute.repository';
import { ChatLogRepository } from './repositories/chat-log.repository';
import { ChannelPasswordRepository } from './repositories/channel-password.repository';

@Module({
  imports: [
    forwardRef(() => GamesModule),
    forwardRef(() => UsersModule),
    forwardRef(() => SocketsModule),
    TypeOrmModule,
  ],
  controllers: [ChatsController],
  providers: [
    ChatsService, 
    ChatsSocketService, 
    ChannelConfigRepository, 
    ChannelMemberRepository,
    ChannelPasswordRepository,
    ChatBanRepository,
    ChatMuteRepository,
    ChatLogRepository],
  exports: [ChatsService]
})
export class ChatsModule {}
