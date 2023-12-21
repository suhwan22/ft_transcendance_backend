import { Injectable } from "@nestjs/common";
import { DataSource, InsertResult, Repository } from "typeorm";
import { ChannelMember } from "../entities/channel-member.entity";

@Injectable()
export class ChannelMemberRepository extends Repository<ChannelMember> {
  constructor(private dataSource: DataSource) {
    super(ChannelMember, dataSource.createEntityManager());
  }

  async createChannelMember(channelId: number, userId: number): Promise<InsertResult> {
    const insertResult = await this.createQueryBuilder('channel_member')
    .insert()
    .into(ChannelMember)
    .values({ channel: () => `${channelId}`, user: () => `${userId}`, op: false })
    .execute();
    return (insertResult);
  }

  /* [R] 모든 ChannelMember 조회 */
  async readAllChannelMember(): Promise<ChannelMember[]> {
    const channelMembers = await this.createQueryBuilder('channel_member')
      .leftJoinAndSelect('channel_member.user', 'player')
      .leftJoinAndSelect('channel_member.channel', 'channel_config')
      .select(['channel_member.id',
        'channel_member.op',
        'player.id',
        'player.name',
        'player.status',
        'channel_member.date',
        'channel_config.id',
        'channel_config.title'])
      .getMany();
    return (channelMembers);
  }

  /* [R] 특정 Channel{id}에 속한 Member 조회 */
  async readOneChannelMember(channelId: number): Promise<ChannelMember[]> {
    const channelMembers = await this.createQueryBuilder('channel_member')
      .leftJoinAndSelect('channel_member.user', 'player')
      .leftJoinAndSelect('channel_member.channel', 'channel_config')
      .select(['channel_member.id',
        'channel_member.op',
        'player.id',
        'player.name',
        'player.avatar',
        'player.status',
        'channel_member.date',
        'channel_config.id',
        'channel_config.title'])
      .where('channel_config.id = :id', { id: channelId })
      .getMany();
    return (channelMembers);
  }

 async readOneChannelMemberWithDm(channelId: number): Promise<ChannelMember[]> {
    const channelMembers = await this.createQueryBuilder('channel_member')
      .leftJoinAndSelect('channel_member.user', 'player')
      .leftJoinAndSelect('channel_member.channel', 'channel_config')
      .select(['channel_member.id',
        'channel_member.op',
        'player.id',
        'player.name',
        'player.avatar',
        'player.status',
        'channel_member.date',
        'channel_config.id',
        'channel_config.title',
        'channel_config.dm'])
      .where('channel_config.id = :id', { id: channelId })
      .getMany();
    return (channelMembers);
  }

  /* 특정 channel에 몇명 있는지 조사하기 위해 만든 pureChannelMember */
  async readOnePureChannelMember(channelId: number): Promise<ChannelMember[]> {
    const channelMembers = await this.createQueryBuilder('channel_member')
      .leftJoinAndSelect('channel_member.channel', 'channel_config')
      .select(['channel_member.id', 'channel_config.title'])
      .where('channel_config.id = :id', { id: channelId })
      .getMany();
    return (channelMembers);
  }


  /* [R] 특정 User{id}에 속한 Member 조회 */
  async readChannelMemberWithUserId(userId: number): Promise<ChannelMember[]> {
    const channelMembers = await this.dataSource
      .getRepository(ChannelMember).createQueryBuilder('channel_member')
      .leftJoinAndSelect('channel_member.user', 'player')
      .leftJoinAndSelect('channel_member.channel', 'channel_config')
      .select(['channel_member.id',
        'player.id',
        'player.name',
        'player.status',
        'channel_member.op',
        'channel_member.date',
        'channel_config.id',
        'channel_config.title'])
      .where('player.id = :id', { id: userId })
      .getMany();
    return (channelMembers);
  }

