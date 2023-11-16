import { ApiProperty } from "@nestjs/swagger";
import { Player } from "src/users/entities/player.entity";
import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, OneToOne, JoinColumn, ManyToOne, ManyToMany } from "typeorm";
import { ChannelConfig } from "./channel-config.entity";

@Entity({ name: "chat_log" })
export class ChatLog {
  @ApiProperty()
  @PrimaryGeneratedColumn()
  id: number;

  @ApiProperty({ type: () => ChannelConfig })
  @ManyToOne(() => ChannelConfig, (channelConfig) => channelConfig.chatLogs, {
    onDelete: "CASCADE"
  })
  @JoinColumn({ name: 'channel_id' })
  channel: ChannelConfig;

  @ApiProperty({ type: () => Player })
  @ManyToOne(() => Player)
  @JoinColumn({ name: 'user_id' })
  user: Player;

  @ApiProperty()
  @Column()
  content: String;

  @ApiProperty()
  @CreateDateColumn({ type: 'timestamptz' })
  date: Date;
}