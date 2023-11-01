import { ApiProperty } from "@nestjs/swagger";

export class GameHistoryRequestDto {
  @ApiProperty()
  user: number;

  @ApiProperty()
  opponent: number;

  @ApiProperty()
  result: boolean;

  @ApiProperty()
  userScore: number;

  @ApiProperty()
  opponentScore: number;
}