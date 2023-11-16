import { ApiProperty } from "@nestjs/swagger";
import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, OneToMany, JoinColumn, } from "typeorm";
import { ChannelMember } from "./channel-member.entity";
import { ChatBan } from "./chat-ban.entity";
import { ChatMute } from "./chat-mute.entity";
import { ChatLog } from "./chat-log.entity";

@Entity({ name: "channel_config" })
export class ChannelConfig {
  @ApiProperty()
  @PrimaryGeneratedColumn()
  id: number;

  @ApiProperty()
  @Column({ unique: true })
  title: string;

  @ApiProperty()
  @Column()
  public: boolean;

  @ApiProperty()
  @Column()
  limit: number;

  @ApiProperty()
  @Column()
  dm: boolean;

  @ApiProperty()
  @CreateDateColumn()
  date: Date;

  @ApiProperty({ type : () => ChannelMember, isArray: true })
  @OneToMany(() => ChannelMember, (channelMember) => channelMember.channel)
  memberList: ChannelMember[];

  @ApiProperty({ type : () => ChatBan, isArray: true })
  @OneToMany(() => ChatBan, (chatBan) => chatBan.channel, {
    cascade: true
  })
  banList: ChatBan[];

  @ApiProperty({ type : () => ChatMute, isArray: true })
  @OneToMany(() => ChatMute, (chatMute) => chatMute.channel, {
    cascade: true
  })
  muteList: ChatMute[];

  @ApiProperty({ type : () => ChatLog, isArray: true })
  @OneToMany(() => ChatLog, (chatLog) => chatLog.channel, {
    cascade: true
  })
  chatLogs: ChatLog[];
}