import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { GSWhatsAppMessage, GupshupWhatsappProvider } from '@samagra-x/uci-adapters-gupshup-whatsapp-adapter';
import { ConfigService } from '@nestjs/config';
import axios from 'axios';
import { v4 as uuid4 } from 'uuid';

import { OutboundService } from '../outbound/outbound.service';
import { XMessage, MessageType, MessageState } from '@samagra-x/xmessage';
import { CredentialService } from '../credentials/credentials.service';
import { FeedbackService } from '../feedback/feedback.service';
import { SupabaseService } from '../supabase/supabase.service';

@Injectable()
export class GupshupWhatsappInboundService {
    constructor(
        private configService: ConfigService,
        private readonly outboundService: OutboundService,
        private readonly credentialService: CredentialService,
        private readonly feedbackService: FeedbackService,
        private readonly supabaseService: SupabaseService,
    ) {}
    private readonly logger = new Logger(GupshupWhatsappInboundService.name);

    convertApiResponseToXMessage(data: any, phoneNumber): XMessage {
        return {
            adapterId: data.adapterId,
            messageType: data.messageType,
            messageId: data.messageId,
            to: { userID: phoneNumber },
            from: { userID: 'admin' },
            channelURI: data.channelURI,
            providerURI: data.providerURI,
            timestamp: data.timestamp,
            messageState: MessageState.REPLIED,
            payload: data.payload,
            app: data.app
        };
    }

    // TODO: define botData type
    async handleIncomingGsWhatsappMessage(botData: any, whatsappMessage: GSWhatsAppMessage) {
        const adapterId = botData.logicIDs[0]?.adapter?.id;
        if (!adapterId) {
            this.logger.error(`Adapter data not present in bot: ${botData}`);
            throw new NotFoundException('Adapter data not present in bot!');
        }
        const adapterCredentials = await this.credentialService.getCredentialsForAdapter(adapterId);
        if (!adapterCredentials) {
            throw new NotFoundException('Adapter credentials not found!');
        }
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
            if (whatsappMessage.type == 'voice') {
                throw new Error('Media Type Not Supported');
            }

            const xMessagePayload: XMessage = await new GupshupWhatsappProvider().convertMessageToXMsg(whatsappMessage);
            xMessagePayload.adapterId = adapterId;
            if (xMessagePayload.messageType != MessageType.TEXT) {
                throw new Error('Media Type Not Supported');
            }

            this.logger.log('Converted Message:', xMessagePayload);
            xMessagePayload.messageId.Id = uuid4();

            xMessagePayload.to.bot = true;
            xMessagePayload.to.meta = xMessagePayload.to.meta || new Map<string, string>();
            xMessagePayload.to.meta.set('botMobileNumber', whatsappMessage.waNumber);

            xMessagePayload.from.bot = false;
            xMessagePayload.from.meta = xMessagePayload.from.meta || new Map<string, string>();
            xMessagePayload.from.meta.set('mobileNumber', whatsappMessage.mobile.substring(2));
            xMessagePayload.app = botData.id;

            // Saving history of what user said
            this.supabaseService.writeMessage(xMessagePayload);

            //Send Template response before the actuar response because the actual response takes time.
            const templateResponse = this.convertApiResponseToXMessage(
                {
                    adapterId: adapterId,
                    messageType: MessageType.TEXT,
                    messageId: { Id: xMessagePayload.messageId.Id },
                    from: { userID: 'admin' },
                    channelURI: 'Whatsapp',
                    providerURI: 'Gupshup',
                    timestamp: Date.now(),
                    messageState: MessageState.REPLIED,
                    payload: {
                        text: 'Thank you for your question! Our chatbot is working diligently to provide you with the best possible answer. Generating responses may take a moment, so please be patient.'
                    },
                    app: botData.id,
                },
                whatsappMessage.mobile.substring(2)
            );
            await this.outboundService.handleOrchestratorResponse(
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

            const userHistory = await this.supabaseService.getUserHistory(xMessagePayload.from.userID, botData.id);

            const resp = await axios.post(
                `${orchestratorServiceUrl}/prompt`,
                {
                    'botId': botData.id,
                    'message': payload,
                    'userHistory': userHistory
                },
                {
                    headers: {
                        'Content-Type': 'application/json'
                    }
                }
            );

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
                    adapterId: adapterId,
                    messageType: MessageType.TEXT,
                    messageId: {id: uuid4()},
                    from: { userID: 'admin' },
                    channelURI: 'Whatsapp',
                    providerURI: 'Gupshup',
                    timestamp: Date.now(),
                    messageState: MessageState.REPLIED,
                    payload: { text: errorText },
                    app: botData.id,
                },
                whatsappMessage.mobile.substring(2)
            );
            const sentResp = await this.outboundService.handleOrchestratorResponse(errorResponse, adapterCredentials);
            this.logger.log('OutboundErrorResponse', error);
        }
    }
}
