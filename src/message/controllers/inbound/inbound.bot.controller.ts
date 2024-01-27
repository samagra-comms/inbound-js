import { Controller, Get, Post, Body, Logger, Param, NotFoundException } from '@nestjs/common';
import { InboundService } from 'src/message/services/inbound/inbound.bot.service';
import { WebClientProvider } from 'src/message/services/webclient/webclient.provider';

@Controller('/inbound/bot')
export class InboundBotController {
    constructor(
        private readonly inboundBotService: InboundService,
        private readonly webclientProvider: WebClientProvider,
    ) {}
    private readonly logger = new Logger(InboundBotController.name);

    @Get('/health')
    async verifyEndpointIsActive(): Promise<string> {
        return 'Endpoint Active!';
    }

    @Post(':botId')
    async handleIncomingMessageData(
        @Param('botId') botId: string,
        @Body() updateObject
    ): Promise<any> {
        this.logger.log("Received message on inbound.");
        const botFetchRequest = await this.webclientProvider.getUciApiWebClient().get(
            `/admin/bot/${botId}`
        );
        if (botFetchRequest.status != 200 || !botFetchRequest.data || !botFetchRequest.data.result) {
            this.logger.error(botFetchRequest);
            throw new NotFoundException('Bot Not Found!');
        }
        this.inboundBotService.handleIncomingMessage(botFetchRequest.data.result, updateObject);
    }
}
