import { Inject, Injectable, forwardRef } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { DataSource, Repository, getManager } from 'typeorm';
import { Player } from './entities/player.entity';
import { UserGameRecord } from './entities/user-game-record.entity';
import { UserBlock } from './entities/user-block.entity';
import { UserFriend } from './entities/user-friend.entity';
import { UserDto } from './dtos/user.dto';
import { ChannelListDto } from './dtos/channel-list.dto';
import { ChatsService } from 'src/chats/chats.service';
import { ChannelConfig } from 'src/chats/entities/channel-config.entity';
import { FriendRequest } from './entities/friend-request.entity';
import { UserBlockRequestDto } from './dtos/user-block.request.dto';
import { UserFriendRequestDto } from './dtos/user-friend.request.dto';
import { UserGameRecordRequestDto } from './dtos/user-game-record.request.dto';
import { PlayerRequestDto } from './dtos/player.request.dto';
import { GamesService } from 'src/games/games.service';
import { ChannelMember } from 'src/chats/entities/channel-member.entity';

@Injectable()
export class UsersService {
  constructor(
    @InjectRepository(Player)
    private playerRepository: Repository<Player>,
    @InjectRepository(UserGameRecord)
    private recordRepository: Repository<UserGameRecord>,
    @InjectRepository(UserBlock)
    private userBlockRepository: Repository<UserBlock>,
    @InjectRepository(UserFriend)
    private userFriendRepository: Repository<UserFriend>,
    @InjectRepository(FriendRequest)
    private friendRequestRepository: Repository<FriendRequest>,

    @Inject(forwardRef(() => ChatsService))
    private readonly chatsService: ChatsService,
    @Inject(forwardRef(() => GamesService))
    private readonly gamesService: GamesService,
    private dataSource: DataSource
  ) {}

  /**
   * 
   * PLAYER Table CURD
   * 
   */

  /* [C] Player 생성 */
  async createPlayer(player: Partial<PlayerRequestDto>): Promise<Player> {
    const newplayer = this.playerRepository.create(player);
    return (this.playerRepository.save(newplayer));
  }

  /* [R] 특정 Player 조회 */
  async readOnePlayer(id: number) : Promise<Player> {
    const player = await this.playerRepository.findOne({where: { id }});
    player.friendList = await this.readFriendList(id);
    player.blockList = await this.readBlockList(id);
    player.gameRecord = await this.readOneUserGameRecord(id);
    player.gameHistory = await this.gamesService.readOneGameHistory(id);
    delete player.gameRecord.user;
    return (player);
  }

  /* gamesService 용 readOnePlayer */
  async readOnePurePlayer(id: number) : Promise<Player> {
    const player = await this.playerRepository.findOne({where: { id }});
    return (player);
  }

  /* [U] Player info 수정 */
  async updatePlayerInfo(id: number, player: Partial<Player>): Promise<Player> {
    await this.playerRepository.update(id, player);
    return (this.playerRepository.findOne({ where: { id } }));
  }

  /* [D] Player 제거 */
  async deletePlayer(id: number): Promise<void> {
    await (this.playerRepository.delete(id));
  }

  /**
   * 
   * WIN_LOSS_RECORD Table CURD
   * 
   */

  /* [C] UserGameRecord 생성 */
  async createUserGameRecord(record: Partial<UserGameRecordRequestDto>): Promise<UserGameRecord> {
    const user = await this.readOnePlayer(record.user);
    const temp = {
      user: user,
      win: record.win,
      loss: record.loss,
      score: record.score
    }
    const newRecord = this.recordRepository.create(temp);
    return (this.recordRepository.save(newRecord));
  }

  /* [R] 모든 UserGameRecord 조회 */
  async readAllUserGameRecord(): Promise<UserGameRecord[]> {
    return (this.recordRepository.find());
  }

  /* [R] 특정 UserGameRecord 조회 */
  async readOneUserGameRecord(user: number) : Promise<UserGameRecord> {
    const recordList = await this.dataSource 
                                      .getRepository(UserGameRecord).createQueryBuilder('win_loss_record')
                                      .leftJoinAndSelect('win_loss_record.user', 'user')
                                      .select(['win_loss_record.id', 'user.id', 'user.name'
                                      , 'win_loss_record.win', 'win_loss_record.loss', 'win_loss_record.score'])
                                      .where('win_loss_record.user = :id', { id: user })
                                      .getOne();
    return (recordList)
  }

  /* [U] UserGameRecord info 수정 */
  async updateUserGameRecordInfo(id: number, record: Partial<UserGameRecord>): Promise<UserGameRecord> {
    await this.recordRepository.update(id, record);
    return (this.recordRepository.findOne({ where: { id } }));
  }

  // /* [D] UserGameRecord 제거 */
  // async deleteUserGameRecord(id: number): Promise<void> {
  //   await (this.recordRepository.delete(id));
  // }

  /**
   * 
   * FRIEND_LIST Table CURD
   * 
   */

  // 유저 친구리스트 조회 메서드
  async readFriendList(user: number) : Promise<UserFriend[]> {
    const friendList = await this.dataSource 
                                      .getRepository(UserFriend).createQueryBuilder('friend_list')
                                      .leftJoinAndSelect('friend_list.friend', 'friend')
                                      .select(['friend_list.id', 'friend.id', 'friend.name'])
                                      .where('friend_list.user = :id', { id: user })
                                      .getMany();
    return (friendList)
  }

