import { Injectable, Logger } from '@nestjs/common';
import { convertXMessageToMsg, gupshupWhatsappAdapterServiceConfig } from '@samagra-x/gupshup-whatsapp-adapter';
import { ConfigService } from '@nestjs/config';
import { MessageState, XMessage } from '@samagra-x/xmessage';

import { CredentialService } from '../credentials/credentials.service';

@Injectable()
export class OutboundService {
    constructor(
        private configService: ConfigService,
        private readonly credentialService: CredentialService
    ) {}
    private readonly logger = new Logger(OutboundService.name);

    async getAdapterCredentials(number: string) {
        console.log(number)
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
        } else if (number.endsWith("87")) {
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
            throw new Error("unknown whatsapp number")
        }
    }

    async handleOrchestratorResponse(orchestratorRequest: XMessage, credentials) {
        gupshupWhatsappAdapterServiceConfig.setConfig({
            adapterCredentials: credentials
        });

        const adapterResponse = await convertXMessageToMsg(orchestratorRequest);
        if (adapterResponse.messageState == MessageState.NOT_SENT) {
            throw new Error('Message Not Sent');
        }
    }
}
