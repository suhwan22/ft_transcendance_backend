import { Controller, Get, Param, Body, Post, Delete, Query, Put, NotFoundException } from '@nestjs/common';
import { UsersService } from './users.service';
import { UserBlock } from './entities/user-block.entity';
import { UserFriend } from './entities/user-friend.entity';
import { ApiBody, ApiCreatedResponse, ApiOperation, ApiTags, ApiQuery, ApiOkResponse } from '@nestjs/swagger';
import { Player } from './entities/player.entity';
import { UserGameRecord } from './entities/user-game-record.entity';
import { UserDto } from './dtos/user.dto';
import { ChannelListDto } from './dtos/channel-list.dto';
import { FriendRequest } from './entities/friend-request.entity';


@ApiTags('Users')
@Controller('users')
export class UsersController {
  constructor(private readonly usersService: UsersService) { }
  
  /** 
   * player API
   */
  
  //get all player
  @ApiOperation({ summary: '전체 Player목록 조회 API' })
  @ApiOkResponse({ description: 'Ok', type: Player, isArray: true })
  @Get('players')
  async readAllPlayer(): Promise<Player[]> {
    return (this.usersService.readAllPlayer());
  }

  //get player by id
  @ApiOperation({ summary: '특정 Player목록 조회 API' })
  @ApiOkResponse({ description: 'Ok', type: Player })
  @Get('players/:id')
  async readOnePlayer(@Param('id') id: number): Promise<Player> {
    const user = await this.usersService.readOnePlayer(id);
    if (!user) {
      throw new NotFoundException('Player does not exist!');
    }
    return (user);
  }

  //create player
  @ApiOperation({ summary: 'Player 등록 API' })
  @ApiBody({ type: Player })
  @ApiCreatedResponse({ description: 'success', type: Player })
  @Post('players')
  async createPlayer(@Body() user: Player): Promise<Player> {
    return (this.usersService.createPlayer(user));
  }

  //update player
  @ApiOperation({ summary: 'Player 수정 API' })
  @ApiBody({ type: Player })
  @ApiCreatedResponse({ description: 'success', type: Player })
  @Put('players/:id')
  async updatePlayerInfo(@Param('id') id: number, @Body() user: Player): Promise<any> {
    return (this.usersService.updatePlayerInfo(id, user));
  }

  //delete player
  @ApiOperation({ summary: 'Player 삭제 API' })
  // @ApiQuery({ name: 'user', type: 'number' })
  // @ApiQuery({ name: 'friend', type: 'number' })
  @ApiOkResponse({ description: 'Ok' })
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
  @ApiOperation({ summary: '전체 승점 list 조회 API' })
  @ApiOkResponse({ description: 'Ok', type: UserGameRecord, isArray: true })
  @Get('game-records')
  async readAllUserGameRecord(): Promise<UserGameRecord[]> {
    return (this.usersService.readAllUserGameRecord());
  }

  //get usergamerecord by id
  @ApiOperation({ summary: '특정 승점 list 조회 API' }) 
  @ApiOkResponse({ description: 'Ok', type: UserGameRecord, isArray: true })
  @Get('game-records/:id')
  async readOneUserGameRecord(@Param('id') id: number): Promise<UserGameRecord> {
    const user = await this.usersService.readOneUserGameRecord(id);
    if (!user) {
      throw new NotFoundException('UserGameRecord does not exist!');
    }
    return (user);
  }

  //create usergamerecord
  @ApiOperation({ summary: '승정 수정 API' })
  @ApiBody({ type: UserGameRecord })
  @ApiCreatedResponse({ description: 'success', type: UserGameRecord })
  @Post('game-records')
  async createUserGameRecord(@Body() user: UserGameRecord): Promise<UserGameRecord> {
    return (this.usersService.createUserGameRecord(user));
  }

  //update usergamerecord
  @ApiOperation({ summary: '승점 수정 API' })
  @ApiBody({ type: UserGameRecord })
  @ApiCreatedResponse({ description: 'success', type: UserGameRecord })
  @Put('game-records/:id')
  async updateUserGameRecordInfo(@Param('id') id: number, @Body() user: UserGameRecord): Promise<any> {
    return (this.usersService.updateUserGameRecordInfo(id, user));
  }

  //delete usergamerecord
  @ApiOperation({ summary: '승점 삭제 API' })
  // @ApiQuery({ name: 'user', type: 'number' })
  // @ApiQuery({ name: 'friend', type: 'number' })
  @ApiOkResponse({ description: 'Ok' })
  @Delete('game-records/:id')
  async deleteUserGameRecord(@Param('id') id: number): Promise<any> {
    const user = await this.usersService.readOneUserGameRecord(id);
    if (!user) {
      throw new NotFoundException('UserGameRecord does not exist!');
    }
    return (this.usersService.deleteUserGameRecord(id));
  }

  /** 
   * 유저 친구 API
   */

