import { Entity, PrimaryGeneratedColumn, Column, } from "typeorm";
import { ApiProperty } from "@nestjs/swagger";

@Entity({ name: "friend_request" })
export class FriendRequest {
  @PrimaryGeneratedColumn()
  id: number;

  @ApiProperty()
  @Column()
  recv: number;

  @ApiProperty()
  @Column()
  send: number;
}