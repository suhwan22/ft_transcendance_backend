import { Entity, PrimaryGeneratedColumn, Column,  } from "typeorm";

@Entity({ name: "friend_list" })
export class Friend {
    @PrimaryGeneratedColumn()
    id: number;

    @Column()
    user: number;

    @Column()
    friend: number;
}