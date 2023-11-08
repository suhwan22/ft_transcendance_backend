import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, JoinColumn, } from "typeorm";
import { ApiProperty } from "@nestjs/swagger";
import { Player } from "./player.entity";

// class temp
// {
//   id: number;
//   name: string;
// };

@Entity({ name: "friend_list" })
export class UserFriend {
  @PrimaryGeneratedColumn()
  id: number;

  @ApiProperty()
  @Column()
  user: number;

  @ApiProperty({ type: () => Player})
  @ManyToOne( (type) => Player, (player) => player.friendList)
  @JoinColumn({ name: 'friend_id' })
  friend: Player;
}