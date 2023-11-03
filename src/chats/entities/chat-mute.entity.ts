import { ApiProperty } from "@nestjs/swagger";
import { Player } from "src/users/entities/player.entity";
import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, OneToOne, JoinColumn, ManyToOne } from "typeorm";
import { ChannelConfig } from "./channel-config.entity";

@Entity({ name: "mute_list" })
export class ChatMute {
  @ApiProperty()
  @PrimaryGeneratedColumn()
  id: number;

  @ApiProperty({ type: () => ChannelConfig })
  @ManyToOne(() => ChannelConfig, (channelConfig) => channelConfig.muteList)
  @JoinColumn({ name: 'channel_id' })
  channel: ChannelConfig;

  @ApiProperty({ type: () => Player })
  @ManyToOne(() => Player)
  @JoinColumn({ name: 'user_id' })
  user: Player;

  @ApiProperty()
  @CreateDateColumn({ type: 'timestamptz' })
  date: Date;
}