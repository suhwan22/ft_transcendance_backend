import { Test, TestingModule } from '@nestjs/testing';
import { ChatLogService } from './chat-log.service';

describe('ChatLogService', () => {
  let service: ChatLogService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [ChatLogService],
    }).compile();

    service = module.get<ChatLogService>(ChatLogService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
