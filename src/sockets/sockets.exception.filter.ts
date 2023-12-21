import { ArgumentsHost, Catch, HttpException } from "@nestjs/common";
import { BaseWsExceptionFilter, WsException } from "@nestjs/websockets";

@Catch()
export class SocketExceptionFilter extends BaseWsExceptionFilter {
  catch(exception: any, host: ArgumentsHost): void {
    const client = host.switchToWs().getClient();
    if (exception.name === 'JsonWebTokenError') {
      const msg = this.getNotice("Invaild Token", 201, client.data.status);
      client.emit("NOTICE", msg);
    }
    else if (exception.name === 'TokenExpiredError') {
      const msg = this.getNotice("Token expired", 202, client.data.status);
      client.emit("NOTICE", msg);
    }
    else if (exception.error === 'DuplicatedAccessError') {
      const msg = this.getNotice("Duplicated Access", 203, client.data.status);
      client.emit("NOTICE", msg);
    }
    else if (exception.error === 'TokenExpiredError') {
      const msg = this.getNotice("Token expired", 202, client.data.status);
      client.emit("NOTICE", msg);
    }
    else {
      const msg = this.getNotice("DB Error", 200, client.data.status);
      client.emit("NOTICE", msg);
    }
  }

  getNotice(message: string, code: number, status: number) {
    return ({
      code: code,
      content: message,
      status: status,
      date: new Date(),
    });
  }
}