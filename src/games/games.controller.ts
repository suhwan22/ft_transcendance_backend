import { Controller, Get, Post, Body, Put, Param, Delete, NotFoundException, UseGuards, Req } from '@nestjs/common';
import { ApiBody, ApiCreatedResponse, ApiOkResponse, ApiOperation, ApiQuery, ApiTags } from '@nestjs/swagger';
import { GamesService } from './games.service';
import { GameHistory } from './entities/game-history.entity';
import { GameHistoryRequestDto } from './dtos/game-history.request.dto';
import { UserGameRecord } from 'src/users/entities/user-game-record.entity';
import { JwtTwoFactorAuthGuard } from 'src/auth/guards/jwt-2fa.guard';

@UseGuards(JwtTwoFactorAuthGuard)
@ApiTags('games')
@Controller('games')
export class GamesController {
  constructor(
    private readonly gamesService: GamesService
  ) {}

/* History Part */
  //get history by id
  @ApiOperation({ summary: '내 게임 기록 조회 API' })
  @ApiOkResponse({ description: 'Ok', type: GameHistory, isArray: true})
  @Get('historys/me')
  async readMeHistory(@Req() req): Promise<GameHistory[]> {
    const id = req.user.userId;
    const history = await this.gamesService.readOneGameHistory(id);
    if (!history) {
      throw new NotFoundException('History does not exist!');
    }
    return (history);
  }

  @ApiOperation({ summary: '특정 유저 게임 기록 조회 API' })
  @ApiOkResponse({ description: 'Ok', type: GameHistory, isArray: true})
  @Get('historys/:userId')
  async readOneHistory(@Param('userId') id): Promise<GameHistory[]> {
    const history = await this.gamesService.readOneGameHistory(parseInt(id));
    if (!history) {
      throw new NotFoundException('History does not exist!');
    }
    return (history);
  }

  @ApiOperation({ summary: '랭킹목록 조회 API' })
  @ApiOkResponse({ description: 'Ok', type: UserGameRecord, isArray: true })
  @Get('ranks')
  async readRankInfo(): Promise<UserGameRecord[]> {
    return (this.gamesService.readRankInfo());
  }

  @ApiOperation({ summary: '내 랭킹 조회 API' })
  @ApiOkResponse({ description: 'Ok'})
  @Get('ranks/me')
  async getMyRank(@Req() req): Promise<number> {
    const id = req.user.userId;
    return (this.gamesService.getMyRank(id));
  }

}