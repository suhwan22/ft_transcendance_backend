import { Body, Controller, Delete, Get, Param, Post, Query, NotFoundException, Put } from '@nestjs/common';
import { ApiBody, ApiCreatedResponse, ApiOkResponse, ApiOperation, ApiQuery, ApiTags } from '@nestjs/swagger';
import { ChatsService } from './chats.service';
import { ChatBan } from './entities/chat-ban.entity';
import { ChatLog } from './entities/chat-log.entity';
import { ChannelMember } from './entities/channel-member.entity';
import { ChannelConfig } from './entities/channel-config.entity';
import { ChannelListDto } from './dtos/channel-list.dto';

@ApiTags('Chats')
@Controller('chats')
export class ChatsController {
  constructor(private readonly chatsService: ChatsService) { }

  @ApiOperation({ summary: 'player가 참여한 channel 조회 API'})
  @ApiOkResponse({ description: 'Ok', type: ChannelListDto, isArray: true })
  @Get('/:UserId')
  async readChatInfo(@Param('UserId') id: number): Promise<ChannelListDto> {
    return (this.chatsService.readChannelList(id));
  }

  @ApiOperation({ summary: '채팅내역 조회 API' })
  @ApiOkResponse({ description: 'Ok', type: ChatLog, isArray: true })
  @Get('/logs/:channelId')
  async readChatLogList(@Param('channelId') channel: number): Promise<ChatLog[]> {
    return (this.chatsService.readChatLogList(channel));
  }

  @ApiBody({ type: ChatLog })
  @ApiOperation({ summary: '채팅내역 저장 API' })
  @ApiCreatedResponse({ description: 'Created', type: ChatLog })
  @Post('/logs')
  async createChatLogInfo(@Body() chatLog: ChatLog): Promise<ChatLog> {
    return (this.chatsService.createChatLogInfo(chatLog));
  }

  @ApiOperation({ summary: '채팅내역 삭제 API' })
  @ApiOkResponse({ description: 'Ok' })
  @Delete('/logs/:channelId')
  async deleteChatLogList(@Param('channelId') channel: number): Promise<void> {
    await (this.chatsService.deleteCatLogList(channel));
  }

  /**
   * 채팅 밴 API
   */

  @ApiOperation({ summary: '채팅 밴 목록 조회 API' })
  @ApiOkResponse({ description: 'Ok', type: ChatBan, isArray: true })
  @Get('/bans/:channelId')
  async readBanList(@Param('channelId') channel: number): Promise<ChatBan[]> {
    return (this.chatsService.readBanList(channel));
  }

  @ApiBody({ type: ChatBan })
  @ApiOperation({ summary: '채팅 밴 추가 API' })
  @ApiCreatedResponse({ description: 'success', type: ChatBan })
  @Post('/bans')
  async createBanInfo(@Body() ban: ChatBan): Promise<ChatBan> {
    return (this.chatsService.createBanInfo(ban));
  }

  @ApiOperation({ summary: '채팅 밴 해제 API' })
  @ApiOkResponse({ description: 'Ok' })
  @ApiQuery({ name: 'channel', type: 'number' })
  @ApiQuery({ name: 'user', type: 'number' })
  @Delete('/bans')
  async deleteBanInfo(@Query('channel') channel: number, @Query('user') user: number): Promise<void> {
    await (this.chatsService.deleteBanInfo(channel, user));
  }

  /**
   * channel configs API
   */

  //get all channelConfigs
  @ApiOperation({ summary: '모든 channel 및 각 channel 옵션 조회 API' })
  @ApiOkResponse({ description: 'Ok', type: ChannelConfig, isArray: true })
  @Get('configs')
  async readAllChannelConfig(): Promise<ChannelConfig[]> {
    return (this.chatsService.readAllChannelConfig());
  }

