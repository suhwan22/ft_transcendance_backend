import { ApiProperty } from "@nestjs/swagger";

export class PlayerRequestDto {
  @ApiProperty()
  name: string;
  
  @ApiProperty()
  avatar: Buffer;

  @ApiProperty()
  status: number;
}