import { ApiProperty } from "@nestjs/swagger";
import { Player } from "src/users/entities/player.entity";
import { Entity, PrimaryGeneratedColumn, Column, OneToMany, JoinColumn, OneToOne, ManyToOne, Unique } from "typeorm";
import { ChannelConfig } from "./channel-config.entity";

@Entity({ name: "ban_list" })
@Unique(['channel', 'user'])
export class ChatBan {
  @ApiProperty()
  @PrimaryGeneratedColumn()
  id: number;

  @ApiProperty({ type: () => ChannelConfig })
  @ManyToOne(() => ChannelConfig, (channelConfig) => channelConfig.banList, { 
    onDelete: "CASCADE",
    nullable: false
  })
  @JoinColumn({ name: 'channel_id' })
  channel: ChannelConfig;

  @ApiProperty({ type: () => Player })
  @ManyToOne(() => Player, { nullable: false })
  @JoinColumn({ name: 'user_id' })
  user: Player;
}