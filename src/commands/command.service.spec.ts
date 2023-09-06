import { Test, TestingModule } from '@nestjs/testing';
import { CommandService } from './command.service';
import { TextArmandizerModule } from 'src/text-armandizer/text-armandizer.module';

describe('CommandService', () => {
  let service: CommandService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      imports: [TextArmandizerModule],
      providers: [CommandService],
    }).compile();

    service = module.get<CommandService>(CommandService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
