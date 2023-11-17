import { ApiProperty } from "@nestjs/swagger";
import { Column, Entity, JoinColumn, OneToOne, PrimaryColumn, PrimaryGeneratedColumn, UpdateDateColumn } from "typeorm";
import { Player } from "./player.entity";

@Entity({ name: 'user_socket' })
export class UserSocket {
  @ApiProperty()
  @PrimaryGeneratedColumn()
  id: number;

  @ApiProperty({ type: () => Player})
  @OneToOne( (type) => Player)
  @JoinColumn({ name: 'user_id' })
  user: Player;

  @ApiProperty()
  @Column({ nullable: true })
  socket: string;

  @ApiProperty()
  @UpdateDateColumn()
  date: Date;
}