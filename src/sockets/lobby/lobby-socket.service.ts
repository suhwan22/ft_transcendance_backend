import { Injectable } from '@nestjs/common';
import { Socket } from 'socket.io';
import { UsersService } from 'src/users/users.service';

@Injectable()
export class LobbySocketService {
  constructor(
    private readonly usersService: UsersService,) {}

  async invateGame(clinet: Socket, userId: number, target: string) {
    // target이 유효한지

    // target이 현재 초대를 받을 수 있는 상태인지 (로비, 채팅 에서만)

    // target에게 INVATE 전송
  }

  async sendFriendList(client: Socket, userId: number) {
    const friendList = await this.usersService.readFriendList(userId);
    client.emit('INFO_FRIENDS', friendList);
  }

  async sendUpdateToFriends(clients: Map<number, Socket>, userId: number) {
    const friendList = await this.usersService.readFriendList(userId);
    for (let i = 0; i < friendList.length; i++) {
      const client = clients.get(friendList[i].friend.id);
      if (client) {
        this.sendFriendList(client, friendList[i].friend.id);
      }
    }
  }

  async requestFriend(clinet: Socket, userId: number, target: string) {
  }
  async acceptFriend(clinet: Socket, userId: number, target: string) {
  }
  async refuseFriend(clinet: Socket, userId: number, target: string) {
  }
}
