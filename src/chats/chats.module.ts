import { Module, forwardRef } from '@nestjs/common';

import { UsersModule } from 'src/users/users.module';
import { GamesModule } from 'src/games/games.module';
import { SocketsModule } from 'src/sockets/sockets.module';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AuthModule } from 'src/auth/auth.module';

import { ChatsController } from './chats.controller';
import { ChatsService } from './chats.service';

import { ChannelConfigRepository,  } from './repositories/channel-config.repository';
import { ChannelMemberRepository } from './repositories/channel-member.repository';
import { ChannelPasswordRepository } from './repositories/channel-password.repository';
import { ChatBanRepository } from './repositories/chat-ban.repository';
import { ChatMuteRepository } from './repositories/chat-mute.repository';
import { ChatLogRepository } from './repositories/chat-log.repository';

@Module({
  imports: [
    forwardRef(() => AuthModule),
    forwardRef(() => GamesModule),
    forwardRef(() => UsersModule),
    forwardRef(() => SocketsModule),
    TypeOrmModule,
  ],
  controllers: [ChatsController],
  providers: [
    ChatsService, 
    ChannelConfigRepository, 
    ChannelMemberRepository,
    ChannelPasswordRepository,
    ChatBanRepository,
    ChatMuteRepository,
    ChatLogRepository],
  exports: [ChatsService]
})
export class ChatsModule {}
