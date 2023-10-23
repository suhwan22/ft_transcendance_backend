import { Test, TestingModule } from '@nestjs/testing';
import { BanListService } from './ban-list.service';

describe('BanListService', () => {
  let service: BanListService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [BanListService],
    }).compile();

    service = module.get<BanListService>(BanListService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
