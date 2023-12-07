import { Module } from '@nestjs/common';
import { GupshupWhatsappInboundController } from './controllers/inbound/gupshup.whatsapp.controller';
import { GupshupWhatsappInboundService } from './services/inbound/gupshup.whatsapp.service';
import { ConfigModule } from '@nestjs/config';
import { OutboundService } from './services/outbound/outbound.service';
import { CredentialService } from './services/credentials/credentials.service';

@Module({
  imports: [ConfigModule.forRoot()],
  controllers: [GupshupWhatsappInboundController],
  providers: [ 
    GupshupWhatsappInboundService,
    OutboundService,
    CredentialService
  ],
})
export class MessageModule {}