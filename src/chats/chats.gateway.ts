import {
  MessageBody,
  SubscribeMessage,
  WebSocketGateway,
  WebSocketServer,
  OnGatewayConnection,
  OnGatewayDisconnect,
} from '@nestjs/websockets';

import { Server, Socket } from 'socket.io';
import { ChatsSocketService } from './chats-socket.service';
import { ChatsService } from './chats.service';
import { UsersService } from 'src/users/users.service';

@WebSocketGateway(3131, { cors: '*' })
export class ChatsGateway implements OnGatewayConnection, OnGatewayDisconnect {
  constructor(private readonly chatsSocketService: ChatsSocketService,
    private readonly usersService: UsersService) { }
  @WebSocketServer()
  server: Server;

  //소켓 연결시 유저목록에 추가
  public handleConnection(client: Socket): void {
    client.leave(client.id);
    client.data.roomId = `room:lobby`;
    client.join('room:lobby');
    console.log('connected', client.id);
  }

  //소켓 연결 해제시 유저목록에서 제거
  public async handleDisconnect(client: Socket): Promise<void> {
    const { roomId } = client.data;
    if (
      roomId != 'room:lobby' &&
      !this.server.sockets.adapter.rooms.get(roomId)
    ) {
      this.chatsSocketService.deleteChatRoom(roomId);
      this.server.emit(
        'getChatRoomList',
        this.chatsSocketService.getChatRoomList(),
      );
    }
    console.log('disonnected', client.id);
  }

  @SubscribeMessage('sendMessage')
  async onChat(client: Socket, message) {
    if (client.data.roomId === 'room:lobby') {
      client.broadcast.emit('getMessage', {
        channelId: null,
        userId: message.userId,
        content: message.content,
      });
      return;
    }
    if (message.content.charAt(0) === '/') {
      if ((await this.chatsSocketService.checkOpUser(client, message)))
        this.chatsSocketService.execCommend(client, message);
      return;
    }
    const log = await this.chatsSocketService.sendMessage(client, message);
  }

  //채팅방 들어가기
  @SubscribeMessage('enterChatRoom')
  enterChatRoom(client: Socket, message) {
    const roomId = message.channelId;
    // private 비번 확인
    // 밴이면 못들어가
    // 맴버 조회 있으면 그대로 없으면 추가
    // ...


    //이미 접속해있는 방 일 경우 재접속 차단
    if (client.rooms.has(roomId)) {
      return;
    }
    //이전 방이 만약 나 혼자있던 방이면 제거
    if (
      client.data.roomId != 'room:lobby' &&
      this.server.sockets.adapter.rooms.get(client.data.roomId).size == 1
    ) {
      this.chatsSocketService.deleteChatRoom(client.data.roomId);
    }

    // channel 일 경우 새로 만듬
    if (!this.chatsSocketService.getChatRoom(roomId)) {
      return this.chatsSocketService.createChatRoom(client, message.channelId, message.userId);
    }
    this.chatsSocketService.enterChatRoom(client, roomId, message.userId);
    return {
      roomId: roomId,
      chat: this.chatsSocketService.getChatRoom(roomId).chat,
    };
  }

  @SubscribeMessage('REGIST')
  async registUserSocket(client: Socket, userId: number) {
    this.usersService.updateUserSocket(userId, client.id);
  }

  @SubscribeMessage('INFO_CH_LIST')
  async sendChannelList(client: Socket, userId: number) {
  }

  @SubscribeMessage('INFO_CH_MEMBER')
  async sendChannelMember(client: Socket, channelId: number) {
    //this.chatsSocketService.sendChannelMember(client,channelId);
  }

  @SubscribeMessage('MSG')
  async sendMessage(client: Socket, message) {
    await this.chatsSocketService.sendMessage(client, message);
  }

  @SubscribeMessage('JOIN')
  async joinClient(client: Socket, message) {

  }

  @SubscribeMessage('QUIT')
  async quitClient(client: Socket, message) {
    console.log('quit');
  }

  @SubscribeMessage('KICK')
  async kickClient(client: Socket, message) {
    const roomId = message.channelId.toString();
    const msg = await this.chatsSocketService.commendKick(client, message.channelId, message.target);
    console.log(msg);
    console.log(roomId);
    client.to(roomId).to(msg).emit('KICK');
  }

  @SubscribeMessage('BAN')
  async banClient(client: Socket, message) {
    const msg = await this.chatsSocketService.commendBan(client, message.channelId, message.target);
    client.emit("MSG", msg);
  }

  @SubscribeMessage('UNBAN')
  async unbanClient(client: Socket, message) {
    const msg = await this.chatsSocketService.commendUnban(client, message.channelId, message.target);
    client.emit("MSG", msg);
  }


  @SubscribeMessage('BLOCK')
  async blockClient(client: Socket, message) {
  }

  @SubscribeMessage('UNBLOCK')
  async unblockClient(client: Socket, message) {

  }

  @SubscribeMessage('MUTE')
  async muteClient(client: Socket, message) {
    const msg = await this.chatsSocketService.commendMute(client, message.channelId, message.target);
    client.emit("MSG", msg);
  }

  @SubscribeMessage('PASS')
  async updatePasswordWithChannel(client: Socket, message) {
    const msg = await this.chatsSocketService.commendPassword(client, message.channelId, message.target);
    client.emit("MSG", msg);
  }

  @SubscribeMessage('OP')
  async setOpClient(client: Socket, message) {
    const msg = await this.chatsSocketService.commendOp(client, message.channelId, message.target);
    client.emit("MSG", msg);
  }
}