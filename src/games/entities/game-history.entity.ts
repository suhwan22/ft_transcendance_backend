import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, } from "typeorm";

@Entity({ name: "game_history" })
export class GameHistory {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  winner: string;

  @Column()
  loser: string;

  @Column()
  winnerScore: number;

  @Column()
  loserScore: number;

  @CreateDateColumn()
  date: Date;
}