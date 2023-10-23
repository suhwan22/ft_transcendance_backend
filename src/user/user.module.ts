import { Module } from '@nestjs/common';
import { UserController } from './user.controller';
import { UserService } from './user.service';
import { BlockService } from './database/block/block.service';
import { FriendService } from './database/friend/friend.service';

@Module({
  imports: [],
  controllers: [UserController],
  providers: [UserService, FriendService, BlockService],
})
export class UserModule {}
