import { Controller, Get, Param, Body, Post, Delete, Query, Put, NotFoundException } from '@nestjs/common';
import { UsersService } from './users.service';
import { UserBlock } from './entities/user-block.entity';
import { UserFriend } from './entities/user-friend.entity';
import { ApiBody, ApiCreatedResponse, ApiOperation, ApiTags, ApiQuery, ApiOkResponse } from '@nestjs/swagger';
import { Player } from './entities/player.entity';
import { UserGameRecord } from './entities/user-game-record.entity';

@ApiTags('Users')
@Controller('users')
export class UsersController {
  constructor(private readonly userService: UsersService) { }
  
  /** 
   * player API
   */
  
  //get all player
  @Get('players')
  async readAllPlayer(): Promise<Player[]> {
    return (this.usersService.readAllPlayer());
  }

  //get player by id
  @Get('players/:id')
  async readOnePlayer(@Param('id') id: number): Promise<Player> {
    const user = await this.usersService.readOnePlayer(id);
    if (!user) {
      throw new NotFoundException('Player does not exist!');
    }
    return (user);
  }

  //create player
  @Post('players')
  async createPlayer(@Body() user: Player): Promise<Player> {
    return (this.usersService.createPlayer(user));
  }

  //update player
  @Put('players/:id')
  async updatePlayerInfo(@Param('id') id: number, @Body() user: Player): Promise<any> {
    return (this.usersService.updatePlayerInfo(id, user));
  }

  //delete player
  @Delete('players/:id')
  async deletePlayer(@Param('id') id: number): Promise<any> {
    const user = await this.usersService.readOnePlayer(id);
    if (!user) {
      throw new NotFoundException('Player does not exist!');
    }
    return (this.usersService.deletePlayer(id));
  }
  
  /** 
   * 게임 기록 API
   */
  
  //get all usergamerecord
  @Get('game-records')
  async readAllUserGameRecord(): Promise<UserGameRecord[]> {
    return (this.usersService.readAllUserGameRecord());
  }

  //get usergamerecord by id
  @Get('game-records/:id')
  async readOneUserGameRecord(@Param('id') id: number): Promise<UserGameRecord> {
    const user = await this.usersService.readOneUserGameRecord(id);
    if (!user) {
      throw new NotFoundException('UserGameRecord does not exist!');
    }
    return (user);
  }

  //create usergamerecord
  @Post('game-records')
  async createUserGameRecord(@Body() user: UserGameRecord): Promise<UserGameRecord> {
    return (this.usersService.createUserGameRecord(user));
  }

  //update usergamerecord
  @Put('game-records/:id')
  async updateUserGameRecordInfo(@Param('id') id: number, @Body() user: UserGameRecord): Promise<any> {
    return (this.usersService.updateUserGameRecordInfo(id, user));
  }

  //delete usergamerecord
  @Delete('game-records/:id')
  async deleteUserGameRecord(@Param('id') id: number): Promise<any> {
    const user = await this.usersService.readOneUserGameRecord(id);
    if (!user) {
      throw new NotFoundException('UserGameRecord does not exist!');
    }
    return (this.usersService.deleteUserGameRecord(id));
    
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
