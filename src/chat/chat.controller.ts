import { Body, Controller, Delete, Get, Param, Post, Query } from '@nestjs/common';
import { ApiBody, ApiCreatedResponse, ApiOperation, ApiParam, ApiQuery, ApiTags } from '@nestjs/swagger';
import { ChatService } from './chat.service';
import { ChatLog } from './database/chat-log/chat-log.entity';
import { ChatLogListResponse } from 'src/reponse/chat/chat-log.list.response';
import { ChatLogResponse } from 'src/reponse/chat/chat-log.response';
import { BaseResponse } from 'src/reponse/base.response';
import { Ban } from './database/ban/ban.entity';
import { BanResponse } from 'src/reponse/chat/ban.response';
import { BanListResponse } from 'src/reponse/chat/ban.list.response';

@ApiTags('Chat')
@Controller('chat')
export class ChatController {
    constructor(private readonly chatService: ChatService) {}

    /** 
     * 채팅내역 API
     */

    @ApiOperation({ summary: '채팅내역 조회 API'})
    @ApiCreatedResponse({ description: 'success', type: ChatLogListResponse })
    @Get('/chat-log/:channelId')
    async readChatLogList(@Param('channelId') channel: number): Promise<ChatLog[]> {
        return (this.chatService.readChatLogList(channel));
    }

    @ApiBody({ type: ChatLog })
    @ApiOperation({ summary: '채팅내역 저장 API'})
    @ApiCreatedResponse({ description: 'success', type: ChatLogResponse })
    @Post('/chat-log')
    async createChatLogInfo(@Body() chatLog: ChatLog): Promise<ChatLog> {
        return (this.chatService.createChatLogInfo(chatLog));
    }

    @ApiOperation({ summary: '채팅내역 삭제 API'})
    @ApiCreatedResponse({ description: 'success', type: BaseResponse })
    @Delete('/chat-log/:channelId')
    async deleteChatLogList(@Param('channelId') channel: number): Promise<void> {
        await (this.chatService.deleteChatLogList(channel));
    }

    /**
     * 채팅 밴 API
     */

    @ApiOperation({ summary: '채팅 밴 목록 조회 API'})
    @ApiCreatedResponse({ description: 'success', type: BanListResponse })
    @Get('/ban/:channelId')
    async readBanList(@Param('channelId') channel: number): Promise<Ban[]> {
        return (this.chatService.readBanList(channel));
    }

    @ApiBody({ type: Ban })
    @ApiOperation({ summary: '채팅 밴 추가 API'})
    @ApiCreatedResponse({ description: 'success', type: BanResponse })
    @Post('/ban')
    async createBanInfo(@Body() ban: Ban): Promise<Ban> {
        return (this.chatService.createBanInfo(ban));
    }

    @ApiOperation({ summary: '채팅 밴 해제 API'})
    @ApiCreatedResponse({ description: 'success', type: BaseResponse })
    @ApiQuery({ name: 'channel', type: 'number' })
    @ApiQuery({ name: 'user', type: 'number' })
    @Delete('/ban')
    async deleteBanInfo(@Query('channel') channel: number, @Query('user') user: number): Promise<void> {
        await (this.chatService.deleteBanInfo(channel, user));
    }

    @ApiOperation({ summary: '채팅 밴 전체 해제 API'})
    @ApiCreatedResponse({ description: 'success', type: BaseResponse })
    @Delete('/ban/:channelId')
    async deleteBanList(@Param('channelId') channel: number): Promise<void> {
        await (this.chatService.deleteBanList(channel));
    }
}
