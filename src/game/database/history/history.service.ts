import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { History } from './history.entity';

@Injectable()
export class HistoryService {
  constructor(
    @InjectRepository(History)
    private historyRepository: Repository<History>,
  ) {}

  /* [C] History 생성 */
  async createHistory(history: Partial<History>): Promise<History> {
    const newhistory = this.historyRepository.create(history);
    return (this.historyRepository.save(newhistory));
  }

  /* [R] 모든 History 조회 */
  async readAllHistory(): Promise<History[]> {
    return (this.historyRepository.find());
  }

  /* [R] 특정 History 조회 */
  async readOneHistory(id: number): Promise<History> {
    return (this.historyRepository.findOne({ where: { id } }));
  }

  /* [U] History info 수정 */
  async updateHistoryInfo(id: number, history: Partial<History>): Promise<History> {
    await this.historyRepository.update(id, history);
    return (this.historyRepository.findOne({ where: { id } }));
  }

  /* [D] History 제거 */
  async deleteHistory(id: number): Promise<void> {
    await (this.historyRepository.delete(id));
  }
}
  