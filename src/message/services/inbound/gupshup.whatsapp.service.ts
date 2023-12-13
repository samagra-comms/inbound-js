import { Injectable, Logger } from '@nestjs/common';
import { GSWhatsAppMessage, convertMessageToXMsg } from '@samagra-x/gupshup-whatsapp-adapter';
import { ConfigService } from '@nestjs/config';
import axios from 'axios';
import { v4 as uuid4 } from 'uuid';

import { OutboundService } from '../outbound/outbound.service';
import { XMessage, MessageType, MessageState } from '@samagra-x/xmessage';
import { CredentialService } from '../credentials/credentials.service';
import { UserService } from 'src/user/user.service';
import { FeedbackService } from '../feedback/feedback.service';

@Injectable()
export class GupshupWhatsappInboundService {
    constructor(
        private readonly configService: ConfigService,
        private readonly userService: UserService,
        private readonly outboundService: OutboundService,
        private readonly credentialService: CredentialService,
        private readonly feedbackService: FeedbackService
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
            //Handle Feedback
            const thumbsUpEmojis = ['👍', '👍🏻', '👍🏼', '👍🏽', '👍🏾', '👍🏿'];
            const thumbsDownEmojis = ['👎', '👎🏻', '👎🏼', '👎🏽', '👎🏾', '👎🏿'];
            if (
                'replyId' in whatsappMessage &&
                'text' in whatsappMessage &&
                'messageId' in whatsappMessage &&
                (thumbsUpEmojis.includes(whatsappMessage.text) || thumbsDownEmojis.includes(whatsappMessage.text))
            ) {
                if (thumbsUpEmojis.includes(whatsappMessage.text)) {
                    this.feedbackService.givePositiveFeedback(whatsappMessage.messageId);
                    this.logger.log('Message ID', whatsappMessage.messageId);
                } else if (thumbsDownEmojis.includes(whatsappMessage.text)) {
                    this.feedbackService.giveNegativeFeedback(whatsappMessage.messageId);
                    this.logger.log('Message ID', whatsappMessage.messageId);
                }
                return;
            }

            const xMessagePayload: XMessage = await convertMessageToXMsg(whatsappMessage);
            if (xMessagePayload.messageType != MessageType.TEXT) {
                throw new Error('Media Type Not Supported');
            }

            this.logger.log('Converted Message:', xMessagePayload);
            xMessagePayload.from.userID = uuid4();
            xMessagePayload.to.userID = uuid4();
            xMessagePayload.messageId.Id = uuid4();

            xMessagePayload.to.bot = true;
            xMessagePayload.to.meta = xMessagePayload.to.meta || new Map<string, string>();
            xMessagePayload.to.meta.set('botMobileNumber', whatsappMessage.waNumber);

            xMessagePayload.from.bot = false;
            xMessagePayload.from.meta = xMessagePayload.from.meta || new Map<string, string>();
            xMessagePayload.from.meta.set('mobileNumber', whatsappMessage.mobile.substring(2));

            //Send Template response before the actuar response because the actual response takes time
            const templateResponse = this.convertApiResponseToXMessage(
                {
                    adapterId: '7b0cf232-38a2-4f9b-8070-9b988ff94c2c',
                    messageType: MessageType.TEXT,
                    messageId: {},
                    from: { userID: 'admin' },
                    channelURI: 'WhatsApp',
                    providerURI: 'gupshup',
                    timestamp: Date.now(),
                    messageState: MessageState.REPLIED,
                    payload: {
                        text: 'Thank you for your question! Our chatbot is working diligently to provide you with the best possible answer. Generating responses may take a moment, so please be patient.'
                    }
                },
                whatsappMessage.mobile.substring(2)
            );

            const tempResp = await this.outboundService.handleOrchestratorResponse(
                templateResponse,
                adapterCredentials
            );

            const orchestratorServiceUrl = this.configService.get<string>('ORCHESTRATOR_API_ENDPOINT');


            // Map<string,string>() cannot be sent in request body
            const payload = JSON.parse(JSON.stringify(xMessagePayload));

            xMessagePayload.to.meta.forEach((val: string, key: string) => {
                payload.to.meta[key] = val;
            });

            xMessagePayload.from.meta.forEach((val: string, key: string) => {
                payload.from.meta[key] = val;
            });
            const resp = await axios.post(`${orchestratorServiceUrl}/prompt`, payload, {
                headers: {
                    'Content-Type': 'application/json'
                }
            });

            this.logger.log('OrchestratorResponse', resp.data);
            //remove after this with active outbound
            // const xResponse = this.convertApiResponseToXMessage(resp.data, whatsappMessage.mobile.substring(2));
            // this.logger.log('OrchestratorResponse', xResponse);
            // const sentResp = await this.outboundService.handleOrchestratorResponse(xResponse, adapterCredentials);
            // this.logger.log('OutboundResponse', sentResp);

        } catch (error) {
            let errorText = 'Something went wrong. Please try again later';
            if (error == 'Error: Media Type Not Supported') {
                errorText = `Sorry, I can only respond to text-based questions at the moment. Please type your question using regular text characters, and I'll be happy to help!\n\nThank you for your understanding!`;
            }
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
                    payload: { text: errorText }
                },
                whatsappMessage.mobile.substring(2)
            );
            const sentResp = await this.outboundService.handleOrchestratorResponse(errorResponse, adapterCredentials);
            this.logger.log('OutboundErrorResponse', error);
        }
    }
}
