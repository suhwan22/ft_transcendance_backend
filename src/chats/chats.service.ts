import { Injectable } from '@nestjs/common';

import { ChannelConfig } from './entities/channel-config.entity'
import { ChannelMember } from './entities/channel-member.entity';
import { ChannelPassword } from './entities/channel-password.entity';
import { ChatBan } from './entities/chat-ban.entity';
import { ChatMute } from './entities/chat-mute.entity';
import { ChatLog } from './entities/chat-log.entity';

import { ChannelConfigRequestDto } from './dtos/channel-config.request.dto';
import { ChannelMemberRequestDto } from './dtos/channel-member.request.dto';
import { ChatMuteBanRequestDto } from './dtos/chat-mute-ban.request.dto';
import { ChatLogRequestDto } from './dtos/chat-log.request.dto';

import { ChannelConfigRepository } from './repositories/channel-config.repository';
import { ChannelMemberRepository } from './repositories/channel-member.repository';
import { ChannelPasswordRepository } from './repositories/channel-password.repository';
import { ChatBanRepository } from './repositories/chat-ban.repository';
import { ChatMuteRepository } from './repositories/chat-mute.repository';
import { ChatLogRepository } from './repositories/chat-log.repository';

import { compare, hash } from 'bcrypt';

@Injectable()
export class ChatsService {
  constructor(
    private channelConfigRepository: ChannelConfigRepository,
    private channelMemberRepository: ChannelMemberRepository,
    private channelPasswordRepository: ChannelPasswordRepository,
    private chatBanRepository: ChatBanRepository,
    private chatMuteRepository: ChatMuteRepository,
    private chatLogRepository: ChatLogRepository,
  ) { }

  // 특정 유저가 특정 채팅방에 들어와 있는지 검사
  async checkInChannelMember(channelId: number, userId: number): Promise<boolean> {
    const channelMember = await this.readChannelMember(channelId, userId);
    if (!channelMember)
      return false;
    return true;
  }
  
  // 비밀번호 검사
  async comparePassword(password: string, channelId: number) {
    if (!password) {
      return false;
    }
    const inputPassword = password;
    const userPassword = await this.readChannelPassword(channelId);
    return (await compare(inputPassword, userPassword.password));
  }

  /** 
   * 
   * CHANNEL_CONFIG Table CRUD 
   * 
   */

  /** [C] ChannelConfig 생성 */
  async createChannelConfig(config: Partial<ChannelConfigRequestDto>): Promise<ChannelConfig> {
    const insertResult = await this.channelConfigRepository.createChannelConfig(config);
    this.createChannelPassword(insertResult.raw[0].id, config.password);
    return (this.readOnePureChannelConfig(insertResult.raw[0].id));
  }

  /** [R] 모든 ChannelConfig 조회 */
  async readAllChannelConfig(): Promise<ChannelConfig[]> {
    return (this.channelConfigRepository.readAllChannelConfig());
  }

  /** [R] 특정 ChannelConfig 조회 */
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

  /** [R] 특정 ChannelConfig 조회 */
  async readOnePureChannelConfig(id: number): Promise<ChannelConfig> {
    return (await this.channelConfigRepository.readOnePureChannelConfig(id));
  }

  /** [R] 내 DM ChannelConfig 조회 */
  async readChannelConfigMyDm(userId: number) {
    const dmList = await this.channelConfigRepository.readChannelConfigMyDm(userId);

    for (const dm of dmList) {
      let channelMember = await this.channelMemberRepository.readOneChannelMember(dm.id);
      dm.title = channelMember[0].user.id === userId ? channelMember[1].user.name : channelMember[0].user.name;
    };

    return (dmList);
  }

  /* [R] 내 DM ChannelConfig 조회 */
  async readDmUserWithTarget(userId: number, targetId: number) {
    const dmList = await this.channelConfigRepository.readDmUserTarget(userId, targetId);

    return (dmList);
  }

