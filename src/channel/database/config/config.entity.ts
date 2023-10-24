import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn,  } from "typeorm";

@Entity({ name: "channel_config" })
export class Config {
    @PrimaryGeneratedColumn()
    id: number;

    @Column()
    password: string;

    @Column()
    public: boolean;

    @Column()
    limit: number;

    @CreateDateColumn()
    date: Date;
}