import { ApiProperty } from "@nestjs/swagger";
import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, OneToOne, JoinColumn, UpdateDateColumn, } from "typeorm";
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
  rating: number;

  rank: number;

  @UpdateDateColumn()
  date: Date;
}