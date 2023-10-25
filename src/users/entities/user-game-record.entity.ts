import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, } from "typeorm";

@Entity({ name: "win_loss_record" })
export class UserGameRecord {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  user: string;

  @Column()
  win: number;

  @Column()
  loss: number;

  @Column()
  score: number;

  @CreateDateColumn()
  date: Date;
}