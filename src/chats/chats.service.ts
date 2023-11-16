import { Inject, Injectable, forwardRef } from '@nestjs/common';
import { ChatBan } from './entities/chat-ban.entity';
import { InjectRepository } from '@nestjs/typeorm';
import { ChatLog } from './entities/chat-log.entity';
import { Repository, DataSource } from 'typeorm';
import { ChatMute } from './entities/chat-mute.entity';
import { ChannelMember } from './entities/channel-member.entity';
import { ChannelConfig } from './entities/channel-config.entity'
import { Player } from 'src/users/entities/player.entity';
import { ChatLogRequestDto } from './dtos/chat-log.request.dto';
import { UsersService } from 'src/users/users.service';
import { ChatMuteBanRequestDto } from './dtos/chat-mute-ban.request.dto';
import { ChannelMemberRequestDto } from './dtos/channel-member.request.dto';
import { ChannelConfigRequestDto } from './dtos/channel-config.request.dto';
import { ChannelPassword } from './entities/channel-password.entity';
import { compare, hash } from 'bcrypt';

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
    @InjectRepository(ChannelPassword)
    private channelPasswordRepository: Repository<ChannelPassword>,

    @Inject(forwardRef(() => UsersService))
    private readonly usersService: UsersService,
    private dataSource: DataSource
  ) {}

  /** 
   * 
   * CHANNEL_CONFIG Table CURD 
   * 
   */

  /* [C] ChannelConfig 생성 */
  async createChannelConfig(config: Partial<ChannelConfigRequestDto>): Promise<ChannelConfig> {
    const pass = config.password;
    delete config.password;
    const newchannelConfig = this.channelConfigRepository.create(config);
    const channelConfig = await this.channelConfigRepository.save(newchannelConfig);
    this.createChannelPassword(channelConfig.id, pass);
    return (channelConfig);
  }

  /* [R] 모든 ChannelConfig 조회 */
  async readAllChannelConfig(): Promise<ChannelConfig[]> {
    return (this.channelConfigRepository.find());
  }

  /* [R] 특정 ChannelConfig 조회 */
  async readOneChannelConfig(id: number): Promise<ChannelConfig> {
    const channelConfig = await this.channelConfigRepository.findOne({ where: { id }})
    if (!channelConfig) {
      return null;
    }
    channelConfig.banList = await this.readBanList(id);
    channelConfig.chatLogs = await this.readChatLogList(id);
    channelConfig.memberList = await this.readOneChannelMember(id);
    channelConfig.muteList = await this.readMuteList(id);
    return (channelConfig);
  }

  async readChannelConfigListWhereDm(dm: boolean): Promise<ChannelConfig[]> {
    return (await this.channelConfigRepository.find({ where: { dm }}));
  }

  async readOnePureChannelConfig(id: number): Promise<ChannelConfig> {
    return (await this.channelConfigRepository.findOne({ where: { id }}));
  }

  /* [U] ChannelConfig info 수정 */
  async updateChannelConfigInfo(id: number, config: Partial<ChannelConfigRequestDto>): Promise<ChannelConfig> {
    await this.channelConfigRepository.update(id, config);
    return (this.channelConfigRepository.findOne({ where: { id } }));
  }
  
  async updateChannelConfigWithTitle(id: number, title: string): Promise<ChannelConfig> {
    await this.channelConfigRepository.update(id, { title: title});
    return (this.channelConfigRepository.findOne({ where: { id } }));
  }

  /* [D] ChannelConfig 제거 
          channel_member 관계는 없는 경우 */
  async deleteChannelConfig(id: number): Promise<void> {
    await this.channelPasswordRepository.delete(id);
    await (this.channelConfigRepository.delete(id));
  }

  /** 
   * 
   * CHANNEL_MEMBER Table CURD 
   * 
   */

  /* [C] ChannelMember 생성 */
  async createChannelMember(channelMemberReqeust: Partial<ChannelMemberRequestDto>): Promise<ChannelMember> {
    const user = await this.usersService.readOnePurePlayer(channelMemberReqeust.userId);
    const channel = await this.readOneChannelConfig(channelMemberReqeust.channelId);
    const channelMember = {
      user: user,
      channel: channel,
      op: channelMemberReqeust.op,
    }
    const newChannelMember = this.channelMemberRepository.create(channelMember);
    return (this.channelMemberRepository.save(newChannelMember));
  }

  /* [R] 모든 ChannelMember 조회 */
  async readAllChannelMember(): Promise<ChannelMember[]> {
    const channelMembers = await this.dataSource
                                .getRepository(ChannelMember).createQueryBuilder('channel_member')
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
    const channelMembers = await this.dataSource
                                .getRepository(ChannelMember).createQueryBuilder('channel_member')
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
                                .where('channel_config.id = :id', { id: channelId })
                                .getMany();
    return (channelMembers);
  }

  /* 특정 channel에 몇명 있는지 조사하기 위해 만든 pureChannelMember */
  async readOnePureChannelMember(channelId: number): Promise<ChannelMember[]> {
    const channelMembers = await this.dataSource
                                .getRepository(ChannelMember).createQueryBuilder('channel_member')
                                .leftJoinAndSelect('channel_member.channel', 'channel_config')
                                .select(['channel_member.id', 'channel_config.title'])
                                .where('channel_config.id = :id', { id: channelId })
                                .getMany();
    return (channelMembers);
  }


  /* [R] 특정 User{id}에 속한 Member 조회 */
  async readUserChannelMemberWithUserId(userId: number): Promise<ChannelMember[]> {
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
    const channelMember = await this.dataSource
                                .getRepository(ChannelMember).createQueryBuilder('channel_member')
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

  /* [U] ChannelMember{id} info 수정 */
  async updateChannelMemberInfo(id: number, list: Partial<ChannelMember>): Promise<ChannelMember> {
    await this.channelMemberRepository.update(id, list);
    return (this.channelMemberRepository.findOne({ where: { id } }));
  }

  async updateChannelMemberOp(id: number, op: boolean): Promise<ChannelMember> {
    let changeOp = true;
    if (op)
      changeOp = false;
    await this.channelMemberRepository.update(id, { op: changeOp });
    return (this.channelMemberRepository.findOne({ where: { id }}));
  }

  /* [D] ChannelMember{id} 제거 */
  async deleteChannelMember(id: number): Promise<void> {
    await (this.channelMemberRepository.delete(id));
  }

  async readMemberInChannel(channelId: number, userId: number): Promise<ChannelMember> {
    const channelMembers = await this.dataSource
                                .getRepository(ChannelMember).createQueryBuilder('channel_member')
                                .leftJoinAndSelect('channel_member.user', 'player')
                                .leftJoinAndSelect('channel_member.channel', 'channel_config')
                                .select(['channel_member.id', 
                                        'player.id', 
                                        'player.name', 
                                        'channel_member.op', 
                                        'channel_member.date', 
                                        'channel_config.id', 
                                        'channel_config.title'])
                                .where('channel_config.id = :channelId', { channelId }, )
                                .andWhere('player.id = :userId', { userId })
                                .getOne();
    return (channelMembers);
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
                                      .limit(10)
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
    const banList = await this.dataSource
                              .getRepository(ChatBan).createQueryBuilder('ban_list')  
                              .leftJoinAndSelect('ban_list.user', 'player')
                              .leftJoinAndSelect('ban_list.channel', 'channel_config')
                              .select(['ban_list.id', 'player.id', 'player.name'])
                              .where('channel_config.id = :id', { id: channelId })
                              .getMany();
   
    return (banList);
  }

  async readBanUser(channelId: number, userId: number): Promise<ChatBan> {
    const banList = await this.dataSource
                                      .getRepository(ChatBan).createQueryBuilder('ban_list')  
                                      .leftJoinAndSelect('ban_list.user', 'player')
                                      .leftJoinAndSelect('ban_list.channel', 'channel_config')
                                      .select(['ban_list.id', 'channel_config.id', 'player.id', 'player.name'])
                                      .where('channel_config.id = :channelId', { channelId })
                                      .andWhere('player.id = :userId', { userId })
                                      .getOne();
    return (banList);
  }
  
  async readChatBan(channelId: number, userId: number): Promise<ChatBan> {
    const chatBan = await this.dataSource
                  .getRepository(ChatBan).createQueryBuilder('ban_list')  
                  .leftJoinAndSelect('ban_list.user', 'player')
                  .leftJoinAndSelect('ban_list.channel', 'channel_config')
                  .select(['ban_list.id', 'player.id', 'player.name'])
                  .where('channel_config.id = :channelId', { channelId: channelId })
                  .andWhere('player.id = :userId', { userId: userId })
                  .getOne();
    return (chatBan);
  }

  async createBanInfo(chatBanRequest: Partial<ChatMuteBanRequestDto>): Promise<ChatBan> {
    const user = await this.usersService.readOnePlayer(chatBanRequest.userId);
    const channel = await this.readOneChannelConfig(chatBanRequest.channelId);
    const ban = {
      user: user,
      channel: channel,
    }
    const newBan = this.chatBanRepository.create(ban);
    return (this.chatBanRepository.save(newBan));
  }

  async updateBanInfo(id: number, ban: Partial<ChatBan>): Promise<ChatBan> {
      await this.chatBanRepository.update(id, ban);
      return (this.chatBanRepository.findOne({ where: { id } }));
  }

  async deleteBanInfo(id: number): Promise<void> {
      const deleteBan = await this.chatBanRepository.findOne({ where: { id } });
      if (!deleteBan)
          return ;
      await this.chatBanRepository.remove(deleteBan);
  }

  /**
   * 
   * MUTE_LIST Table CURD
   * 
   */

  async readMuteList(channelId: number): Promise<ChatMute[]> {
    const muteList = await this.dataSource
                                .getRepository(ChatMute).createQueryBuilder('mute_list')  
                                .leftJoinAndSelect('mute_list.user', 'player')
                                .leftJoinAndSelect('mute_list.channel', 'channel_config')
                                .select(['mute_list.id', 'player.id', 'player.name', 'mute_list.date'])
                                .where('channel_config.id = :id', { id: channelId })
                                .getMany();
    return (muteList);
  }

  async readChatMute(channelId: number, userId: number) {
    const chatMute = await this.dataSource
                              .getRepository(ChatMute).createQueryBuilder('mute_list')  
                              .leftJoinAndSelect('mute_list.user', 'player')
                              .leftJoinAndSelect('mute_list.channel', 'channel_config')
                              .select(['mute_list.id', 'player.id', 'player.name', 'mute_list.date'])
                              .where('channel_config.id = :channelId', { channelId: channelId })
                              .andWhere('player.id = :userId', { userId: userId })
                              .getOne();
    return (chatMute);
    
  }

  async createMuteInfo(chatMuteRequest: Partial<ChatMuteBanRequestDto>): Promise<ChatMute> {
    const user = await this.usersService.readOnePlayer(chatMuteRequest.userId);
    const channel = await this.readOneChannelConfig(chatMuteRequest.channelId);
    const mute = {
      user: user,
      channel: channel,
    }
    const newMute = this.chatMuteRepository.create(mute);
    return (this.chatMuteRepository.save(newMute));
  }

  async updateMuteInfo(id: number, mute: Partial<ChatMute>): Promise<ChatMute> {
    await this.chatMuteRepository.update(id, mute);
    return (this.chatMuteRepository.findOne({ where: { id } }));
  }

  async deleteMuteInfo(id: number): Promise<void> {
    const deleteMute = await this.chatMuteRepository.findOne({ where: { id } });
    if (!deleteMute)
      return ;
    await this.chatMuteRepository.remove(deleteMute);
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
    let hashPass = null;
    if (password)
      hashPass = await hash(password, 10);
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
    if (!password){
      return false;
    }
    const userPassword = await this.readChannelPassword(channelId);
    return (await compare(password, userPassword.password));
  }

  async deleteChannelPassword(channelId: number): Promise<void> {
    this.channelPasswordRepository.delete(channelId);
  }
}
