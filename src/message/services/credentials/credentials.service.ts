import { Injectable, Logger } from '@nestjs/common';
import axios from 'axios';

@Injectable()
export class CredentialService {
    private readonly logger = new Logger(CredentialService.name);
    async getCredentialsFromVault(
        baseUrl: string,
        secretPath: string,
        headers: Record<string, string>
    ) {
        const webClient = axios.create({
            baseURL: baseUrl,
            headers: headers
        });

        const response = await webClient.get(`${secretPath}`);
        return response.data
    }
}
