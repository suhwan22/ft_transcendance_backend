import { ApiProperty } from "@nestjs/swagger";
import { Player } from "src/users/entities/player.entity";
import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, ManyToOne, JoinColumn, } from "typeorm";

@Entity({ name: "game_history" })
export class GameHistory {
  @PrimaryGeneratedColumn()
  id: number;

  @ApiProperty()
  @Column()
  user: number;

  @ApiProperty({ type: () => Player})
  @ManyToOne( (type) => Player, (player) => player.gameHistory)
  @JoinColumn({ name: 'opponent_id' })
  opponent: Player;

  @ApiProperty()
  @Column()
  result: boolean;

  @ApiProperty()
  @Column({ name: "user_score"})
  userScore: number;

  @ApiProperty()
  @Column({ name: "opponent_score"})
  opponentScore: number;

  @ApiProperty()
  @Column({ default: false })
  rank: boolean;

  @CreateDateColumn()
  date: Date;
}