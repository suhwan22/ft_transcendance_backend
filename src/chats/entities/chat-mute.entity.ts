import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn } from "typeorm";

@Entity({ name: "mute_list" })
export class ChatMute {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  channel: number;

  @Column()
  user: string;

  @CreateDateColumn({ type: 'timestamptz' })
  date: Date;
}