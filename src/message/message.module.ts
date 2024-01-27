import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { OutboundService } from './services/outbound/outbound.service';
import { CredentialService } from './services/credentials/credentials.service';
import { OutboundMessageController } from './controllers/outbound/outbound.controller';
import { UserModule } from 'src/user/user.module';
import { SupabaseService } from './services/supabase/supabase.service';
import { FeedbackService } from './services/feedback/feedback.service';
import { InboundBotController } from './controllers/inbound/inbound.bot.controller';
import { WebClientProvider } from './services/webclient/webclient.provider';
import { InboundService } from './services/inbound/inbound.bot.service';

@Module({
    imports: [ConfigModule.forRoot(), UserModule],
    controllers: [
        InboundBotController,
        OutboundMessageController
    ],
    providers: [
        InboundService,
        OutboundService,
        CredentialService,
        SupabaseService,
        FeedbackService,
        WebClientProvider,
    ]
})
export class MessageModule {}
