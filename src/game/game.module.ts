import { Module } from '@nestjs/common';
import { GameController } from './game.controller';
import { GameService } from './game.service';
import { HistoryService } from './database/history/history.service';
import { TypeOrmModule } from '@nestjs/typeorm';
import { History } from './database/history/history.entity';
import { RecordService } from './database/record/record.service';

@Module({
  imports: [TypeOrmModule.forFeature([History])],
  controllers: [GameController],
  providers: [GameService, HistoryService, RecordService]
})
export class GameModule {}