import { Test, TestingModule } from '@nestjs/testing';
import { OutboundMessageController } from './outbound.controller';

describe('OutboundMessageController', () => {
  let controller: OutboundMessageController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [OutboundMessageController],
    }).compile();

    controller = module.get<OutboundMessageController>(OutboundMessageController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