  /** [R] 내가 속한 ChannelConfig 조회 */
  async readChannelConfigMyChannel(userId: number): Promise<ChannelConfig[]> {
    return (await this.channelConfigRepository.readChannelConfigMyChannel(userId));
  }

  /** [R] 내가 속하지 않은 ChannelConfig 조회 */
  async readChannelConfigNotMember(userId: number): Promise<ChannelConfig[]> {
    return (await this.channelConfigRepository.readChannelConfigNotMember(userId));
  }

  /** [U] ChannelConfig info 수정 */
  async updateChannelConfigInfo(id: number, config: Partial<ChannelConfigRequestDto>): Promise<ChannelConfig> {
    return (this.channelConfigRepository.updateChannelConfigInfo(id, config));
  }

  /** [U] ChannelConfig title 수정 */
  async updateChannelConfigWithTitle(id: number, title: string): Promise<ChannelConfig> {
    return (this.channelConfigRepository.updateChannelConfigWithTitle(id, title));
  }

  /** [D] ChannelConfig 제거 
          channel_member 관계는 없는 경우 */
  async deleteChannelConfig(id: number): Promise<void> {
    await this.deleteChannelPassword(id);
    await (this.channelConfigRepository.deleteChannelConfig(id));
  }

  /** 
   * 
   * CHANNEL_MEMBER Table CRUD 
   * 
   */

  /** [C] ChannelMember 생성 */
  async createChannelMember(request: Partial<ChannelMemberRequestDto>): Promise<ChannelMember> {
    const result = await this.channelMemberRepository.createChannelMember(request.channelId, request.userId);
    return (this.readChannelMember(request.channelId, request.userId));
  }

  /** [R] 모든 ChannelMember 조회 */
  async readAllChannelMember(): Promise<ChannelMember[]> {
    return (await this.channelMemberRepository.readAllChannelMember());
  }

  /** [R] 특정 Channel{id}에 속한 Member 조회 */
  async readOneChannelMember(channelId: number): Promise<ChannelMember[]> {
    return (await this.channelMemberRepository.readOneChannelMember(channelId));
  }

  /** [R] 특정 Channel{id}에 속한 Member + dm 조회 */
  async readOneChannelMemberWithDm(channelId: number): Promise<ChannelMember[]> {
    return (await this.channelMemberRepository.readOneChannelMemberWithDm(channelId));
  }

  /** [R] 특정 channel에 몇명 있는지 조사하기 위해 만든 pureChannelMember */
  async readOnePureChannelMember(channelId: number): Promise<ChannelMember[]> {
    return (await this.channelMemberRepository.readOnePureChannelMember(channelId));
  }

  /** [R] 특정 User{id}에 속한 Member 조회 */
  async readChannelMemberWithUserId(userId: number): Promise<ChannelMember[]> {
    return (await this.channelMemberRepository.readChannelMemberWithUserId(userId));
  }

  /** [R] 특정 Channel Member 조회 */
  async readChannelMember(channelId: number, userId: number): Promise<ChannelMember> {
    return (await this.channelMemberRepository.readChannelMember(channelId, userId));
  }

  /** [R] 유저 이름으로 Channel Member 조회 */
  async readChannelMemberWithName(channelId: number, name: string): Promise<ChannelMember> {
    return (await this.channelMemberRepository.readChannelMemberWithName(channelId, name));
  }

  /** [R] 특정 User{id}에 속한 Member 조회 */
  async readMemberInChannel(channelId: number, userId: number): Promise<ChannelMember> {
    return (await this.channelMemberRepository.readMemberInChannel(channelId, userId));
  }

  /** [R] Dm방 상대방 id 가져오기 */
  async readDmTargetId(channelId: number, userId: number): Promise<ChannelMember> {
    return (await this.channelMemberRepository.readDmTargetId(channelId, userId));
  }

