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

}
