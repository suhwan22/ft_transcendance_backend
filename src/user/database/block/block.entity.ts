import { Entity, PrimaryGeneratedColumn, Column,  } from "typeorm";

@Entity({ name: "block_list" })
export class Block {
    @PrimaryGeneratedColumn()
    id: number;

    @Column()
    user: number;

    @Column()
    target: number;
}