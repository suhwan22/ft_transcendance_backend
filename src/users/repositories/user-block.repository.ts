import { Injectable } from "@nestjs/common";
import { DataSource, DeleteResult, InsertResult, Repository } from "typeorm";
import { Player } from "../entities/player.entity"
import { UserBlock } from "../entities/user-block.entity";
import { UserBlockRequestDto } from "../dtos/user-block.request.dto";

/* BLOCK_LIST Table CRUD */

@Injectable()
export class UserBlockRepository extends Repository<UserBlock> {
  constructor(private dataSource: DataSource) {
    super(UserBlock, dataSource.createEntityManager());
  }

  /* [C] 유저 블락 생성 */
  async createBlockInfo(blockRequest: Partial<UserBlockRequestDto>): Promise<InsertResult> {
    let insertResult;
    if (typeof (blockRequest.target) === 'number') {
        insertResult = await this.createQueryBuilder('block_list')
        .insert()
        .into(UserBlock)
        .values({ user: blockRequest.user, target: () => `${blockRequest.target}` })
        .execute();
    }
    else
      return null;
    return (insertResult);
  }

  /* [C] 유저 블락 생성 */
  async createBlockInfoWithTarget(user: number, targetName: string) {
    const playerQr = await this.dataSource
      .getRepository(Player)
      .createQueryBuilder('player')
      .subQuery()
      .from(Player, 'player')
      .select('player.id')
      .where('name = :target', { target: targetName })
      .getQuery();
    const userBlock = await this.createQueryBuilder('block_list')
      .insert()
      .values({ user: user, target: () => `${playerQr}` })
      .execute();
  }

  /* [R] 유저 블락리스트 조회 */
  async readBlockList(user: number): Promise<UserBlock[]> {
    const blockList = await this.createQueryBuilder('block_list')
      .leftJoinAndSelect('block_list.target', 'target')
      .select(['block_list.id', 'target.id', 'target.name'])
      .where('block_list.user = :id', { id: user })
      .getMany();
    return (blockList)
  }

  /* [R] user의 특정(target) block 조회 */
  async readUserBlockWithTargetId(user: number, target: number): Promise<UserBlock> {
    const userBlock = await this.dataSource
      .getRepository(UserBlock).createQueryBuilder('block_list')
      .leftJoinAndSelect('block_list.target', 'target')
      .select(['block_list.id', 'target.id', 'target.name'])
      .where('block_list.user = :id', { id: user })
      .andWhere('target.id = :target', { target: target })
      .getOne();
    return (userBlock)
  }

  /* [U] 특정(id) block 수정 */
  async updateBlockInfo(id: number, block: Partial<UserBlock>): Promise<UserBlock> {
    await this.update(id, block);
    return (this.findOne({ where: { id } }));
  }

  /* [D] 특정(id) block 제거 */
  async deleteBlockInfo(id: number): Promise<void> {
    await (this.delete(id));
  }

  /* [D] 특정 user(id) 의 block_list 제거 */
  async deleteBlockList(user: number): Promise<void> {
    const deleteResult = await this.createQueryBuilder('block_list')
      .delete()
      .where(`user = ${user}`)
      .execute();
  }

  /* [D] 특정 user의 name으로 자기가 target되어있는 block_list 제거 */
  async deleteUserBlockWithName(name: string): Promise<DeleteResult> {
    const playerQr = await this.dataSource
      .getRepository(Player)
      .createQueryBuilder('player')
      .subQuery()
      .from(Player, 'player')
      .select('player.id')
      .where('name = :name', { name: name })
      .getQuery();

    const deleteResult = await this.dataSource
      .getRepository(UserBlock)
      .createQueryBuilder('block_list')
      .delete()
      .where(`target_id = ${playerQr}`)
      .execute();
    return (deleteResult);
  }
}