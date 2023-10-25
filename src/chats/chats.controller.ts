import { Body, Controller, Delete, Get, Param, Post, Query, NotFoundException } from '@nestjs/common';
import { ApiBody, ApiCreatedResponse, ApiOkResponse, ApiOperation, ApiQuery, ApiTags } from '@nestjs/swagger';
import { ChatsService } from './chats.service';
import { ChatBan } from './entities/chat-ban.entity';
import { ChatLog } from './entities/chat-log.entity';
import { ChannelMember } from './entities/channel-members.entity';
import { ChannelConfig } from './entities/channel-config.entity';

@ApiTags('Chats')
@Controller('chats')
export class ChatsController {
    constructor(private readonly chatsService: ChatsService) {}

    @ApiOperation({ summary: '채팅내역 조회 API'})
    @ApiOkResponse({ description: 'Ok', type: ChatLog, isArray: true })
    @Get('/logs/:channelId')
    async readChatLogList(@Param('channelId') channel: number): Promise<ChatLog[]> {
        return (this.chatsService.readChatLogList(channel));
    }

    @ApiBody({ type: ChatLog })
    @ApiOperation({ summary: '채팅내역 저장 API'})
    @ApiCreatedResponse({ description: 'Created', type: ChatLog })
    @Post('/logs')
    async createChatLogInfo(@Body() chatLog: ChatLog): Promise<ChatLog> {
        return (this.chatsService.createChatLogInfo(chatLog));
    }

    @ApiOperation({ summary: '채팅내역 삭제 API'})
    @ApiOkResponse({ description: 'Ok' })
    @Delete('/logs/:channelId')
    async deleteChatLogList(@Param('channelId') channel: number): Promise<void> {
        await (this.chatsService.deleteCatLogList(channel));
    }

    /**
     * 채팅 밴 API
     */

    @ApiOperation({ summary: '채팅 밴 목록 조회 API'})
    @ApiOkResponse({ description: 'Ok', type: ChatBan, isArray: true })
    @Get('/bans/:channelId')
    async readBanList(@Param('channelId') channel: number): Promise<ChatBan[]> {
        return (this.chatsService.readBanList(channel));
    }

    @ApiBody({ type: ChatBan })
    @ApiOperation({ summary: '채팅 밴 추가 API'})
    @ApiCreatedResponse({ description: 'success', type: ChatBan })
    @Post('/bans')
    async createBanInfo(@Body() ban: ChatBan): Promise<ChatBan> {
        return (this.chatsService.createBanInfo(ban));
    }

    @ApiOperation({ summary: '채팅 밴 해제 API'})
    @ApiOkResponse({ description: 'Ok' })
    @ApiQuery({ name: 'channel', type: 'number' })
    @ApiQuery({ name: 'user', type: 'number' })
    @Delete('/bans')
    async deleteBanInfo(@Query('channel') channel: number, @Query('user') user: number): Promise<void> {
        await (this.chatsService.deleteBanInfo(channel, user));
    }
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
