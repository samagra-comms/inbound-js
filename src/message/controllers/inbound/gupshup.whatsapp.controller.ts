import { Controller, Get, Post, Body, Logger, Param, NotFoundException } from '@nestjs/common';
import { GSWhatsAppMessage, GupshupWhatsappProvider } from '@samagra-x/uci-adapters-gupshup-whatsapp-adapter';
import { GupshupWhatsappInboundService } from '../../services/inbound/gupshup.whatsapp.service';
import { SupabaseService } from '../../services/supabase/supabase.service';
import { XMessage } from '@samagra-x/xmessage';
import { WebClientProvider } from 'src/message/services/webclient/webclient.provider';

@Controller('/inbound/gupshup/whatsapp')
export class GupshupWhatsappInboundController {
    constructor(
        private readonly inboundService: GupshupWhatsappInboundService,
        private readonly supabaseService: SupabaseService,
        private readonly webclientProvider: WebClientProvider,
    ) {}
    private readonly logger = new Logger(GupshupWhatsappInboundController.name);

    @Get('/health')
    async verifyEndpointIsActive(): Promise<string> {
        return 'Endpoint Active!';
    }

    @Post(':botId')
    async handleIncomingMessageData(
        @Param('botId') botId: string,
        @Body() requestData: GSWhatsAppMessage,
    ): Promise<any> {
        this.logger.log(requestData)
        // TODO: Find a better way to distinguish between whatsapp message and report.
		if ("mobile" in requestData) {
            this.logger.log("Received whatsapp message from user.");
            const botFetchRequest = await this.webclientProvider.getUciApiWebClient().get(
                `/admin/bot/${botId}`
            );
            if (botFetchRequest.status != 200 || !botFetchRequest.data || !botFetchRequest.data.result) {
                this.logger.error(botFetchRequest);
                throw new NotFoundException('Bot Not Found!');
            }
			await this.inboundService.handleIncomingGsWhatsappMessage(botFetchRequest.data.result, requestData);
		}
        else {
            this.logger.log("Received delivery report for whatsapp.");
            const reportXmsg: XMessage = await new GupshupWhatsappProvider().convertMessageToXMsg(requestData);
            await this.supabaseService.writeMessage(reportXmsg);
        }
    }
}
