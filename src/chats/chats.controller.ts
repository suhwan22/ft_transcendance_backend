import { Body, Controller, Delete, Get, Param, Post, Query, NotFoundException, Put } from '@nestjs/common';
import { ApiBody, ApiCreatedResponse, ApiOkResponse, ApiOperation, ApiTags } from '@nestjs/swagger';
import { ChatsService } from './chats.service';
import { ChatBan } from './entities/chat-ban.entity';
import { ChatLog } from './entities/chat-log.entity';
import { ChannelMember } from './entities/channel-member.entity';
import { ChannelConfig } from './entities/channel-config.entity';
import { ChatLogRequestDto } from './dtos/chat-log.request.dto';
import { ChatMuteBanRequestDto } from './dtos/chat-mute-ban.request.dto';
import { ChannelMemberRequestDto } from './dtos/channel-member.request.dto';
import { ChannelConfigRequestDto } from './dtos/channel-config.request.dto';

@ApiTags('Chats')
@Controller('chats')
export class ChatsController {
  constructor(private readonly chatsService: ChatsService) { }

  /**
   * 
   * 채팅 내역 API
   * 
   */

  @ApiOperation({ summary: '채팅내역 조회 API' })
  @ApiOkResponse({ description: 'Ok', type: ChatLog, isArray: true })
  @Get('/logs/:channelId')
  async readChatLogList(@Param('channelId') channel: number): Promise<ChatLog[]> {
    return (this.chatsService.readChatLogList(channel));
  }

  @ApiBody({ type: ChatLogRequestDto })
  @ApiOperation({ summary: '채팅내역 저장 API' })
  @ApiCreatedResponse({ description: 'Created', type: ChatLog })
  @Post('/logs')
  async createChatLogInfo(@Body() chatLog: Partial<ChatLogRequestDto>): Promise<ChatLog> {
    return (this.chatsService.createChatLogInfo(chatLog));
  }

  @ApiBody({ type: ChatLogRequestDto })
  @ApiOperation({ summary: '채팅내역 수정 API' })
  @ApiCreatedResponse({ description: 'Created', type: ChatLog })
  @Put('/logs/:id')
  async updateChatLogInfo(@Param() id: number, @Body() chatLogRequest: Partial<ChatLogRequestDto>): Promise<ChatLog> {
    return (this.chatsService.updateCatLogInfo(id, chatLogRequest));
  }

  @ApiOperation({ summary: '채팅내역 삭제 API' })
  @ApiOkResponse({ description: 'Ok' })
  @Delete('/logs/:id')
  async deleteChatLogList(@Param('id') id: number): Promise<void> {
    await (this.chatsService.deleteCatLogInfo(id));
  }

  /**
   * 
   * 채팅 밴 API
   * 
   */

  @ApiOperation({ summary: '채팅 밴 목록 조회 API' })
  @ApiOkResponse({ description: 'Ok', type: ChatBan, isArray: true })
  @Get('/bans/:channelId')
  async readBanList(@Param('channelId') channel: number): Promise<ChatBan[]> {
    return (this.chatsService.readBanList(channel));
  }

  @ApiBody({ type: ChatMuteBanRequestDto })
  @ApiOperation({ summary: '채팅 밴 추가 API' })
  @ApiCreatedResponse({ description: 'success', type: ChatBan })
  @Post('/bans')
  async createBanInfo(@Body() ban: ChatMuteBanRequestDto): Promise<ChatBan> {
    return (this.chatsService.createBanInfo(ban));
  }

  @ApiOperation({ summary: '채팅 밴 해제 API' })
  @ApiOkResponse({ description: 'Ok' })
  @Delete('/bans')
  async deleteBanInfo(@Param('id') id: number): Promise<void> {
    await (this.chatsService.deleteBanInfo(id));
  }

  /**
   * 
   * 채팅 정보 API
   * 
   */

  @ApiOperation({ summary: '모든 채팅정보 조회 API' })
  @ApiOkResponse({ description: 'Ok', type: ChannelConfig, isArray: true })
  @Get('configs')
  async readAllChannelConfig(): Promise<ChannelConfig[]> {
    return (this.chatsService.readAllChannelConfig());
  }

  @ApiOperation({ summary: '채팅정보 조회 API' })
  @ApiOkResponse({ description: 'Ok', type: ChannelConfig })
  @Get('configs/:id')
  async readOneChannelConfig(@Param('id') id: number): Promise<ChannelConfig> {
    const user = await this.chatsService.readOneChannelConfig(id);
    if (!user) {
      throw new NotFoundException('ChannelConfig does not exist!');
    }
    return (user);
  }

  @ApiBody({ type: ChannelConfigRequestDto })
  @ApiOperation({ summary: '채팅정보 생성 API' })
  @ApiCreatedResponse({ description: 'success', type: ChannelConfig })
  @Post('configs')
  async createChannelConfig(@Body() user: ChannelConfigRequestDto): Promise<ChannelConfig> {
    return (this.chatsService.createChannelConfig(user));
  }

  @ApiBody({ type: ChannelConfigRequestDto })
  @ApiOperation({ summary: '채팅정보 수정 API' })
  @ApiCreatedResponse({ description: 'success', type: ChannelConfig })
  @Put('configs/:id')
  async updateChannelConfigInfo(@Param('id') id: number, @Body() user: ChannelConfigRequestDto): Promise<any> {
    return (this.chatsService.updateChannelConfigInfo(id, user));
  }

  @ApiOperation({ summary: '채팅정보 삭제 API' })
  @ApiOkResponse({ description: 'Ok' })
  @Delete('configs/:id')
  async delete(@Param('id') id: number): Promise<any> {
    const user = await this.chatsService.readOneChannelConfig(id);
    if (!user) {
      throw new NotFoundException('ChannelConfig does not exist!');
    }
    return (this.chatsService.deleteChannelConfig(id));
  }

  /**
   * 
   * 채팅인원 API 
   * 
   */

  @ApiOperation({ summary: '모든 채팅인원 조회 API' })
  @ApiOkResponse({ description: 'Ok', type: ChannelMember, isArray: true })
  @Get('members')
  async readAllChannelMember(): Promise<ChannelMember[]> {
    return (this.chatsService.readAllChannelMember());
  }

  @ApiOperation({ summary: '채팅인원 조회 API' })
  @ApiOkResponse({ description: 'Ok', type: ChannelMember, isArray: true })
  @Get('members/:id')
  async readOneChannelMember(@Param('id') channel: number): Promise<ChannelMember[]> {
    const channelMembers = await this.chatsService.readOneChannelMember(channel);
    if (!channelMembers) {
      throw new NotFoundException('ChannelMember does not exist!');
    }
    return (channelMembers);
  }

  @ApiBody({ type: ChannelMemberRequestDto })
  @ApiOperation({ summary: '채팅인원 추가 API' })
  @ApiCreatedResponse({ description: 'success', type: ChannelMember })
  @Post('members')
  async createChannelMember(@Body() user: ChannelMemberRequestDto): Promise<ChannelMember> {
    return (this.chatsService.createChannelMember(user));
  }

  @ApiOperation({ summary: '채팅인원 제거 API' })
  @ApiOkResponse({ description: 'Ok' })
  @Delete('members/:id')
  async deleteChannelMember(@Param('id') id: number): Promise<any> {
    const user = await this.chatsService.readOneChannelMember(id);
    if (!user) {
      throw new NotFoundException('ChannelMember does not exist!');
    }
    return (this.chatsService.deleteChannelMember(id));
  }
}
