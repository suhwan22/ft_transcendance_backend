import { Entity, PrimaryGeneratedColumn, Column,  } from "typeorm";
import { ApiProperty } from "@nestjs/swagger";

@Entity({ name: "friend_list" })
export class Friend {
    @PrimaryGeneratedColumn()
    id: number;

    @ApiProperty()
    @Column()
    user: number;

    @ApiProperty()
    @Column()
    friend: number;
}