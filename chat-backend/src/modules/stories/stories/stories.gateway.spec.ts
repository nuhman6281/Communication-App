import { Test, TestingModule } from '@nestjs/testing';
import { StoriesGateway } from './stories.gateway';

describe('StoriesGateway', () => {
  let gateway: StoriesGateway;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [StoriesGateway],
    }).compile();

    gateway = module.get<StoriesGateway>(StoriesGateway);
  });

  it('should be defined', () => {
    expect(gateway).toBeDefined();
  });
});
