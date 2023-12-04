import { Module } from '@nestjs/common';
import { MessageController } from './controllers/inbound.message.controller';
import { InboundService } from './services/inbound/inbound.service';
import { ConfigModule } from '@nestjs/config';
import { OutboundService } from './services/outbound/outbound.service';

@Module({
  imports: [ConfigModule.forRoot()],
  controllers: [MessageController],
  providers: [ 
    InboundService,
    OutboundService
  ],
})
export class MessageModule {}