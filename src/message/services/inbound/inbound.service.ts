import { Injectable, Logger } from '@nestjs/common';
import {
    GSWhatsAppMessage,
    convertMessageToXMsg,
    convertXMessageToMsg,
    gupshupWhatsappAdapterServiceConfig
} from '@samagra-x/gupshup-whatsapp-adapter';
import { ConfigService } from '@nestjs/config';
import axios from 'axios';
import { v4 as uuid4 } from 'uuid';

import { OutboundService } from '../outbound/outbound.service';
import { XMessage, MessageType, MessageState } from '@samagra-x/xmessage';

@Injectable()
export class InboundService {
    constructor(
        private configService: ConfigService,
        private readonly outboundService: OutboundService
    ) {}
    private readonly logger = new Logger(InboundService.name);

    convertApiResponseToXMessage(data: any, phoneNumber): XMessage {
        return {
            adapterId: '7b0cf232-38a2-4f9b-8070-9b988ff94c2c',
            messageType: data.messageType,
            messageId: data.messageId,
            to: { userID: phoneNumber },
            from: { userID: 'admin' },
            channelURI: data.channelURI,
            providerURI: data.providerURI,
            timestamp: data.timestamp,
            messageState: MessageState.REPLIED,
            payload: data.payload
        };
    }

    async handleIncomingGsWhatsappMessage(whatsappMessage: GSWhatsAppMessage) {
        gupshupWhatsappAdapterServiceConfig.setConfig({
            baseUrl: this.configService.get<string>('BASE_URL'),
            adminToken: this.configService.get<string>('ADAPTER_ADMIN_TOKEN'),
            vaultServiceToken: this.configService.get<string>('VAULT_SERVICE_TOKEN'),
            vaultServiceUrl: this.configService.get<string>('VAULT_SERVICE_URL'),
            gupshupUrl: this.configService.get<string>('GUPSHUP_API_ENDPOINT')
        });
        try {
            if ("interactive" in whatsappMessage) {
                const interactiveInteraction = JSON.parse(whatsappMessage.interactive)
                if (interactiveInteraction.type = 'button_reply') {
                    //handle feedback
                    this.logger.log("Feedback is not being handled right now!")
                    return
                }
            }
            const xMessagePayload = await convertMessageToXMsg(whatsappMessage);
            xMessagePayload.from.userID = uuid4();
            xMessagePayload.to.userID = uuid4();
            xMessagePayload.messageId.Id = uuid4();

            const orchestratorServiceUrl = this.configService.get<string>('ORCHESTRATOR_API_ENDPOINT');
            const resp = await axios.post(orchestratorServiceUrl, xMessagePayload, {
                headers: {
                    'Content-Type': 'application/json'
                }
            });

            const xResponse = this.convertApiResponseToXMessage(resp.data, whatsappMessage.mobile.substring(2));
            const sentResp = await this.outboundService.handleOrchestratorResponse(xResponse);
        } catch (error) {
            const errorResponse = this.convertApiResponseToXMessage(
                {
                    adapterId: '7b0cf232-38a2-4f9b-8070-9b988ff94c2c',
                    messageType: MessageType.TEXT,
                    messageId: {},
                    from: { userID: 'admin' },
                    channelURI: 'WhatsApp',
                    providerURI: 'gupshup',
                    timestamp: Date.now(),
                    messageState: MessageState.REPLIED,
                    payload: { text: 'Something went wrong. Please try again later.' }
                },
                whatsappMessage.mobile.substring(2)
            );
            await this.outboundService.handleOrchestratorResponse(errorResponse);
        }
    }
}
