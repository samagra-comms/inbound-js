import { Controller, Get, Post, Body, Logger } from '@nestjs/common';
import { GSWhatsAppMessage, convertMessageToXMsg } from '@samagra-x/gupshup-whatsapp-adapter';
import { GupshupWhatsappInboundService } from '../../services/inbound/gupshup.whatsapp.service';
import { SupabaseService } from '../../../message/services/supabase.service';
import { XMessage } from '@samagra-x/xmessage';

@Controller('/inbound/gupshup/whatsapp')
export class GupshupWhatsappInboundController {
    constructor(
        private readonly inboundService: GupshupWhatsappInboundService,
        private readonly supabaseService: SupabaseService,
    ) {}
    private readonly logger = new Logger(GupshupWhatsappInboundController.name);

    @Get('/health')
    async verifyEndpointIsActive(): Promise<string> {
        return 'Endpoint Active!';
    }

    @Post()
    async handleIncomingMessageData(@Body() requestData: GSWhatsAppMessage): Promise<any> {
        this.logger.log(requestData)
        // TODO: Find a better way to distinguish between whatsapp message and report.
		if ("mobile" in requestData){
            this.logger.log("Received whatsapp message from user.");
			await this.inboundService.handleIncomingGsWhatsappMessage(requestData);
		}
        else {
            this.logger.log("Received delivery report for whatsapp.");
            const reportXmsg: XMessage = await convertMessageToXMsg(requestData);
            await this.supabaseService.writeMessage(reportXmsg);
        }
    }
}
