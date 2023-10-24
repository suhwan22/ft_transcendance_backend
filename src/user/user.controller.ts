import { Controller, Get, Param, Body, Post, Delete, Query } from '@nestjs/common';
import { UserService } from './user.service';
import { Block } from './database/block/block.entity';
import { Friend } from './database/friend/friend.entity';
import { ApiBody, ApiCreatedResponse, ApiParam, ApiOperation, ApiTags } from '@nestjs/swagger';
import { FriendResponse } from 'src/reponse/user/friend.response';
import { FriendListResponse } from 'src/reponse/user/friend.list.response';
import { BaseResponse } from 'src/reponse/base.response';
import { BlockListResponse } from 'src/reponse/user/block.list.response';
import { BlockResponse } from 'src/reponse/user/block.response';

@ApiTags('User')
@Controller('user')
export class UserController {
    constructor(private readonly userService: UserService) {}

    /** 
     * 유저 친구 API
     */

    @ApiOperation({ summary: '친구목록 조회 API'})
    @ApiCreatedResponse({ description: 'success', type: FriendListResponse })
    @Get('/friend/:userId')
    async readFriendList(@Param('userId') user: number): Promise<Friend[]> {
        return (this.userService.readFriendList(user));
    }

    @ApiOperation({ summary: '친구 등록 API'})
    @ApiBody({ type: Friend })
    @ApiCreatedResponse({ description: 'success', type: FriendResponse })
    @Post('/friend')
    async createFriendInfo(@Body() friend: Friend): Promise<Friend> {
        return (this.userService.createFriendInfo(friend));
    }

    @ApiOperation({ summary: '친구 삭제 API'})
    @ApiParam({ name: 'user', type: 'number' })
    @ApiParam({ name: 'friend', type: 'number' })
    @ApiCreatedResponse({ description: 'success', type: BaseResponse })
    @Delete('/friend')
    async deleteFriendInfo(@Query('user') user: number, @Query('friend') friend: number): Promise<void> {
        await this.userService.deleteFriendInfo(user, friend);
    }

    @ApiOperation({ summary: '친구 전체삭제 API'})
    @ApiCreatedResponse({ description: 'success', type: BaseResponse })
    @Delete('/friend/:userId')
    async deleteFriendList(@Param('userId') user: number): Promise<void> {
        await this.userService.deleteFriendList(user);
    }

    /** 
     * 유저 차단 API
     */

    @ApiOperation({ summary: '차단목록 조회 API'})
    @ApiCreatedResponse({ description: 'success', type: BlockListResponse })
    @Get('/block/:userId')
    async readBlockList(@Param('userId') user: number): Promise<Block[]> {
        return (this.userService.readBlockList(user));
    }

    @ApiOperation({ summary: '차단 등록 API'})
    @ApiBody({ type: Block })
    @ApiCreatedResponse({ description: 'success', type: BlockResponse })
    @Post('/block')
    async createBlockInfo(@Body() block: Block): Promise<Block> {
        return (this.userService.createBlockInfo(block));
    }

    @ApiOperation({ summary: '차단 해제 API'})
    @ApiParam({ name: 'user', type: 'number' })
    @ApiParam({ name: 'target', type: 'number' })
    @ApiCreatedResponse({ description: 'success', type: BaseResponse })
    @Delete('/block')
    async deleteBlockInfo(@Query('user') user: number, @Query('target') target: number): Promise<void> {
        await this.userService.deleteBlockInfo(user, target);
    }

    @ApiOperation({ summary: '차단 전체해제 API'})
    @ApiCreatedResponse({ description: 'success', type: BaseResponse })
    @Delete('/block/:userId')
    async deleteBlockList(@Param('userId') user: number): Promise<void> {
        await this.userService.deleteBlockList(user);
    }

}
