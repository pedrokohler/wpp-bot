import { Test, TestingModule } from '@nestjs/testing';
import { WppClientService } from './wpp-client.service';

describe('WppClientService', () => {
  let service: WppClientService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [WppClientService],
    }).compile();

    service = module.get<WppClientService>(WppClientService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
