import { Module, forwardRef } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ChatsController } from './chats.controller';
import { ChatsService } from './chats.service';
import { ChatBan } from './entities/chat-ban.entity';
import { ChatMute } from './entities/chat-mute.entity';
import { ChatLog } from './entities/chat-log.entity';
import { ChannelMember } from './entities/channel-member.entity';
import { ChannelConfig } from './entities/channel-config.entity';
import { UserGameRecord } from 'src/users/entities/user-game-record.entity';
import { Player } from 'src/users/entities/player.entity';
import { UserBlock } from 'src/users/entities/user-block.entity';
import { UserFriend } from 'src/users/entities/user-friend.entity';
import { FriendRequest } from 'src/users/entities/friend-request.entity';
import { UsersService } from 'src/users/users.service';
import { UsersModule } from 'src/users/users.module';

@Module({
  imports: [
    forwardRef(() => UsersModule),
    TypeOrmModule.forFeature([ UserFriend,
      UserBlock,
      Player,
      UserGameRecord,
      FriendRequest,
      ChatLog,
      ChatMute,
      ChatBan,
      ChannelMember,
      ChannelConfig,]),],
  controllers: [ChatsController],
  providers: [ChatsService, UsersService]
})
export class ChatsModule {}
