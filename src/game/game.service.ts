import { Injectable } from '@nestjs/common';
import { HistoryService } from './database/history/history.service';
import { History } from './database/history/history.entity';

@Injectable()
export class GameService {
    constructor(
        private readonly historyService : HistoryService,
    ) {}

  /* [C] History 생성 */
  async createHistory(history: Partial<History>): Promise<History> {
    return (this.historyService.createHistory(history));
  }

  /* [R] 모든 History 조회 */
  async readAllHistory(): Promise<History[]> {
    return (this.historyService.readAllHistory());
  }

  /* [R] 특정 History 조회 */
  async readOneHistory(id: number): Promise<History> {
    return (this.historyService.readOneHistory(id));
  }

  /* [U] History info 수정 */
  async updateHistoryInfo(id: number, history: Partial<History>): Promise<History> {
    return (this.historyService.updateHistoryInfo(id, history));
  }

  /* [D] History 제거 */
  async deleteHistory(id: number): Promise<void> {
    await this.historyService.deleteHistory(id);
  }
}
