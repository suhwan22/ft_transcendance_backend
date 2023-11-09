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

@WebSocketGateway(3131, { cors: '*' })
export class ChatsGateway implements OnGatewayConnection, OnGatewayDisconnect {
  constructor(private readonly chatsSocketService: ChatsSocketService,
    private readonly chatsServeice: ChatsService) { }
  @WebSocketServer()
  server: Server;
  users: number = 0;

  //소켓 연결시 유저목록에 추가
  public handleConnection(client: Socket): void {
    this.users++;
    this.server.emit('users', this.users);
    console.log('connected', client.id);
    client.leave(client.id);
    client.data.roomId = `room:lobby`;
    client.join('room:lobby');
  }

  //소켓 연결 해제시 유저목록에서 제거
  public handleDisconnect(client: Socket): void {
    this.users--;  //사용자 감소
    this.server.emit('users', this.users);
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
      return ;
    }
    const log = this.chatsSocketService.sendMessage(client, message);
    client.to(client.data.roomId).emit('sendMessage', log);  //전체에게 방송함
  }

  //채팅방 들어가기
  @SubscribeMessage('enterChatRoom')
  enterChatRoom(client: Socket, message) {
    const roomId = message.channelId;
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

    //없는 방일 경우 새로 만듬
    if (!this.chatsSocketService.getChatRoom(roomId)) {
      return this.chatsSocketService.createChatRoom(client, message.channelId, message.userId);
    }
    this.chatsSocketService.enterChatRoom(client, roomId, message.userId);
    return {
      roomId: roomId,
      chat: this.chatsSocketService.getChatRoom(roomId).chat,
    };
  }
}