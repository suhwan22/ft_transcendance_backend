import { Injectable } from "@nestjs/common";
import { DataSource, InsertResult, Repository } from "typeorm";
import { ChannelConfig } from "../entities/channel-config.entity";
import { ChannelConfigRequestDto } from "../dtos/channel-config.request.dto";
import { ChannelMember } from "../entities/channel-member.entity";

@Injectable()
export class ChannelConfigRepository extends Repository<ChannelConfig> {
  constructor(private dataSource: DataSource) {
    super(ChannelConfig, dataSource.createEntityManager());
  }

  async createChannelConfig(config: Partial<ChannelConfigRequestDto>): Promise<InsertResult> {
    const insertResult = await this.createQueryBuilder('channel_config')
      .insert()
      .into(ChannelConfig)
      .values({ title: config.title, limit: config.limit, dm: config.dm, public: config.public })
      .execute();
    return (insertResult);
  }

  async readAllChannelConfig(): Promise<ChannelConfig[]> {
    return (this.find());
  }

  async readOnePureChannelConfig(id: number): Promise<ChannelConfig> {
    return (await this.findOne({ where: { id } }));
  }

  async readChannelConfigMyDm(userId: number) {
    const MyDmQr = await this.dataSource
      .getRepository(ChannelMember)
      .createQueryBuilder('channel_member')
      .subQuery()
      .from(ChannelMember, 'channel_member')
      .leftJoinAndSelect('channel_member.channel', 'channel_config')
      .select(['channel_config.id AS id'])
      .where(`channel_member.user_id = ${userId}`)
      .andWhere('channel_config.dm = true')
      .getQuery();

    const configList = await this.createQueryBuilder('channel_config')
      .select(['channel_config.id',
        'channel_config.title',
        'channel_config.public',
        'channel_config.limit',
        'channel_config.dm',
        'channel_config.date'])
      .where(`id IN ${MyDmQr}`)
      .getMany();
    return (configList);
  }

  async readChannelConfigMyChannel(userId: number): Promise<ChannelConfig[]> {
    const MyChannelQr = await this.dataSource
      .getRepository(ChannelMember)
      .createQueryBuilder('channel_member')
      .subQuery()
      .from(ChannelMember, 'channel_member')
      .leftJoinAndSelect('channel_member.channel', 'channel_config')
      .select(['channel_config.id AS id'])
      .where(`channel_member.user_id = ${userId}`)
      .andWhere('channel_config.dm = false')
      .getQuery();

    const configList = await this.createQueryBuilder('channel_config')
      .select(['channel_config.id',
        'channel_config.title',
        'channel_config.public',
        'channel_config.limit',
        'channel_config.dm',
        'channel_config.date'])
      .where(`id IN ${MyChannelQr}`)
      .getMany();
    return (configList);
  }

  async readDmUserTarget(userId: number, targetId: number) {
    if (typeof (userId) === 'number' && typeof (targetId) === 'number') {
      const MyDmQr = await this.dataSource
        .getRepository(ChannelMember)
        .createQueryBuilder('channel_member')
        .subQuery()
        .from(ChannelMember, 'channel_member')
        .leftJoinAndSelect('channel_member.channel', 'channel_config')
        .select(['channel_config.id AS id'])
        .where(`channel_member.user_id = ${userId}`)
        .andWhere('channel_config.dm = true')
        .getQuery();

      const dm = await this.dataSource
        .getRepository(ChannelMember)
        .createQueryBuilder('channel_member')
        .subQuery()
        .from(ChannelMember, 'channel_member')
        .leftJoinAndSelect('channel_member.channel', 'channel_config')
        .select(['channel_config.id AS id'])
        .where(`channel_member.channel_id IN ${MyDmQr}`)
        .andWhere(`channel_member.user_id = ${targetId}`)
        .getQuery();

      const qureyRunner = await this.dataSource.createQueryRunner();
      const ret = await qureyRunner.manager.query(dm);

      return (ret);
    }
    else 
      return (null);
  }

  async readChannelConfigNotMember(userId: number): Promise<ChannelConfig[]> {
    const MyDmQr = await this.dataSource
      .getRepository(ChannelMember)
      .createQueryBuilder('channel_member')
      .subQuery()
      .from(ChannelMember, 'channel_member')
      .leftJoinAndSelect('channel_member.channel', 'channel_config')
      .select(['channel_config.id'])
      .where(`channel_member.user_id = ${userId}`)
      .getQuery();
    const configList = await this.createQueryBuilder('channel_config')
      .select(['channel_config.id',
        'channel_config.title',
        'channel_config.public',
        'channel_config.limit',
        'channel_config.dm',
        'channel_config.date'])
      .where(`id NOT IN ${MyDmQr}`)
      .andWhere('channel_config.dm = false')
      .getMany();
    return (configList);
  }

  async updateChannelConfigInfo(id: number, config: Partial<ChannelConfigRequestDto>): Promise<ChannelConfig> {
    await this.update(id, config);
    return (this.findOne({ where: { id } }));
  }

  async updateChannelConfigWithTitle(id: number, title: string): Promise<ChannelConfig> {
    await this.update(id, { title: title });
    return (this.findOne({ where: { id } }));
  }

  /* [D] ChannelConfig 제거 
          channel_member 관계는 없는 경우 */
  async deleteChannelConfig(id: number): Promise<void> {
    await this.delete(id);
  }
}
