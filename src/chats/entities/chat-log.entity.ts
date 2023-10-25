import { ApiProperty } from "@nestjs/swagger";
import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn } from "typeorm";

@Entity({ name: "chat_log" })
export class ChatLog {
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
  content: String;

  @CreateDateColumn({ type: 'timestamptz' })
  date: Date;
}