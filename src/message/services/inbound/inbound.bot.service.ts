import { BadRequestException, Injectable, Logger, NotFoundException, NotImplementedException } from "@nestjs/common";
import { CredentialService } from "../credentials/credentials.service";
import { SupabaseService } from "../supabase/supabase.service";
import axios from "axios";
import { ConfigService } from "@nestjs/config";
import { OutboundService } from "../outbound/outbound.service";
import { AdapterFactory } from "@samagra-x/uci-adapters-factory";
import { MessageType, XMessage } from "@samagra-x/xmessage";
import { FeedbackService } from "../feedback/feedback.service";

@Injectable()
export class InboundService {

    private readonly logger = new Logger(InboundService.name);

    constructor(
        private readonly credentialService: CredentialService,
        private readonly supabaseService: SupabaseService,
        private readonly configService: ConfigService,
        private readonly outboundService: OutboundService,
        private readonly feedbackService: FeedbackService,
    ) { }

    // TODO: specify botData type
    async handleIncomingMessage(botData: any, messageData: any) {
        const adapterId = botData.logic?.adapter?.id;
        if (!adapterId) {
            this.logger.error(`Adapter data not present in bot: ${botData}`);
            throw new NotFoundException('Adapter data not present in bot!');
        }
        const adapterConfigVariable = botData.logic.adapter.config?.credentials?.variable;
        if (!adapterConfigVariable) {
            this.logger.error(`Adapter config data not present in bot: ${botData}`);
            throw new NotFoundException('Adapter config data not present in bot!');
        }
        const adapterType = `${botData.logic.adapter.provider}${botData.logic.adapter.channel}`;
        const requiredAdapter: any = AdapterFactory.getAdapter({
            type: adapterType,
        });
        if (!requiredAdapter) {
            this.logger.error(`Adapter type ${adapterType} not found.`)
            throw new NotFoundException(`Adapter type ${adapterType} not found.`)
        }
        if (!requiredAdapter.convertMessageToXMsg) {
            this.logger.error(`Tried to ping inbound with unsupported two-way adapter: ${adapterType}`);
            throw new NotImplementedException("Two-way communication is not supported in this adapter!");
        }
        let xmsg: XMessage;
        try {
            xmsg = await requiredAdapter.convertMessageToXMsg(messageData);
        }
        catch (ex) {
            this.logger.error(`Failed to convert raw message to XMessage: ${ex}`);
        }
        if (!xmsg) {
            this.logger.error(`Received unsupported message on inbound: ${messageData}`);
            throw new BadRequestException('Message type not supported by adapter!');
        }
        switch (xmsg.messageType) {
            case MessageType.REPORT:
                this.logger.log('Storing message delivery report');
                this.supabaseService.writeMessage(xmsg);
                break;
            case MessageType.FEEDBACK_POSITIVE:
                this.logger.log(`Sending positive feedback message for messageId: ${xmsg.messageId}`);
                this.feedbackService.givePositiveFeedback(xmsg.messageId.replyId);
                break;
            case MessageType.FEEDBACK_NEGATIVE:
                this.logger.log(`Sending negative feedback message for messageId: ${xmsg.messageId}`);
                this.feedbackService.giveNegativeFeedback(xmsg.messageId.replyId);
                break;
            case MessageType.FEEDBACK_NEUTRAL:
                this.logger.log(`Sending neutral feedback message for messageId: ${xmsg.messageId}`);
                this.feedbackService.giveNeutralFeedback(xmsg.messageId.replyId);
                break;
            default:
                xmsg.app = botData.id;
                xmsg.adapterId = adapterId;
                const adapterCredentials = await this.credentialService.getCredentialsFromVault(adapterConfigVariable);
                if (!adapterCredentials) {
                    throw new NotFoundException('Adapter credentials not found!');
                }
                const userHistory = await this.supabaseService.getUserHistory(xmsg.from?.userID, botData.id);
                this.supabaseService.writeMessage(xmsg);

                const templateResp = JSON.parse(JSON.stringify(xmsg));
                templateResp.to.userID = xmsg.from?.userID;
                templateResp.from.userID = xmsg.to?.userID;
                templateResp.payload.text = 'Thank you for your question! Our chatbot is working diligently to provide you with the best possible answer. Generating responses may take a moment, so please be patient.';
                this.outboundService.handleOrchestratorResponse(templateResp, adapterCredentials);

                const orchestratorServiceUrl = this.configService.get<string>('ORCHESTRATOR_API_ENDPOINT');
                axios.post(
                    `${orchestratorServiceUrl}/prompt`,
                    {
                        'xstate': botData.logic.transformer?.config,
                        'message': xmsg,
                        'userHistory': userHistory
                    },
                    {
                        headers: {
                            'Content-Type': 'application/json'
                        }
                    }
                );
        }
    }
}