import { Injectable } from '@nestjs/common';
import { convertXMessageToMsg, gupshupWhatsappAdapterServiceConfig } from '@samagra-x/gupshup-whatsapp-adapter';
import { ConfigService } from '@nestjs/config';
import { XMessage } from '@samagra-x/xmessage';

@Injectable()
export class OutboundService {
    constructor(private configService: ConfigService){}

    async handleOrchestratorRequest(orchestratorRequest: XMessage) {
        gupshupWhatsappAdapterServiceConfig.setConfig({
            baseUrl: this.configService.get<string>('BASE_URL'),
            adminToken: this.configService.get<string>('ADAPTER_ADMIN_TOKEN'),
            vaultServiceToken: this.configService.get<string>('VAULT_SERVICE_TOKEN'),
            vaultServiceUrl: this.configService.get<string>('VAULT_SERVICE_URL'),
            gupshupUrl: this.configService.get<string>('GUPSHUP_API_ENDPOINT')
          })

        await convertXMessageToMsg(orchestratorRequest)
    }
}
