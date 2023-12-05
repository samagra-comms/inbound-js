import { Controller, Get, Post, Body, Logger } from '@nestjs/common';
import { GSWhatsAppMessage } from '@samagra-x/gupshup-whatsapp-adapter';
import { ConfigService } from '@nestjs/config';
import { InboundService } from '../services/inbound/inbound.service';

@Controller('/inbound/gupshup/whatsapp')
export class MessageController {
    constructor(
        private configService: ConfigService,
        private readonly inboundService: InboundService
    ) {}
    private readonly logger = new Logger(MessageController.name);

    @Get('/health')
    async verifyEndpointIsActive(): Promise<string> {
        return 'Endpoint Active!';
    }

    @Post()
    async handleIncomingMessageData(@Body() requestData: GSWhatsAppMessage): Promise<any> {
		if ("mobile" in requestData){
			await this.inboundService.handleIncomingGsWhatsappMessage(requestData);
		}
    }
}
