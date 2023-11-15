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
import { channel } from 'diagnostics_channel';

@WebSocketGateway(3131, { cors: '*' })
export class ChatsGateway implements OnGatewayConnection, OnGatewayDisconnect {
  constructor(
    private readonly chatsSocketService: ChatsSocketService,
    private readonly chatsService: ChatsService ) { }
  @WebSocketServer()
  server: Server;

  //소켓 연결시 유저목록에 추가
  public handleConnection(client: Socket): void {
    console.log('connected', client.id);
    client.leave(client.id);
    client.data.roomId = `room:lobby`;
    client.join('room:lobby');
  }

  //소켓 연결 해제시 유저목록에서 제거
  public handleDisconnect(client: Socket): void {
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
    // 뮤트인지
    // 명령어 파싱
    if (client.data.roomId === 'room:lobby') {
      client.broadcast.emit('getMessage', {
        channelId: null,
        userId: message.userId,
        content: message.content,
      });
      return ;
    }
    const log = await this.chatsSocketService.sendMessage(client, message);
    client.to(client.data.roomId).emit('sendMessage', log);  //전체에게 방송함
  }

  //채팅방 만들면서 들어가기
  // HOST + message : {
  //   userId: number,
  //   title: string,
  //   password: string,
  //   limit: number
  // }
  @SubscribeMessage('HOST')
  async hostChatRoom(client: Socket, message) {
    let isPassword = message.password ? true : false;
    let userLimit = message.limit ? message.limit : 10;
    const channelConfigDto = {
      title: message.title,
      password: message.password,
      public: isPassword,
      limit: userLimit,
      dm: false
    }
    const newChannelConfig = await this.chatsService.createChannelConfig(channelConfigDto);
    const roomId = newChannelConfig.id;
    let log;

    this.chatsSocketService.createAndEnterChatRoom(client, roomId, message.userId);
  }

  //채팅방 들어가기
  // JOIN + message : {
  //   userId: number,
  //   channelId: number,
  //   password: string
  // }
  @SubscribeMessage('JOIN')
  async enterChatRoom(client: Socket, message) {
    const roomId = message.channelId;
    let log;

    //이미 접속해있는 방 일 경우 재접속 차단
    if (client.rooms.has(roomId)) {
      console.log('already connect room');
      //왜 이거 작동을 안해...
      return;
    }
    console.log('in1?');

    // 맴버 조회 있으면 그냥 접속
    const isMember = await this.chatsService.readMemberInChannel(message.channelId, message.userId);
    if (isMember) {
      console.log(isMember)
      //이전 방이 만약 나 혼자있던 방이면 제거
      if (client.data.roomId != 'room:lobby' && this.server.sockets.adapter.rooms.get(client.data.roomId).size == 1) {
       this.chatsSocketService.deleteChatRoom(client.data.roomId);
       //이것도 작동 안함...
       console.log('delete room');
      }
      this.chatsSocketService.connectChatRoom(client, message.channelId, message.userId);
      return;
    }

    //ban list 확인
    const banUser = await this.chatsService.readBanUser(message.channelId, message.userId);
    if (banUser) {
      log = '해당 channel의 ban list에 등록 되어있어 입장이 불가합니다.';
      client.emit('JOIN', log);
      return;
    }

    // 비번 확인
    const channel = await this.chatsService.readOneChannelConfig(message.channelId);
    if (!channel.public === false && !this.chatsService.comparePassword(message.password, message.channelId)) {
      log = '비밀번호가 일치하지 않습니다.';
      client.emit('JOIN', log);
      return;
    }

    //인원 수 확인
    const current = await this.chatsService.readOnePureChannelMember(message.channelId);
    if (channel.limit === current.length) {
      log = '방이 가득 찼습니다.';
      client.emit('JOIN', log);
      return;
    }

    //이전 방이 만약 나 혼자있던 방이면 제거
    if (client.data.roomId != 'room:lobby' && this.server.sockets.adapter.rooms.get(client.data.roomId).size == 1) {
      this.chatsSocketService.deleteChatRoom(client.data.roomId);
    }

    this.chatsSocketService.enterChatRoom(client, roomId, message.userId);
  }

  //채팅방 나가기
  // QUIT + message : {
  //   userId: number,
  //   channelId: number,
  // }
  @SubscribeMessage('QUIT')
  async quitChatRoom(client: Socket, message) {

    //방이 만약 나 혼자인 방이면 제거
    if (client.data.roomId != 'room:lobby' && this.server.sockets.adapter.rooms.get(client.data.roomId).size == 1) {
      this.chatsSocketService.deleteChatRoom(client.data.roomId);
      // 외래키 되어있는거 어떻게 지우지?.. channel_config와 channel_member 지워야함
    }
    //channel_member 지워야함
    this.chatsSocketService.exitChatRoom(client, message.channelId, message.userId);
  }

}