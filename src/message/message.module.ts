import { Module } from '@nestjs/common';
import { GupshupWhatsappInboundController } from './controllers/inbound/gupshup.whatsapp.controller';
import { GupshupWhatsappInboundService } from './services/inbound/gupshup.whatsapp.service';
import { ConfigModule } from '@nestjs/config';
import { OutboundService } from './services/outbound/outbound.service';
import { CredentialService } from './services/credentials/credentials.service';
import { OutboundMessageController } from './controllers/outbound/outbound.controller';
import { UserModule } from 'src/user/user.module';
import { SupabaseService } from './services/supabase.service';

@Module({
    imports: [ConfigModule.forRoot(), UserModule],
    controllers: [GupshupWhatsappInboundController, OutboundMessageController],
    providers: [GupshupWhatsappInboundService, OutboundService, CredentialService, SupabaseService]
})
export class MessageModule {}
