import { ApiProperty } from "@nestjs/swagger";
import { Entity, PrimaryGeneratedColumn, Column, } from "typeorm";

@Entity({ name: "block_list" })
export class UserBlock {
  @PrimaryGeneratedColumn()
  id: number;

  @ApiProperty()
  @Column()
  user: number;

  @ApiProperty()
  @Column()
  target: number;
}