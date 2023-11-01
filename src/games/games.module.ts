import { Module } from '@nestjs/common';
import { GamesController } from './games.controller';
import { GamesService } from './games.service';
import { TypeOrmModule } from '@nestjs/typeorm';
import { GameHistory } from './entities/game-history.entity';
import { UsersModule } from 'src/users/users.module';
import { ChatsModule } from 'src/chats/chats.module';

@Module({
  imports: [
    UsersModule,
    ChatsModule,
    TypeOrmModule.forFeature([GameHistory,])],
  controllers: [GamesController],
  providers: [GamesService],
  exports: [TypeOrmModule, GamesService],
})
export class GamesModule {}