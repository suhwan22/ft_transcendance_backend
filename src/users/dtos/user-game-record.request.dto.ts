import { ApiProperty } from "@nestjs/swagger";

export class UserGameRecordRequestDto {
  @ApiProperty()
  user: number;

  @ApiProperty()
  win: number;

  @ApiProperty()
  loss: number;

  @ApiProperty()
  rating: number;
}