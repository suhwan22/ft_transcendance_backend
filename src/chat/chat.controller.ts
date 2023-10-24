import { Body, Controller, Delete, Get, Param, Post, Query } from '@nestjs/common';
import { ApiBody, ApiCreatedResponse, ApiOkResponse, ApiOperation, ApiQuery, ApiTags } from '@nestjs/swagger';
import { ChatService } from './chat.service';
import { ChatLog } from './database/chat-log/chat-log.entity';
import { Ban } from './database/ban/ban.entity';

@ApiTags('Chat')
@Controller('chat')
export class ChatController {
    constructor(private readonly chatService: ChatService) {}

    /** 
     * 채팅내역 API
     */

    @ApiOperation({ summary: '채팅내역 조회 API'})
    @ApiOkResponse({ description: 'Ok', type: ChatLog, isArray: true })
    @Get('/chat-log/:channelId')
    async readChatLogList(@Param('channelId') channel: number): Promise<ChatLog[]> {
        return (this.chatService.readChatLogList(channel));
    }

    @ApiBody({ type: ChatLog })
    @ApiOperation({ summary: '채팅내역 저장 API'})
    @ApiCreatedResponse({ description: 'Created', type: ChatLog })
    @Post('/chat-log')
    async createChatLogInfo(@Body() chatLog: ChatLog): Promise<ChatLog> {
        return (this.chatService.createChatLogInfo(chatLog));
    }

    @ApiOperation({ summary: '채팅내역 삭제 API'})
    @ApiOkResponse({ description: 'Ok' })
    @Delete('/chat-log/:channelId')
    async deleteChatLogList(@Param('channelId') channel: number): Promise<void> {
        await (this.chatService.deleteChatLogList(channel));
    }

    /**
     * 채팅 밴 API
     */

    @ApiOperation({ summary: '채팅 밴 목록 조회 API'})
    @ApiOkResponse({ description: 'Ok', type: Ban, isArray: true })
    @Get('/ban/:channelId')
    async readBanList(@Param('channelId') channel: number): Promise<Ban[]> {
        return (this.chatService.readBanList(channel));
    }

    @ApiBody({ type: Ban })
    @ApiOperation({ summary: '채팅 밴 추가 API'})
    @ApiCreatedResponse({ description: 'success', type: Ban })
    @Post('/ban')
    async createBanInfo(@Body() ban: Ban): Promise<Ban> {
        return (this.chatService.createBanInfo(ban));
    }

    @ApiOperation({ summary: '채팅 밴 해제 API'})
    @ApiOkResponse({ description: 'Ok' })
    @ApiQuery({ name: 'channel', type: 'number' })
    @ApiQuery({ name: 'user', type: 'number' })
    @Delete('/ban')
    async deleteBanInfo(@Query('channel') channel: number, @Query('user') user: number): Promise<void> {
        await (this.chatService.deleteBanInfo(channel, user));
    }

    @ApiOperation({ summary: '채팅 밴 전체 해제 API'})
    @ApiOkResponse({ description: 'Ok' })
    @Delete('/ban/:channelId')
    async deleteBanList(@Param('channelId') channel: number): Promise<void> {
        await (this.chatService.deleteBanList(channel));
    }
}
