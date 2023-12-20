import { Inject, Injectable, forwardRef } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { DataSource, DeleteResult, Repository, UpdateResult } from 'typeorm';
import { Player } from './entities/player.entity';
import { UserGameRecord } from './entities/user-game-record.entity';
import { UserBlock } from './entities/user-block.entity';
import { UserFriend } from './entities/user-friend.entity';
import { ChatsService } from 'src/chats/chats.service';
import { FriendRequest } from './entities/friend-request.entity';
import { UserBlockRequestDto } from './dtos/user-block.request.dto';
import { UserFriendRequestDto } from './dtos/user-friend.request.dto';
import { UserGameRecordRequestDto } from './dtos/user-game-record.request.dto';
import { PlayerRequestDto } from './dtos/player.request.dto';
import { GamesService } from 'src/games/games.service';
import { ChannelMember } from 'src/chats/entities/channel-member.entity';
import { UserAuth } from './entities/user-auth.entity';
import { compare, hash } from 'bcrypt';
import { UserSocket } from './entities/user-socket.entity';
import { FriendRequestDto } from './dtos/friend-request.request.dto';
import { Socket } from 'socket.io';
import { GameRoom } from 'src/games/entities/game.entity';
import { PlayerRepository } from './repositories/player.repository';
import { UserFriendRepository } from './repositories/user-friend.repository';
import { UserBlockRepository } from './repositories/user-block.repository';

@Injectable()
export class UsersService {
  constructor(
    private playerRepository: PlayerRepository,
    private userFriendRepository: UserFriendRepository,
    private userBlockRepository: UserBlockRepository,

    @InjectRepository(UserGameRecord)
    private recordRepository: Repository<UserGameRecord>,
    @InjectRepository(FriendRequest)
    private friendRequestRepository: Repository<FriendRequest>,
    @InjectRepository(UserAuth)
    private userAuthRepository: Repository<UserAuth>,
    @InjectRepository(UserSocket)
    private userSocketRepository: Repository<UserSocket>,

    @Inject(forwardRef(() => ChatsService))
    private readonly chatsService: ChatsService,
    @Inject(forwardRef(() => GamesService))
    private readonly gamesService: GamesService,
    private dataSource: DataSource
  ) { }

  /**
   * 
   * PLAYER Table CURD
   * 
   */

  /* [C] Player 생성 */
  async createPlayer(player: Partial<PlayerRequestDto>): Promise<Player> {
    const newplayer = this.playerRepository.createPlayer(player);
    return (newplayer);
  }

  /* [R] 특정 Player 조회 */
  async readOnePlayer(id: number): Promise<Player> {
    const player = await this.playerRepository.readOnePlayer(id);
    if (!player)
      return (null);
    player.friendList = await this.readFriendList(id);
    player.blockList = await this.readBlockList(id);
    player.gameRecord = null;
    player.gameHistory = await this.gamesService.readOneGameHistory(id);
    player.channelList = await this.readChannelList(id);
    // if (player.gameRecord !== null) {
    //   delete player.gameRecord.user;
    //   player.gameRecord.rank = await this.gamesService.getMyRank(id);
    // }
    return (player);
  }

  /* gamesService 용 readOnePlayer */
  async readOnePurePlayer(id: number): Promise<Player> {
    const player = await this.playerRepository.readOnePlayer(id);
    return (player);
  }

  async   readOnePurePlayerWithName(name: string): Promise<Player> {
    const player = await this.playerRepository.readOnePlayerWithName(name);
    return (player);
  }

  /* [U] Player info 수정 */
  // async updatePlayerInfo(id: number, player: Partial<Player>): Promise<Player> {
  //   const updatePlayer = await this.playerRepository.updatePlayerInfo(id, player);
  //   return (updatePlayer);
  // }

  async updatePlayer(userId: number, name: string, avatar: string) {
    const update = await this.playerRepository.updatePlayer(userId, name, avatar);
    return (update);
  }

