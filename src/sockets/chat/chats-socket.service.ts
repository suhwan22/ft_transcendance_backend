import { Injectable } from "@nestjs/common";
import { ChatsService } from "../../chats/chats.service";
import { Server, Socket } from 'socket.io';
import { ChannelConfig } from "../../chats/entities/channel-config.entity";
import { UsersService } from "src/users/users.service";
import { ChatMute } from "../../chats/entities/chat-mute.entity";
import { FriendRequest } from "src/users/entities/friend-request.entity";
import { Player } from "src/users/entities/player.entity";
import { GameRequest } from "src/games/entities/game-request";
import { STATUS } from "../sockets.type";


@Injectable()
export class ChatsSocketService {
  private chatRoomList: Record<string, chatRoomListDTO>;

  constructor(
    private readonly chatsService: ChatsService,
    private readonly usersService: UsersService
  ) {
    this.chatRoomList = {
      'room:lobby': {
        roomId: 'room:lobby',
        chat: null,
      },
    };
  }

  getNotice(message: string, code: number, status: number) {
    return ({
      code: code,
      content: message,
      status: status,
      date: new Date(),
    });
  }

  async sendMessage(client: Socket, message) {
    let log;
    const chatMute = await this.chatsService.readChatMute(message.channelId, message.userId);
    if (chatMute && !this.checkMuteTime(chatMute)) {
      log = this.getNotice('채팅 금지로 인하여 일정 시간동안 채팅이 금지됩니다.', 35, client.data.status);
      client.emit('NOTICE', log);
      return;
    }
    else if (chatMute && this.checkMuteTime(chatMute))
      this.chatsService.deleteMuteInfo(chatMute.id);
    const chatLogRequest = {
      channelId: message.channelId,
      userId: message.userId,
      content: message.content
    }
    log = await this.chatsService.createChatLogInfo(chatLogRequest);
    delete log.channel;
    client.to(client.data.roomId).emit('MSG', log);  //전체에게 방송함
    return (log);
  }

  async createChatRoom(client: Socket, channelId: number, userId: number) {
    const chat = await this.chatsService.readOnePureChannelConfig(channelId);
    const roomId = channelId.toString();
    const player = await this.usersService.readOnePurePlayer(userId);

    this.chatRoomList[roomId] = {
      roomId,
      chat,
    };
  }

  async enterChatRoom(client: Socket, channelId: number, userId: number) {
    const roomId = channelId.toString();
    const player = await this.usersService.readOnePurePlayer(userId);

    const channelMemberRequest = {
      channelId: channelId,
      userId: userId,
      op: false
    }
    await this.chatsService.createChannelMember(channelMemberRequest);

    // room이 없는 경우 새로 만듬
    if (!this.getChatRoom(roomId)) {
      await this.createChatRoom(client, channelId, userId);
    }

    this.connectChatRoom(client, channelId, userId);
    const { chat } = this.getChatRoom(roomId);

    const log = this.getNotice(`${player.name}님이 ${chat.title}방에 입장하셨습니다.`, 5, client.data.status);
    client.to(roomId).emit('NOTICE', log);
  }

  async createAndEnterChatRoom(client: Socket, channelId: number, userId: number) {
    const roomId = channelId.toString();
    const player = await this.usersService.readOnePurePlayer(userId);

    const channelMemberRequest = {
      channelId: channelId,
      userId: userId,
      op: true
    }
    const channelMember = await this.chatsService.createChannelMember(channelMemberRequest);
    await this.chatsService.updateChannelMemberOp(channelMember.id, true);

    await this.createChatRoom(client, channelId, userId);

    await this.connectChatRoom(client, channelId, userId);

    const { chat } = this.getChatRoom(roomId);

    const log = this.getNotice(`${player.name}님이 ${chat.title}방에 입장하셨습니다.`, 5, client.data.status);
    client.to(roomId).emit('NOTICE', log);
  }

