import { Controller, Get, Param, Body, Post, Delete, Put, NotFoundException, UseGuards, Req } from '@nestjs/common';
import { UsersService } from './users.service';
import { UserBlock } from './entities/user-block.entity';
import { UserFriend } from './entities/user-friend.entity';
import { ApiBody, ApiCreatedResponse, ApiOperation, ApiTags, ApiOkResponse } from '@nestjs/swagger';
import { Player } from './entities/player.entity';
import { UserGameRecord } from './entities/user-game-record.entity';
import { FriendRequest } from './entities/friend-request.entity';
import { PlayerRequestDto } from './dtos/player.request.dto';
import { JwtTwoFactorAuthGuard } from 'src/auth/guards/jwt-2fa.guard';
import { ChannelConfig } from 'src/chats/entities/channel-config.entity';

@UseGuards(JwtTwoFactorAuthGuard)
@ApiTags('Users')
@Controller('users')
export class UsersController {
  constructor(private readonly usersService: UsersService) { }
  
  /** 
   * player API
   */
  
  @ApiOperation({ summary: '내 정보 조회 API' })
  @ApiOkResponse({ description: 'Ok', type: Player })
  @Get('players/me')
  async readMePlayer(@Req() req): Promise<Player> {
    const id = req.user.userId;
    const user = await this.usersService.readOnePlayer(id);
    if (!user) {
      throw new NotFoundException('Player does not exist!');
    }
    return (user);
  }

  //get player by id
  @ApiOperation({ summary: '특정 유저 정보 조회 API' })
  @ApiOkResponse({ description: 'Ok', type: Player })
  @Get('players/:userId')
  async readOnePlayer(@Param('userId') id: number): Promise<Player> {
    const user = await this.usersService.readOnePlayer(id);
    if (!user) {
      throw new NotFoundException('Player does not exist!');
    }
    return (user);
  }

  //update player
  // @ApiOperation({ summary: '내 정보 수정 API' })
  // @ApiBody({ type: PlayerRequestDto })
  // @ApiCreatedResponse({ description: 'success', type: Player })
  // @Put('players/me')
  // async updatePlayerInfo(@Req() req, @Body() user: PlayerRequestDto): Promise<any> {
  //   const id = req.user.userId;
  //   return (this.usersService.updatePlayerInfo(id, user));
  // }

  //delete player
  @ApiOperation({ summary: '내 유저 정보 삭제 API' })
  @ApiOkResponse({ description: 'Ok' })
  @Delete('players/me')
  async deletePlayer(@Req() req): Promise<any> {
    const id = req.user.userId;
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
  @ApiOperation({ summary: '전체 유저 레이팅 조회 API' })
  @ApiOkResponse({ description: 'Ok', type: UserGameRecord, isArray: true })
  @Get('game-records')
  async readAllUserGameRecord(): Promise<UserGameRecord[]> {
    return (this.usersService.readAllUserGameRecord());
  }

  @ApiOperation({ summary: '내 레이팅 조회 API' }) 
  @ApiOkResponse({ description: 'Ok', type: UserGameRecord})
  @Get('game-records/me')
  async readMeUserGameRecord(@Req() req): Promise<UserGameRecord> {
    const id = req.user.userId;
    const user = await this.usersService.readOneUserGameRecord(id);
    if (!user) {
      throw new NotFoundException('UserGameRecord does not exist!');
    }
    return (user);
  }

  //get usergamerecord by id
  @ApiOperation({ summary: '특정 유저 레이팅 조회 API' }) 
  @ApiOkResponse({ description: 'Ok', type: UserGameRecord})
  @Get('game-records/:userId')
  async readOneUserGameRecord(@Param('userId') id: number): Promise<UserGameRecord> {
    const user = await this.usersService.readOneUserGameRecord(id);
    if (!user) {
      throw new NotFoundException('UserGameRecord does not exist!');
    }
    return (user);
  }

  /** 
   * 유저 친구 API
   */

  @ApiOperation({ summary: '내 친구 목록 조회 API' })
  @ApiOkResponse({ description: 'Ok', type: UserFriend, isArray: true })
  @Get('/friends/me')
  async readMeFriendList(@Req() req): Promise<UserFriend[]> {
    const id = req.user.userId;
    return (this.usersService.readFriendList(id));
  }

  @ApiOperation({ summary: '특정 유저 친구 목록 조회 API' })
  @ApiOkResponse({ description: 'Ok', type: UserFriend, isArray: true })
  @Get('/friends/:userId')
  async readFriendList(@Param('userId') user: number): Promise<UserFriend[]> {
    return (this.usersService.readFriendList(user));
  }

  /** 
   * 유저 차단 API
   */

  @ApiOperation({ summary: '내 차단목록 조회 API' })
  @ApiOkResponse({ description: 'Ok', type: UserFriend, isArray: true })
  @Get('/blocks/me')
  async readBlockList(@Req() req): Promise<UserBlock[]> {
    const id = req.user.userId;
    return (this.usersService.readBlockList(id));
  }

  /** 
   * 친구 요청 API
   */

  /* [R] 특정 recv{id}의 FriendRequest 조회 */
  @ApiOperation({ summary: '내가 받은 친구 요청 목록 조회 API' })
  @ApiOkResponse({ description: 'Ok' , isArray: true})
  @Get('friend-requests-recv/me')
  async readRecvFriendRequest(@Req() req): Promise<FriendRequest[]> {
    const recv = req.user.userId;
    return (this.usersService.readRecvFriendRequest( recv ));
  }

  /* [R] 특정 send{id}의 FriendRequest 조회 */
  @ApiOperation({ summary: '내가 보낸 친구 요청 목록 조회 API' })
  @ApiOkResponse({ description: 'Ok' , isArray: true})
  @Get('friend-requests-send/me')
  async readSendFriendRequest(@Req() req): Promise<FriendRequest[]> {
    const send = req.user.userId;
    return (this.usersService.readSendFriendRequest( send ));
  }

  /* [D] FriendRequest 제거 */
  @ApiOperation({ summary: '친구 요청 삭제 API' })
  @ApiOkResponse({ description: 'Ok' })
  @Delete('/friend-requests/:userId')
  async deleteFriendRequest(@Param('userId') target: number): Promise<void> {
    await this.usersService.deleteFriendRequest(target);
  }

  @ApiOperation({ summary: '참여 가능 채팅방 리스트 조회 API'})
  @ApiOkResponse({ description: 'Ok', type: ChannelConfig, isArray: true })
  @Get('/channels/me/out')
  async readChatInfo(@Req() req): Promise<ChannelConfig[]> {
    const userId = req.user.userId;
    return (this.usersService.readChannelListWithoutUser(userId));
  }

  @ApiOperation({ summary: '참여 중인 채팅방 리스트 조회 API'})
  @ApiOkResponse({ description: 'Ok', type: ChannelConfig, isArray: true })
  @Get('/channels/me/in')
  async readChatUserInfo(@Req() req): Promise<ChannelConfig[]>  {
    const userId = req.user.userId;
    return (this.usersService.readChannelListWithUser(userId, false));
  }

  @ApiOperation({ summary: '참여 중인 dm 리스트 조회 API'})
  @ApiOkResponse({ description: 'Ok', type: ChannelConfig, isArray: true })
  @Get('/channels/me/dm')
  async readDm(@Req() req): Promise<ChannelConfig[]>  {
    const userId = req.user.userId;
    return (this.usersService.readChannelListWithUser(userId, true));
  }
}
