import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { UserController } from './user.controller';
import { UserService } from './user.service';
import { FriendService } from './database/friend/friend.service';
import { Friend } from './database/friend/friend.entity';
import { BlockService } from './database/block/block.service';
import { Block } from './database/block/block.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([Friend]),
    TypeOrmModule.forFeature([Block])],
  controllers: [UserController],
  providers: [UserService, FriendService, BlockService],
})
export class UserModule {}