  async updatePlayerStatus(id: number, status: number): Promise<Player> {
    const update = await this.playerRepository.updatePlayerStatus(id, status);
    return (update);
  }

  /* [D] Player 제거 */
  async deletePlayer(id: number): Promise<void> {
    await (this.playerRepository.deletePlayer(id));
  }

  /**
   * 
   * WIN_LOSS_RECORD Table CURD
   * 
   */

  /* [C] UserGameRecord 생성 */
  async createUserGameRecord(record: Partial<UserGameRecordRequestDto>): Promise<UserGameRecord> {
    const user = await this.readOnePurePlayer(record.user);
    const temp = {
      user: user,
      win: record.win,
      loss: record.loss,
      rating: record.rating
    }
    const newRecord = this.recordRepository.create(temp);
    return (this.recordRepository.save(newRecord));
  }

  async createUserGameRecordWithResult(user: Player, result: boolean): Promise<UserGameRecord> {
    let record = { win: 0, loss: 1, rating: -1 };
    if (result) 
      record = { win: 1, loss: 0, rating: 1 };
    const newRecord = this.recordRepository.create({ 
      user: user, 
      win: record.win, 
      loss: record.loss, 
      rating: record.rating });
    return (this.recordRepository.save(newRecord));
  }

  /* [R] 모든 UserGameRecord 조회 */
  async readAllUserGameRecord(): Promise<UserGameRecord[]> {
    const recordList = await this.dataSource
      .getRepository(UserGameRecord).createQueryBuilder('win_loss_record')
      .leftJoinAndSelect('win_loss_record.user', 'user')
      .select(['win_loss_record.id', 'user.id', 'user.name'
        , 'win_loss_record.win', 'win_loss_record.loss', 'win_loss_record.rating'])
      .getMany();
    return (recordList)
  }

  /* [R] 특정 UserGameRecord 조회 */
  async readOneUserGameRecord(user: number): Promise<UserGameRecord> {
    const recordList = await this.dataSource
      .getRepository(UserGameRecord).createQueryBuilder('win_loss_record')
      .leftJoinAndSelect('win_loss_record.user', 'user')
      .select(['win_loss_record.id', 'user.id', 'user.name'
        , 'win_loss_record.win', 'win_loss_record.loss', 'win_loss_record.rating'])
      .where('win_loss_record.user = :id', { id: user })
      .getOne();
    return (recordList)
  }

  /* [U] UserGameRecord info 수정 */
  async updateUserGameRecordInfo(id: number, record: Partial<UserGameRecord>): Promise<UserGameRecord> {
    await this.recordRepository.update(id, record);
    return (this.recordRepository.findOne({ where: { id } }));
  }

  async updateRating(winner: Socket, loser: Socket, gameRoom: GameRoom) {
    if (gameRoom.rank) {
      const k = 20;
      let winExpect = 1 / (1 + 10**((loser.data.rating - winner.data.rating) / 400));
      let lossExpect = 1 / (1 + 10**((winner.data.rating - loser.data.rating) / 400));

      let winRating = winner.data.rating + k * (1 - winExpect);
      let lossRating = loser.data.rating + k * (0 - lossExpect);
      await this.updateUserGameRecordRankWin(winner.data.userId, Math.round(winRating));
      await this.updateUserGameRecordRankLoss(loser.data.userId, Math.round(lossRating));
    }
    else {
      await this.updateUserGameRecordWin(winner.data.userId);
      await this.updateUserGameRecordLoss(loser.data.userId);
    }
  }

  async updateUserGameRecordWin(userId: number) {
    const update = await this.dataSource
      .getRepository(UserGameRecord).createQueryBuilder('win_loss_record')
      .update()
      .set({ win: () => 'win + 1' })
      .where(`user_id = ${userId}`)
      .execute()
    return (update);
  }
  
  async updateUserGameRecordLoss(userId: number) {
    const update = await this.dataSource
      .getRepository(UserGameRecord).createQueryBuilder('win_loss_record')
      .update()
      .set({ win: () => 'loss + 1' })
      .where(`user_id = ${userId}`)
      .execute()
    return (update);
  }

