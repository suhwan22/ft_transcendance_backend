import { Inject, Injectable, forwardRef } from '@nestjs/common';
import { ChatBan } from './entities/chat-ban.entity';
import { InjectRepository } from '@nestjs/typeorm';
import { ChatLog } from './entities/chat-log.entity';
import { Repository, DataSource } from 'typeorm';
import { ChatMute } from './entities/chat-mute.entity';
import { ChannelMember } from './entities/channel-member.entity';
import { ChannelConfig } from './entities/channel-config.entity'
import { ChatLogRequestDto } from './dtos/chat-log.request.dto';
import { UsersService } from 'src/users/users.service';
import { ChatMuteBanRequestDto } from './dtos/chat-mute-ban.request.dto';
import { ChannelMemberRequestDto } from './dtos/channel-member.request.dto';
import { ChannelConfigRequestDto } from './dtos/channel-config.request.dto';
import { ChannelPassword } from './entities/channel-password.entity';
import { compare, hash } from 'bcrypt';
import { ChatBanRepositroy } from './repositories/chat-ban.repository';
import { ChannelConfigRepositroy } from './repositories/channel-config.repository';
import { ChannelMemberRepositroy } from './repositories/channel-member.repository';
import { ChatMuteRepositroy } from './repositories/chat-mute.repository';

@Injectable()
export class ChatsService {
  constructor(
    @InjectRepository(ChatLog)
    private chatLogRepository: Repository<ChatLog>,
    @InjectRepository(ChannelPassword)
    private channelPasswordRepository: Repository<ChannelPassword>,
    private channelConfigRepository: ChannelConfigRepositroy,
    private channelMemberRepository: ChannelMemberRepositroy,
    private chatBanRepository: ChatBanRepositroy,
    private chatMuteRepository: ChatMuteRepositroy,

    @Inject(forwardRef(() => UsersService))
    private readonly usersService: UsersService,
    private dataSource: DataSource
  ) { }

  /** 
   * 
   * CHANNEL_CONFIG Table CURD 
   * 
   */

  /* [C] ChannelConfig 생성 */
  async createChannelConfig(config: Partial<ChannelConfigRequestDto>): Promise<ChannelConfig> {
    const insertResult = await this.channelConfigRepository.createChannelConfig(config);
    this.createChannelPassword(insertResult.raw.id, config.password);
    return (this.readOnePureChannelConfig(insertResult.raw.id));
  }

  /* [R] 모든 ChannelConfig 조회 */
  async readAllChannelConfig(): Promise<ChannelConfig[]> {
    return (this.channelConfigRepository.readAllChannelConfig());
  }

  /* [R] 특정 ChannelConfig 조회 */
  async readOneChannelConfig(id: number): Promise<ChannelConfig> {
    const channelConfig = await this.readOnePureChannelConfig(id);
    if (!channelConfig) {
      return null;
    }
    channelConfig.banList = await this.readBanList(id);
    channelConfig.chatLogs = await this.readChatLogList(id);
    channelConfig.memberList = await this.readOneChannelMember(id);
    channelConfig.muteList = await this.readMuteList(id);
    return (channelConfig);
  }

  async readChannelConfigMyDm(userId: number) {
    return (await this.channelConfigRepository.readChannelConfigMyDm(userId));
  }

  async readChannelConfigMyChannel(userId: number): Promise<ChannelConfig[]> {
    return (await this.channelConfigRepository.readChannelConfigMyChannel(userId));
  }

  async readChannelConfigNotMember(userId: number): Promise<ChannelConfig[]> {
    return (await this.channelConfigRepository.readChannelConfigNotMember(userId));
  }

  async readOnePureChannelConfig(id: number): Promise<ChannelConfig> {
    return (await this.channelConfigRepository.readOnePureChannelConfig(id));
  }

  /* [U] ChannelConfig info 수정 */
  async updateChannelConfigInfo(id: number, config: Partial<ChannelConfigRequestDto>): Promise<ChannelConfig> {
    return (this.channelConfigRepository.updateChannelConfigInfo(id, config));
  }

  async updateChannelConfigWithTitle(id: number, title: string): Promise<ChannelConfig> {
    return (this.channelConfigRepository.updateChannelConfigWithTitle(id, title));
  }

  /* [D] ChannelConfig 제거 
          channel_member 관계는 없는 경우 */
  async deleteChannelConfig(id: number): Promise<void> {
    await this.channelPasswordRepository.delete(id);
    await (this.channelConfigRepository.deleteChannelConfig(id));
  }

  /** 
   * 
   * CHANNEL_MEMBER Table CURD 
   * 
   */

  /* [C] ChannelMember 생성 */
  async createChannelMember(request: Partial<ChannelMemberRequestDto>): Promise<ChannelMember> {
    const result = await this.channelMemberRepository.createChannelMember(request.channelId, request.userId);
    return (this.channelMemberRepository.findOne(result.raw.id));
  }

