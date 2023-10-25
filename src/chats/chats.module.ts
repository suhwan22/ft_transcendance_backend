import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ChatsController } from './chats.controller';
import { ChatsService } from './chats.service';
import { ChatBan } from './entities/chat-ban.entity';
import { ChatMute } from './entities/chat-mute.entity';
import { ChatLog } from './entities/chat-log.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([ChatLog]),
    TypeOrmModule.forFeature([ChatMute]),
    TypeOrmModule.forFeature([ChatBan]),
  ],
  controllers: [ChatsController],
  providers: [ChatsService]
})
export class ChatsModule {}
