import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { GameHistory } from './entities/game-history.entity';

@Injectable()
export class GamesService {
  constructor(
    @InjectRepository(GameHistory)
    private gameHistoryRepository: Repository<GameHistory>,
  ) {}

  /* [C] gameHistory 생성 */
  async createGameHistory(history: Partial<GameHistory>): Promise<GameHistory> {
    const newgameHistory = this.gameHistoryRepository.create(history);
    return (this.gameHistoryRepository.save(newgameHistory));
  }

  /* [R] 모든 gameHistory 조회 */
  async readAllGameHistory(): Promise<GameHistory[]> {
    return (this.gameHistoryRepository.find());
  }

  /* [R] 특정 gameHistory 조회 */
  async readOneGameHistory(id: number): Promise<GameHistory> {
    return (this.gameHistoryRepository.findOne({ where: { id } }));
  }

  /* [U] gameHistory info 수정 */
  async updateGameHistoryInfo(id: number, history: Partial<GameHistory>): Promise<GameHistory> {
    await this.gameHistoryRepository.update(id, history);
    return (this.gameHistoryRepository.findOne({ where: { id } }));
  }

  /* [D] gameHistory 제거 */
  async deleteGameHistory(id: number): Promise<void> {
    await (this.gameHistoryRepository.delete(id));
  }
}
