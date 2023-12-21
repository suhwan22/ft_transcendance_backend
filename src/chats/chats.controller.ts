import { Body, Controller, Delete, Get, Param, Post, Query, NotFoundException, Put, UseGuards } from '@nestjs/common';
import { ApiBody, ApiCreatedResponse, ApiOkResponse, ApiOperation, ApiTags } from '@nestjs/swagger';

import { ChatsService } from './chats.service';

import { ChannelConfig } from './entities/channel-config.entity';
import { ChannelMember } from './entities/channel-member.entity';
import { ChatBan } from './entities/chat-ban.entity';
import { ChatLog } from './entities/chat-log.entity';

import { JwtTwoFactorAuthGuard } from 'src/auth/guards/jwt-2fa.guard';

@UseGuards(JwtTwoFactorAuthGuard)
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
  @Get('configs/:channelId')
  async readOneChannelConfig(@Param('channelId') id: number): Promise<ChannelConfig> {
    const user = await this.chatsService.readOneChannelConfig(id);
    if (!user) {
      throw new NotFoundException('ChannelConfig does not exist!');
    }
    return (user);
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
  @Get('members/:channelId')
  async readOneChannelMember(@Param('channelId') channel: number): Promise<ChannelMember[]> {
    const channelMembers = await this.chatsService.readOneChannelMember(channel);
    if (!channelMembers) {
      throw new NotFoundException('ChannelMember does not exist!');
    }
    return (channelMembers);
  }
}

