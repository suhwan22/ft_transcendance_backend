import {
  MessageBody,
  SubscribeMessage,
  WebSocketGateway,
  WebSocketServer,
  OnGatewayConnection,
  OnGatewayDisconnect,
} from '@nestjs/websockets';

import { Server, Socket } from 'socket.io';

@WebSocketGateway()
export class ChatsGateway implements OnGatewayConnection, OnGatewayDisconnect {
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
    // const { roomId } = client.data;
    // if (
    //   roomId != 'room:lobby' &&
    //   !this.server.sockets.adapter.rooms.get(roomId)
    // ) {
    //   this.ChatRoomService.deleteChatRoom(roomId);
    //   this.server.emit(
    //     'getChatRoomList',
    //     this.ChatRoomService.getChatRoomList(),
    //   );
    // }
    // console.log('disonnected', client.id);
  }
}