  // 유저 친구 생성 메서드
  async createFriendInfo(friendRequestDto: Partial<UserFriendRequestDto>): Promise<UserFriend> {
    const friend = await this.readOnePlayer(friendRequestDto.friend);
    const temp = {
      user: friendRequestDto.user,
      friend: friend
    }
    const newFriend = this.userFriendRepository.create(temp);
    return (this.userFriendRepository.save(newFriend));
  }

  // 유저 친구 수정 메서드
  async updateFriendInfo(id: number, friend: Partial<UserFriend>): Promise<UserFriend> {
    await this.userFriendRepository.update(id, friend);
    return (this.userFriendRepository.findOne({ where: { id } }));
  }

  // // 유저 친구 제거 메서드
  // async deleteFriendInfo(user: number, friend: number): Promise<void> {
  //   const deleteFriend = await this.userFriendRepository.findOne({ where: { user, friend} });
  //   if (!deleteFriend)
  //     return ;
  //   await this.userFriendRepository.remove(deleteFriend);
  // }

  // 유저 전체 친구 삭제 메서드
  // async deleteFriendList(user: number): Promise<void> {
  //   await this.userFriendRepository.delete({ user });
  // }

  /**
   * 
   * BAN_LIST Table CURD
   * 
   */

  // 유저 블락리스트 조회 메서드
  async readBlockList(user: number) : Promise<UserBlock[]> {
    const blockList = await this.dataSource 
                                      .getRepository(UserBlock).createQueryBuilder('block_list')
                                      .leftJoinAndSelect('block_list.target', 'target')
                                      .select(['block_list.id', 'target.id', 'target.name'])
                                      .where('block_list.user = :id', { id: user })
                                      .getMany();
    return (blockList)
  }

  // 유저 블락 생성 메서드
  async createBlockInfo(blockRequest: Partial<UserBlockRequestDto>): Promise<UserBlock> {
    const target = await this.readOnePlayer(blockRequest.target);
    const block = {
      user: blockRequest.user,
      target: target
    }
    const newBlock = this.userBlockRepository.create(block);
    return (this.userBlockRepository.save(newBlock));
  }


  // 유저 블락 수정 메서드
  async updateBlockInfo(id: number, block: Partial<UserBlock>): Promise<UserBlock> {
    await this.userBlockRepository.update(id, block);
    return (this.userBlockRepository.findOne({ where: { id } }));
  }

  // // 유저 블락 제거 메서드
  // async deleteBlockInfo(user: number, target: number): Promise<void> {
  //   const deleteFriend = await this.userBlockRepository.findOne({ where: { user, target } });
  //   if (!deleteFriend)
  //      return ;
  //   await this.userBlockRepository.remove(deleteFriend);
  // }

  // 유저 블락 전체제거 메서드
  async deleteBlockList(user: number): Promise<void> {
    await this.userBlockRepository.delete({ user });
  }

  /**
   * 
   * FRIEND_REQUEST Table CURD
   * 
   */

  /* [C] FriendRequest 생성 */
  async createFriendRequest(request: Partial<FriendRequest>): Promise<FriendRequest> {
    const newRequest = this.friendRequestRepository.create(request);
    console.log(newRequest);
    return (this.friendRequestRepository.save(newRequest));
  }

  /* [R] 모든 FriendRequest 조회 */
  async readAllFriendRequest(): Promise<FriendRequest[]> {
    return (this.friendRequestRepository.find());
  }

  /* [R] 특정 recv{id}의 FriendRequest 조회 */
  async readRecvFriendRequest(recv: number): Promise<FriendRequest[]> {
    return (this.friendRequestRepository.find({ where: { recv } }));
  }

  /* [R] 특정 send{id}의 FriendRequest 조회 */
  async readSendFriendRequest(send: number): Promise<FriendRequest[]> {
    return (this.friendRequestRepository.find({ where: { send } }));
  }

  /* [D] FriendRequest 제거 */
  async deleteFriendRequest(id: number): Promise<void> {
    await (this.friendRequestRepository.delete(id));
  }

  // async readUserInfo(id: number): Promise<UserDto> {
  //   const userDto = new UserDto();
  //   const userInfo = await this.playerRepository.findOne({ where: { id }});
  //   const blockList = await this.userBlockRepository.find({ where: { user: id }});
  //   const friendList = await this.userFriendRepository.find({ where: { user: id }});

  //   var blocks: { userId: number, name: string }[] = [];
  //   var friends: { userId: number, name: string }[] = [];

  //   for (const idx of blockList) {
  //     blocks.push({ userId: idx.target, name: "temp" });
  //   }

  //   for (const idx of friendList) {
  //     friends.push({ userId: idx.friend, name: "temp" });
  //   }

  //   userDto.id = userInfo.id;
  //   userDto.name = userInfo.name;
  //   userDto.avatar = userInfo.avatar;
  //   //userDto.rank: number;
  //   userDto.record = await this.readOneUserGameRecord(id);
  //   userDto.blockList = blocks;
  //   userDto.friendList = friends;
  //   return (userDto);
  // }

  async readChannelList(userId: number): Promise<ChannelMember[]> {
    const user = await this.readOnePlayer(userId);
    const userChannelList = await this.chatsService.readUserChannel(user);
    return (userChannelList);
  }
}
