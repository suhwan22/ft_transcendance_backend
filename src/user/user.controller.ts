import { Controller, Get, Param, Body, Post, Delete, Query } from '@nestjs/common';
import { UserService } from './user.service';
import { Block } from './database/block/block.entity';
import { Friend } from './database/friend/friend.entity';

@Controller('user')
export class UserController {
    constructor(private readonly userService: UserService) {}

    /** 
     * 유저 친구 API
     */

    // 친구목록 조회 API
    @Get('/friend/:id')
    async readFriendList(@Param('id') id: number): Promise<Friend[]> {
        return (this.userService.readFriendList(id));
    }

    // 친구 등록 API
    @Post('/friend')
    async createFriendInfo(@Body() friend: Friend): Promise<Friend> {
        return (this.userService.createFriendInfo(friend));
    }

    // 친구 삭제 API
    @Delete('/friend')
    async deleteFriendInfo(@Query('user') user: number, @Query('friend') friend: number): Promise<void> {
        await this.userService.deleteFriendInfo(user, friend);
    }

    // 친구 전체삭제 API
    @Delete('/friend/:id')
    async deleteFriendList(@Param('id') user: number): Promise<void> {
        await this.userService.deleteFriendList(user);
    }

    /** 
     * 유저 차단 API
     */

    // 차단목록 조회 API
    @Get('/block/:id')
    async readBlockList(@Param('id') id: number): Promise<Block[]> {
        return (this.userService.readBlockList(id));
    }

    // 차단 등록 API
    @Post('/block')
    async createBlockInfo(@Body() block: Block): Promise<Block> {
        return (this.userService.createBlockInfo(block));
    }

    // 차단 해제 API
    @Delete('/block')
    async deleteBlockInfo(@Query('user') user: number, @Query('target') target: number): Promise<void> {
        await this.userService.deleteBlockInfo(user, target);
    }

    // 차단 전체해제 API
    @Delete('/block/:id')
    async deleteBlockList(@Param('id') user: number): Promise<void> {
        await this.userService.deleteBlockList(user);
    }

}
