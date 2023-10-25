import { Controller, Get, Param, Body, Post, Delete, Query } from '@nestjs/common';
import { UserService } from './user.service';
import { Block } from './database/block/block.entity';
import { Friend } from './database/friend/friend.entity';
import { ApiBody, ApiCreatedResponse, ApiOperation, ApiTags, ApiQuery, ApiOkResponse } from '@nestjs/swagger';

@ApiTags('User')
@Controller('user')
export class UserController {
    constructor(private readonly userService: UserService) {}

    /** 
     * 유저 친구 API
     */

    @ApiOperation({ summary: '친구목록 조회 API'})
    @ApiOkResponse({ description: 'Ok', type: Friend, isArray: true })
    @Get('/friend/:userId')
    async readFriendList(@Param('userId') user: number): Promise<Friend[]> {
        return (this.userService.readFriendList(user));
    }

    @ApiOperation({ summary: '친구 등록 API'})
    @ApiBody({ type: Friend })
    @ApiCreatedResponse({ description: 'success', type: Friend })
    @Post('/friend')
    async createFriendInfo(@Body() friend: Friend): Promise<Friend> {
        return (this.userService.createFriendInfo(friend));
    }

    @ApiOperation({ summary: '친구 삭제 API'})
    @ApiQuery({ name: 'user', type: 'number' })
    @ApiQuery({ name: 'friend', type: 'number' })
    @ApiOkResponse({ description: 'Ok' })
    @Delete('/friend')
    async deleteFriendInfo(@Query('user') user: number, @Query('friend') friend: number): Promise<void> {
        await this.userService.deleteFriendInfo(user, friend);
    }

    /** 
     * 유저 차단 API
     */

    @ApiOperation({ summary: '차단목록 조회 API'})
    @ApiOkResponse({ description: 'Ok', type: Block, isArray: true })
    @Get('/block/:userId')
    async readBlockList(@Param('userId') user: number): Promise<Block[]> {
        return (this.userService.readBlockList(user));
    }

    @ApiOperation({ summary: '차단 등록 API'})
    @ApiBody({ type: Block })
    @ApiCreatedResponse({ description: 'success', type: Block })
    @Post('/block')
    async createBlockInfo(@Body() block: Block): Promise<Block> {
        return (this.userService.createBlockInfo(block));
    }

    @ApiOperation({ summary: '차단 해제 API'})
    @ApiQuery({ name: 'user', type: 'number' })
    @ApiQuery({ name: 'target', type: 'number' })
    @ApiOkResponse({ description: 'Ok' })
    @Delete('/block')
    async deleteBlockInfo(@Query('user') user: number, @Query('target') target: number): Promise<void> {
        await this.userService.deleteBlockInfo(user, target);
    }
}