  /* [R] 모든 ChannelMember 조회 */
  async readAllChannelMember(): Promise<ChannelMember[]> {
    return (await this.channelMemberRepository.readAllChannelMember());
  }

  /* [R] 특정 Channel{id}에 속한 Member 조회 */
  async readOneChannelMember(channelId: number): Promise<ChannelMember[]> {
    return (await this.channelMemberRepository.readOneChannelMember(channelId));
  }

  /* 특정 channel에 몇명 있는지 조사하기 위해 만든 pureChannelMember */
  async readOnePureChannelMember(channelId: number): Promise<ChannelMember[]> {
    return (await this.channelMemberRepository.readOnePureChannelMember(channelId));
  }

  /* [R] 특정 User{id}에 속한 Member 조회 */
  async readChannelMemberWithUserId(userId: number): Promise<ChannelMember[]> {
    return (await this.channelMemberRepository.readChannelMemberWithUserId(userId));
  }

  async readChannelMember(channelId: number, userId: number): Promise<ChannelMember> {
    return (await this.channelMemberRepository.readChannelMember(channelId, userId));
  }

  async readChannelMemberWithName(channelId: number, name: string): Promise<ChannelMember> {
    return (await this.channelMemberRepository.readChannelMemberWithName(channelId, name));
  }

  /* [U] ChannelMember{id} info 수정 */
  async updateChannelMemberInfo(id: number, list: Partial<ChannelMember>): Promise<ChannelMember> {
    return (await this.channelMemberRepository.updateChannelMemberInfo(id, list));
  }

  async updateChannelMemberOp(id: number, op: boolean): Promise<ChannelMember> {
    let changeOp = true;
    if (op)
      changeOp = false;
    return (await this.channelMemberRepository.updateChannelMemberOp(id, changeOp));
  }

  async updateChannelOpWithName(channelId: number, targetName: string, op: boolean) {
    return (await this.channelMemberRepository.updateChannelOpWithName(channelId, targetName, op));
  }

  /* [D] ChannelMember{id} 제거 */
  async deleteChannelMember(id: number): Promise<void> {
    await (this.channelMemberRepository.deleteChannelMember(id));
  }

  async deleteChannelMemberWithUserId(channelId: number, userId: number) {
    return (await this.channelMemberRepository.deleteChannelMemberWithUserId(channelId, userId));
  }

  async readMemberInChannel(channelId: number, userId: number): Promise<ChannelMember> {
    return (await this.channelMemberRepository.readMemberInChannel(channelId, userId));
  }

  /** 
   * 
   * CHAT_LOG_LIST Table CURD 
   * 
   */

  async readChatLogList(channelId: number): Promise<ChatLog[]> {
    const chatLogs = await this.dataSource
      .getRepository(ChatLog).createQueryBuilder('chat_log')
      .leftJoinAndSelect('chat_log.user', 'player')
      .leftJoinAndSelect('chat_log.channel', 'channel_config')
      .select(['chat_log.id', 'chat_log.content', 'player.id', 'player.name', 'player.avatar', 'chat_log.date'])
      .where('channel_config.id = :id', { id: channelId })
      .getMany();
    return (chatLogs);
  }

  async readLatestChatLog(channelId: number): Promise<ChatLog[]> {
    const chatLogs = await this.dataSource
      .getRepository(ChatLog).createQueryBuilder('chat_log')
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
    const chatLog = await this.dataSource
      .getRepository(ChatLog).createQueryBuilder('chat_log')
      .leftJoinAndSelect('chat_log.user', 'player')
      .leftJoinAndSelect('chat_log.channel', 'channel_config')
      .select(['chat_log.id', 'chat_log.content', 'player.id', 'player.name', 'player.avatar', 'chat_log.date'])
      .where('channel_config.id = :id', { id: id })
      .getOne();
    return (chatLog);
  }

  async createChatLogInfo(chatLogRequest: Partial<ChatLogRequestDto>): Promise<ChatLog> {
    const user = await this.usersService.readOnePurePlayer(chatLogRequest.userId);
    const channel = await this.readOnePureChannelConfig(chatLogRequest.channelId);
    const chatLog = {
      user: user,
      channel: channel,
      content: chatLogRequest.content,
    }
    const newChatLog = this.chatLogRepository.create(chatLog);
    return (this.chatLogRepository.save(newChatLog));
  }

  async updateCatLogInfo(id: number, chatLogRequest: Partial<ChatLogRequestDto>): Promise<ChatLog> {
    const user = await this.usersService.readOnePlayer(chatLogRequest.userId);
    const channel = await this.readOneChannelConfig(chatLogRequest.channelId);
    const chatLog = {
      user: user,
      channel: channel,
      content: chatLogRequest.content,
    }
    await this.chatLogRepository.update(id, chatLog);
    return (this.chatLogRepository.findOne({ where: { id } }));
  }

