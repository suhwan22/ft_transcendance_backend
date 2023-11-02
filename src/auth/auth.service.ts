import { HttpService } from '@nestjs/axios';
import { Injectable } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { firstValueFrom } from 'rxjs';
import { PlayerRequestDto } from 'src/users/dtos/player.request.dto';
import { Player } from 'src/users/entities/player.entity';
import { UsersService } from 'src/users/users.service';

@Injectable()
export class AuthService {
  constructor(
    private jwtService: JwtService,
    private usersService: UsersService,
  ) {}

  async getJwtToken(user: Player) {
    const payload = { username: user.name, sub: user.id };
    const token = this.jwtService.sign(payload);
    return (token);
  }

  async logIn(data) {
    let user = await this.usersService.readOnePurePlayer(data.id);
    if (!user) {
      const newPlayer = { id: data.id,
                          name: data.login,
                          avatar: data.image.link,
                          status: 1};
      user = await this.usersService.createPlayer(newPlayer);
    }
    const token = await this.getJwtToken(user);
    return {
      token: token,
      domain: 'localhost',
      path: '/',
      httpOnly: true,
      maxAge: 10 * 60 * 1000,
    };
  }

  async logOut() {
    return {
      token: '',
      domain: 'localhost',
      path: '/',
      httpOnly: true,
      maxAge: 0,
    };
  }
}
