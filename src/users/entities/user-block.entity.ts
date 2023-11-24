import { ApiProperty } from "@nestjs/swagger";
import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, JoinColumn, Unique, } from "typeorm";
import { Player } from "./player.entity";

@Entity({ name: "block_list" })
@Unique(['user', 'target'])
export class UserBlock {
  @PrimaryGeneratedColumn()
  id: number;

  @ApiProperty()
  @Column()
  user: number;

  @ApiProperty({ type: () => Player})
  @ManyToOne( (type) => Player, (player) => player.blockList, { nullable: false })
  @JoinColumn({ name: 'target_id' })
  target: Player;
}