  /** [U] ChannelMember{id} info 수정 */
  async updateChannelMemberInfo(id: number, list: Partial<ChannelMember>): Promise<ChannelMember> {
    return (await this.channelMemberRepository.updateChannelMemberInfo(id, list));
  }

  /** [U] ChannelMember{id} op 수정 */
  async updateChannelMemberOp(id: number, op: boolean): Promise<ChannelMember> {
    return (await this.channelMemberRepository.updateChannelMemberOp(id, op));
  }

  /** [U] 유저 이름으로 ChannelMember op 수정 */
  async updateChannelOpWithName(channelId: number, targetName: string, op: boolean) {
    return (await this.channelMemberRepository.updateChannelOpWithName(channelId, targetName, op));
  }

  /** [D] ChannelMember{id} 제거 */
  async deleteChannelMember(id: number): Promise<void> {
    await (this.channelMemberRepository.deleteChannelMember(id));
  }

  /** [D] 특정 ChannelMember{id} 제거 */
  async deleteChannelMemberWithUserId(channelId: number, userId: number) {
    return (await this.channelMemberRepository.deleteChannelMemberWithUserId(channelId, userId));
  }

  /** 
   * 
   * CHANNEL_PASSWORD Table CRUD 
   * 
   */

  /** [C] ChannelPassword 생성 */
  async createChannelPassword(channelId: number, password: string): Promise<ChannelPassword> {
    let hashPass: string = null;
    const saltRound = 10;
    if (password)
      hashPass = await hash(password, saltRound);
    const result = await this.channelPasswordRepository.createChannelPassword(channelId, hashPass);
    return (this.channelPasswordRepository.findOne({ where: { channelId : channelId }}));
  }

  /** [R] 특정 ChannelPassword 조회 */
  async readChannelPassword(channelId: number): Promise<ChannelPassword> {
    return (await this.channelPasswordRepository.readChannelPassword(channelId));
  }

  /** [U] 특정 ChannelPassword 비밀번호 변경 */
  async updateChannelPassword(channelId: number, password: string): Promise<ChannelPassword> {
    let hashPass = null;
    if (password)
      hashPass = await hash(password, 10);
    return (await this.channelPasswordRepository.updateChannelPassword(channelId, hashPass));
  }

  /** [D] 특정 ChannelPassword 비밀번호 제거 */
  async deleteChannelPassword(channelId: number): Promise<void> {
    this.channelPasswordRepository.deleteChannelPassword(channelId);
  }

  /** 
   * 
   * BAN_LIST Table CRUD
   * 
   */

  /** [C] ChatBan 생성 */
  async createBanInfo(chatBanRequest: Partial<ChatMuteBanRequestDto>): Promise<ChatBan> {
    const result = await this.chatBanRepository.createBanInfo(chatBanRequest.channelId, chatBanRequest.userId);
    return (this.chatBanRepository.findOne({ where: { id: result.raw[0].id }}));
  }

  /** [C] 유저 이름으로 ChatBan 생성 */
  async createChatBanWithName(channelId: number, name: string) {
    await this.chatBanRepository.createChatBanWithName(channelId, name);
  } 

  /** [C] 채팅방의 모든 ChatBan 조회 */
  async readBanList(channelId: number): Promise<ChatBan[]> {
    return (await this.chatBanRepository.readBanList(channelId));
  }

  /** [R] 채팅방의 특정 ChatBan 조회 */
  async readBanUser(channelId: number, userId: number): Promise<ChatBan> {
    return (await this.chatBanRepository.readBanUser(channelId, userId));
  }

  /** [R] 채팅방의 특정 ChatBan 조회 */
  async readChatBan(channelId: number, userId: number): Promise<ChatBan> {
    return (await this.chatBanRepository.readChatBan(channelId, userId));
  }

