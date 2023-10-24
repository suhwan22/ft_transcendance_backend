import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Record } from './record.entity';

@Injectable()
export class RecordService {
  constructor(
    @InjectRepository(Record)
    private recordRepository: Repository<Record>,
  ) {}

  /* [C] Record 생성 */
  async createRecord(record: Partial<Record>): Promise<Record> {
    const newrecord = this.recordRepository.create(record);
    return (this.recordRepository.save(newrecord));
  }

  /* [R] 모든 Record 조회 */
  async readAllRecord(): Promise<Record[]> {
    return (this.recordRepository.find());
  }

  /* [R] 특정 Record 조회 */
  async readOneRecord(id: number): Promise<Record> {
    return (this.recordRepository.findOne({ where: { id } }));
  }

  /* [U] Record info 수정 */
  async updateRecordInfo(id: number, record: Partial<Record>): Promise<Record> {
    await this.recordRepository.update(id, record);
    return (this.recordRepository.findOne({ where: { id } }));
  }

  /* [D] Record 제거 */
  async deleteRecord(id: number): Promise<void> {
    await (this.recordRepository.delete(id));
  }
}
  