  async updateUserGameRecordRankWin(userId: number, rating: number) {
    const update = await this.dataSource
      .getRepository(UserGameRecord).createQueryBuilder('win_loss_record')
      .update()
      .set({ win: () => 'win + 1', rating: () => `${rating}`})
      .where(`user_id = ${userId}`)
      .execute()
    return (update);
  }

  async updateUserGameRecordRankLoss(userId: number, rating: number) {
    const update = await this.dataSource
      .getRepository(UserGameRecord).createQueryBuilder('win_loss_record')
      .update()
      .set({ win: () => 'loss + 1', rating: () => `${rating}`})
      .where(`user_id = ${userId}`)
      .execute()
    return (update);
  }

  /* [D] UserGameRecord 제거 */
  async deleteUserGameRecord(id: number): Promise<void> {
    await (this.recordRepository.delete(id));
  }

  /**
   * 
   * FRIEND_LIST Table CURD
   * 
   */

  // 유저 친구 생성 메서드
  async createFriendInfo(friendRequestDto: Partial<UserFriendRequestDto>): Promise<UserFriend> {
    const insertResult = await this.userFriendRepository.createFriend(friendRequestDto);
    if (!insertResult)
      return null;
    return (this.userFriendRepository.readFriendWithFriendId(friendRequestDto.user, insertResult.raw[0].id));
  }

  async createFriendWithPlayer(userId: number, friend: Player): Promise<UserFriend> {
    const temp = {
      user: userId,
      friend: friend
    }
    const newFriend = this.userFriendRepository.create(temp);
    return (this.userFriendRepository.save(newFriend));
  }

  // 유저 친구리스트 조회 메서드
  async readFriendList(user: number): Promise<UserFriend[]> {
    const friendList = await this.userFriendRepository.readFriendList(user);
    return (friendList)
  }

  async readFriendWithFriendId(user: number, friend: number): Promise<UserFriend> {
    const userFriend = await this.userFriendRepository.readFriendWithFriendId(user, friend);
    return (userFriend);
  }

  // 유저 친구 수정 메서드
  async updateFriendInfo(id: number, friend: Partial<UserFriend>): Promise<UserFriend> {
    const updateFriend = await this.userFriendRepository.updateFriendInfo(id, friend);
    return (updateFriend);
  }

  // 유저 친구 제거 메서드
  async deleteFriendInfo(user: number, friend: number): Promise<void> {
    await this.userFriendRepository.deleteFriendInfo(user, friend);
  }

  // 유저 전체 친구 삭제 메서드
  async deleteFriendList(user: number): Promise<void> {
    await this.userFriendRepository.deleteFriendList(user);
  }

  /**
   * 
   * BLOCK_LIST Table CRUD
   * 
   */

  // 유저 블락 생성 메서드
  async createBlockInfo(blockRequest: Partial<UserBlockRequestDto>): Promise<UserBlock> {
    const insertResult = await this.userBlockRepository.createBlockInfo(blockRequest);
    if (!insertResult)
      return null;
    return (this.userBlockRepository.readUserBlockWithTargetId(blockRequest.user, insertResult.raw[0].id));
  }

  // 유저 블락 생성 메서드
  async createBlockInfoWithTarget(user: number, targetName: string) {
    await this.userBlockRepository.createBlockInfoWithTarget(user, targetName);
  }

  // 유저 블락리스트 조회 메서드
  async readBlockList(user: number): Promise<UserBlock[]> {
    const blockList = await this.userBlockRepository.readBlockList(user);
    return (blockList)
  }

  async readUserBlockWithTargetId(user: number, target: number): Promise<UserBlock> {
    const userBlock = await this.userBlockRepository.readUserBlockWithTargetId(user, target);
    return (userBlock)
  }

