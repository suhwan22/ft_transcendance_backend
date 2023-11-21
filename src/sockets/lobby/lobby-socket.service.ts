import { Injectable } from '@nestjs/common';
import { Socket } from 'socket.io';
import { GameRequest } from 'src/games/entities/game-request';
import { FriendRequest } from 'src/users/entities/friend-request.entity';
import { Player } from 'src/users/entities/player.entity';
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

  async invateGame(targetClient: Socket, userId: number, target: Player) {
    const user = await this.usersService.readOnePurePlayer(userId);
    const gameRequest = new GameRequest(target, user);
    targetClient.emit("INVATE", gameRequest);
  }

  async acceptGame(client: Socket, targetClient: Socket, gameRequest: Partial<GameRequest>, target: Player) {
    const user = await this.usersService.readOnePurePlayer(gameRequest.recv.id);
    const msg = this.getInfoMessage("요청을 수락 하였습니다.");
    client.emit("NOTICE", msg);
    // 2명 게임 소캣 열도록 유도?
    // 그리고 정해진 두명을 게임 소켓내 같은 룸으로 join 시켜야함
  }

  async refuseGame(client: Socket, targetClient: Socket, gameRequest: Partial<GameRequest>, target: Player) {
    client.emit("NOTICE", this.getInfoMessage("요청을 거절 하였습니다."));
    if (target.status === 0 || target.status === 1)
      targetClient.emit("NOTICE", this.getInfoMessage(gameRequest.recv.name + " 님이 게임초대를 거절 하였습니다."));
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

  async requestFriend(client: Socket, targetClient: Socket, userId: number, target: Player) {
    const request = await this.usersService.readRecvAndSendFriendRequest(target.id, userId);
    if (request) {
      const msg = this.getInfoMessage("이미 친구 요청한 유저입니다.");
      client.emit("NOTICE", msg);
      return;
    }
    const frined = await this.usersService.readFriendWithFriendId(userId, target.id);
    if (frined) {
      const msg = this.getInfoMessage("이미 친구 관계입니다.");
      client.emit("NOTICE", msg);
      return;
    }
    const otherRequest = await this.usersService.readRecvAndSendFriendRequest(userId, target.id);
    if (otherRequest) {
      const user = await this.usersService.readOnePurePlayer(userId);
      await this.usersService.createFriendWithPlayer(user.id, target);
      await this.usersService.createFriendWithPlayer(target.id, user);
      this.usersService.deleteFriendRequest(otherRequest.id);
      if (target.status === 0)
        this.sendFriendList(targetClient, target.id);
      if (user.status === 0)
        this.sendFriendList(client, userId);
      const msg = this.getInfoMessage(target.name + " 님과 친구가 되었습니다.");
      client.emit("NOTICE", msg);
      if (target.status === 0 || target.status === 1) {
        const msg = this.getInfoMessage(user.name + " 님과 친구가 되었습니다.");
        targetClient.emit("NOTICE", msg);
      }
    }
    else {
      const user = await this.usersService.readOnePurePlayer(userId);
      const friendRequest = await this.usersService.createFriendRequestWithPlayer(target, user);
      const msg = this.getInfoMessage(target.name + " 님에게 친구 요청하였습니다.");
      client.emit("NOTICE", msg);
      if (targetClient)
        targetClient.emit("REQUEST_FRIEND", friendRequest);
    }
  }

  async acceptFriend(client: Socket, targetClient: Socket, friendRequest: Partial<FriendRequest>, target: Player) {
    try {
      const user = await this.usersService.readOnePurePlayer(friendRequest.recv.id);
      await this.usersService.createFriendWithPlayer(user.id, target);
      await this.usersService.createFriendWithPlayer(target.id, user);
      this.usersService.deleteFriendRequest(friendRequest.id);
      if (target.status === 0)
        this.sendFriendList(targetClient, target.id);
      if (user.status === 0)
        this.sendFriendList(client, user.id);
      const msg = this.getInfoMessage(target.name + " 님과 친구가 되었습니다.");
      client.emit("NOTICE", msg);
      if (target.status === 0 || target.status === 1) {
        const msg = this.getInfoMessage(user.name + " 님과 친구가 되었습니다.");
        targetClient.emit("NOTICE", msg);
      }
    }
    catch (e) {
      const msg = this.getInfoMessage("Server Error: DB error");
      client.emit("NOTICE", msg);
    }
  }

  async refuseFriend(client: Socket, targetClient: Socket, friendRequest: Partial<FriendRequest>, target: Player) {
    try {
      this.usersService.deleteFriendRequest(friendRequest.id);
      const msg = this.getInfoMessage("요청을 거절 하였습니다.");
      client.emit("NOTICE", msg);
      if (target.status === 0 || target.status === 1)
        targetClient.emit("NOTICE", this.getInfoMessage(friendRequest.recv.name + " 님이 친구요청을 거절 하였습니다."));
    }
    catch (e) {
      const msg = this.getInfoMessage("Server Error: DB error");
      client.emit("NOTICE", msg);
    }
  }
}