  async createDMRoom(client: Socket, channelId: number, message) {
    const roomId = channelId.toString();

    const channelMemberRequest1 = {
      channelId: channelId,
      userId: message.userId,
      op: false
    }

    const channelMemberRequest2 = {
      channelId: channelId,
      userId: message.targetId,
      op: false
    }

    await this.chatsService.createChannelMember(channelMemberRequest1);
    await this.chatsService.createChannelMember(channelMemberRequest2);

    await this.createChatRoom(client, channelId, message.userId);

    await this.connectChatRoom(client, channelId, message.userId);

    const log = this.getNotice(`DM with ${message.targetName}`, 42, client.data.status);
    client.to(roomId).emit('NOTICE', log);
  }

  async connectLobby(client: Socket, userId: number) {
    client.leave(client.data.roomId);
    client.data.roomId = 'room:lobby';
    client.rooms.clear();
    client.rooms.add('room:lobby');
    client.join('room:lobby');
  }

  async connectChatRoom(client: Socket, channelId: number, userId: number) {
    console.log("join channel id: ", channelId);
    const roomId = channelId.toString();
    client.leave(client.data.roomId);
    client.data.roomId = roomId;
    client.rooms.clear();
    client.rooms.add(roomId);
    client.join(roomId);

    // 들어가는 방 채널 멤버들 전달
    await this.sendChannelMember(client, channelId);

    // 채널 리스트 다시 전달
    await this.sendChannelList(client, userId);

    // 최근 chat_log 50개 전달
    let log = await this.chatsService.readLatestChatLog(channelId);
    client.emit('LOADCHAT', log);
  }

  async exitChatRoom(client: Socket, channelId: number, userId: number) {
    const player = await this.usersService.readOnePurePlayer(userId);
    const roomId = channelId.toString();

    client.data.roomId = 'room:lobby';
    client.leave(roomId);
    client.rooms.clear();
    client.rooms.add('room:lobby');
    client.join('room:lobby');

    const log = this.getNotice(`${player.name}님이 퇴장하셨습니다.`, 6, client.data.status);
    client.broadcast.to(roomId).emit('NOTICE', log);

    // 채널 리스트 다시 전달
    await this.sendChannelList(client, userId);

    // roomId에 있는 사람들에게 바뀐 채널 멤버 전달
    await this.sendChannelMember(client, channelId);
  }

  async kickChatRoom(client: Socket, channelId: number, userId: number) {
    const player = await this.usersService.readOnePurePlayer(userId);
    const channel = await this.chatsService.readOnePureChannelConfig(channelId);
    const roomId = channelId.toString();

    client.data.roomId = 'room:lobby';
    client.leave(roomId);
    client.rooms.clear();
    client.rooms.add('room:lobby');
    client.join('room:lobby');

    const logChannel = this.getNotice(`${player.name}님이 강퇴 되었습니다`, 7, client.data.status);
    client.broadcast.to(roomId).emit('NOTICE', logChannel);

    const logTarget = this.getNotice(`${channel.title}에서 강퇴 되었습니다`, 37, client.data.status);
    client.emit('NOTICE', logTarget);

    // 채널 리스트 다시 전달
    await this.sendChannelList(client, userId);

    // roomId에 있는 사람들에게 바뀐 채널 멤버 전달
    await this.sendChannelMember(client, channelId);
  }

  getChatRoom(roomId: string): chatRoomListDTO {
    return this.chatRoomList[roomId];
  }

  getChatRoomList(): Record<string, chatRoomListDTO> {
    return this.chatRoomList;
  }

  deleteChatRoom(roomId: string) {
    delete this.chatRoomList[roomId];
  }

  async isOpUser(channelId: number, userId: number) {
    const channelMember = await this.chatsService.readChannelMember(channelId, userId);
    return (channelMember.op);
  }

  // op
  async commandOp(client: Socket, channelId: number, target: string) {
    try {
      const update = await this.chatsService.updateChannelOpWithName(channelId, target, true);
      if (update.affected === 0) {
        return (this.getNotice("채널 맴버가 아닙니다.", 9, client.data.status));
      }
      return (this.getNotice(`"${target}"님에게 OP 권한을 부여 하였습니다.`, 200, client.data.status));
    } catch (e) {
      return (this.getNotice("DB error", 200, client.data.status));
    }
  }

