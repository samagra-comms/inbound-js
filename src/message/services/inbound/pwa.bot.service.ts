import { Injectable, Logger, NotFoundException } from "@nestjs/common";
import { CredentialService } from "../credentials/credentials.service";
import { PwaBotProvider } from "@samagra-x/uci-adapters-pwa";
import { SupabaseService } from "../supabase/supabase.service";
import axios from "axios";
import { ConfigService } from "@nestjs/config";
import { OutboundService } from "../outbound/outbound.service";
import { v4 as uuid4 } from 'uuid';

@Injectable()
export class PwaBotService {

    private readonly logger = new Logger(PwaBotService.name);

    constructor(
        private readonly credentialService: CredentialService,
        private readonly supabaseService: SupabaseService,
        private readonly configService: ConfigService,
        private readonly outboundService: OutboundService,
    ) { }

    // TODO: specify botData type
    async handleIncomingMessage(botData: any, pwaMessage: any) {
        const adapterId = botData.logicIDs[0]?.adapter?.id;
        if (!adapterId) {
            this.logger.error(`Adapter data not present in bot: ${botData}`);
            throw new NotFoundException('Adapter data not present in bot!');
        }
        const adapterCredentials = await this.credentialService.getCredentialsForAdapter(adapterId);
        if (!adapterCredentials) {
            throw new NotFoundException('Adapter credentials not found!');
        }
        const xmsg = await PwaBotProvider.convertMessageToXMsg(pwaMessage);
        xmsg.app = botData.id;
        xmsg.adapterId = adapterId;

        const userHistory = await this.supabaseService.getUserHistory(xmsg.from.userID, botData.id);
        this.supabaseService.writeMessage(xmsg);

        const templateResp = JSON.parse(JSON.stringify(xmsg));
        templateResp.to.userID = xmsg.from.userID;
        templateResp.from.userID = xmsg.to.userID;
        templateResp.messageId.Id = uuid4();
        templateResp.payload.text = 'Thank you for your question! Our chatbot is working diligently to provide you with the best possible answer. Generating responses may take a moment, so please be patient.';
        await this.outboundService.handleOrchestratorResponse(templateResp, adapterCredentials);

        const orchestratorServiceUrl = this.configService.get<string>('ORCHESTRATOR_API_ENDPOINT');
        const resp = await axios.post(
            `${orchestratorServiceUrl}/prompt`,
            {
                'botId': botData.id,
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