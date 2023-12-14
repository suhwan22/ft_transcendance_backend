import { CanActivate, ExecutionContext, Injectable } from "@nestjs/common";
import { WsException } from "@nestjs/websockets";
import { Observable } from "rxjs";

@Injectable()
export class JwtWsGuard implements CanActivate {

  canActivate(context: ExecutionContext): boolean | Promise<boolean> | Observable<boolean> {
    console.log(context.getArgs()[0].request.headers.cookie);
    throw new WsException("ERROR");
    return (false);
  }
}