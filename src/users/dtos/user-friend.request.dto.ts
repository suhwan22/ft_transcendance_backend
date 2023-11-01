import { ApiProperty } from "@nestjs/swagger";

export class UserFriendRequestDto {
  id: number;

  @ApiProperty()
  user: number;

  @ApiProperty()
  friend: number;
}