  /** [U] 특정 ChatBan 수정 */
  async updateBanInfo(id: number, ban: Partial<ChatBan>): Promise<ChatBan> {
    return (await this.chatBanRepository.updateBanInfo(id, ban));
  }

  /** [D] 특정 ChatBan 제거 */
  async deleteBanInfo(id: number): Promise<void> {
    await this.chatBanRepository.deleteBanInfo(id);
  }

  /** [D] 유저 이름으로 ChatBan 제거 */
  async deleteChatBanWithName(name: string) {
    return (await this.chatBanRepository.deleteChatBanWithName(name));
  }

  /**
   * 
   * MUTE_LIST Table CRUD
   * 
   */

  /** [C] ChatMute 생성 */
  async createMuteInfo(chatMuteRequest: Partial<ChatMuteBanRequestDto>): Promise<ChatMute> {
    const result = await this.chatMuteRepository.createMuteInfo(chatMuteRequest.channelId, chatMuteRequest.userId);
    return (this.chatMuteRepository.findOne({ where: { id: result.raw[0].id }}));
  }

  /** [C] 유저 이름으로 ChatMute 생성 */
  async createChatMuteWithName(channelId: number, name: string) {
    await this.chatMuteRepository.createChatMuteWithName(channelId, name);
  }

  /** [R] 채팅방의 모든 ChatMute 조회 */
  async readMuteList(channelId: number): Promise<ChatMute[]> {
    return (await this.chatMuteRepository.readMuteList(channelId));
  }

  /** [R] 특정 ChatMute 조회 */
  async readChatMute(channelId: number, userId: number) {
    return (await this.chatMuteRepository.readChatMute(channelId, userId));
  }

  /** [R] 유저 이름으로 특정 ChatMute 조회 */
  async readChatMuteWithName(channelId: number, name: string) {
    return (await this.chatMuteRepository.readChatMuteWithName(channelId, name));
  }

  /** [U] ChatMute 수정 */
  async updateMuteInfo(id: number, mute: Partial<ChatMute>): Promise<ChatMute> {
    return (await this.chatMuteRepository.updateMuteInfo(id, mute));
  }

  /** [U] ChatMute 시간 수정 */
  async updateTimeChatMute(id: number, user: number) {
    return (await this.chatMuteRepository.updateTimeChatMute(id, user));
  }

  /** [U] 유저이름으로 ChatMute 시간 수정 */
  async updateTimeChatMuteWithName(channelId: number, name: string) {
    return (await this.chatMuteRepository.updateTimeChatMuteWithName(channelId, name));
  }

  /** [D] ChatMute 삭제 */
  async deleteMuteInfo(id: number): Promise<void> {
    await this.chatMuteRepository.deleteMuteInfo(id);
  }

  /** 
   * 
   * CHAT_LOG_LIST Table CRUD 
   * 
   */

  /** [C] ChatLog 생성 */
  async createChatLogInfo(chatLogRequest: Partial<ChatLogRequestDto>): Promise<ChatLog> {
    const result = await this.chatLogRepository.createChatLogInfo(chatLogRequest);
    const aa = await this.readChatLog(result.raw[0].id);
    return (aa);
  }

  /** [R] 채널방에 모든 ChatLog 조회 */
  async readChatLogList(channelId: number): Promise<ChatLog[]> {
    return (await this.chatLogRepository.readChatLogList(channelId));
  }

  /** [R] 채널방에 최근 50개의 ChatLog 조회 */
  async readLatestChatLog(channelId: number): Promise<ChatLog[]> {
    return (this.chatLogRepository.readLatestChatLog(channelId));
  }

  /** [R] 특정 ChatLog 조회 */
  async readChatLog(id: number): Promise<ChatLog> {
    return (await this.chatLogRepository.readChatLog(id));
  }

  /** [D] 특정 ChatLog 삭제 */
  async deleteCatLogInfo(id: number): Promise<void> {
    await this.chatLogRepository.deleteCatLogInfo(id);
  }
}
