import { Injectable } from '@nestjs/common';
import { Socket } from 'socket.io';
import { GameRequest } from 'src/games/entities/game-request';
import { FriendRequest } from 'src/users/entities/friend-request.entity';
import { Player } from 'src/users/entities/player.entity';
import { UsersService } from 'src/users/users.service';
import { STATUS } from '../sockets.type';

@Injectable()
export class LobbySocketService {
  constructor(
    private readonly usersService: UsersService,) { }


  getNotice(message: string, code: number, status: number) {
    return ({
      code: code,
      content: message,
      status: status,
      date: new Date(),
    });
  }

  async inviteGame(targetClient: Socket, userId: number, target: Player) {
    const user = await this.usersService.readOnePurePlayer(userId);
    const gameRequest = new GameRequest(target, user);
    targetClient.emit("INVITE", gameRequest);
  }

  async acceptGame(client: Socket, targetClient: Socket, data) {
    const msg = this.getNotice("게임이 성사되었습니다.", 26, client.data.status);

    client.emit("NOTICE", msg);
    targetClient.emit("NOTICE", msg);

    const roomId = client.id + targetClient.id;

    client.emit("JOIN_GAME", { roomId, gameRequest: data});
    targetClient.emit("JOIN_GAME", { roomId, gameRequest: data });
  }

  async refuseGame(client: Socket, targetClient: Socket, gameRequest: Partial<GameRequest>, target: Player) {
    client.emit("NOTICE", this.getNotice("요청을 거절 하였습니다.", 27, client.data.status));
    if (target.status !== STATUS.GAME && target.status !== STATUS.OFFLINE)
      targetClient.emit("NOTICE", this.getNotice(gameRequest.recv.name + " 님이 게임초대를 거절 하였습니다.", 28, client.data.status));
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
      const msg = this.getNotice("이미 친구 요청한 유저입니다.", 29, client.data.status);
      client.emit("NOTICE", msg);
      return;
    }
    const frined = await this.usersService.readFriendWithFriendId(userId, target.id);
    if (frined) {
      const msg = this.getNotice("이미 친구 관계입니다.", 30, client.data.status);
      client.emit("NOTICE", msg);
      return;
    }
    const user = await this.usersService.readOnePurePlayer(userId);
    const friendRequest = await this.usersService.createFriendRequestWithPlayer(target, user);
    const msg = this.getNotice(target.name + " 님에게 친구 요청하였습니다.", 31, client.data.status);
    client.emit("NOTICE", msg);
    if (targetClient) {
      const friendRequests = await this.usersService.readRecvFriendRequest(client.data.userId);
      targetClient.emit("REQUEST_FRIEND", friendRequest);
      targetClient.emit("GET_FRIEND_REQUEST", friendRequests);
    }
  }

  async acceptFriend(client: Socket, targetClient: Socket, friendRequest: Partial<FriendRequest>, target: Player) {
    try {
      const user = await this.usersService.readOnePurePlayer(friendRequest.recv.id);
      await this.usersService.createFriendWithPlayer(user.id, target);
      await this.usersService.createFriendWithPlayer(target.id, user);
      await this.usersService.deleteFriendRequest(friendRequest.id);
      if (target.status === 0)
        this.sendFriendList(targetClient, target.id);
      if (user.status === 0)
        this.sendFriendList(client, user.id);
      const msg = this.getNotice(target.name + " 님과 친구가 되었습니다.", 32, client.data.status);
      client.emit("NOTICE", msg);

      const friendRequests = await this.usersService.readRecvFriendRequest(client.data.userId);
      client.emit("GET_FRIEND_REQUEST", friendRequests);
      if (target.status !== STATUS.GAME && target.status !== STATUS.OFFLINE) {
        const msg = this.getNotice(user.name + " 님과 친구가 되었습니다.", 32, client.data.status);
        targetClient.emit("NOTICE", msg);
      }
    }
    catch (e) {
      const msg = this.getNotice("DB error", 200, client.data.status);
      client.emit("NOTICE", msg);
    }
  }

  async refuseFriend(client: Socket, targetClient: Socket, friendRequest: Partial<FriendRequest>, target: Player) {
    try {
      await this.usersService.deleteFriendRequest(friendRequest.id);
      const msg = this.getNotice("요청을 거절 하였습니다.", 33, client.data.status);
      client.emit("NOTICE", msg);
      const friendRequests = await this.usersService.readRecvFriendRequest(client.data.userId);
      client.emit("GET_FRIEND_REQUEST", friendRequests);
      if (target.status !== STATUS.GAME && target.status !== STATUS.OFFLINE)
        targetClient.emit("NOTICE", this.getNotice(friendRequest.recv.name + " 님이 친구요청을 거절 하였습니다.", 34, client.data.status));
    }
    catch (e) {
      const msg = this.getNotice("DB error", 200, client.data.status);
      client.emit("NOTICE", msg);
    }
  }

  async updateProfile(client: Socket, data) {
    try {
      const userId = client.data.userId;
      await this.usersService.updatePlayer(userId, data.name, data.avatar);
      return (this.getNotice("성공적으로 변경 되었습니다.", 38, client.data.status));
    }
    catch(e) {
      if (e.code === '23505')
        return (this.getNotice('중복된 이름입니다.', 39, client.data.status));
      return (this.getNotice("DB Error", 200, client.data.status));
    }
  }
}
