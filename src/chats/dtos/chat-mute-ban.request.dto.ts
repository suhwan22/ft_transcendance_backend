import { ApiProperty } from "@nestjs/swagger";

export class ChatMuteBanRequestDto {
  @ApiProperty()
  channelId: number;

  @ApiProperty()
  userId: number;
}