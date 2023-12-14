import { ArgumentsHost, Catch, HttpException } from "@nestjs/common";
import { BaseWsExceptionFilter, WsException } from "@nestjs/websockets";

@Catch()
export class SocketExceptionFilter extends BaseWsExceptionFilter {
  catch(exception: WsException | HttpException, host: ArgumentsHost): void {
    const client = host.switchToWs().getClient();
    console.log(exception.name);
    console.log("=====================");
    // if (e.name === 'JsonWebTokenError') {
    //   const msg = this.gamesSocketService.getNotice("Invaild Token", 201);
    //   client.emit("NOTICE", msg);
    // }
    // else if (e.name === 'TokenExpiredError') {
    //   const msg = this.gamesSocketService.getNotice("Token expired", 202);
    //   client.emit("NOTICE", msg);
    // }
    // else {
    //   const msg = this.gamesSocketService.getNotice("DB Error", 200);
    //   client.emit("NOTICE", msg);
    // }
  }
}