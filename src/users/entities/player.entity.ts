import { ApiProperty } from "@nestjs/swagger";
import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, } from "typeorm";

@Entity({ name: "player" })
export class Player {
  @PrimaryGeneratedColumn()
  id: number;

  @ApiProperty()
  @Column({ unique: true })
  name: string;
  
  @ApiProperty()
  @Column({ type : "bytea", nullable : true })
  avatar: Buffer;

  @ApiProperty()
  @Column()
  status: number;

  @CreateDateColumn()
  date: Date;
}