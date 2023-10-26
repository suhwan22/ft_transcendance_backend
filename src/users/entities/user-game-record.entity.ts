import { ApiProperty } from "@nestjs/swagger";
import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, } from "typeorm";

@Entity({ name: "win_loss_record" })
export class UserGameRecord {
  @PrimaryGeneratedColumn()
  id: number;

  @ApiProperty()
  @Column()
  user: string;

  @ApiProperty()
  @Column()
  win: number;

  @ApiProperty()
  @Column()
  loss: number;

  @ApiProperty()
  @Column()
  score: number;

  @CreateDateColumn()
  date: Date;
}