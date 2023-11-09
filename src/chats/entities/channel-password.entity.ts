import { ApiProperty } from "@nestjs/swagger";
import { Column, Entity, PrimaryColumn, UpdateDateColumn } from "typeorm";

@Entity({ name: 'channel_password' })
export class ChannelPassword {
  @ApiProperty()
  @PrimaryColumn({ name: 'id' })
  channelId: number;

  @ApiProperty()
  @Column({ nullable: true })
  password: string;

  @ApiProperty()
  @UpdateDateColumn()
  date: Date;
}