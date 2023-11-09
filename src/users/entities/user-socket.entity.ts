import { ApiProperty } from "@nestjs/swagger";
import { Column, CreateDateColumn, Entity, PrimaryColumn, UpdateDateColumn } from "typeorm";

@Entity({ name: 'user_socket' })
export class UserSocket {
  @ApiProperty()
  @PrimaryColumn({ name: 'id' })
  userId: number;

  @ApiProperty()
  @Column({ nullable: true })
  socket: string;

  @ApiProperty()
  @UpdateDateColumn()
  date: Date;
}