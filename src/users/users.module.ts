import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { UsersController } from './users.controller';
import { UsersService } from './users.service';
import { UserFriend } from './entities/user-friend.entity';
import { UserBlock } from './entities/user-block.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([UserFriend]),
    TypeOrmModule.forFeature([UserBlock])],
  controllers: [UsersController],
  providers: [UsersService],
})
export class UsersModule {}
