import { Module, forwardRef } from '@nestjs/common';
import { GamesController } from './games.controller';
import { GamesService } from './games.service';
import { TypeOrmModule } from '@nestjs/typeorm';
import { GameHistory } from './entities/game-history.entity';
import { UsersModule } from 'src/users/users.module';
import { ChatsModule } from 'src/chats/chats.module';
import { SocketsModule } from 'src/sockets/sockets.module';
import { GamesSocketService } from '../sockets/game/games-socket.service';
import { AuthModule } from 'src/auth/auth.module';
import { GameDodge } from './entities/game-dodge.entity';
import { GameHistoryRepository } from './repositories/game-history.entity';
import { GameDodgeRepository } from './repositories/game-dodge.repository';
@Module({
  imports: [
    forwardRef(() => AuthModule),
    forwardRef(() => (UsersModule)),
    forwardRef(() => (ChatsModule)),
    forwardRef(() => (SocketsModule)),
    TypeOrmModule],
  controllers: [GamesController],
  providers: [GamesService, GamesSocketService, GameHistoryRepository, GameDodgeRepository],
  exports: [TypeOrmModule, GamesService]
})
export class GamesModule {}