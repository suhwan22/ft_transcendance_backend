import { Controller, Get, Post, Body, Put, Param, Delete, NotFoundException } from '@nestjs/common';
import { ChatsService } from './chats.service';
import { ChannelMember } from './entities/channel-members.entity';
import { ChannelConfig } from './entities/channel-config.entity';

@Controller('Chats')
export class ChatsController {
  constructor(private readonly chatsService: ChatsService) {}

  //get all channelConfigs
  @Get('configs')
  async readAllChannelConfig(): Promise<ChannelConfig[]> {
    return (this.chatsService.readAllChannelConfig());
  }

  //get channelConfigs by id
  @Get('configs/:id')
  async readOneChannelConfig(@Param('id') id: number): Promise<ChannelConfig> {
    const user = await this.chatsService.readOneChannelConfig(id);
    if (!user) {
      throw new NotFoundException('ChannelConfig does not exist!');
    }
    return (user);
  }

  //create channelConfigs
  @Post('configs')
  async createChannelConfig(@Body() user: ChannelConfig): Promise<ChannelConfig> {
    return (this.chatsService.createChannelConfig(user));
  }

  //update channelConfigs
  @Put('configs/:id')
  async updateChannelConfigInfo(@Param('id') id: number, @Body() user: ChannelConfig): Promise<any> {
    return (this.chatsService.updateChannelConfigInfo(id, user));
  }

  //delete channelConfigs
  @Delete('configs/:id')
  async delete(@Param('id') id: number): Promise<any> {
    const user = await this.chatsService.readOneChannelConfig(id);
    if (!user) {
      throw new NotFoundException('ChannelConfig does not exist!');
    }
    return (this.chatsService.deleteChannelConfig(id));
  }

  //get all channelMembers
  @Get('members')
  async readAllChannelMember(): Promise<ChannelMember[]> {
    return (this.chatsService.readAllChannelMember());
  }

  //get channelMembers by id
  @Get('members/:id')
  async readOneChannelMember(@Param('id') id: number): Promise<ChannelMember> {
    const user = await this.chatsService.readOneChannelMember(id);
    if (!user) {
      throw new NotFoundException('ChannelMember does not exist!');
    }
    return (user);
  }

  //create channelMembers
  @Post('members')
  async createChannelMember(@Body() user: ChannelMember): Promise<ChannelMember> {
    return (this.chatsService.createChannelMember(user));
  }

  //update channelMembers
  @Put('members/:id')
  async updateChannelMemberInfo(@Param('id') id: number, @Body() user: ChannelMember): Promise<any> {
    return (this.chatsService.updateChannelMemberInfo(id, user));
  }

  //delete channelMembers
  @Delete('members:id')
  async deleteChannelMember(@Param('id') id: number): Promise<any> {
    const user = await this.chatsService.readOneChannelMember(id);
    if (!user) {
      throw new NotFoundException('ChannelMember does not exist!');
    }
    return (this.chatsService.deleteChannelMember(id));
  }
}