  // kick
  async commandKick(client: Socket, channelId: number, targetId: number, targetClient: Socket) {
    try {
      const roomId = channelId.toString();
      // 타겟이 그 채팅방을 보고 있는 경우
      if (targetClient) {
        if (targetClient.data.roomId === roomId) {
          targetClient.emit("KICK", targetId);
          return (this.getNotice("성공적으로 강퇴하였습니다.", 10, client.data.status));
        }
      }
      // 타겟이 오프라인 이거나 온라인인데 그 채팅방을 안보고 있는 경우
      const deleteResult = await this.chatsService.deleteChannelMemberWithUserId(channelId, targetId);
      if (deleteResult.affected === 0) {
        return (this.getNotice("채널 맴버가 아닙니다.", 9, client.data.status));
      }
      await this.sendChannelMember(client, channelId);
      if (targetClient)
        await this.sendChannelList(targetClient, targetId);
      return (this.getNotice("성공적으로 강퇴하였습니다.", 10, client.data.status));
    } catch (e) {
      return (this.getNotice("DB Error", 200, client.data.status));
    }
  }

  async sendChannelMember(client: Socket, channelId: number) {
    const roomId = channelId.toString();
    const updateMembers = await this.chatsService.readOneChannelMember(channelId);
    client.to(roomId).emit('INFO_CH_MEMBER', updateMembers);
  }

  async sendChannelList(client: Socket, userId: number) {
    const otherList = await this.usersService.readChannelListWithoutUser(userId);
    const meList = await this.usersService.readChannelListWithUser(userId, false);
    const dmList = await this.usersService.readChannelListWithUser(userId, true);
    const channelList = { other: otherList, me: meList, dm: dmList };
    client.emit('INFO_CH_LIST', channelList);
  }

  // ban
  async commandBanList(client: Socket, channelId: number) {
    client.emit("BAN", await this.chatsService.readBanList(channelId));
  }

  async commandBan(client: Socket, channelId: number, targetName: string) {
    try {
      await this.chatsService.createChatBanWithName(channelId, targetName);
      return (this.getNotice('성공적으로 밴 성공하였습니다.', 13, client.data.status));
    } catch (e) {
      if (e.code === '23502')
        return (this.getNotice("존재하지 않는 유저입니다.", 11, client.data.status));
      else if (e.code === '23505')
        return (this.getNotice('이미 밴 목록에 추가된 유저입니다.', 12, client.data.status));
      return (this.getNotice("DB Error", 200, client.data.status));
    }
  }

  // unban
  async commandUnban(client: Socket, channelId: number, target: string) {
    try {
      const deleteResult = await this.chatsService.deleteChatBanWithName(target);
      if (deleteResult.affected === 0)
        return (this.getNotice('밴 목록에 해당하는 유저가 없습니다.', 14, client.data.status));
      return (this.getNotice('밴 목록에서 제거하였습니다.', 15, client.data.status));
    }
    catch (e) {
      return (this.getNotice("DB Error", 200, client.data.status));
    }
  }

  // block
  async commandBlock(client: Socket, channelId: number, userId: number, targetName: string) {
    try {
      const userBlocks = await this.usersService.readBlockList(userId);
      if (targetName === '') {
        client.emit("BLOCK", userBlocks);
        return (null);
      }
      await this.usersService.createBlockInfoWithTarget(userId, targetName);
      return (this.getNotice('차단 목록에 추가하였습니다.', 17, client.data.status));
    } catch (e) {
      if (e.code === '23502')
        return (this.getNotice("존재하지 않는 유저입니다.", 11, client.data.status));
      else if (e.code === '23505')
        return (this.getNotice("이미 차단 목록에 추가된 유저입니다.", 16, client.data.status));
      return (this.getNotice("DB Error", 200, client.data.status));
    }
  }
  // unblock
  async commandUnblock(client: Socket, channelId: number, userId: number, targetName: string) {
    try {
      const deleteResult = await this.usersService.deleteUserBlockWithName(targetName);
      if (deleteResult.affected === 0)
        return (this.getNotice("차단 목록에 해당하는 유저가 없습니다.", 18, client.data.status));
      return (this.getNotice("차단 목록에서 제거하였습니다.", 19, client.data.status));
    }
    catch (e) {
      return (this.getNotice("DB Error", 200, client.data.status));
    }
  }

