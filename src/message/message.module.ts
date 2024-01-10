import { Module } from '@nestjs/common';
import { GupshupWhatsappInboundController } from './controllers/inbound/gupshup.whatsapp.controller';
import { GupshupWhatsappInboundService } from './services/inbound/gupshup.whatsapp.service';
import { ConfigModule } from '@nestjs/config';
import { OutboundService } from './services/outbound/outbound.service';
import { CredentialService } from './services/credentials/credentials.service';
import { OutboundMessageController } from './controllers/outbound/outbound.controller';
import { UserModule } from 'src/user/user.module';
import { SupabaseService } from './services/supabase/supabase.service';
import { FeedbackService } from './services/feedback/feedback.service';
import { TelegramBotController } from './controllers/inbound/telegram.bot.controller';
import { WebClientProvider } from './services/webclient/webclient.provider';
import { TelegramBotService } from './services/inbound/telegram.bot.service';

@Module({
    imports: [ConfigModule.forRoot(), UserModule],
    controllers: [
        GupshupWhatsappInboundController,
        TelegramBotController,
        OutboundMessageController
    ],
    providers: [
        GupshupWhatsappInboundService,
        TelegramBotService,
        OutboundService,
        CredentialService,
        SupabaseService,
        FeedbackService,
        WebClientProvider,
    ]
})
export class MessageModule {}
