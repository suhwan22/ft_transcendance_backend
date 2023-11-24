import { ApiProperty } from "@nestjs/swagger";
import { Player } from "src/users/entities/player.entity";
import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, OneToOne, JoinColumn, ManyToOne, UpdateDateColumn, Unique } from "typeorm";
import { ChannelConfig } from "./channel-config.entity";

@Entity({ name: "mute_list" })
@Unique(['channel', 'user'])
export class ChatMute {
  @ApiProperty()
  @PrimaryGeneratedColumn()
  id: number;

  @ApiProperty({ type: () => ChannelConfig })
  @ManyToOne(() => ChannelConfig, (channelConfig) => channelConfig.muteList, {
    onDelete: "CASCADE"
  })
  @JoinColumn({ name: 'channel_id' })
  channel: ChannelConfig;

  @ApiProperty({ type: () => Player })
  @ManyToOne(() => Player, { nullable: false })
  @JoinColumn({ name: 'user_id' })
  user: Player;

  @Column({ nullable: true })
  duplicate: number;

  @ApiProperty()
  @UpdateDateColumn({ type: 'timestamptz' })
  date: Date;
}