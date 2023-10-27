import { UserGameRecord } from "../entities/user-game-record.entity";

export class UserDto {
  id: number;
  name: string;
  avatar: Buffer;
  rank: number;
  record: UserGameRecord;
  blockList: { userId: number, name: string }[];
  friendList: { userId: number, name: string }[];
}
