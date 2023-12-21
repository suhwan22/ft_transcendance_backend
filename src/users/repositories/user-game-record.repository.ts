import { Injectable } from "@nestjs/common";
import { DataSource, InsertResult, Repository } from "typeorm";
import { UserGameRecord } from "../entities/user-game-record.entity";
import { UserGameRecordRequestDto } from "../dtos/user-game-record.request.dto";

@Injectable()
export class UserGameRecordRepository extends Repository<UserGameRecord> {
  constructor(private dataSource: DataSource) {
    super(UserGameRecord, dataSource.createEntityManager());
  }

  /* WIN_LOSS_RECORD Table CRUD */

  /* [C] UserGameRecord 생성 */
  async createUserGameRecord(record: Partial<UserGameRecordRequestDto>): Promise<InsertResult> {
    let insertResult;
    if (typeof (record.user) === 'number') {
      insertResult = await this.createQueryBuilder('win_loss_record')
        .insert()
        .into(UserGameRecord)
        .values({ user: () => `${record.user}`, win: record.win, loss: record.loss, rating: record.rating })
        .execute();
    }
    else
      return null;
    return (insertResult);
  }

  // /* [C] UserGameRecord with result 생성 */
  // async createUserGameRecordWithResult(user: Player, result: boolean): Promise<UserGameRecord> {
  //   let record = { win: 0, loss: 1, rating: -1 };
  //   if (result) 
  //     record = { win: 1, loss: 0, rating: 1 };
  //   const newRecord = this.create({ 
  //     user: user, 
  //     win: record.win, 
  //     loss: record.loss, 
  //     rating: record.rating });
  //   return (this.recordRepository.save(newRecord));
  // }

  /* [R] 모든 UserGameRecord 조회 */
  async readAllUserGameRecord(): Promise<UserGameRecord[]> {
    const recordList = await this.createQueryBuilder('win_loss_record')
      .leftJoinAndSelect('win_loss_record.user', 'user')
      .select(['win_loss_record.id', 'user.id', 'user.name'
        , 'win_loss_record.win', 'win_loss_record.loss', 'win_loss_record.rating'])
      .getMany();
    return (recordList)
  }

  /* [R] 특정 UserGameRecord 조회 */
  async readOneUserGameRecord(user: number): Promise<UserGameRecord> {
    const recordList = await this.createQueryBuilder('win_loss_record')
      .leftJoinAndSelect('win_loss_record.user', 'user')
      .select(['win_loss_record.id', 'user.id', 'user.name'
        , 'win_loss_record.win', 'win_loss_record.loss', 'win_loss_record.rating'])
      .where('win_loss_record.user = :id', { id: user })
      .getOne();
    return (recordList)
  }

  /* [U] UserGameRecord info 수정 */
  async updateUserGameRecordInfo(id: number, record: Partial<UserGameRecord>): Promise<UserGameRecord> {
    await this.update(id, record);
    return (this.findOne({ where: { id } }));
  }

  async updateUserGameRecordWin(userId: number) {
    const update = await this.createQueryBuilder('win_loss_record')
      .update()
      .set({ win: () => 'win + 1' })
      .where('user_id = :userId', { userId: userId })
      .execute()
    return (update);
  }

  async updateUserGameRecordLoss(userId: number) {
    const update = await this.createQueryBuilder('win_loss_record')
      .update()
      .set({ loss: () => 'loss + 1' })
      .where('user_id = :userId', { userId: userId })
      .execute()
    return (update);
  }

  async updateUserGameRecordRankWin(userId: number, rating: number) {
    if (typeof (rating) === 'number') {
      const update = await this.createQueryBuilder('win_loss_record')
        .update()
        .set({ win: () => 'win + 1', rating: () => `${rating}` })
        .where('user_id = :userId', { userId: userId })
        .execute()
      return (update);
    }
    else
      return ;
  }

  async updateUserGameRecordRankLoss(userId: number, rating: number) {
    if (typeof (rating) === 'number') {
      const update = await this.createQueryBuilder('win_loss_record')
        .update()
        .set({ loss: () => 'loss + 1', rating: () => `${rating}` })
        .where('user_id = :userId', { userId: userId })
        .execute()
      return (update);
    }
    else
      return ;
  }

  /* [D] UserGameRecord 제거 */
  async deleteUserGameRecord(id: number): Promise < void> {
      await(this.delete(id));
    }
  }