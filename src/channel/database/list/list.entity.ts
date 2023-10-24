import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn,  } from "typeorm";

@Entity({ name: "channel_list" })
export class List {
    @PrimaryGeneratedColumn()
    id: number;

    @Column()
    channel: number;

    @Column()
    user: number;

    @Column()
    op: boolean;

    @CreateDateColumn()
    date: Date;
}