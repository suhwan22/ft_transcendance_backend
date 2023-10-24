import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { List } from './list.entity';

@Injectable()
export class ListService {
  constructor(
    @InjectRepository(List)
    private listRepository: Repository<List>,
  ) {}

  /* [C] List 생성 */
  async createList(list: Partial<List>): Promise<List> {
    const newlist = this.listRepository.create(list);
    return (this.listRepository.save(newlist));
  }

  /* [R] 모든 List 조회 */
  async readAllList(): Promise<List[]> {
    return (this.listRepository.find());
  }

  /* [R] 특정 List 조회 */
  async readOneList(id: number): Promise<List> {
    return (this.listRepository.findOne({ where: { id } }));
  }

  /* [U] List info 수정 */
  async updateListInfo(id: number, list: Partial<List>): Promise<List> {
    await this.listRepository.update(id, list);
    return (this.listRepository.findOne({ where: { id } }));
  }

  /* [D] List 제거 */
  async deleteList(id: number): Promise<void> {
    await (this.listRepository.delete(id));
  }
}
  