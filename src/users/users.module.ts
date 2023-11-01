import { Module, forwardRef } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { UsersController } from './users.controller';
import { UsersService } from './users.service';
import { UserFriend } from './entities/user-friend.entity';
import { UserBlock } from './entities/user-block.entity';
import { Player } from './entities/player.entity';
import { UserGameRecord } from './entities/user-game-record.entity';
import { ChatsModule } from 'src/chats/chats.module';
import { FriendRequest } from './entities/friend-request.entity';

@Module({
  imports: [
    forwardRef(() => ChatsModule),
    TypeOrmModule.forFeature([ 
      UserFriend,
      UserBlock,
      Player,
      UserGameRecord,
      FriendRequest])],
  controllers: [UsersController],
  providers: [UsersService],
  exports: [TypeOrmModule, UsersService]
})
export class UsersModule {}
