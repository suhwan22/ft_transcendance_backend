import { Injectable } from '@nestjs/common';
import { ChatBan } from './entities/chat-ban.entity';
import { InjectRepository } from '@nestjs/typeorm';
import { ChatLog } from './entities/chat-log.entity';
import { Repository } from 'typeorm';
import { ChatMute } from './entities/chat-mute.entity';
import { ChannelMember } from './entities/channel-member.entity';
import { ChannelConfig } from './entities/channel-config.entity'
import { ChannelListDto } from './dtos/channel-list.dto';

@Injectable()
export class ChatsService {
  constructor(
    @InjectRepository(ChannelMember)
    private channelMemberRepository: Repository<ChannelMember>,
    @InjectRepository(ChannelConfig)
    private channelConfigRepository: Repository<ChannelConfig>,
    @InjectRepository(ChatLog)
    private chatLogRepository: Repository<ChatLog>,
    @InjectRepository(ChatBan)
    private chatBanRepository: Repository<ChatBan>,
    @InjectRepository(ChatMute)
    private chatMuteRepository: Repository<ChatMute>,
  ) {}

  /* [C] ChannelConfig 생성 */
  async createChannelConfig(config: Partial<ChannelConfig>): Promise<ChannelConfig> {
    const newchannelConfig = this.channelConfigRepository.create(config);
    return (this.channelConfigRepository.save(newchannelConfig));
  }

  /* [R] 모든 ChannelConfig 조회 */
  async readAllChannelConfig(): Promise<ChannelConfig[]> {
    return (this.channelConfigRepository.find());
  }

  /* [R] 특정 ChannelConfig 조회 */
  async readOneChannelConfig(id: number): Promise<ChannelConfig> {
    return (this.channelConfigRepository.findOne({ where: { id } }));
  }

  /* [U] ChannelConfig info 수정 */
  async updateChannelConfigInfo(id: number, config: Partial<ChannelConfig>): Promise<ChannelConfig> {
    await this.channelConfigRepository.update(id, config);
    return (this.channelConfigRepository.findOne({ where: { id } }));
  }

  /* [D] ChannelConfig 제거 */
  async deleteChannelConfig(id: number): Promise<void> {
    await (this.channelConfigRepository.delete(id));
  }

  /* [C] ChannelMember 생성 */
  async createChannelMember(channelMember: Partial<ChannelMember>): Promise<ChannelMember> {
    const newlist = this.channelMemberRepository.create(channelMember);
    return (this.channelMemberRepository.save(newlist));
  }

  /* [R] 모든 ChannelMember 조회 */
  async readAllChannelMember(): Promise<ChannelMember[]> {
    return (this.channelMemberRepository.find());
  }

  /* [R] 특정 Channel{id}에 속한 Member 조회 */
  async readOneChannelMember(channel: number): Promise<ChannelMember[]> {
    return (this.channelMemberRepository.find({ where: { channel } }));
  }

  /* [U] ChannelMember{id} info 수정 */
  async updateChannelMemberInfo(id: number, list: Partial<ChannelMember>): Promise<ChannelMember> {
    await this.channelMemberRepository.update(id, list);
    return (this.channelMemberRepository.findOne({ where: { id } }));
  }

  /* [D] ChannelMember{id} 제거 */
  async deleteChannelMember(id: number): Promise<void> {
    await (this.channelMemberRepository.delete(id));
  }

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

  async readChannelList(user: number): Promise<ChannelListDto> {
    const channelListDto = new ChannelListDto();
    const userChannelList = await this.channelMemberRepository.find({ where: { user }});
    var id: number;
    var config: ChannelConfig;
    var channelList: { userId: number, name: string }[] = [];

    for (const idx of userChannelList) {
      id = idx.channel;
      config = await this.channelConfigRepository.findOne({ where: { id } });
      channelList.push({ userId: id, name: config.title });
    }

    channelListDto.channelList = channelList;
    //dmList: { userId: number, name: string }[];
    return (channelListDto);
  }
}
