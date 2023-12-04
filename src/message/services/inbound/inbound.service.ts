import { Injectable, Logger } from '@nestjs/common';
import { GSWhatsAppMessage, convertMessageToXMsg, convertXMessageToMsg, gupshupWhatsappAdapterServiceConfig } from '@samagra-x/gupshup-whatsapp-adapter';
import { ConfigService } from '@nestjs/config';
import axios from 'axios';
import { url } from 'inspector';

@Injectable()
export class InboundService {
    constructor(private configService: ConfigService){}
    private readonly logger = new Logger(InboundService.name)
    async handleIncomingGsWhatsappMessage(whatsappMessage: GSWhatsAppMessage) {
        gupshupWhatsappAdapterServiceConfig.setConfig({
            baseUrl: this.configService.get<string>('BASE_URL'),
            adminToken: this.configService.get<string>('ADAPTER_ADMIN_TOKEN'),
            vaultServiceToken: this.configService.get<string>('VAULT_SERVICE_TOKEN'),
            vaultServiceUrl: this.configService.get<string>('VAULT_SERVICE_URL'),
            gupshupUrl: this.configService.get<string>('GUPSHUP_API_ENDPOINT')
          })
        
        const xMessagePayload = await convertMessageToXMsg(whatsappMessage)
        this.logger.log(xMessagePayload)
        const orchestratorServiceUrl = this.configService.get<string>('ORCHESTRATOR_API_ENDPOINT')
        const resp = await axios.post(orchestratorServiceUrl, xMessagePayload, {
            headers: {
                    'Content-Type': 'application/json',
                }
        })
        //log to supabase
        //handle errors
    }

}