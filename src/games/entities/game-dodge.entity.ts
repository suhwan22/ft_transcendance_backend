import { ApiProperty } from "@nestjs/swagger";
import { Player } from "src/users/entities/player.entity";
import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, ManyToOne, JoinColumn, UpdateDateColumn, Unique, } from "typeorm";

@Entity({ name: "game_dodge" })
@Unique(['user'])
export class GameDodge {

  @ApiProperty()
  @PrimaryGeneratedColumn()
  id: number;

  @ApiProperty({ type: () => Player})
  @ManyToOne( (type) => Player, (player) => player.gameHistory)
  @JoinColumn({ name: 'user_id' })
  user: Player;

  @ApiProperty()
  @UpdateDateColumn()
  date: Date;

  @ApiProperty({ default: false })
  @Column()
  execute: boolean;
}