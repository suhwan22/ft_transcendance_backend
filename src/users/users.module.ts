import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { UsersController } from './users.controller';
import { UsersService } from './users.service';
import { UserFriend } from './entities/user-friend.entity';
import { UserBlock } from './entities/user-block.entity';
import { Player } from './entities/player.entity';
import { UserGameRecord } from './entities/user-game-record.entity';
import { ChatsModule } from 'src/chats/chats.module';
import { ChatsService } from 'src/chats/chats.service';
import { ChannelConfig } from 'src/chats/entities/channel-config.entity';
import { ChannelMember } from 'src/chats/entities/channel-member.entity';
import { ChatBan } from 'src/chats/entities/chat-ban.entity';
import { ChatLog } from 'src/chats/entities/chat-log.entity';
import { ChatMute } from 'src/chats/entities/chat-mute.entity';
import { FriendRequest } from './entities/friend-request.entity';

@Module({
  imports: [
    ChatsModule,
    TypeOrmModule.forFeature([ UserFriend,
      UserBlock,
      Player,
      UserGameRecord,
      ChatLog,
      ChatMute,
      ChatBan,
      ChannelMember,
      ChannelConfig,
      FriendRequest])],
  controllers: [UsersController],
  providers: [UsersService, ChatsService],
})
export class UsersModule {}
