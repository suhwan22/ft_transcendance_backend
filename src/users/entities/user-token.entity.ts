import { ApiProperty } from "@nestjs/swagger";
import { Column, Entity, PrimaryColumn } from "typeorm";

@Entity({ name: 'token_list' })
export class UserToken {
  @ApiProperty()
  @PrimaryColumn()
  userId: number;

  @ApiProperty()
  @Column({ nullable: true })
  refreshToken: string;
}