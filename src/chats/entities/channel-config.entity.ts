import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, } from "typeorm";

@Entity({ name: "channel_config" })
export class ChannelConfig {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  title: string;

  @Column()
  password: string;

  @Column()
  public: boolean;

  @Column()
  limit: number;

  @CreateDateColumn()
  date: Date;
}