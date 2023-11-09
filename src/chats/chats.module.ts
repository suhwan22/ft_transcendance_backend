import { Module, forwardRef } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ChatsController } from './chats.controller';
import { ChatsService } from './chats.service';
import { ChatBan } from './entities/chat-ban.entity';
import { ChatMute } from './entities/chat-mute.entity';
import { ChatLog } from './entities/chat-log.entity';
import { ChannelMember } from './entities/channel-member.entity';
import { ChannelConfig } from './entities/channel-config.entity';
import { GamesModule } from 'src/games/games.module';
import { UsersModule } from 'src/users/users.module';
import { ChatsGateway } from './chats.gateway';
import { ChatsSocketService } from './chats-socket.service';

@Module({
  imports: [
    forwardRef(() => GamesModule),
    forwardRef(() => UsersModule),
    TypeOrmModule.forFeature([
      ChannelConfig,
      ChannelMember,
      ChatBan,
      ChatLog,
      ChatMute
    ])
  ],
  controllers: [ChatsController],
  providers: [ChatsService, ChatsGateway, ChatsSocketService],
  exports: [TypeOrmModule, ChatsService]
})
export class ChatsModule {}
