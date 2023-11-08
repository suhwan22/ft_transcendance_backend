import { Injectable } from "@nestjs/common";
import { ChatsService } from "./chats.service";


@Injectable()
export class ChatsSocketService {
  constructor(
    private readonly usersService: ChatsService,
  ) {}
}