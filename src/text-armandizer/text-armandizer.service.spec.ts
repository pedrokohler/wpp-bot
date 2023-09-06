import { Test, TestingModule } from '@nestjs/testing';
import { TextArmandizerService } from './text-armandizer.service';
import { UtilsModule } from 'src/utils/utils.module';

describe('TextArmandizerService', () => {
  let service: TextArmandizerService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [TextArmandizerService],
      imports: [UtilsModule],
    }).compile();

    service = module.get<TextArmandizerService>(TextArmandizerService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  it('should armandize the text', () => {
    const originalText =
      'Lorem ipsum dolor sit amet, consectetur adipiscing elit. Mauris a risus at libero scelerisque mattis. Duis pharetra congue tortor, nec ornare quam dictum at. Nunc eu finibus sem, vel tempor neque. Aenean in nisl ac nisl varius tincidunt. Pellentesque habitant morbi tristique senectus et netus et malesuada fames ac turpis egestas. Quisque tempor sodales nulla, ut ultrices lectus mollis eget. Duis sodales scelerisque risus et elementum. Class aptent taciti sociosqu ad litora torquent per conubia nostra, per inceptos himenaeos. Vestibulum ac pharetra dolor, eget facilisis velit. Suspendisse potenti. Fusce quam nulla, consectetur vitae nisi in, faucibus laoreet lorem. Suspendisse scelerisque justo ut imperdiet sodales. Nunc eget nisi vel tortor mattis dapibus.';
    const armandizedText = service.transformText(originalText);

    expect(armandizedText.length).toBeGreaterThan(originalText.length);
  });
});
