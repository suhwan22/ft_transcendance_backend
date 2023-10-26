import { ApiProperty } from "@nestjs/swagger";
import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, } from "typeorm";

@Entity({ name: "channel_member" })
export class ChannelMember {
  @PrimaryGeneratedColumn()
  id: number;

  @ApiProperty()
  @Column()
  channel: number;

  @ApiProperty()
  @Column()
  user: number;

  @ApiProperty()
  @Column()
  op: boolean;

  @CreateDateColumn()
  date: Date;
}