  async deleteCatLogInfo(id: number): Promise<void> {
    await this.chatLogRepository.delete({ id });
  }

  /** 
   * 
   * BAN_LIST Table CURD
   * 
   */
  async readBanList(channelId: number): Promise<ChatBan[]> {
    return (await this.chatBanRepository.readBanList(channelId));
  }

  async readBanUser(channelId: number, userId: number): Promise<ChatBan> {
    return (await this.chatBanRepository.readBanUser(channelId, userId));
  }

  async readChatBan(channelId: number, userId: number): Promise<ChatBan> {
    return (await this.chatBanRepository.readChatBan(channelId, userId));
  }

  async createBanInfo(chatBanRequest: Partial<ChatMuteBanRequestDto>): Promise<ChatBan> {
    const result = await this.chatBanRepository.createBanInfo(chatBanRequest.channelId, chatBanRequest.userId);
    return (this.chatBanRepository.findOne({ where: { id: result.raw.id }}));
  }

  async createChatBanWithName(channelId: number, name: string) {
    await this.chatBanRepository.createChatBanWithName(channelId, name);
  } 

  async updateBanInfo(id: number, ban: Partial<ChatBan>): Promise<ChatBan> {
    return (await this.chatBanRepository.updateBanInfo(id, ban));
  }

  async deleteBanInfo(id: number): Promise<void> {
    await this.chatBanRepository.deleteBanInfo(id);
  }

  async deleteChatBanWithName(name: string) {
    return (await this.chatBanRepository.deleteChatBanWithName(name));
  }

  /**
   * 
   * MUTE_LIST Table CURD
   * 
   */

  async readMuteList(channelId: number): Promise<ChatMute[]> {
    return (await this.chatMuteRepository.readMuteList(channelId));
  }

  async readChatMute(channelId: number, userId: number) {
    return (await this.chatMuteRepository.readChatMute(channelId, userId));
  }

  async readChatMuteWithName(channelId: number, name: string) {
    return (await this.chatMuteRepository.readChatMuteWithName(channelId, name));
  }

  async createMuteInfo(chatMuteRequest: Partial<ChatMuteBanRequestDto>): Promise<ChatMute> {
    const result = await this.chatMuteRepository.createMuteInfo(chatMuteRequest.channelId, chatMuteRequest.userId);
    return (this.chatMuteRepository.findOne({ where: { id: result.raw.id }}));
  }

  async createChatMuteWithName(channelId: number, name: string) {
    await this.chatMuteRepository.createChatMuteWithName(channelId, name);
  }

  async updateMuteInfo(id: number, mute: Partial<ChatMute>): Promise<ChatMute> {
    return (await this.chatMuteRepository.updateMuteInfo(id, mute));
  }

  async updateTimeChatMute(id: number, user: number) {
    return (await this.chatMuteRepository.updateTimeChatMute(id, user));
  }

  async updateTimeChatMuteWithName(channelId: number, name: string) {
    return (await this.chatMuteRepository.updateTimeChatMuteWithName(channelId, name));
  }

  async deleteMuteInfo(id: number): Promise<void> {
    await this.chatMuteRepository.deleteMuteInfo(id);
  }

  // 특정 유저가 특정 채팅방에 들어와 있는지 검사
  async checkInChannelMember(channelId: number, userId: number): Promise<boolean> {
    const channelMember = await this.readChannelMember(channelId, userId);
    if (!channelMember)
      return false;
    return true;
  }

  async readChannelPassword(channelId: number): Promise<ChannelPassword> {
    const userchannelPassword = await this.channelPasswordRepository.findOne({ where: { channelId } });
    return (userchannelPassword);
  }

  async createChannelPassword(channelId: number, password: string): Promise<ChannelPassword> {
    let hashPass: string = null;
    const saltRound = 10;
    if (password)
      hashPass = await hash(password, saltRound);
    const channelPassword = { channelId: channelId, password: hashPass };
    const newChannelPassword = this.channelPasswordRepository.create(channelPassword);
    return (this.channelPasswordRepository.save(newChannelPassword));
  }

  async updateChannelPassword(channelId: number, password: string): Promise<ChannelPassword> {
    let hashPass = null;
    if (password)
      hashPass = await hash(password, 10);
    this.channelPasswordRepository.update(channelId, { password: hashPass });
    return (this.readChannelPassword(channelId));
  }

  async comparePassword(password: string, channelId: number) {
    if (!password) {
      return false;
    }
    const inputPassword = password;
    const userPassword = await this.readChannelPassword(channelId);
    return (await compare(inputPassword, userPassword.password));
  }

  async deleteChannelPassword(channelId: number): Promise<void> {
    this.channelPasswordRepository.delete(channelId);
  }
}
