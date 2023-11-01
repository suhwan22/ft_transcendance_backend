import { ApiProperty } from "@nestjs/swagger";
import { Player } from "src/users/entities/player.entity";
import { Entity, PrimaryGeneratedColumn, Column, OneToMany, JoinColumn, OneToOne, ManyToOne } from "typeorm";
import { ChannelConfig } from "./channel-config.entity";

@Entity({ name: "ban_list" })
export class ChatBan {
  @ApiProperty()
  @PrimaryGeneratedColumn()
  id: number;

  @ApiProperty({ type: () => ChannelConfig })
  @ManyToOne(() => ChannelConfig, (channelConfig) => channelConfig.banList)
  @JoinColumn({ name: 'channel_id' })
  channel: ChannelConfig;

  @ApiProperty()
  @OneToOne(() => Player)
  @JoinColumn({ name: 'user_id' })
  user: Player;
}