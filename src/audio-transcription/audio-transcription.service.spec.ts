import { Test, TestingModule } from '@nestjs/testing';
import { AudioTranscriptionService } from './audio-transcription.service';

describe('AudioTranscriptionService', () => {
  let service: AudioTranscriptionService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [AudioTranscriptionService],
    }).compile();

    service = module.get<AudioTranscriptionService>(AudioTranscriptionService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
