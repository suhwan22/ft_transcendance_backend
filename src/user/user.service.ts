import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { FriendService } from './database/friend/friend.service';
import { BlockService } from './database/block/block.service';
import { Block } from './database/block/block.entity';
import { Friend } from './database/friend/friend.entity';

@Injectable()
export class UserService {
  constructor(
    private readonly friendService : FriendService,
    private readonly blockService : BlockService,
  ) {}

  async readFriendList(user: number): Promise<Friend[]> {
    return (this.friendService.readFriendList(user));
  }

  async createFriendInfo(friend: Friend): Promise<Friend> {
    return (this.friendService.createFriendInfo(friend));
  }

  async deleteFriendInfo(user: number, friend: number): Promise<void> {
    await this.friendService.deleteFriendInfo(user, friend);
  }

  async deleteFriendList(user: number): Promise<void> {
    await this.friendService.deleteFriendList(user);
  }

  async readBlockList(user: number): Promise<Block[]> {
    return (this.blockService.readBlockList(user));
  }

  async createBlockInfo(block: Block): Promise<Block> {
    return (this.blockService.createBlockInfo(block));
  }

  async deleteBlockInfo(user: number, target: number): Promise<void> {
    await this.blockService.deleteBlockInfo(user, target);
  }

  async deleteBlockList(user: number): Promise<void> {
    await this.blockService.deleteBlockList(user);
  }

}
