import { ApiProperty } from "@nestjs/swagger";
import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn } from "typeorm";

@Entity({ name: "mute_list" })
export class ChatMute {
  @PrimaryGeneratedColumn()
  id: number;

  @ApiProperty()
  @Column()
  channel: number;

  @ApiProperty()
  @Column()
  user: number;

  @ApiProperty()
  @CreateDateColumn({ type: 'timestamptz' })
  date: Date;
}