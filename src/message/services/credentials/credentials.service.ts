import { HttpStatus, Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import axios from 'axios';
import { WebClientProvider } from '../webclient/webclient.provider';

@Injectable()
export class CredentialService {
    private readonly logger = new Logger(CredentialService.name);

    constructor(
        private readonly configService: ConfigService,
        private readonly webClientProvider: WebClientProvider,
    ) {}

    async getCredentialsForAdapter(
        adapterId: string,
    ): Promise<any> {
        this.logger.log(`Fetching credentials for adapter: ${adapterId}`)
        if (!adapterId) {
            return undefined;
        }
        const response = await this.webClientProvider.getUciApiWebClient().get(`/admin/adapter/${adapterId}`)
        if (response.status == HttpStatus.OK) {
            const variableName = response.data.result?.config?.credentials?.variable;
            return await this.getCredentialsFromVault(variableName);
        }
        else {
            this.logger.error(`Could not fetch adapter: ${adapterId}`)
            return undefined;
        }
    }

    private async getCredentialsFromVault(
        variableName: string,
    ): Promise<any> {
        const response = await this.webClientProvider.getUciApiWebClient({
            'ownerId': this.configService.get<string>('OWNER_ID'),
        }).get(`/admin/secret/${variableName}`);
        if (response.status == HttpStatus.OK) {
            const resp = response.data.result;
            if (resp && Object.keys(resp).length != 0) {
                return resp[Object.keys(resp)[0]];
            }
            else {
                return undefined;
            }
        }
        else {
            console.error(`Could not get secret for variable: ${variableName}`);
            return undefined;
        }
    }
}
