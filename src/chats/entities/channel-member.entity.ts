import { ApiProperty } from "@nestjs/swagger";
import { Player } from "src/users/entities/player.entity";
import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, OneToMany, OneToOne, JoinColumn, ManyToOne, } from "typeorm";
import { ChannelConfig } from "./channel-config.entity";

@Entity({ name: "channel_member" })
export class ChannelMember {
  @ApiProperty()
  @PrimaryGeneratedColumn()
  id: number;

  @ApiProperty({ type: () => ChannelConfig })
  @ManyToOne(() => ChannelConfig, (channelConfig) => channelConfig.memberList)
  @JoinColumn({ name: 'channel_id' })
  channel: ChannelConfig;

  @ApiProperty({ type: () => Player })
  @ManyToOne(() => Player, (user) => user.channelList)
  @JoinColumn({ name: 'user_id' })
  user: Player;

  @ApiProperty()
  @Column()
  op: boolean;

  @ApiProperty()
  @CreateDateColumn()
  date: Date;
}