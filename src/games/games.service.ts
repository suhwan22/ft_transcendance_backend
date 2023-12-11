import { Inject, Injectable, forwardRef } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { UserGameRecord } from 'src/users/entities/user-game-record.entity';
import { UsersService } from 'src/users/users.service';
import { Repository } from 'typeorm';
import { GameHistory } from './entities/game-history.entity';
import { GameHistoryRequestDto } from './dtos/game-history.request.dto';
import { GameRoom } from './entities/game.entity';
import { Player } from 'src/users/entities/player.entity';
import { GameDodge } from './entities/game-dodge.entity';

@Injectable()
export class GamesService {
  constructor(
    @InjectRepository(GameHistory)
    private gameHistoryRepository: Repository<GameHistory>,
    @InjectRepository(GameDodge)
    private gameDodgeRepository: Repository<GameDodge>,

    @Inject(forwardRef(() => UsersService))
    private readonly usersService: UsersService,
  ) { }

  /* [C] gameHistory 생성 */

  async createGameHistory(history: Partial<GameHistoryRequestDto>): Promise<GameHistory> {
    const opponent = await this.usersService.readOnePurePlayer(history.opponent);
    const temp = {
      user: history.user,
      opponent: opponent,
      result: history.result,
      userScore: history.userScore,
      opponentScore: history.opponentScore
    }
    const newHistory = this.gameHistoryRepository.create(temp);
    return (this.gameHistoryRepository.save(newHistory));
  }

  async createGameHistoryWitData(user: number,
    opponent: Player,
    result: boolean,
    userScore: number,
    opponentScore: number,
    rank: boolean): Promise<GameHistory> {
    const temp = {
      user: user,
      opponent: opponent,
      result: result,
      userScore: userScore,
      opponentScore: opponentScore,
      rank: rank,
    }
    const newHistory = this.gameHistoryRepository.create(temp);
    return (this.gameHistoryRepository.save(newHistory));
  }

  /* [R] 특정 gameHistory 조회 */
  async readOneGameHistory(user: number): Promise<GameHistory[]> {
    const recordList = await this.gameHistoryRepository
      .createQueryBuilder('game_history')
      .leftJoinAndSelect('game_history.opponent', 'opponent')
      .select(['game_history.id', 'game_history.result', 'game_history.userScore', 'game_history.opponentScore', 'game_history.date'
        , 'opponent.id', 'opponent.name'])
      .where('game_history.user = :id', { id: user })
      .getMany();
    return (recordList)
  }

  /* [U] gameHistory info 수정 */
  async updateGameHistoryInfo(id: number, history: Partial<GameHistory>): Promise<GameHistory> {
    await this.gameHistoryRepository.update(id, history);
    return (this.gameHistoryRepository.findOne({ where: { id } }));
  }

  // /* [D] gameHistory 제거 */
  // async deleteGameHistory(id: number): Promise<void> {
  //   await (this.gameHistoryRepository.delete(id));
  // }

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

  async createGameDodge(userId: number) {
    const gameDodge = this.gameDodgeRepository
      .createQueryBuilder('game_dodge')
      .insert()
      .into(GameDodge)
      .values({ user: () => `${userId}` })
      .execute();
  }

  async readGameDodge(userId: number) {
    const gameDodge = await this.gameDodgeRepository
      .createQueryBuilder('game_dodge')
      .select(['game_dodge.id', 'game_dodge.date'])
      .getOne();
    return (gameDodge);
  }

  async deleteGameDodge(userId: number) {
    const deleteResult = await this.gameDodgeRepository
      .createQueryBuilder('game_dodge')
      .delete()
      .where(`user_id = ${userId}`)
      .execute();
  }

  async getCurrentMyHistroy(userId: number): Promise<GameHistory> {
    const gameHistroy = this.gameHistoryRepository.createQueryBuilder('game_history')
      .leftJoinAndSelect('game_history.opponent', 'player')
      .select(['game_history.id',
        'game_history.result',
        'game_history.userScore',
        'game_history.opponentScore',
        'player.id',
        'player.name',
        'game_history.date'])
      .where(`game_history.user = ${userId}`)
      .orderBy('game_history.date', 'DESC')
      .limit(1)
      .getOne();
    return (gameHistroy);
  }
}
