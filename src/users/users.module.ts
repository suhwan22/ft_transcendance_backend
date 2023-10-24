import { Module } from '@nestjs/common';
import { UsersController } from './users.controller';
import { UsersService } from './users.service';
import { PlayerService } from './database/player/player.service';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Player } from './database/player/player.entity';

@Module({
  imports: [TypeOrmModule.forFeature([Player])],
  controllers: [UsersController],
  providers: [UsersService, PlayerService]
})
export class UsersModule {}