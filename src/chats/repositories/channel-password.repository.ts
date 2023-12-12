import { Injectable } from "@nestjs/common";
import { DataSource, InsertResult, Repository } from "typeorm";
import { ChannelPassword } from "../entities/channel-password.entity";

@Injectable()
export class ChannelPasswordRepository extends Repository<ChannelPassword> {
  constructor(private dataSource: DataSource) {
    super(ChannelPassword, dataSource.createEntityManager());
  }

  async readChannelPassword(channelId: number): Promise<ChannelPassword> {
    const userchannelPassword = await this.findOne({ where: { channelId } });
    return (userchannelPassword);
  }

  async createChannelPassword(channelId: number, password: string): Promise<InsertResult> {
    const result = await this.createQueryBuilder('channel_password')
    .insert()
    .into(ChannelPassword)
    .values({ channelId: channelId, password: password})
    .execute();
    return (result);
  }

  async updateChannelPassword(channelId: number, password: string): Promise<ChannelPassword> {
    this.update(channelId, { password: password });
    return (this.readChannelPassword(channelId));
  }

  async deleteChannelPassword(channelId: number): Promise<void> {
    this.delete(channelId);
  }
}