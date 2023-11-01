import { ApiProperty } from "@nestjs/swagger";

export class ChannelMemberRequestDto {
  @ApiProperty()
  channelId: number;

  @ApiProperty()
  userId: number;

  @ApiProperty()
  op: boolean;
}