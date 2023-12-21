import { Injectable } from "@nestjs/common";
import { DataSource, Repository } from "typeorm";
import { GameHistory } from "../entities/game-history.entity";
import { Player } from "src/users/entities/player.entity";

@Injectable()
export class GameHistoryRepository extends Repository<GameHistory> {
  constructor(dataSource: DataSource) {
    super(GameHistory, dataSource.createEntityManager());
  }

  /* [C] gameHistory 생성 */
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
    const newHistory = this.create(temp);
    return (this.save(newHistory));
  }

  /* [R] 특정 gameHistory 조회 */
  async readOneGameHistory(user: number): Promise<GameHistory[]> {
    if (typeof(user) !== 'number')
      return (null);
    const recordList = await this.createQueryBuilder('game_history')
      .leftJoinAndSelect('game_history.opponent', 'opponent')
      .select(['game_history.id', 'game_history.result', 'game_history.userScore', 'game_history.opponentScore', 'game_history.date'
        , 'opponent.id', 'opponent.name'])
      .where('game_history.user = :id', { id: user })
      .getMany();
    return (recordList)
  }

  /* [D] gameHistory 제거 */
  async deleteGameHistory(id: number): Promise<void> {
    await (this.delete(id));
  }

}