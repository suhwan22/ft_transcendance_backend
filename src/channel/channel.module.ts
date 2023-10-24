import { Module } from '@nestjs/common';
import { ChannelController } from './channel.controller';
import { ChannelService } from './channel.service';
import { ListService } from './database/list/list.service';
import { TypeOrmModule } from '@nestjs/typeorm';
import { List } from './database/list/list.entity';
import { ConfigService } from './database/config/config.service';

@Module({
  imports: [TypeOrmModule.forFeature([List])],
  controllers: [ChannelController],
  providers: [ChannelService, ListService, ConfigService]
})
export class UsersModule {}