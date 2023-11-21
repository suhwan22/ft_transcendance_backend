import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, JoinColumn, } from "typeorm";
import { ApiProperty } from "@nestjs/swagger";
import { Player } from "./player.entity";

@Entity({ name: "friend_request" })
export class FriendRequest {
  @PrimaryGeneratedColumn()
  id: number;

  @ApiProperty({ type: () => Player})
  @ManyToOne((type) => Player)
  @JoinColumn({ name: 'recv_id' })
  recv: Player;

  @ApiProperty({ type: () => Player})
  @ManyToOne((type) => Player)
  @JoinColumn({ name: 'send_id' })
  send: Player;
}