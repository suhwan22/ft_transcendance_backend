import { Injectable } from '@nestjs/common';
import { ChatBan } from './entities/chat-ban.entity';
import { InjectRepository } from '@nestjs/typeorm';
import { ChatLog } from './entities/chat-log.entity';
import { Repository } from 'typeorm';
import { ChatMute } from './entities/cgat-mute.entity';

@Injectable()
export class ChatsService {
  constructor(
    @InjectRepository(ChatLog)
    private chatLogRepository: Repository<ChatLog>,

    @InjectRepository(ChatBan)
    private chatBanRepository: Repository<ChatBan>,

    @InjectRepository(ChatMute)
    private chatMuteRepository: Repository<ChatMute>,
  ) {}

  /** 
   * 
   * CHAT_LOG_LIST Table CURD 
   * 
   */

  async readChatLogList(channel: number): Promise<ChatLog[]> {
    return (this.chatLogRepository.find({ where: { channel } }));
  }

  async createChatLogInfo(chatLog: Partial<ChatLog>): Promise<ChatLog> {
    const newChatLog = this.chatLogRepository.create(chatLog);
    return (this.chatLogRepository.save(newChatLog));
  }

  async updateCatLogInfo(id: number, chatLog: Partial<ChatLog>): Promise<ChatLog> {
    await this.chatLogRepository.update(id, chatLog);
    return (this.chatLogRepository.findOne({ where: { id } }));
  }

  async deleteCatLogList(channel: number): Promise<void> {
    await this.chatLogRepository.delete({ channel });
  }

  /** 
   * 
   * BAN_LIST Table CURD
   * 
   */

  async readBanList(channel: number): Promise<ChatBan[]> {
    return (this.chatBanRepository.find({ where: { channel } }));
  }

  async createBanInfo(ban: Partial<ChatBan>): Promise<ChatBan> {
      const newBan = this.chatBanRepository.create(ban);
      return (this.chatBanRepository.save(newBan));
  }

  async updateBanInfo(id: number, ban: Partial<ChatBan>): Promise<ChatBan> {
      await this.chatBanRepository.update(id, ban);
      return (this.chatBanRepository.findOne({ where: { id } }));
  }

  async deleteBanInfo(channel: number, user: number): Promise<void> {
      const deleteBan = await this.chatBanRepository.findOne({ where: { channel, user } });
      if (!deleteBan)
          return ;
      await this.chatBanRepository.remove(deleteBan);
  }

  async deleteBanList(channel: number): Promise<void> {
      await this.chatBanRepository.delete({ channel });
  }

  /**
   * 
   * MUTE_LIST Table CURD
   * 
   */

  async readMuteList(channel: number): Promise<ChatMute[]> {
    return (this.chatMuteRepository.find({ where: { channel } }));
  }

  async createMuteInfo(mute: Partial<ChatMute>): Promise<ChatMute> {
    const newMute = this.chatMuteRepository.create(mute);
    return (this.chatMuteRepository.save(newMute));
  }

  async updateMutenfo(id: number, mute: Partial<ChatMute>): Promise<ChatMute> {
    await this.chatMuteRepository.update(id, mute);
    return (this.chatMuteRepository.findOne({ where: { id } }));
  }

  async deleteMutenfo(channel: number, user: number): Promise<void> {
    const deleteMute = await this.chatMuteRepository.findOne({ where: { channel, user} });
    if (!deleteMute)
      return ;
    await this.chatMuteRepository.remove(deleteMute);
  }

  async deleteFriendList(channel: number): Promise<void> {
    await this.chatMuteRepository.delete({ channel });
  }

}
