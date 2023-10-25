import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { UsersController } from './users.controller';
import { UsersService } from './users.service';
import { UserFriend } from './entities/user-friend.entity';
import { UserBlock } from './entities/user-block.entity';
import { Player } from './entities/player.entity';
import { UserGameRecord } from './entities/user-game-record.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([UserFriend]),
    TypeOrmModule.forFeature([UserBlock]),
    TypeOrmModule.forFeature([Player]),
    TypeOrmModule.forFeature([UserGameRecord])],
  controllers: [UsersController],
  providers: [UsersService],
})
export class UsersModule {}
