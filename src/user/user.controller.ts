import { Controller, Get, Param } from '@nestjs/common';
import { UserService } from './user.service';
import { Block } from './database/block/block.entity';

@Controller('user')
export class UserController {
    constructor(private readonly userService: UserService) {}
}
