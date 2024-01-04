import { Controller, Get, Post, Body, Logger } from '@nestjs/common';

@Controller('/inbound/telegram/bot')
export class TelegramBotController {
    constructor(
    ) {}
    private readonly logger = new Logger(TelegramBotController.name);

    @Get('/health')
    async verifyEndpointIsActive(): Promise<string> {
        return 'Endpoint Active!';
    }

    @Post()
    async handleIncomingMessageData(@Body() updateObject): Promise<any> {
        this.logger.log(updateObject);
    }
}
