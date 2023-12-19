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
import { ChannelPassword } from './entities/channel-password.entity';
import { SocketsModule } from 'src/sockets/sockets.module';
import { AuthModule } from 'src/auth/auth.module';

@Module({
  imports: [
    forwardRef(() => AuthModule),
    forwardRef(() => GamesModule),
    forwardRef(() => UsersModule),
    forwardRef(() => SocketsModule),
    TypeOrmModule.forFeature([
      ChannelConfig,
      ChannelMember,
      ChatBan,
      ChatLog,
      ChatMute,
      ChannelPassword
    ])
  ],
  controllers: [ChatsController],
  providers: [ChatsService],
  exports: [TypeOrmModule, ChatsService]
})
export class ChatsModule {}
