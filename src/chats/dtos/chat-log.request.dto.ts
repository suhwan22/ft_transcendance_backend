import { ApiProperty } from "@nestjs/swagger";

export class ChatLogRequestDto {
  @ApiProperty()
  channelId: number;

  @ApiProperty()
  userId: number;
  
  @ApiProperty()
  content: string;
}