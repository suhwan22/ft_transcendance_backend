import { ApiProperty } from "@nestjs/swagger";
import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, } from "typeorm";

@Entity({ name: "game_history" })
export class GameHistory {
  @PrimaryGeneratedColumn()
  id: number;

  @ApiProperty()
  @Column()
  winner: string;

  @ApiProperty()
  @Column()
  loser: string;

  @ApiProperty()
  @Column()
  winnerScore: number;

  @ApiProperty()
  @Column()
  loserScore: number;

  @CreateDateColumn()
  date: Date;
}