import { Controller, Get, Param, Body, Post, Delete, Query } from '@nestjs/common';
import { UsersService } from './users.service';
import { UserBlock } from './entities/user-block.entity';
import { UserFriend } from './entities/user-friend.entity';
import { ApiBody, ApiCreatedResponse, ApiOperation, ApiTags, ApiQuery, ApiOkResponse } from '@nestjs/swagger';

@ApiTags('Users')
@Controller('users')
export class UsersController {
  constructor(private readonly userService: UsersService) { }

  /** 
   * 유저 친구 API
   */

  @ApiOperation({ summary: '친구목록 조회 API' })
  @ApiOkResponse({ description: 'Ok', type: UserFriend, isArray: true })
  @Get('/friends/:userId')
  async readFriendList(@Param('userId') user: number): Promise<UserFriend[]> {
    return (this.userService.readFriendList(user));
  }

  @ApiOperation({ summary: '친구 등록 API' })
  @ApiBody({ type: UserFriend })
  @ApiCreatedResponse({ description: 'success', type: UserFriend })
  @Post('/friends')
  async createFriendInfo(@Body() friend: UserFriend): Promise<UserFriend> {
    return (this.userService.createFriendInfo(friend));
  }

  @ApiOperation({ summary: '친구 삭제 API' })
  @ApiQuery({ name: 'user', type: 'number' })
  @ApiQuery({ name: 'friend', type: 'number' })
  @ApiOkResponse({ description: 'Ok' })
  @Delete('/friends')
  async deleteFriendInfo(@Query('user') user: number, @Query('friend') friend: number): Promise<void> {
    await this.userService.deleteFriendInfo(user, friend);
  }

  /** 
   * 유저 차단 API
   */

  @ApiOperation({ summary: '차단목록 조회 API' })
  @ApiOkResponse({ description: 'Ok', type: UserFriend, isArray: true })
  @Get('/blocks/:userId')
  async readBlockList(@Param('userId') user: number): Promise<UserBlock[]> {
    return (this.userService.readBlockList(user));
  }

  @ApiOperation({ summary: '차단 등록 API' })
  @ApiBody({ type: UserBlock })
  @ApiCreatedResponse({ description: 'success', type: UserBlock })
  @Post('/blocks')
  async createBlockInfo(@Body() block: UserBlock): Promise<UserBlock> {
    return (this.userService.createBlockInfo(block));
  }

  @ApiOperation({ summary: '차단 해제 API' })
  @ApiQuery({ name: 'user', type: 'number' })
  @ApiQuery({ name: 'target', type: 'number' })
  @ApiOkResponse({ description: 'Ok' })
  @Delete('/blocks')
  async deleteBlockInfo(@Query('user') user: number, @Query('target') target: number): Promise<void> {
    await this.userService.deleteBlockInfo(user, target);
  }
}
