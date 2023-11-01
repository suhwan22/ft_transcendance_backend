import { ChannelMember } from "../entities/channel-member.entity";
import { ChatBan } from "../entities/chat-ban.entity";
import { ChatLog } from "../entities/chat-log.entity";
import { ChatMute } from "../entities/chat-mute.entity";

export class ChatDto {
  id: number;
  title: string;
  limitUser: number;
  isPublic: boolean;
  chatLog: ChatLog[];
  memberList: ChannelMember[];
  banList: ChatBan[];
  muteList: ChatMute[];
  date: Date;
}