import { Controller, Get, Post, Body, Logger } from '@nestjs/common';
import { GSWhatsAppMessage, convertXMessageToMsg, convertMessageToXMsg, gupshupWhatsappAdapterServiceConfig} from '@samagra-x/gupshup-whatsapp-adapter';
import { ConfigService } from '@nestjs/config';
import { InboundService } from '../services/inbound/inbound.service';

@Controller('/inbound/gupshup/whatsapp')
export class MessageController {
    constructor(
        private configService: ConfigService,
        private readonly inboundService:InboundService
        ) {}
    private readonly logger = new Logger(MessageController.name);

    @Get("/health")
    async verifyEndpointIsActive(): Promise<string> {
        return "Endpoint Active!"
    }

    @Post()
    async handleIncomingMessageData(@Body() requestData: GSWhatsAppMessage): Promise<any> {

        await this.inboundService.handleIncomingGsWhatsappMessage(requestData)
        try {
            this.logger.log("Message Received and Sent!");
        } catch (error) {
            this.logger.error(`Error sending message: ${error}`);
            throw error;
        }
        }
}