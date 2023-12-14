import { CanActivate, ExecutionContext, Injectable } from "@nestjs/common";
import { WsException } from "@nestjs/websockets";
import { Observable } from "rxjs";
import { AuthService } from "../auth.service";

@Injectable()
export class JwtWsGuard implements CanActivate {
  constructor(private authService: AuthService) { }

  canActivate(context: ExecutionContext): boolean | Promise<boolean> | Observable<boolean> {
    const client = context.getArgs()[0];
    this.authService.verifyBearTokenWithCookies("client.request.headers.cookie", "TwoFactorAuth");
    return (true);
  }
}