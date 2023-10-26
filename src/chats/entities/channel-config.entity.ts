import { ApiProperty } from "@nestjs/swagger";
import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, } from "typeorm";

@Entity({ name: "channel_config" })
export class ChannelConfig {
  @PrimaryGeneratedColumn()
  id: number;

  @ApiProperty()
  @Column({ unique: true })
  title: string;

  @ApiProperty()
  @Column()
  password: string;

  @ApiProperty()
  @Column()
  public: boolean;

  @ApiProperty()
  @Column()
  limit: number;

  @CreateDateColumn()
  date: Date;
}