import { Injectable } from "@nestjs/common";
import { DataSource, InsertResult, Repository } from "typeorm";
import { FriendRequest } from "../entities/friend-request.entity";
import { FriendRequestDto } from "../dtos/friend-request.request.dto";
import { Player } from "../entities/player.entity";

@Injectable()
export class FriendRequestRepository extends Repository<FriendRequest> {
  constructor(private dataSource: DataSource) {
    super(FriendRequest, dataSource.createEntityManager());
  }

  /* FRIEND_REQUEST Table CRUD */

  /* [C] FriendRequest 생성 */
  async createFriendRequest(request: Partial<FriendRequestDto>): Promise<InsertResult> {
    let insertResult;
    if (typeof(request.recv) === 'number' && typeof(request.send) === 'number') {
      insertResult = await this.createQueryBuilder('friend_request')
        .insert()
        .into(FriendRequest)
        .values({ recv: () => `${request.recv}`, send: () => `${request.send}` })
        .execute();
    }
    else
      return null;
    return (insertResult);
  }

  /* [C] Player 객체로 FriendRequest 생성 */
  async createFriendRequestWithPlayer(recv: Player, send: Player): Promise<FriendRequest> {
    const newRequest = { recv: recv, send: send };
    const friendRequest = this.create(newRequest);
    return (this.save(friendRequest));
  }

  /* [R] 모든 FriendRequest 조회 */
  async readAllFriendRequest(): Promise<FriendRequest[]> {
    const friendRequest = await this.find();
    return (friendRequest);
  }

  /* [R] FriendRequest id 로 조회 */
  async readOneFriendRequest(id: number): Promise<FriendRequest> {
    return (this.findOne({ where: { id } }));
  }

  /* [R] 특정 recv{id}의 FriendRequest 조회 */
  async readRecvFriendRequest(recv: number): Promise<FriendRequest[]> {
    const friendRequestList = await this.createQueryBuilder('friend_list')
      .leftJoinAndSelect('friend_list.send', 'send')
      .leftJoinAndSelect('friend_list.recv', 'recv')
      .select(['friend_list.id', 'recv.id', 'recv.name', 'send.id', 'send.name'])
      .where('recv.id = :id', { id: recv })
      .getMany();
    return (friendRequestList);
  }

  /* [R] 특정 send{id}의 FriendRequest 조회 */
  async readSendFriendRequest(send: number): Promise<FriendRequest[]> {
    const friendRequestList = await this.createQueryBuilder('friend_list')
      .leftJoinAndSelect('friend_list.send', 'send')
      .leftJoinAndSelect('friend_list.recv', 'recv')
      .select(['friend_list.id', 'recv.id', 'recv.name', 'send.id', 'send.name'])
      .where('send.id = :id', { id: send })
      .getMany();
    return (friendRequestList);
  }

  /* [R] 특정 send{id}의 recv{id} 로의 FriendRequest 조회 */
  async readRecvAndSendFriendRequest(recv:number, send: number): Promise<FriendRequest> {
    const friendRequest = await this.createQueryBuilder('friend_list')
      .leftJoinAndSelect('friend_list.send', 'send')
      .leftJoinAndSelect('friend_list.recv', 'recv')
      .select(['friend_list.id', 'recv.id', 'recv.name', 'send.id', 'send.name'])
      .where('send.id = :send', { send: send })
      .andWhere('recv.id = :recv', { recv: recv })
      .getOne();
    return (friendRequest);
  }

  /* [D] FriendRequest 제거 */
  async deleteFriendRequest(id: number): Promise<void> {
    await (this.delete(id));
  }
}