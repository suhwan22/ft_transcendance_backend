import { ApiProperty } from "@nestjs/swagger";

export class PlayerRequestDto {
  @ApiProperty()
  id: number;

  @ApiProperty()
  name: string;
  
  @ApiProperty()
  avatar: string;

  @ApiProperty()
  status: number;
}