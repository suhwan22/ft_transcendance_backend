import { HttpService } from '@nestjs/axios';
import { Injectable } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { firstValueFrom } from 'rxjs';
import { Player } from 'src/users/entities/player.entity';

@Injectable()
export class AuthService {
  constructor(
    private jwtService: JwtService,
  ) {}

  async getJwtToken(user: Player) {
    const payload = { username: user.name, sub: user.id };
    const token = this.jwtService.sign(payload);
    return (token);
  }

  async logIn(user) {
    console.log(user.id);
    console.log(user.login);
    console.log(user.first_name);
    console.log(user.last_name);
    console.log(user.image);
    return "success";
    // const user = new Player();
    // user.id = 1;
    // user.name = 'sehjang';
    // const token = await this.getJwtToken(user);
    // return {
    //   token: token,
    //   domain: 'localhost',
    //   path: '/',
    //   httpOnly: true,
    //   maxAge: 10 * 60 * 1000,
    // };
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
