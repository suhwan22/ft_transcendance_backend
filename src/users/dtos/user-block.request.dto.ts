import { ApiProperty } from "@nestjs/swagger";

export class UserBlockRequestDto {
  @ApiProperty()
  user: number;

  @ApiProperty()
  target: number;
}