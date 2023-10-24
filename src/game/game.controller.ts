import { Controller, Get, Post, Body, Put, Param, Delete, NotFoundException } from '@nestjs/common';
import { GameService } from './game.service';
import { History } from './database/history/history.entity';

@Controller('game')
export class GameController {
  constructor(
    private readonly gameService: GameService
  ) {}

/* History Part */
  //get all history
  @Get()
  async readAllHistory(): Promise<History[]> {
    return (this.gameService.readAllHistory());
  }

  //get history by id
  @Get(':id')
  async readOneHistory(@Param('id') id: number): Promise<History> {
    const history = await this.gameService.readOneHistory(id);
    if (!history) {
      throw new NotFoundException('History does not exist!');
    }
    return (history);
  }

  //create history
  @Post()
  async createHistory(@Body() game: History): Promise<History> {
    return (this.gameService.createHistory(game));
  }

  //update history
  @Put(':id')
  async updateHistoryInfo(@Param('id') id: number, @Body() game: History): Promise<any> {
    return (this.gameService.updateHistoryInfo(id, game));
  }

  //delete history
  @Delete(':id')
  async delete(@Param('id') id: number): Promise<any> {
    const history = await this.gameService.readOneHistory(id);
    if (!history) {
      throw new NotFoundException('History does not exist!');
    }
    return (this.gameService.deleteHistory(id));
  }
}