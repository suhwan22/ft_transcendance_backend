import { Controller, Get, Post, Body, Put, Param, Delete, NotFoundException } from '@nestjs/common';
import { GamesService } from './games.service';
import { GameHistory } from './entities/game-history.entity';
import { ApiOkResponse, ApiOperation, ApiTags } from '@nestjs/swagger';
import { UserGameRecord } from 'src/users/entities/user-game-record.entity';

@ApiTags('Game')
@Controller('game')
export class GamesController {
  constructor(
    private readonly gamesService: GamesService
  ) {}

/* History Part */
  //get all history
  @Get('history')
  async readAllHistory(): Promise<GameHistory[]> {
    return (this.gamesService.readAllGameHistory());
  }

  //get history by id
  @Get('history/:id')
  async readOneHistory(@Param('id') id: number): Promise<GameHistory> {
    const history = await this.gamesService.readOneGameHistory(id);
    if (!history) {
      throw new NotFoundException('History does not exist!');
    }
    return (history);
  }

  //create history
  @Post('history')
  async createHistory(@Body() game: GameHistory): Promise<GameHistory> {
    return (this.gamesService.createGameHistory(game));
  }

  //update history
  @Put('history/:id')
  async updateGameHistoryInfo(@Param('id') id: number, @Body() game: GameHistory): Promise<any> {
    return (this.gamesService.updateGameHistoryInfo(id, game));
  }

  //delete history
  @Delete('history/:id')
  async deleteGameHistory(@Param('id') id: number): Promise<any> {
    const history = await this.gamesService.readOneGameHistory(id);
    if (!history) {
      throw new NotFoundException('History does not exist!');
    }
    return (this.gamesService.deleteGameHistory(id));
  }

  @ApiOperation({ summary: '랭킹목록 조회 API' })
  @ApiOkResponse({ description: 'Ok', type: UserGameRecord, isArray: true })
  @Get('ranks')
  async readRankInfo(): Promise<UserGameRecord[]> {
    return (this.gamesService.readRankInfo());
  }
}