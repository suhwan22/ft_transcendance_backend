import { Controller, Get, Post, Body, Put, Param, Delete, NotFoundException } from '@nestjs/common';
import { UsersService } from './users.service';
import { Player } from './entities/player.entity';
import { UserGameRecord } from './entities/user-game-record.entity';

@Controller('users')
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

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
  }
}
