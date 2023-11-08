import { ApiProperty } from "@nestjs/swagger";

export class ChannelConfigRequestDto {
  @ApiProperty()
  title: string;

  @ApiProperty()
  password: string;

  @ApiProperty()
  public: boolean;

  @ApiProperty()
  limit: number;

  @ApiProperty()
  dm: boolean;

  @ApiProperty()
  date: Date;
}