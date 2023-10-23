import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn } from "typeorm";

@Entity({ name: "mute_list" })
export class Mute {
    @PrimaryGeneratedColumn()
    id: number;

    @Column()
    channel: number;

    @Column()
    user: number;

    @CreateDateColumn({ type: 'timestamptz' })
    date: Date;
}