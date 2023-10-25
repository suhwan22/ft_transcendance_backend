import { ApiProperty } from "@nestjs/swagger";
import { Entity, PrimaryGeneratedColumn, Column } from "typeorm";

@Entity({ name: "ban_list" })
export class ChatBan {
  @PrimaryGeneratedColumn()
  id: number;

  @ApiProperty()
  @Column()
  channel: number;

  @ApiProperty()
  @Column()
  user: number;
}