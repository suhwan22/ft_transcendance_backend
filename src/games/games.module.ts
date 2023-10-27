import { Module } from '@nestjs/common';
import { GamesController } from './games.controller';
import { GamesService } from './games.service';
import { TypeOrmModule } from '@nestjs/typeorm';
import { GameHistory } from './entities/game-history.entity';
import { UsersService } from 'src/users/users.service';
import { UserGameRecord } from 'src/users/entities/user-game-record.entity';
import { Player } from 'src/users/entities/player.entity';
import { UserBlock } from 'src/users/entities/user-block.entity';
import { UserFriend } from 'src/users/entities/user-friend.entity';
import { UsersModule } from 'src/users/users.module';
import { ChatLog } from 'src/chats/entities/chat-log.entity';
import { ChatMute } from 'src/chats/entities/chat-mute.entity';
import { ChatBan } from 'src/chats/entities/chat-ban.entity';
import { ChannelMember } from 'src/chats/entities/channel-member.entity';
import { ChannelConfig } from 'src/chats/entities/channel-config.entity';
import { ChatsModule } from 'src/chats/chats.module';
import { ChatsService } from 'src/chats/chats.service';
import { FriendRequest } from 'src/users/entities/friend-request.entity';

@Module({
  imports: [
    UsersModule,
    ChatsModule,
    TypeOrmModule.forFeature([GameHistory,
                              UserFriend,
                              UserBlock,
                              Player,
                              UserGameRecord,
                              ChatLog,
                              ChatMute,
                              ChatBan,
                              ChannelMember,
                              ChannelConfig,
                              FriendRequest])],
  controllers: [GamesController],
  providers: [GamesService, UsersService, ChatsService]
})
export class GamesModule {}