  // 유저 블락 수정 메서드
  async updateBlockInfo(id: number, block: Partial<UserBlock>): Promise<UserBlock> {
    const updateBlock = await this.userBlockRepository.updateBlockInfo(id, block);
    return (updateBlock);
  }

  // 유저 블락 제거 메서드
  async deleteBlockInfo(id: number): Promise<void> {
    await (this.userBlockRepository.deleteBlockInfo(id));
  }

  // 유저 블락 전체제거 메서드
  async deleteBlockList(user: number): Promise<void> {
    await this.userBlockRepository.deleteBlockList(user);
  }

  async deleteUserBlockWithName(name: string): Promise<DeleteResult> {
    const deleteResult = await this.userBlockRepository.deleteUserBlockWithName(name);
    return (deleteResult);
  }

  /**
   * 
   * FRIEND_REQUEST Table CURD
   * 
   */

  /* [C] FriendRequest 생성 */
  async createFriendRequest(request: Partial<FriendRequestDto>): Promise<FriendRequest> {
    const recv = await this.readOnePurePlayer(request.recv);
    const send = await this.readOnePurePlayer(request.send);
    const newRequest = { recv: recv, send: send };
    const friendRequest = this.friendRequestRepository.create(newRequest);
    return (this.friendRequestRepository.save(friendRequest));
  }

  async createFriendRequestWithPlayer(recv: Player, send: Player): Promise<FriendRequest> {
    const newRequest = { recv: recv, send: send };
    const friendRequest = this.friendRequestRepository.create(newRequest);
    return (this.friendRequestRepository.save(friendRequest));
  }

  /* [R] 모든 FriendRequest 조회 */
  async readAllFriendRequest(): Promise<FriendRequest[]> {
    return (this.friendRequestRepository.find());
  }

  /* [R] 특정 recv{id}의 FriendRequest 조회 */
  async readRecvFriendRequest(recv: number): Promise<FriendRequest[]> {
    const friendRequestList = await this.dataSource
      .getRepository(FriendRequest).createQueryBuilder('friend_list')
      .leftJoinAndSelect('friend_list.send', 'send')
      .leftJoinAndSelect('friend_list.recv', 'recv')
      .select(['friend_list.id', 'recv.id', 'recv.name', 'send.id', 'send.name'])
      .where('recv.id = :id', { id: recv })
      .getMany();
    return (friendRequestList);
  }

  /* [R] 특정 send{id}의 FriendRequest 조회 */
  async readRecvAndSendFriendRequest(recv:number, send: number): Promise<FriendRequest> {
    const friendRequest = await this.dataSource
      .getRepository(FriendRequest).createQueryBuilder('friend_list')
      .leftJoinAndSelect('friend_list.send', 'send')
      .leftJoinAndSelect('friend_list.recv', 'recv')
      .select(['friend_list.id', 'recv.id', 'recv.name', 'send.id', 'send.name'])
      .where('send.id = :send', { send: send })
      .andWhere('recv.id = :recv', { recv: recv })
      .getOne();
    return (friendRequest);
  }

  /* [R] 특정 send{id}의 FriendRequest 조회 */
  async readSendFriendRequest(send: number): Promise<FriendRequest[]> {
    const friendRequestList = await this.dataSource
      .getRepository(FriendRequest).createQueryBuilder('friend_list')
      .leftJoinAndSelect('friend_list.send', 'send')
      .leftJoinAndSelect('friend_list.recv', 'recv')
      .select(['friend_list.id', 'recv.id', 'recv.name', 'send.id', 'send.name'])
      .where('send.id = :id', { id: send })
      .getMany();
    return (friendRequestList);
  }

  /* [D] FriendRequest 제거 */
  async deleteFriendRequest(id: number): Promise<void> {
    await (this.friendRequestRepository.delete(id));
  }

  async readChannelList(userId: number): Promise<ChannelMember[]> {
    const userChannelList = await this.chatsService.readChannelMemberWithUserId(userId);
    return (userChannelList);
  }

  async readChannelListWithoutUser(userId: number) {
    return (await this.chatsService.readChannelConfigNotMember(userId));
  }

