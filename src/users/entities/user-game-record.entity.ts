import { ApiProperty } from "@nestjs/swagger";
import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, OneToOne, JoinColumn, } from "typeorm";
import { Player } from "./player.entity";

@Entity({ name: "win_loss_record" })
export class UserGameRecord {
  @PrimaryGeneratedColumn()
  id: number;

  @ApiProperty({type: () => Player})
  @OneToOne(() => Player, (player) => player.gameRecord)
  @JoinColumn({ name: 'user_id' })
  user: Player;

  @ApiProperty()
  @Column()
  win: number;

  @ApiProperty()
  @Column()
  loss: number;

  @ApiProperty()
  @Column()
  score: number;

  rank: number;

  @CreateDateColumn()
  date: Date;
}