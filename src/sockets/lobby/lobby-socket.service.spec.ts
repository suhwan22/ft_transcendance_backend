import { Test, TestingModule } from '@nestjs/testing';
import { LobbySocketService } from './lobby-socket.service';

describe('LobbySocketService', () => {
  let service: LobbySocketService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [LobbySocketService],
    }).compile();

    service = module.get<LobbySocketService>(LobbySocketService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
