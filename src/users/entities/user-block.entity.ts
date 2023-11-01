import { ApiProperty } from "@nestjs/swagger";
import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, } from "typeorm";
import { Player } from "./player.entity";

@Entity({ name: "block_list" })
export class UserBlock {
  @PrimaryGeneratedColumn()
  id: number;

  @ApiProperty()
  @Column()
  user: number;

  @ApiProperty({ type: () => Player})
  @ManyToOne( (type) => Player, (player) => player.blockList)
  target: Player;
}