  async readChannelMember(channelId: number, userId: number): Promise<ChannelMember> {
    const channelMember = await this.createQueryBuilder('channel_member')
      .leftJoinAndSelect('channel_member.user', 'player')
      .leftJoinAndSelect('channel_member.channel', 'channel_config')
      .select(['channel_member.id',
        'player.id',
        'player.name',
        'channel_member.op',
        'channel_member.date',
        'channel_config.id',
        'channel_config.title'])
      .where('player.id = :userId', { userId: userId })
      .andWhere('channel_config.id = :channelId', { channelId: channelId })
      .getOne();
    return (channelMember);
  }

  async readDmTargetId(channelId: number, userId: number): Promise<ChannelMember> {
    const channelMember = await this.createQueryBuilder('channel_member')
      .leftJoinAndSelect('channel_member.user', 'player')
      .leftJoinAndSelect('channel_member.channel', 'channel_config')
      .select(['channel_member.id',
        'player.id',
        'player.name',
        'player.status',
        'channel_member.op',
        'channel_member.date',
        'channel_config.id',
        'channel_config.title'])
      .where('player.id != :userId', { userId: userId })
      .andWhere('channel_config.id = :channelId', { channelId: channelId })
      .getOne();
    return (channelMember);
  }

  async readChannelMemberWithName(channelId: number, name: string): Promise<ChannelMember> {
    const channelMember = await this.createQueryBuilder('channel_member')
      .leftJoinAndSelect('channel_member.user', 'player')
      .leftJoinAndSelect('channel_member.channel', 'channel_config')
      .select(['channel_member.id',
        'player.id',
        'player.name',
        'channel_member.op',
        'channel_member.date',
        'channel_config.id',
        'channel_config.title'])
      .where('player.name = :name', { name: name })
      .andWhere('channel_config.id = :channelId', { channelId: channelId })
      .getOne();
    return (channelMember);
  }

  async updateChannelMemberInfo(id: number, list: Partial<ChannelMember>): Promise<ChannelMember> {
    await this.update(id, list);
    return (this.findOne({ where: { id } }));
  }

  async updateChannelMemberOp(id: number, op: boolean): Promise<ChannelMember> {
    await this.update(id, { op: op });
    return (this.findOne({ where: { id } }));
  }

  async updateChannelOpWithName(channelId: number, targetName: string, op: boolean) {
    const memberQr = await this.createQueryBuilder('channel_member')
      .subQuery()
      .from(ChannelMember, 'channel_member')
      .leftJoinAndSelect('channel_member.user', 'player')
      .select(['channel_member.id'])
      .where(`player.name = '${targetName}'`)
      .andWhere(`channel_id = ${channelId}`)
      .getQuery();
    const updateResult = await this.createQueryBuilder('channel_member')
      .update()
      .set({ op: op })
      .where(`id IN ${memberQr}`)
      .execute();
    return (updateResult);
  }

  /* [D] ChannelMember{id} 제거 */
  async deleteChannelMember(id: number): Promise<void> {
    await (this.delete(id));
  }

  async deleteChannelMemberWithUserId(channelId: number, userId: number) {
    const memberQr = await this.createQueryBuilder('channel_member')
      .subQuery()
      .from(ChannelMember, 'channel_member')
      .select(['channel_member.id'])
      .where(`user_id = ${userId}`)
      .andWhere(`channel_id = ${channelId}`)
      .getQuery();
    const deleteResult = await this.createQueryBuilder('channel_member')
      .delete()
      .from(ChannelMember, 'channel_member')
      .where(`id IN ${memberQr}`)
      .execute();
    return (deleteResult);
  }

  async readMemberInChannel(channelId: number, userId: number): Promise<ChannelMember> {
    const channelMembers = await this.createQueryBuilder('channel_member')
      .leftJoinAndSelect('channel_member.user', 'player')
      .leftJoinAndSelect('channel_member.channel', 'channel_config')
      .select(['channel_member.id',
        'player.id',
        'player.name',
        'channel_member.op',
        'channel_member.date',
        'channel_config.id',
        'channel_config.title'])
      .where('channel_config.id = :channelId', { channelId },)
      .andWhere('player.id = :userId', { userId })
      .getOne();
    return (channelMembers);
  }

}