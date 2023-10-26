import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, } from "typeorm";

@Entity({ name: "channel_member" })
export class ChannelMember {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  channel: number;

  @Column()
  user: string;

  @Column()
  op: boolean;

  @CreateDateColumn()
  date: Date;

}