import { Injectable } from '@nestjs/common';
import { HistoryService } from './database/history/history.service';
import { History } from './database/history/history.entity';
import { RecordService } from './database/record/record.service';
import { Record } from './database/record/record.entity';

@Injectable()
export class GameService {
    constructor(
        private readonly historyService : HistoryService,
        private readonly recordService : RecordService,
    ) {}
/* History Part */
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

/* Record Part */
  /* [C] Record 생성 */
  async createRecord(record: Partial<Record>): Promise<Record> {
    return (this.recordService.createRecord(record));
  }

  /* [R] 모든 Record 조회 */
  async readAllRecord(): Promise<Record[]> {
    return (this.recordService.readAllRecord());
  }

  /* [R] 특정 Record 조회 */
  async readOneRecord(id: number): Promise<Record> {
    return (this.recordService.readOneRecord(id));
  }

  /* [U] Record info 수정 */
  async updateRecordInfo(id: number, record: Partial<Record>): Promise<Record> {
    return (this.recordService.updateRecordInfo(id, record));
  }

  /* [D] Record 제거 */
  async deleteRecord(id: number): Promise<void> {
    await this.recordService.deleteRecord(id);
  }
}
