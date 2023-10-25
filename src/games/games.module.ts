import { Module } from '@nestjs/common';
import { GamesController } from './games.controller';
import { GamesService } from './games.service';
import { TypeOrmModule } from '@nestjs/typeorm';
import { GameHistory } from './entities/game-history.entity';

@Module({
  imports: [TypeOrmModule.forFeature([GameHistory])],
  controllers: [GamesController],
  providers: [GamesService]
})
export class GamesModule {}