import { Injectable, Logger } from '@nestjs/common';
import { convertXMessageToMsg, gupshupWhatsappAdapterServiceConfig } from '@samagra-x/gupshup-whatsapp-adapter';
import { ConfigService } from '@nestjs/config';
import { MessageState, XMessage } from '@samagra-x/xmessage';

import { CredentialService } from '../credentials/credentials.service';

@Injectable()
export class OutboundService {
    constructor(private configService: ConfigService) {}
    private readonly logger = new Logger(OutboundService.name);

    async handleOrchestratorResponse(orchestratorRequest: XMessage, credentials) {
        gupshupWhatsappAdapterServiceConfig.setConfig({
            adapterCredentials: credentials
        });
        const adapterResponse = await convertXMessageToMsg(orchestratorRequest);
        if (adapterResponse.messageState = MessageState.NOT_SENT) {
            throw new Error("Message Not Sent")
        }
    }
}
