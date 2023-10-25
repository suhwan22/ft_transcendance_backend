import { Module } from '@nestjs/common';
import { ChatsController } from './chats.controller';
import { ChatsService } from './chats.service';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ChannelMember } from './entities/channel-members.entity';
import { ChannelConfig } from './entities/channel-config.entity';

@Module({
  imports: [TypeOrmModule.forFeature([ChannelMember]),
            TypeOrmModule.forFeature([ChannelConfig])],
  controllers: [ChatsController],
  providers: [ChatsService]
})
export class ChatsModule {}