import { ApiProperty } from "@nestjs/swagger";

export class FriendRequestDto {
  @ApiProperty()
  recv: number;

  @ApiProperty()
  send: number;
}