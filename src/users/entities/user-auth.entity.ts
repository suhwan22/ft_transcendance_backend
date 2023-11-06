import { ApiProperty } from "@nestjs/swagger";
import { Column, Entity, PrimaryColumn } from "typeorm";

@Entity({ name: 'auth_list' })
export class UserAuth {
  @ApiProperty()
  @PrimaryColumn({ name: 'id' })
  userId: number;

  @ApiProperty()
  @Column({ nullable: true, name: 'refresh_token' })
  refreshToken: string;

  @ApiProperty()
  @Column({ nullable: true, name: 'two_factor_auth_secret' })
  twoFactorAuthSecret: string;
}