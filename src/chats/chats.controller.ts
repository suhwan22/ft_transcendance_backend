import { Body, Controller, Delete, Get, Param, Post, Query } from '@nestjs/common';
import { ApiBody, ApiCreatedResponse, ApiOkResponse, ApiOperation, ApiQuery, ApiTags } from '@nestjs/swagger';
import { ChatsService } from './chats.service';
import { ChatBan } from './entities/chat-ban.entity';
import { ChatLog } from './entities/chat-log.entity';

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
}
