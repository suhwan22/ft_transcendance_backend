import { Injectable } from "@nestjs/common";
import { DataSource, InsertResult, Repository } from "typeorm";
import { ChatLog } from "../entities/chat-log.entity";
import { ChatLogRequestDto } from "../dtos/chat-log.request.dto";

@Injectable()
export class ChatLogRepository extends Repository<ChatLog> {
  constructor(private dataSource: DataSource) {
    super(ChatLog, dataSource.createEntityManager());
  }



  async readChatLogList(channelId: number): Promise<ChatLog[]> {
    const chatLogs = await this.createQueryBuilder('chat_log')
      .leftJoinAndSelect('chat_log.user', 'player')
      .leftJoinAndSelect('chat_log.channel', 'channel_config')
      .select(['chat_log.id', 'chat_log.content', 'player.id', 'player.name', 'player.avatar', 'chat_log.date'])
      .where('channel_config.id = :id', { id: channelId })
      .getMany();
    return (chatLogs);
  }

  async readLatestChatLog(channelId: number): Promise<ChatLog[]> {
    const chatLogs = await this.createQueryBuilder('chat_log')
      .leftJoinAndSelect('chat_log.user', 'player')
      .leftJoinAndSelect('chat_log.channel', 'channel_config')
      .select(['chat_log.id', 'chat_log.content', 'player.name', 'player.avatar', 'chat_log.date'])
      .where('channel_config.id = :id', { id: channelId })
      .orderBy('chat_log.date', 'DESC')
      .limit(50)
      .getMany();
    return (chatLogs);
  }

  async readChatLog(id: number): Promise<ChatLog> {
    const chatLog = await this.createQueryBuilder('chat_log')
      .leftJoinAndSelect('chat_log.user', 'player')
      .leftJoinAndSelect('chat_log.channel', 'channel_config')
      .select(['chat_log.id', 'chat_log.content', 'player.id', 'player.name', 'player.avatar', 'player.date', 'chat_log.date'])
      .where('chat_log.id = :id', { id: id })
      .getOne();
    return (chatLog);
  }

  async createChatLogInfo(request: Partial<ChatLogRequestDto>): Promise<InsertResult> {
    const result = await this.createQueryBuilder('chat_log')
    .insert()
    .into(ChatLog)
    .values({ content: request.content, channel: () => `${request.channelId}`, user: () => `${request.userId}` })
    .execute();
    return (result);
  }

  async deleteCatLogInfo(id: number): Promise<void> {
    await this.delete({ id });
  }

}