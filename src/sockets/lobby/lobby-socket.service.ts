import { Injectable } from '@nestjs/common';
import { Socket } from 'socket.io';
import { UsersService } from 'src/users/users.service';

@Injectable()
export class LobbySocketService {
  constructor(
    private readonly usersService: UsersService,) { }

  getInfoMessage(message: string) {
    return ({
      id: null,
      user: { id: null, name: '정보', avatar: null, status: 0, date: null },
      content: message,
      date: new Date(),
    });
  }

  async invateGame(targetClient: Socket, userId: number) {
    const user = await this.usersService.readOnePurePlayer(userId);
    targetClient.emit("INVATE", { target: user });
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
