import { Injectable } from "@nestjs/common";
import { ChatsService } from "./chats.service";
import { Server, Socket } from 'socket.io';
import { ChannelConfig } from "./entities/channel-config.entity";
import { UsersService } from "src/users/users.service";
import { ChatMute } from "./entities/chat-mute.entity";
import { ClientSocket } from "./chats.gateway";
import { FriendRequest } from "src/users/entities/friend-request.entity";
import { Player } from "src/users/entities/player.entity";
import { GameRequest } from "src/games/entities/game-request";


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

  getNotice(message: string, code: number) {
    return ({
      code: code,
      content: message,
      date: new Date(),
    });
  }

  async sendMessage(client: Socket, message) {
    let log;
    const chatMute = await this.chatsService.readChatMute(message.channelId, message.userId);
    if (chatMute && !this.checkMuteTime(chatMute)) {
      log = this.getNotice('채팅 금지로 인하여 일정 시간동안 채팅이 금지됩니다.', 35);
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

    // memlist 동기화 하는거 추가 해야함
    // channellist 동기화 하는거 추가 해야함
    
    
    const log = this.getNotice(`${player.name}님이 ${chat.title}방에 입장하셨습니다.`, 5);
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
    await this.chatsService.createChannelMember(channelMemberRequest);

    this.createChatRoom(client, channelId, userId);

    this.connectChatRoom(client, channelId, userId);

    const { chat } = this.getChatRoom(roomId);
    
    const log = this.getNotice(`${player.name}님이 ${chat.title}방에 입장하셨습니다.`, 5);
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

  async exitChatRoom(client: Socket, channelId: number, userId: number, word: string, code: number) {
    const player = await this.usersService.readOnePurePlayer(userId);
    const roomId = channelId.toString();

    const log = this.getNotice(`${player.name}님이 ${word}`, code);
    client.to(roomId).emit('NOTICE', log);

    client.data.roomId = 'room:lobby';
    client.leave(roomId);
    client.rooms.clear();
    client.rooms.add('room:lobby');
    client.join('room:lobby');

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
      const user = await this.usersService.readOnePurePlayerWithName(target);
      if (!user)
        return (this.getNotice("존재하지 않는 유저입니다.", 11));
      const channelMember = await this.chatsService.readChannelMember(channelId, user.id);
      if (!channelMember)
        return (this.getNotice("채널 맴버가 아닙니다.", 9));
      this.chatsService.updateChannelMemberOp(channelMember.id, false);
      return (this.getNotice(`"${target}"님에게 OP 권한을 부여 하였습니다.`, 200));
    } catch (e) {
      return (this.getNotice("DB error", 200));
    }
  }

  // kick
  async commandKick(client: Socket, channelId: number, target: string, targetId: number, targetClient: Socket) {
    try {
      const roomId = channelId.toString();
      const targetUser = await this.usersService.readOnePurePlayerWithName(target);
      // 타겟이 소켓 연결 되어 있지 않을 경우
      if (!targetClient) {
        const channelMembers = await this.chatsService.readOneChannelMember(channelId);
        const member = channelMembers.find((member) => member.user.name == target);
        if (!member)
          return (this.getNotice("채널 맴버가 아닙니다.", 9));
        await this.chatsService.deleteChannelMember(member.id);
        this.sendChannelMember(client, channelId);
      }
      else {
        // 타겟이 현재 채팅방일 경우
        if (targetClient.data.roomId === roomId) 
          targetClient.emit("KICK", targetUser.id);
        else {
          const channelMembers = await this.chatsService.readOneChannelMember(channelId);
          const member = channelMembers.find((member) => member.user.name == target);
          if (!member)
            return (this.getNotice("채널 맴버가 아닙니다.", 9));
          await this.chatsService.deleteChannelMember(member.id);
          this.sendChannelList(targetClient, targetUser.id);
          this.sendChannelMember(client, channelId);
        }
      }
      return (this.getNotice("성공적으로 강퇴하였습니다.", 10));
    } catch (e) {
      return (this.getNotice("DB Error", 200));
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

  async commandBan(client: Socket, channelId: number, target: string, targetId: number, tagetSocket: Socket) {
    try {
      const user = await this.usersService.readOnePurePlayerWithName(target);
      if (!user)
        return (this.getNotice("존재하지 않는 유저입니다.", 11));
      const chatBan = await this.chatsService.readChatBan(channelId, user.id);
      if (chatBan)
        return (this.getNotice('이미 밴 목록에 추가된 유저입니다.', 12) );
      const chatBanRequest = {
        channelId: channelId,
        userId: user.id
      }
      this.chatsService.createBanInfo(chatBanRequest);

      // 이미 채팅방에 있으면 강퇴
      const channelMembers = await this.chatsService.readOneChannelMember(channelId);
      const member = channelMembers.find((member) => member.user.name == target);
      if (member) {
        this.commandKick(client, channelId, target, targetId, tagetSocket);
      }
      return (this.getNotice('성공적으로 밴 성공하였습니다.', 13) );
    } catch (e) {
      return (this.getNotice("DB Error", 200));
    }
  }

  // unban
  async commandUnban(client: Socket, channelId: number, target: string) {
    try {
      const user = await this.usersService.readOnePurePlayerWithName(target);
      if (!user)
      return (this.getNotice("존재하지 않는 유저입니다.", 11));
      const chatBan = await this.chatsService.readChatBan(channelId, user.id);
      if (!chatBan)
        return (this.getNotice('밴 목록에 해당하는 유저가 없습니다.', 14) );
      this.chatsService.deleteBanInfo(chatBan.id);
      return (this.getNotice('밴 목록에서 제거하였습니다.', 15) );
    }
    catch (e) {
      return (this.getNotice("DB Error", 200));
    }
  }

  // block
  async commandBlock(client: Socket, channelId: number, userId: number, target: string) {
    try {
      const userBlocks = await this.usersService.readBlockList(userId);
      if (target === '') {
        client.emit("BLOCK", userBlocks);
        return (null);
      }
      const user = await this.usersService.readOnePurePlayerWithName(target);
      if (!user)
        return (this.getNotice("존재하지 않는 유저입니다.", 11));
      const blocked = userBlocks.find((e) => e.target.name === target);
      if (blocked)
        return (this.getNotice("이미 차단 목록에 추가된 유저입니다.", 16));

      const userBlockRequest = {
        user: userId,
        target: user.id
      }
      this.usersService.createBlockInfo(userBlockRequest);
      return (this.getNotice('차단 목록에 추가하였습니다.', 17));
    } catch (e) {
      return (this.getNotice("DB Error", 200));
    }
  }
  // unblock
  async commandUnblock(client: Socket, channelId: number, userId: number, target: string) {
    try {
      const userBlocks = await this.usersService.readBlockList(userId);
      const user = await this.usersService.readOnePurePlayerWithName(target);
      if (!user)
        return (this.getNotice("존재하지 않는 유저입니다.", 11));
      const blocked = userBlocks.find((e) => e.target.name === target);
      if (!blocked)
        return (this.getNotice("차단 목록에 해당하는 유저가 없습니다.", 18));
      this.usersService.deleteBlockInfo(blocked.id);
      return (this.getNotice("차단 목록에서 제거하였습니다.", 19));
    }
    catch (e) {
      return (this.getNotice("DB Error", 200));
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
      const user = await this.usersService.readOnePurePlayerWithName(target);
      if (!user)
        return (this.getNotice("존재하지 않는 유저입니다.", 11));
      const chatMute = await this.chatsService.readChatMute(channelId, user.id);
      const chatMuteRequest = {
        channelId: channelId,
        userId: user.id
      }
      if (chatMute) {
        if (this.checkMuteTime(chatMute)) {
          this.chatsService.deleteMuteInfo(chatMute.id);
          this.chatsService.createMuteInfo(chatMuteRequest);
          return (this.getNotice("해당 유저를 1분간 채팅 금지합니다.", 21));
        }
        return (this.getNotice("이미 채팅 금지된 유저입니다.", 20));
      }
      this.chatsService.createMuteInfo(chatMuteRequest);
      return (this.getNotice("해당 유저를 1분간 채팅 금지합니다.", 21));
    } catch (e) {
      return (this.getNotice("DB Error", 200));
    }
  }

  // password
  async commandPassword(client: Socket, channelId: number, target: string) {
    try {
      let password = null;
      if (target !== undefined)
        password = target;
      this.chatsService.updateChannelPassword(channelId, password);
      return (this.getNotice("비밀번호가 성공적으로 변경되었습니다.", 22));
    } catch (e) {
      return (this.getNotice("DB Error", 200));
    }
  }

  async checkOpUser(client: Socket, message) {
    const { roomId } = client.data;
    const channelId = parseInt(roomId);
    const channelMember = await this.chatsService.readChannelMember(channelId, message.userId);

    if (!channelMember.op) {
      const msg = this.getNotice('OP 권한이 필요합니다.', 8);
      client.emit('MSG', msg);
    }
    return (channelMember.op);
  }

  async sendUpdateToChannelMember(server: Server, userId: number) {
    const userChannelList = await this.chatsService.readUserChannelMemberWithUserId(userId);
    for (let i = 0; i < userChannelList.length; i++) {
      const roomId = userChannelList[i].channel.id.toString();
      const channelMember = await this.chatsService.readOneChannelMember(userChannelList[i].channel.id);
      server.to(roomId).emit('INFO_CH_MEMBER', channelMember);
    }
  }

  async invateGame(targetClient: Socket, userId: number, target: Player) {
    const user = await this.usersService.readOnePurePlayer(userId);
    const gameRequest = new GameRequest(target, user);
    targetClient.emit("INVATE", gameRequest);
  }

  async acceptGame(client: Socket, targetClient: Socket, gameRequest: Partial<GameRequest>, target: Player) {
    const user = await this.usersService.readOnePurePlayer(gameRequest.recv.id);
    const msg = this.getNotice("요청을 수락 하였습니다.", 26);
    client.emit("NOTICE", msg);
    // 2명 게임 소캣 열도록 유도?
    // 그리고 정해진 두명을 게임 소켓내 같은 룸으로 join 시켜야함
  }

  async refuseGame(client: Socket, targetClient: Socket, gameRequest: Partial<GameRequest>, target: Player) {
    client.emit("NOTICE", this.getNotice("요청을 거절 하였습니다.", 27));
    if (target.status === 0 || target.status === 1)
      targetClient.emit("NOTICE", this.getNotice(gameRequest.recv.name + " 님이 게임초대를 거절 하였습니다.", 28));
  }

  async sendFriendList(client: Socket, userId: number) {
    const friendList = await this.usersService.readFriendList(userId);
    client.emit('INFO_FRIENDS', friendList);
  }

  async requestFriend(client: Socket, targetClient: Socket, userId: number, target: Player) {
    const request = await this.usersService.readRecvAndSendFriendRequest(target.id, userId);
    if (request) {
      const msg = this.getNotice("이미 친구 요청한 유저입니다.", 29);
      client.emit("NOTICE", msg);
      return;
    }
    const frined = await this.usersService.readFriendWithFriendId(userId, target.id);
    if (frined) {
      const msg = this.getNotice("이미 친구 관계입니다.", 30);
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
      const msg = this.getNotice(target.name + " 님과 친구가 되었습니다.", 31);
      client.emit("NOTICE", msg);
      if (target.status === 0 || target.status === 1) {
        const msg = this.getNotice(target.name + " 님과 친구가 되었습니다.", 31);
        targetClient.emit("NOTICE", msg);
      }
    }
    else {
      const user = await this.usersService.readOnePurePlayer(userId);
      const friendRequest = await this.usersService.createFriendRequestWithPlayer(target, user);
      const msg = this.getNotice(target.name + " 님에게 친구 요청하였습니다.", 31);
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
        const msg = this.getNotice(target.name + " 님과 친구가 되었습니다.", 32);
      client.emit("NOTICE", msg);
      if (target.status === 0 || target.status === 1) {
        const msg = this.getNotice(target.name + " 님과 친구가 되었습니다.", 32);
        targetClient.emit("NOTICE", msg);
      }
    }
    catch (e) {
      const msg = this.getNotice("DB error", 200);
      client.emit("NOTICE", msg);
    }
  }

  async refuseFriend(client: Socket, targetClient: Socket, friendRequest: Partial<FriendRequest>, target: Player) {
    try {
      this.usersService.deleteFriendRequest(friendRequest.id);
      const msg = this.getNotice("요청을 거절 하였습니다.", 33);
      client.emit("NOTICE", msg);
      if (target.status === 0 || target.status === 1)
        targetClient.emit("NOTICE", this.getNotice(friendRequest.recv.name + " 님이 친구요청을 거절 하였습니다.", 34));
    }
    catch (e) {
      const msg = this.getNotice("DB error", 200);
      client.emit("NOTICE", msg);
    }
  }
}

export class chatRoomListDTO {
  roomId: string;
  chat: ChannelConfig
}