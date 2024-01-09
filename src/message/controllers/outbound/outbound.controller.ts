import { Body, Controller, Logger, Post } from '@nestjs/common';
import { MessageState, XMessage } from '@samagra-x/xmessage';
import { CredentialService } from 'src/message/services/credentials/credentials.service';
import { OutboundService } from 'src/message/services/outbound/outbound.service';

@Controller('/outbound/gupshup/whatsapp')
export class OutboundMessageController {
    constructor(
        private readonly outboundService: OutboundService,
        private readonly credentialService: CredentialService,
    ) {}
    private readonly logger = new Logger(OutboundMessageController.name);

    @Post()
    async handleIncomingXMessage(@Body() orchestratorRequest: XMessage): Promise<any> {
        this.logger.log('Orchestrator Request', orchestratorRequest);
        const credentials = await this.credentialService.getCredentialsForAdapter(orchestratorRequest.adapterId);
        orchestratorRequest.messageState = MessageState.REPLIED;
        await this.outboundService.handleOrchestratorResponse(orchestratorRequest, credentials);
    }
}
