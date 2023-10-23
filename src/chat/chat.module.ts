import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ChatController } from './chat.controller';
import { ChatService } from './chat.service';
import { ChatLogService } from './database/chat-log/chat-log.service';
import { ChatLog } from './database/chat-log/chat-log.entity';
import { BanService } from './database/ban/ban.service';
import { MuteService } from './database/mute/mute.service';
import { Mute } from './database/mute/mute.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([ChatLog]),
    TypeOrmModule.forFeature([Mute]),
  ],
  controllers: [ChatController],
  providers: [ChatService, ChatLogService, BanService, MuteService]
})
export class ChatModule {}
