import { Injectable } from '@nestjs/common';
import { ListService } from './database/list/list.service';
import { List } from './database/list/list.entity';

@Injectable()
export class ChannelService {
    constructor(
        private readonly listService : ListService,
    ) {}

  /* [C] List 생성 */
  async createList(list: Partial<List>): Promise<List> {
    return (this.listService.createList(list));
  }

  /* [R] 모든 List 조회 */
  async readAlllist(): Promise<List[]> {
    return (this.listService.readAllList());
  }

  /* [R] 특정 List 조회 */
  async readOneList(id: number): Promise<List> {
    return (this.listService.readOneList(id));
  }

  /* [U] List info 수정 */
  async updateListInfo(id: number, List: Partial<List>): Promise<List> {
    return (this.listService.updateListInfo(id, List));
  }

  /* [D] List 제거 */
  async deleteList(id: number): Promise<void> {
    await this.listService.deleteList(id);
  }
}