  checkMuteTime(chatMute: ChatMute) {
    const date = chatMute.date.getTime();
    const now = new Date().getTime();
    if (((now - date) / 1000) > 60) {
      return (true);
    }
    return (false);
  }

  // mute
  async commandMute(client: Socket, channelId: number, target: string) {
    try {
      await this.chatsService.createChatMuteWithName(channelId, target);
      return (this.getNotice(`${target}의 채팅을 1분간 금지합니다.`, 21, client.data.status));
    } catch (e) {
      if (e.code === '23502')
        return (this.getNotice("존재하지 않는 유저입니다.", 11, client.data.status));
      else if (e.code === '23505') {
        await this.chatsService.updateTimeChatMuteWithName(channelId, target);
        return (this.getNotice(`${target}의 채팅을 1분간 금지합니다.`, 21, client.data.status));
      }
      return (this.getNotice("DB Error", 200, client.data.status));
    }
  }

  // password
  async commandPassword(client: Socket, channelId: number, target: string) {
    try {
      let password = null;
      if (target !== undefined)
        password = target;
      await this.chatsService.updateChannelPassword(channelId, password);
      return (this.getNotice("비밀번호가 성공적으로 변경되었습니다.", 22, client.data.status));
    } catch (e) {
      return (this.getNotice("DB Error", 200, client.data.status));
    }
  }

  async sendUpdateToChannelMember(server: Server, userId: number) {
    const userChannelList = await this.chatsService.readChannelMemberWithUserId(userId);
    for (let i = 0; i < userChannelList.length; i++) {
      const roomId = userChannelList[i].channel.id.toString();
      const channelMember = await this.chatsService.readOneChannelMember(userChannelList[i].channel.id);
      server.to(roomId).emit('INFO_CH_MEMBER', channelMember);
    }
  }

  async inviteGame(client: Socket, targetClient: Socket, userId: number, target: Player) {
    const user = await this.usersService.readOnePurePlayer(userId);
    if (!user) {
      const msg = this.getNotice("존재하지 않는 유저입니다.", 11, client.data.status);
      client.emit("NOTICE", msg);
      return;
    }
    const gameRequest = new GameRequest(target, user);
    targetClient.emit("INVITE", gameRequest);
  }

  async acceptGame(client: Socket, targetClient: Socket, data) {
    const msg = this.getNotice("게임이 성사되었습니다.", 26, client.data.status);

    client.emit("NOTICE", msg);
    targetClient.emit("NOTICE", msg);

    const roomId = client.id + targetClient.id;

    client.emit("JOIN_GAME", { roomId, gameRequest: data });
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
      targetClient.emit("GET_FRIEND_REQUEST", friendRequests);
      targetClient.emit("REQUEST_FRIEND", friendRequest);
    }
  }

  async acceptFriend(client: Socket, targetClient: Socket, friendRequest: Partial<FriendRequest>, target: Player) {
    try {
      const user = await this.usersService.readOnePurePlayer(friendRequest.recv.id);
      await this.usersService.createFriendWithPlayer(user.id, target);
      await this.usersService.createFriendWithPlayer(target.id, user);
      await this.usersService.deleteFriendRequest(friendRequest.id);
      if (target.status >= STATUS.LOBBY && target.status <= STATUS.RANK)
        this.sendFriendList(targetClient, target.id);
      if (user.status >= STATUS.LOBBY && user.status <= STATUS.RANK)
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
}

export class chatRoomListDTO {
  roomId: string;
  chat: ChannelConfig
}