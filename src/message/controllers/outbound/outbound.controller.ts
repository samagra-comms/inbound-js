import { Body, Controller, Logger, Post } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { MessageState, XMessage } from '@samagra-x/xmessage';
import { OutboundService } from 'src/message/services/outbound/outbound.service';

@Controller('/outbound/gupshup/whatsapp')
export class OutboundMessageController {
    constructor(private readonly outboundService: OutboundService, private readonly configService: ConfigService,) {}
    private readonly logger = new Logger(OutboundMessageController.name);

    @Post()
    async handleIncomingXMessage(@Body() orchestratorRequest: XMessage): Promise<any> {
        this.logger.log('Orchestrator Request', orchestratorRequest);
        const botMobileNumber = this.configService.get<string>('BOT_MOBILE_NUMBER')
        const credentials = await this.outboundService.getAdapterCredentials(botMobileNumber);
        orchestratorRequest.messageState = MessageState.REPLIED;
        await this.outboundService.handleOrchestratorResponse(orchestratorRequest, credentials);
    }
}
