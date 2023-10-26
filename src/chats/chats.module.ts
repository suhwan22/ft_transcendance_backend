import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ChatsController } from './chats.controller';
import { ChatsService } from './chats.service';
import { ChatBan } from './entities/chat-ban.entity';
import { ChatMute } from './entities/chat-mute.entity';
import { ChatLog } from './entities/chat-log.entity';
import { ChannelMember } from './entities/channel-member.entity';
import { ChannelConfig } from './entities/channel-config.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([ChatLog]),
    TypeOrmModule.forFeature([ChatMute]),
    TypeOrmModule.forFeature([ChatBan]),
    TypeOrmModule.forFeature([ChannelMember]),
    TypeOrmModule.forFeature([ChannelConfig])
  ],
  controllers: [ChatsController],
  providers: [ChatsService]
})
export class ChatsModule {}
