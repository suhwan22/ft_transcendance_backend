import { Inject, Injectable, forwardRef } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { UserGameRecord } from 'src/users/entities/user-game-record.entity';
import { UsersService } from 'src/users/users.service';
import { Repository } from 'typeorm';
import { GameHistory } from './entities/game-history.entity';
import { GameHistoryRequestDto } from './dtos/game-history.request.dto';
import { Player } from 'src/users/entities/player.entity';
import { GameDodge } from './entities/game-dodge.entity';
import { GameDodgeRepository } from './repositories/game-dodge.repository';
import { GameHistoryRepository } from './repositories/game-history.entity';

@Injectable()
export class GamesService {
  constructor(
    private gameHistoryRepository: GameHistoryRepository,
    private gameDodgeRepository: GameDodgeRepository,

    @Inject(forwardRef(() => UsersService))
    private readonly usersService: UsersService,
  ) { }

  /**
   * 
   * API SERVICE FUNCTION
   * 
   */

  async readRankInfo(): Promise<UserGameRecord[]> {
    const records = await this.usersService.readAllUserGameRecord();
    records.sort((a, b) => {
      if (a.rating === b.rating) {
        return (b.win - a.win);
      }
      else return (b.rating - a.rating);
    });
    return (records);
  }

  async getMyRank(userId: number) {
    const records = await this.readRankInfo();
    for (let i = 0; i < records.length; i++) {
      if (records[i].user.id == userId) {
        return (i + 1);
      }
    }
    return (null);
  }

  /**
   * 
   * GAME_HISTORY Table CRUD
   * 
   */

  /* [C] gameHistory 생성 */
  async createGameHistoryWitData(user: number, opponent: Player, result: boolean, userScore: number, opponentScore: number, rank: boolean): Promise<GameHistory> {
    return (await this.gameHistoryRepository.createGameHistoryWitData(user, opponent, result, userScore, opponentScore, rank));
  }

  /* [R] 특정 gameHistory 조회 */
  async readOneGameHistory(user: number): Promise<GameHistory[]> {
    return (await this.gameHistoryRepository.readOneGameHistory(user));
  }

  /* [D] gameHistory 제거 */
  async deleteGameHistory(id: number): Promise<void> {
    await (this.gameHistoryRepository.delete(id));
  }

  /**
   * 
   * GAME_DODGE Table CRUD
   * 
   */

  /** [C] GameDodge 생성 */
  async createGameDodge(userId: number) {
    await this.gameDodgeRepository.createGameDodge(userId);
  }
  
  /** [U] GameDodge 수정 */
  async updateGameDodge(id: number, execute: boolean) {
    await this.gameDodgeRepository.updateGameDodge(id, execute);
  }

  /** [R] GameDodge 읽기 */
  async readGameDodge(userId: number) {
    const gameDodge = await this.gameDodgeRepository.readGameDodge(userId);
    return (gameDodge);
  }

  /** [D] GameDodge 제거 */
  async deleteGameDodge(id: number) {
    await this.gameDodgeRepository.deleteGameDodge(id);
  }
}
