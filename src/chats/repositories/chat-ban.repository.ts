import { Injectable } from "@nestjs/common";
import { DataSource, InsertResult, Repository } from "typeorm";
import { ChatBan } from "../entities/chat-ban.entity";
import { Player } from "src/users/entities/player.entity";

@Injectable()
export class ChatBanRepository extends Repository<ChatBan> {
  constructor(private dataSource: DataSource) {
    super(ChatBan, dataSource.createEntityManager());
  }

  async readBanList(channelId: number): Promise<ChatBan[]> {
    const banList = await this.createQueryBuilder('ban_list')
      .leftJoinAndSelect('ban_list.user', 'player')
      .leftJoinAndSelect('ban_list.channel', 'channel_config')
      .select(['ban_list.id', 'player.id', 'player.name'])
      .where('channel_config.id = :id', { id: channelId })
      .getMany();

    return (banList);
  }

  async readBanUser(channelId: number, userId: number): Promise<ChatBan> {
    const banList = await this.createQueryBuilder('ban_list')
      .leftJoinAndSelect('ban_list.user', 'player')
      .leftJoinAndSelect('ban_list.channel', 'channel_config')
      .select(['ban_list.id', 'channel_config.id', 'player.id', 'player.name'])
      .where('channel_config.id = :channelId', { channelId })
      .andWhere('player.id = :userId', { userId })
      .getOne();
    return (banList);
  }

  async readChatBan(channelId: number, userId: number): Promise<ChatBan> {
    const chatBan = await this.createQueryBuilder('ban_list')
      .leftJoinAndSelect('ban_list.user', 'player')
      .leftJoinAndSelect('ban_list.channel', 'channel_config')
      .select(['ban_list.id', 'player.id', 'player.name'])
      .where('channel_config.id = :channelId', { channelId: channelId })
      .andWhere('player.id = :userId', { userId: userId })
      .getOne();
    return (chatBan);
  }

  async createBanInfo(channelId: number, userId: number): Promise<InsertResult> {
    const insertResult = await this.createQueryBuilder('ban_list')
    .insert()
    .into(ChatBan)
    .values({ channel: () => `${channelId}`, user: () => `${userId}` })
    .execute();
    return (insertResult);
  }

  async createChatBanWithName(channelId: number, name: string) {
    const playerQr = await this.dataSource
      .getRepository(Player)
      .createQueryBuilder('player')
      .subQuery()
      .from(Player, 'player')
      .select('player.id')
      .where(`name = '${name}'`)
      .getQuery();

    const insert = await this.createQueryBuilder('ban_list')
      .insert()
      .values({ channel: () => `${channelId}`, user: () => `${playerQr}` })
      .execute();
  }

  async updateBanInfo(id: number, ban: Partial<ChatBan>): Promise<ChatBan> {
    await this.update(id, ban);
    return (this.findOne({ where: { id } }));
  }

  async deleteBanInfo(id: number): Promise<void> {
    const deleteBan = await this.findOne({ where: { id } });
    if (!deleteBan)
      return;
    await this.remove(deleteBan);
  }

  async deleteChatBanWithName(name: string) {
    const playerQr = await this.dataSource
      .getRepository(Player)
      .createQueryBuilder('player')
      .subQuery()
      .from(Player, 'player')
      .select('player.id')
      .where(`name = '${name}'`)
      .getQuery();

    const deleteResult = await this.createQueryBuilder('ban_list')
      .delete()
      .where(`user_id IN ${playerQr}`)
      .execute();
    return (deleteResult);
  }
}