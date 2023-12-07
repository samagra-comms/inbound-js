import { Controller, Get, Post, Body, Logger } from '@nestjs/common';
import { GSWhatsAppMessage } from '@samagra-x/gupshup-whatsapp-adapter';
import { ConfigService } from '@nestjs/config';
import { GupshupWhatsappInboundService } from '../../services/inbound/gupshup.whatsapp.service';

@Controller('/inbound/gupshup/whatsapp')
export class GupshupWhatsappInboundController {
    constructor(
        private configService: ConfigService,
        private readonly inboundService: GupshupWhatsappInboundService
    ) {}
    private readonly logger = new Logger(GupshupWhatsappInboundController.name);

    @Get('/health')
    async verifyEndpointIsActive(): Promise<string> {
        return 'Endpoint Active!';
    }

    @Post()
    async handleIncomingMessageData(@Body() requestData: GSWhatsAppMessage): Promise<any> {
		if ("mobile" in requestData){
            this.logger.log(requestData)
			await this.inboundService.handleIncomingGsWhatsappMessage(requestData);
		}
    }
}
