import { Module } from '@nestjs/common';
import { UsersController } from './users.controller';
import { UsersService } from './users.service';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Player } from './entities/player.entity';
import { UserGameRecord } from './entities/user-game-record.entity';

@Module({
  imports: [TypeOrmModule.forFeature([Player]),
            TypeOrmModule.forFeature([UserGameRecord])],
  controllers: [UsersController],
  providers: [UsersService]
})
export class UsersModule {}