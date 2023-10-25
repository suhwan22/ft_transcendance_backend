import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ChannelMember } from './entities/channel-members.entity';
import { ChannelConfig } from './entities/channel-config.entity'

@Injectable()
export class ChatsService {
  constructor(
    @InjectRepository(ChannelMember)
    private channelMemberRepository: Repository<ChannelMember>,
    @InjectRepository(ChannelConfig)
    private channelConfigRepository: Repository<ChannelConfig>,
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

  /* [R] 특정 ChannelMember 조회 */
  async readOneChannelMember(id: number): Promise<ChannelMember> {
    return (this.channelMemberRepository.findOne({ where: { id } }));
  }

  /* [U] ChannelMember info 수정 */
  async updateChannelMemberInfo(id: number, list: Partial<ChannelMember>): Promise<ChannelMember> {
    await this.channelMemberRepository.update(id, list);
    return (this.channelMemberRepository.findOne({ where: { id } }));
  }

  /* [D] ChannelMember 제거 */
  async deleteChannelMember(id: number): Promise<void> {
    await (this.channelMemberRepository.delete(id));
  }
}
