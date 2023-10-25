import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, } from "typeorm";

@Entity({ name: "player" })
export class Player {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ unique: true })
  name: string;

  // @Column({ type : "bytea"}) // 아직 줄게 없어서 가능하게 함{ nullable : true })
  // avatar: Buffer;

  @Column()
  status: number;

  @CreateDateColumn()
  date: Date;
}