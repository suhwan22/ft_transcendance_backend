import { ApiProperty } from "@nestjs/swagger";
import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, OneToMany, OneToOne, JoinColumn, } from "typeorm";
import { UserFriend } from "./user-friend.entity";
import { UserBlock } from "./user-block.entity";
import { UserGameRecord } from "./user-game-record.entity";
import { GameHistory } from "src/games/entities/game-history.entity";
import { ChannelMember } from "src/chats/entities/channel-member.entity";

@Entity({ name: "player" })
export class Player {
  @PrimaryGeneratedColumn()
  id: number;

  @ApiProperty()
  @Column({ unique: true })
  name: string;
  
  @ApiProperty()
  @Column({ type: "bytea", nullable : true })
  avatar: Buffer;

  @ApiProperty()
  @Column()
  status: number;

  @ApiProperty({ type: () => UserFriend, isArray: true })
  @OneToMany((type) => UserFriend, (friend) => friend.friend)
  friendList: UserFriend[];

  @ApiProperty({ type: UserBlock, isArray: true })
  @OneToMany((type) => UserBlock, (block) => block.target)
  blockList: UserBlock[];

  @ApiProperty({ type: () => ChannelMember, isArray: true })
  @OneToMany((type) => ChannelMember, (channelList) => channelList.user)
  channelList: ChannelMember[];

  @ApiProperty({ type: UserGameRecord})
  @OneToOne((type) => UserGameRecord)
  gameRecord: UserGameRecord;

  @ApiProperty({ type: GameHistory, isArray: true })
  @OneToMany((type) => GameHistory, (history) => history.opponent)
  gameHistory: GameHistory[];

  @CreateDateColumn()
  date: Date;
}