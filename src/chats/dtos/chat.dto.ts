import { ChannelMember } from "../entities/channel-members.entity";
import { ChatLog } from "../entities/chat-log.entity";

export class ChatDto {
  id: number;
  title: string;
  limitUser: number;
  isPublic: boolean;
  chatLog: ChatLog[];
  memberList: ChannelMember[];
  banList: object[];
  muteList: object[];
  date: Date;
}