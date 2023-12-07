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
import { CredentialService } from '../credentials/credentials.service';

@Injectable()
export class GupshupWhatsappInboundService {
    constructor(
        private configService: ConfigService,
        private readonly outboundService: OutboundService,
        private readonly credentialService: CredentialService
    ) {}
    private readonly logger = new Logger(GupshupWhatsappInboundService.name);

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

    async getAdapterCredentials(number: string) {
        if (number.endsWith('88')) {
            const vaultResponse = await this.credentialService.getCredentialsFromVault(
                this.configService.get<string>('VAULT_SERVICE_URL'),
                '/admin/secret/gupshupWhatsappVariable',
                {
                    ownerId: '8f7ee860-0163-4229-9d2a-01cef53145ba',
                    ownerOrgId: 'org1',
                    'admin-token': this.configService.get<string>('VAULT_SERVICE_TOKEN')
                }
            );

            const credentials = vaultResponse['result']['gupshupWhatsappVariable'];
            return credentials;
        } else if (number.endsWith('87')) {
            const vaultResponse = await this.credentialService.getCredentialsFromVault(
                this.configService.get<string>('VAULT_SERVICE_URL'),
                '/admin/secret/gupshupWhatsappVariable2',
                {
                    ownerId: '8f7ee860-0163-4229-9d2a-01cef53145ba',
                    ownerOrgId: 'org1',
                    'admin-token': this.configService.get<string>('VAULT_SERVICE_TOKEN')
                }
            );

            const credentials = vaultResponse['result']['gupshupWhatsappVariable2'];
            return credentials;
        } else {
            //throw error
            return;
        }
    }

    async handleIncomingGsWhatsappMessage(whatsappMessage: GSWhatsAppMessage) {
        const adapterCredentials = await this.getAdapterCredentials(whatsappMessage.waNumber);
        try {
            //Handle Feedback First
            if ('interactive' in whatsappMessage) {
                const interactiveInteraction = JSON.parse(whatsappMessage.interactive);
                if ((interactiveInteraction.type = 'button_reply')) {
                    //handle feedback
                    this.logger.log('Feedback is not being handled right now!');
                    return;
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
            this.logger.log("OrchestratorResponse", xResponse)
            const sentResp = await this.outboundService.handleOrchestratorResponse(xResponse, adapterCredentials);
            this.logger.log("OutboundResponse",sentResp)
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
            const sentResp = await this.outboundService.handleOrchestratorResponse(errorResponse, adapterCredentials);
            this.logger.log("OutboundErrorResponse",sentResp)
        }
    }
}

// {
//     adapterId: '7b0cf232-38a2-4f9b-8070-9b988ff94c2c',
//     messageType: MessageType.TEXT,
//     messageId: ,
//     to: { userID: phoneNumber },
//     from: { userID: 'admin' },
//     channelURI: data.channelURI,
//     providerURI: data.providerURI,
//     timestamp: data.timestamp,
//     messageState: MessageState.REPLIED,
//     payload: data.payload
// }
