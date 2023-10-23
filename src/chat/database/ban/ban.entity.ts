import { Entity, PrimaryGeneratedColumn, Column } from "typeorm";

@Entity({ name: "ban_list" })
export class Ban {
    @PrimaryGeneratedColumn()
    id: number;

    @Column()
    channel: number;

    @Column()
    user: number;
}