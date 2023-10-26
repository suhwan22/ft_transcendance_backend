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

@Module({
  imports: [
    UsersModule,
    TypeOrmModule.forFeature([GameHistory,
                              UserFriend,
                              UserBlock,
                              Player,
                              UserGameRecord])],
  controllers: [GamesController],
  providers: [GamesService, UsersService]
})
export class GamesModule {}