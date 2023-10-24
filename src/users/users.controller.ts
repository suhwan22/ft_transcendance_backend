import { Controller, Get, Post, Body, Put, Param, Delete, NotFoundException } from '@nestjs/common';
import { UsersService } from './users.service';
import { Player } from './database/player/player.entity';

@Controller('users')
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  //get all player
  @Get()
  async readAllPlayer(): Promise<Player[]> {
    return (this.usersService.readAllPlayer());
  }

  //get player by id
  @Get(':id')
  async readOnePlayer(@Param('id') id: number): Promise<Player> {
    const user = await this.usersService.readOnePlayer(id);
    if (!user) {
      throw new NotFoundException('Player does not exist!');
    }
    return (user);
  }

  //create player
  @Post()
  async createPlayer(@Body() user: Player): Promise<Player> {
    return (this.usersService.createPlayer(user));
  }

  //update player
  @Put(':id')
  async updatePlayerInfo(@Param('id') id: number, @Body() user: Player): Promise<any> {
    return (this.usersService.updatePlayerInfo(id, user));
  }

  //delete player
  @Delete(':id')
  async delete(@Param('id') id: number): Promise<any> {
    const user = await this.usersService.readOnePlayer(id);
    if (!user) {
      throw new NotFoundException('Player does not exist!');
    }
    return (this.usersService.deletePlayer(id));
  }
}