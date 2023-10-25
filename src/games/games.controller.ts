import { Controller, Get, Post, Body, Put, Param, Delete, NotFoundException } from '@nestjs/common';
import { GamesService } from './games.service';
import { GameHistory } from './entities/game-history.entity';

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
}