  @ApiOperation({ summary: '친구목록 조회 API' })
  @ApiOkResponse({ description: 'Ok', type: UserFriend, isArray: true })
  @Get('/friends/:userId')
  async readFriendList(@Param('userId') user: number): Promise<UserFriend[]> {
    return (this.usersService.readFriendList(user));
  }

  @ApiOperation({ summary: '친구 등록 API' })
  @ApiBody({ type: UserFriend })
  @ApiCreatedResponse({ description: 'success', type: UserFriend })
  @Post('/friends')
  async createFriendInfo(@Body() friend: UserFriend): Promise<UserFriend> {
    return (this.usersService.createFriendInfo(friend));
  }

  @ApiOperation({ summary: '친구 삭제 API' })
  @ApiQuery({ name: 'user', type: 'number' })
  @ApiQuery({ name: 'friend', type: 'number' })
  @ApiOkResponse({ description: 'Ok' })
  @Delete('/friends')
  async deleteFriendInfo(@Query('user') user: number, @Query('friend') friend: number): Promise<void> {
    await this.usersService.deleteFriendInfo(user, friend);
  }

  /** 
   * 유저 차단 API
   */

  @ApiOperation({ summary: '차단목록 조회 API' })
  @ApiOkResponse({ description: 'Ok', type: UserFriend, isArray: true })
  @Get('/blocks/:userId')
  async readBlockList(@Param('userId') user: number): Promise<UserBlock[]> {
    return (this.usersService.readBlockList(user));
  }

  @ApiOperation({ summary: '차단 등록 API' })
  @ApiBody({ type: UserBlock })
  @ApiCreatedResponse({ description: 'success', type: UserBlock })
  @Post('/blocks')
  async createBlockInfo(@Body() block: UserBlock): Promise<UserBlock> {
    return (this.usersService.createBlockInfo(block));
  }

  @ApiOperation({ summary: '차단 해제 API' })
  @ApiQuery({ name: 'user', type: 'number' })
  @ApiQuery({ name: 'target', type: 'number' })
  @ApiOkResponse({ description: 'Ok' })
  @Delete('/blocks')
  async deleteBlockInfo(@Query('user') user: number, @Query('target') target: number): Promise<void> {
    await this.usersService.deleteBlockInfo(user, target);
  }

  /** 
   * 친구 요청 API
   */

  /* [C] FriendRequest 생성 */
  @ApiOperation({ summary: '친구 요청 생성 API' })
  @ApiBody({ type: FriendRequest })
  @ApiCreatedResponse({ description: 'success', type: FriendRequest })
  @Post('friend-requests')
  async createFriendRequest(@Body() request: Partial<FriendRequest>): Promise<FriendRequest> {
    console.log(request);
    return this.usersService.createFriendRequest(request);
  }

  /* [R] 모든 FriendRequest 조회 */
  @ApiOperation({ summary: '받은 친구 요청 목록 API' })
  @ApiOkResponse({ description: 'Ok' , isArray: true})
  @Get('friend-requests')
  async readAllFriendRequest(): Promise<FriendRequest[]> {
    return (this.usersService.readAllFriendRequest());
  }

  /* [R] 특정 recv{id}의 FriendRequest 조회 */
  @ApiOperation({ summary: '받은 친구 요청 목록 API' })
  @ApiOkResponse({ description: 'Ok' , isArray: true})
  @Get('friend-requests-recv/:id')
  async readRecvFriendRequest(recv: number): Promise<FriendRequest[]> {
    return (this.usersService.readRecvFriendRequest( recv ));
  }

  /* [R] 특정 send{id}의 FriendRequest 조회 */
  @ApiOperation({ summary: '보낸 친구 요청 목록 API' })
  @ApiOkResponse({ description: 'Ok' , isArray: true})
  @Get('friend-requests-sned/:id')
  async readSendFriendRequest(send: number): Promise<FriendRequest[]> {
    return (this.usersService.readSendFriendRequest( send ));
  }

  /* [D] FriendRequest 제거 */
  @ApiOperation({ summary: '친구 요청 삭제 API' })
  // @ApiQuery({ name: 'user', type: 'number' })
  // @ApiQuery({ name: 'target', type: 'number' })
  @ApiOkResponse({ description: 'Ok' })
  @Delete('/friend-requests/:id')
  async deleteFriendRequest(@Param('id') target: number): Promise<void> {
    await this.usersService.deleteFriendRequest(target);
  }

  @ApiOperation({ summary: 'user info 조회 API'})
  @ApiOkResponse({ description: 'Ok', type: UserDto, isArray: true })
  @Get(':userId')
  async readUserInfo(@Param('userId') id: number): Promise<UserDto> {
    return (this.usersService.readUserInfo(id));
  }

  @ApiOperation({ summary: 'player가 참여한 channel 조회 API'})
  @ApiOkResponse({ description: 'Ok', type: ChannelListDto, isArray: true })
  @Get('/:userId/channels')
  async readChatInfo(@Param('UserId') id: number): Promise<ChannelListDto> {
    return (this.usersService.readChannelList(id));
  }
}
