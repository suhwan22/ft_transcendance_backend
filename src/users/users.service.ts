import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { UserBlock } from './entities/user-block.entity';
import { UserFriend } from './entities/user-friend.entity';

@Injectable()
export class UsersService {
  constructor(
    @InjectRepository(UserBlock)
    private userBlockRepository: Repository<UserBlock>,
    @InjectRepository(UserFriend)
    private userFriendRepository: Repository<UserFriend>,
  ) {}


  /**
   * 
   * FRIEND_LIST Table CURD
   * 
   */

  // 유저 친구리스트 조회 메서드
  async readFriendList(user: number) : Promise<UserFriend[]> {
    return (this.userFriendRepository.find({ where: { user } }));
  }

  // 유저 친구 생성 메서드
  async createFriendInfo(friend: Partial<UserFriend>): Promise<UserFriend> {
    const newFriend = this.userFriendRepository.create(friend);
    return (this.userFriendRepository.save(newFriend));
  }

  // 유저 친구 수정 메서드
  async updateFriendInfo(id: number, friend: Partial<UserFriend>): Promise<UserFriend> {
    await this.userFriendRepository.update(id, friend);
    return (this.userFriendRepository.findOne({ where: { id } }));
  }

  // 유저 친구 제거 메서드
  async deleteFriendInfo(user: number, friend: number): Promise<void> {
    const deleteFriend = await this.userFriendRepository.findOne({ where: { user, friend} });
    if (!deleteFriend)
      return ;
    await this.userFriendRepository.remove(deleteFriend);
  }

  // 유저 전체 친구 삭제 메서드
  async deleteFriendList(user: number): Promise<void> {
    await this.userFriendRepository.delete({ user });
  }

  /**
   * 
   * BAN_LIST Table CURD
   * 
   */

  // 유저 블락리스트 조회 메서드
  async readBlockList(user: number) : Promise<UserBlock[]> {
    return (this.userBlockRepository.find({ where: { user } }));
  }

  // 유저 블락 생성 메서드
  async createBlockInfo(block: Partial<UserBlock>): Promise<UserBlock> {
      const newBlock = this.userBlockRepository.create(block);
      return (this.userBlockRepository.save(newBlock));
  }


  // 유저 블락 수정 메서드
  async updateBlockInfo(id: number, block: Partial<UserBlock>): Promise<UserBlock> {
      await this.userBlockRepository.update(id, block);
      return (this.userBlockRepository.findOne({ where: { id } }));
  }

  // 유저 블락 제거 메서드
  async deleteBlockInfo(user: number, target: number): Promise<void> {
      const deleteFriend = await this.userBlockRepository.findOne({ where: { user, target } });
      if (!deleteFriend)
          return ;
      await this.userBlockRepository.remove(deleteFriend);
  }

  // 유저 블락 전체제거 메서드
  async deleteBlockList(user: number): Promise<void> {
      await this.userBlockRepository.delete({ user });
  }

}