  async readChannelListWithUser(userId: number, flag: boolean) {
    if (flag)
      return (await this.chatsService.readChannelConfigMyDm(userId));
    else
      return (await this.chatsService.readChannelConfigMyChannel(userId));
  }

  async readUserSocket(id: number): Promise<UserSocket> {
    const userSocket = await this.dataSource
                  .getRepository(UserSocket).createQueryBuilder('user_socket')
                  .leftJoinAndSelect('user_socket.user', 'player')
                  .select(['user_socket.id', 'player.id', 'player.name', 'user_socket.socket'])
                  .where('user_socket.id = :id', { id: id })
                  .getOne();
    return (userSocket);
  }

  async readUserSocketWithSocket(socket: string): Promise<UserSocket> {
    const userSocket = await this.dataSource
                  .getRepository(UserSocket).createQueryBuilder('user_socket')
                  .leftJoinAndSelect('user_socket.user', 'player')
                  .select(['user_socket.id', 'player.id', 'player.name', 'user_socket.socket'])
                  .where('user_socket.socket = :socket', { socket: socket })
                  .getOne();
    return (userSocket);
  }

  async readUserSocketWithUserId(userId: number): Promise<UserSocket> {
    const userSocket = await this.dataSource
                  .getRepository(UserSocket).createQueryBuilder('user_socket')
                  .leftJoinAndSelect('user_socket.user', 'player')
                  .select(['user_socket.id', 'user_socket.socket'])
                  .where('player.id = :id', { id: userId })
                  .getOne();
    return (userSocket);
  }

  async readUserSocketWithName(name: string): Promise<UserSocket> {
    const userSocket = await this.dataSource
                  .getRepository(UserSocket).createQueryBuilder('user_socket')
                  .leftJoinAndSelect('user_socket.user', 'player')
                  .select(['user_socket.id', 'player.id', 'player.name', 'user_socket.socket'])
                  .where('player.name = :name', { name: name })
                  .getOne();
    return (userSocket);
  }

  async createUserSocket(userId: number): Promise<UserSocket> {
    const user = await this.readOnePurePlayer(userId);
    const userSocket = { user: user,  socket: null };
    const newUserSocket = this.userSocketRepository.create(userSocket);
    return (this.userSocketRepository.save(newUserSocket));
  }

  async updateUserSocket(id: number, socket: string): Promise<UserSocket> {
    await this.userSocketRepository.update(id, { socket: socket });
    return (this.readUserSocket(id));
  }

  async deleteUserSocket(id: number): Promise<void> {
    this.userSocketRepository.delete(id);
  }

  async createUserAuth(userId: number): Promise<UserAuth> {
    const userAuth = { userId: userId, refreshToken: null, twoFactorAuthSecret: null };
    const newUserAuth = this.userAuthRepository.create(userAuth);
    return (this.userAuthRepository.save(newUserAuth));
  }

  async updateRefreshToken(refreshToken: string, userId: number): Promise<UserAuth> {
    let hashToken = null;
    if (refreshToken)
      hashToken = await hash(refreshToken, 10);
    this.userAuthRepository.update(userId, { refreshToken: hashToken });
    return (this.readUserAuth(userId));
  }

  async updateTwoFactorAuthSecret(secret: string, userId: number): Promise<UserAuth> {
    this.userAuthRepository.update(userId, { twoFactorAuthSecret: secret });
    return (this.readUserAuth(userId));
  }

  async readUserAuth(userId: number): Promise<UserAuth> {
    return (this.userAuthRepository.findOne({ where: { userId } }));
  }

  async deleteUserToken(userId: number): Promise<void> {
    this.userAuthRepository.delete(userId);
  }

  async compareRefreshToken(refreshToken: string, id: number) {
    const userToken = await this.readUserAuth(id);
    const isEqure = await compare(refreshToken, userToken.refreshToken);
    if (isEqure)
      return (this.readOnePurePlayer(id));
  }
}
