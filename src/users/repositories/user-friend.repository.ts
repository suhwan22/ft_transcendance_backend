import { Injectable } from "@nestjs/common";
import { DataSource, InsertResult, Repository } from "typeorm";
import { Player } from "../entities/player.entity"
import { UserFriend } from "../entities/user-friend.entity";
import { UserFriendRequestDto } from "../dtos/user-friend.request.dto";


@Injectable()
export class UserFriendRepository extends Repository<UserFriend> {
  constructor(private dataSource: DataSource) {
    super(UserFriend, dataSource.createEntityManager());
  }

  /* FRIEND_LIST Table CRUD */

  /* [C] friend 생성 */
  async createFriend(friendRequestDto: Partial<UserFriendRequestDto>): Promise<InsertResult> {
    let insertResult;
    if (typeof (friendRequestDto.friend) === 'number') {
        insertResult = await this.createQueryBuilder('channel_member')
        .insert()
        .into(UserFriend)
        .values({ user: friendRequestDto.user, friend: () => `${friendRequestDto.friend}` })
        .execute();
    }
    else
      return null;
    return (insertResult);
  }

  /* [R] 특정 id 의 friend_list 조회 */
  async readFriendList(userId: number): Promise<UserFriend[]> {
    const friendList = await this
      .createQueryBuilder('friend_list')
      .leftJoinAndSelect('friend_list.friend', 'friend')
      .select(['friend_list.id', 'friend.id', 'friend.name', 'friend.avatar', 'friend.status'])
      .where('friend_list.user = :id', { id: userId })
      .getMany();
    return (friendList)
  }

  /* [R] 특정 id 의 특정 friend 조회 */
  async readFriendWithFriendId(user: number, friend: number): Promise<UserFriend> {
    const userFriend = await this
      .createQueryBuilder('friend_list')
      .leftJoinAndSelect('friend_list.friend', 'friend')
      .select(['friend_list.id', 'friend.id', 'friend.name', 'friend.avatar', 'friend.status'])
      .where('friend_list.user = :user', { user: user })
      .andWhere('friend_list.friend = :friend', { friend: friend })
      .getOne();
    return (userFriend);
  }


  /* [U] id 의 friend 수정 */
  async updateFriendInfo(id: number, friend: Partial<UserFriend>): Promise<UserFriend> {
    await this.update(id, friend);
    return (this.findOne({ where: { id } }));
  }

  /* [D] user 의 friend 제거 */
  async deleteFriendInfo(user: number, friend: number): Promise<void> {
    const deleteResult = await this.dataSource
      .getRepository(UserFriend).createQueryBuilder('friend_list')
      .delete()
      .where('user_id = :user and friend_id = :friend', { user: user, friend: friend })
      .execute();
  }

  /* [D] user 의 friend_list 제거 */
  async deleteFriendList(user: number): Promise<void> {
    const deleteResult = await this.dataSource
      .getRepository(UserFriend).createQueryBuilder('friend_list')
      .delete()
      .where('user_id = :user', { user: user })
      .execute();
  }
}