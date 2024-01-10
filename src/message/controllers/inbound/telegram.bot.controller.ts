import { Controller, Get, Post, Body, Logger, Param, NotFoundException } from '@nestjs/common';
import { TelegramBotService } from 'src/message/services/inbound/telegram.bot.service';
import { WebClientProvider } from 'src/message/services/webclient/webclient.provider';

@Controller('/inbound/telegram/bot')
export class TelegramBotController {
    constructor(
        private readonly telegramBotService: TelegramBotService,
        private readonly webclientProvider: WebClientProvider,
    ) {}
    private readonly logger = new Logger(TelegramBotController.name);

    @Get('/health')
    async verifyEndpointIsActive(): Promise<string> {
        return 'Endpoint Active!';
    }

    @Post(':botId')
    async handleIncomingMessageData(
        @Param('botId') botId: string,
        @Body() updateObject
    ): Promise<any> {
        this.logger.log("Received whatsapp message from user.");
        const botFetchRequest = await this.webclientProvider.getUciApiWebClient().get(
            `/admin/bot/${botId}`
        );
        if (botFetchRequest.status != 200 || !botFetchRequest.data || !botFetchRequest.data.result) {
            this.logger.error(botFetchRequest);
            throw new NotFoundException('Bot Not Found!');
        }
        this.telegramBotService.handleIncomingMessage(botFetchRequest.data.result, updateObject);
    }
}
