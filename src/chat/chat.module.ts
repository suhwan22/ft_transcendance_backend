import { Module } from '@nestjs/common';
import { ChatController } from './chat.controller';
import { ChatService } from './chat.service';
import { ChatLogService } from './database/chat-log/chat-log.service';
import { BanListService } from './database/ban-list/ban-list.service';
import { MuteListService } from './database/mute-list/mute-list.service';

@Module({
  controllers: [ChatController],
  providers: [ChatService, ChatLogService, BanListService, MuteListService]
})
export class ChatModule {}
