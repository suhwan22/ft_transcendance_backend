import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn } from "typeorm";

@Entity({ name: "chat_log" })
export class ChatLog {
    @PrimaryGeneratedColumn()
    id: number;

    @Column()
    channel: number;

    @Column()
    user: number;

    @Column()
    content: String;

    @CreateDateColumn({ type: 'timestamptz' })
    date: Date;
}