import { Injectable } from "@nestjs/common";
import { DataSource, InsertResult, Repository } from "typeorm";
import { ChatMute } from "../entities/chat-mute.entity";
import { Player } from "src/users/entities/player.entity";

@Injectable()
export class ChatMuteRepository extends Repository<ChatMute> {
  constructor(private dataSource: DataSource) {
    super(ChatMute, dataSource.createEntityManager());
  }

  async readMuteList(channelId: number): Promise<ChatMute[]> {
    const muteList = await this.createQueryBuilder('mute_list')
      .leftJoinAndSelect('mute_list.user', 'player')
      .leftJoinAndSelect('mute_list.channel', 'channel_config')
      .select(['mute_list.id', 'player.id', 'player.name', 'mute_list.date'])
      .where('channel_config.id = :id', { id: channelId })
      .getMany();
    return (muteList);
  }

  async readChatMute(channelId: number, userId: number) {
    const chatMute = await this.createQueryBuilder('mute_list')
      .leftJoinAndSelect('mute_list.user', 'player')
      .leftJoinAndSelect('mute_list.channel', 'channel_config')
      .select(['mute_list.id', 'player.id', 'player.name', 'mute_list.date'])
      .where('channel_config.id = :channelId', { channelId: channelId })
      .andWhere('player.id = :userId', { userId: userId })
      .getOne();
    return (chatMute);
  }

  async readChatMuteWithName(channelId: number, name: string) {
    const chatMute = await this.createQueryBuilder('mute_list')
      .leftJoinAndSelect('mute_list.user', 'player')
      .leftJoinAndSelect('mute_list.channel', 'channel_config')
      .select(['mute_list.id', 'player.id', 'player.name', 'mute_list.date'])
      .where(`channel_id = ${channelId}`)
      .andWhere('player.name = :name', { name: name })
      .getOne();
    return (chatMute);
  }


  async createMuteInfo(channelId: number, userId: number): Promise<InsertResult> {
    const insertResult = await this.createQueryBuilder('mute_list')
    .insert()
    .into(ChatMute)
    .values({ channel: () => `${channelId}`, user: () => `${userId}`})
    .execute();
    return (insertResult);
  }

  async createChatMuteWithName(channelId: number, name: string) {
    const playerQr = await this.dataSource
      .getRepository(Player)
      .createQueryBuilder('player')
      .subQuery()
      .from(Player, 'player')
      .select('player.id')
      .where(`name = '${name}'`)
      .getQuery();

    const insert = await this.createQueryBuilder('mute_list')
      .insert()
      .values({ channel: () => `${channelId}`, user: () => `${playerQr}`, duplicate: 0 })
      .execute();
  }


  async updateMuteInfo(id: number, mute: Partial<ChatMute>): Promise<ChatMute> {
    await this.update(id, mute);
    return (this.findOne({ where: { id } }));
  }

  async updateTimeChatMute(id: number, user: number) {
    const updateResult = await this.update(id, { user: () => `${user}` });
    return (updateResult);
  }

  async updateTimeChatMuteWithName(channelId: number, name: string) {
    const playerQr = await this.dataSource
      .getRepository(Player)
      .createQueryBuilder('player')
      .subQuery()
      .from(Player, 'player')
      .select('player.id')
      .where(`name = '${name}'`)
      .getQuery();
    
    const updateResult = await this.createQueryBuilder('mute_list')
      .update()
      .set({ user: () => `${playerQr}`, duplicate: () => `duplicate + 1`})
      .where(`user_id IN ${playerQr}`)
      .andWhere(`channel_id = ${channelId}`)
      .execute();
    return (updateResult);
  }

  async deleteMuteInfo(id: number): Promise<void> {
    const deleteMute = await this.findOne({ where: { id } });
    if (!deleteMute)
      return;
    await this.remove(deleteMute);
  }
}