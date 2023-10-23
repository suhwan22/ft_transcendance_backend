import { Test, TestingModule } from '@nestjs/testing';
import { MuteListService } from './mute-list.service';

describe('MuteListService', () => {
  let service: MuteListService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [MuteListService],
    }).compile();

    service = module.get<MuteListService>(MuteListService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
