import { Module, forwardRef } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { UsersController } from './users.controller';
import { UsersService } from './users.service';
import { UserFriend } from './entities/user-friend.entity';
import { UserBlock } from './entities/user-block.entity';
import { Player } from './entities/player.entity';
import { UserGameRecord } from './entities/user-game-record.entity';
import { ChatsModule } from 'src/chats/chats.module';
import { GamesModule } from 'src/games/games.module';
import { FriendRequest } from './entities/friend-request.entity';
import { UserAuth } from './entities/user-auth.entity';
import { UserSocket } from './entities/user-socket.entity';
import { PlayerRepository } from './repositories/player.repository';
import { UserFriendRepository } from './repositories/user-friend.repository';

@Module({
  imports: [
    forwardRef(() => ChatsModule),
    forwardRef(() => GamesModule),
    TypeOrmModule.forFeature([ 
      UserBlock,
      UserGameRecord,
      FriendRequest,
      UserAuth,
      UserSocket
      ])],
  controllers: [UsersController],
  providers: [
    UsersService,
    PlayerRepository,
    UserFriendRepository
  ],
  exports: [TypeOrmModule, UsersService]
})
export class UsersModule {}
