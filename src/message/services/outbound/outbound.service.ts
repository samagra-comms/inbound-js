import { Injectable, Logger } from '@nestjs/common';
import { convertXMessageToMsg, gupshupWhatsappAdapterServiceConfig } from '@samagra-x/gupshup-whatsapp-adapter';
import { ConfigService } from '@nestjs/config';
import { StylingTag, XMessage } from '@samagra-x/xmessage';

@Injectable()
export class OutboundService {
    constructor(private configService: ConfigService) {}
    private readonly logger = new Logger(OutboundService.name);

    async handleOrchestratorResponse(orchestratorRequest: XMessage) {
        gupshupWhatsappAdapterServiceConfig.setConfig({
            adapter: '7b0cf232-38a2-4f9b-8070-9b988ff94c2c',
            baseUrl: this.configService.get<string>('BASE_URL'),
            adminToken: this.configService.get<string>('ADAPTER_ADMIN_TOKEN'),
            vaultServiceToken: this.configService.get<string>('VAULT_SERVICE_TOKEN'),
            vaultServiceUrl: this.configService.get<string>('VAULT_SERVICE_URL'),
            gupshupUrl: this.configService.get<string>('GUPSHUP_API_ENDPOINT')
        });

        orchestratorRequest.payload.buttonChoices = [
            {
                backmenu: true,
                key: 'positive',
                text: '👍'
            },
            {
                backmenu: true,
                key: 'negative',
                text: '👎'
            }
        ];
        orchestratorRequest.payload.stylingTag = StylingTag.QUICKREPLYBTN;

        if ("text" in orchestratorRequest.payload) {
            orchestratorRequest.payload.text = orchestratorRequest.payload.text.substring(0,1023)
            console.log(orchestratorRequest.payload.text.length)
        }

        const adapterResponse = await convertXMessageToMsg(orchestratorRequest);
        //throw if Not Sent
    }
}