  //get channelConfigs by id
  @ApiOperation({ summary: 'channel 및 해당 channel 옵션 조회 API' })
  @ApiOkResponse({ description: 'Ok', type: ChannelConfig })
  @Get('configs/:id')
  async readOneChannelConfig(@Param('id') id: number): Promise<ChannelConfig> {
    const user = await this.chatsService.readOneChannelConfig(id);
    if (!user) {
      throw new NotFoundException('ChannelConfig does not exist!');
    }
    return (user);
  }

  //create channelConfigs
  @ApiBody({ type: ChannelConfig })
  @ApiOperation({ summary: 'channel 추가 API' })
  @ApiCreatedResponse({ description: 'success', type: ChannelConfig })
  @Post('configs')
  async createChannelConfig(@Body() user: ChannelConfig): Promise<ChannelConfig> {
    return (this.chatsService.createChannelConfig(user));
  }

  //update channelConfigs
  @ApiBody({ type: ChannelConfig })
  @ApiOperation({ summary: 'chennel 옵션 변경 API' })
  @ApiCreatedResponse({ description: 'success', type: ChannelConfig })
  @Put('configs/:id')
  async updateChannelConfigInfo(@Param('id') id: number, @Body() user: ChannelConfig): Promise<any> {
    return (this.chatsService.updateChannelConfigInfo(id, user));
  }

  //delete channelConfigs
  @ApiOperation({ summary: 'channel 제거 API' })
  @ApiOkResponse({ description: 'Ok' })
  // @ApiQuery({ name: 'channel', type: 'number' })
  // @ApiQuery({ name: 'user', type: 'number' }) // 현재는 {id}로 만 제거되는 상태
  @Delete('configs/:id')
  async delete(@Param('id') id: number): Promise<any> {
    const user = await this.chatsService.readOneChannelConfig(id);
    if (!user) {
      throw new NotFoundException('ChannelConfig does not exist!');
    }
    return (this.chatsService.deleteChannelConfig(id));
  }

  //get all channelMembers
  @ApiOperation({ summary: '모든 channel-member list 조회 API' })
  @ApiOkResponse({ description: 'Ok', type: ChannelMember, isArray: true })
  @Get('members')
  async readAllChannelMember(): Promise<ChannelMember[]> {
    return (this.chatsService.readAllChannelMember());
  }

  //get channelMembers by id
  @ApiOperation({ summary: '특정 channel에 속한 member 조회 API' })
  @ApiOkResponse({ description: 'Ok', type: ChannelMember, isArray: true })
  @Get('members/:id')
  async readOneChannelMember(@Param('id') channel: number): Promise<ChannelMember[]> {
    const user = await this.chatsService.readOneChannelMember(channel);
    if (!user) {
      throw new NotFoundException('ChannelMember does not exist!');
    }
    return (user);
  }

  //create channelMembers
  @ApiBody({ type: ChannelMember })
  @ApiOperation({ summary: 'channel-member 추가 API' })
  @ApiCreatedResponse({ description: 'success', type: ChannelMember })
  @Post('members')
  async createChannelMember(@Body() user: ChannelMember): Promise<ChannelMember> {
    return (this.chatsService.createChannelMember(user));
  }

  //update channelMembers
  @ApiBody({ type: ChannelMember })
  @ApiOperation({ summary: 'channel-member 정보 변경 API' })
  @ApiCreatedResponse({ description: 'success', type: ChannelMember })
  @Put('members/:id')
  async updateChannelMemberInfo(@Param('id') id: number, @Body() user: ChannelMember): Promise<any> {
    return (this.chatsService.updateChannelMemberInfo(id, user));
  }

  //delete channelMembers
  @ApiOperation({ summary: 'channel-member 제거 API' })
  @ApiOkResponse({ description: 'Ok' })
  // @ApiQuery({ name: 'channel', type: 'number' })
  // @ApiQuery({ name: 'user', type: 'number' }) // 현재는 {id}로 만 제거되는 상태
  @Delete('members:id')
  async deleteChannelMember(@Param('id') id: number): Promise<any> {
    const user = await this.chatsService.readOneChannelMember(id);
    if (!user) {
      throw new NotFoundException('ChannelMember does not exist!');
    }
    return (this.chatsService.deleteChannelMember(id));
  }
}
