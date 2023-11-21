import { Module, forwardRef } from '@nestjs/common';
import { GamesController } from './games.controller';
import { GamesService } from './games.service';
import { TypeOrmModule } from '@nestjs/typeorm';
import { GameHistory } from './entities/game-history.entity';
import { UsersModule } from 'src/users/users.module';
import { ChatsModule } from 'src/chats/chats.module';
import { GamesGateway } from './games.gateway';
import { SocketsModule } from 'src/sockets/sockets.module';

@Module({
  imports: [
    forwardRef(() => (UsersModule)),
    forwardRef(() => (ChatsModule)),
    forwardRef(() => (SocketsModule)),
    TypeOrmModule.forFeature([
    GameHistory])],
  controllers: [GamesController],
  providers: [GamesService, GamesGateway],
  exports: [TypeOrmModule, GamesService, GamesGateway]
})
export class GamesModule {}