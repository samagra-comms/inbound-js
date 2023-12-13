import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import axios from 'axios';

@Injectable()
export class FeedbackService {
    private readonly logger = new Logger(FeedbackService.name);

    constructor(private readonly configService: ConfigService) {}

    async givePositiveFeedback(messageId) {
        const orchestratorUrl = this.configService.get<string>('ORCHESTRATOR_API_ENDPOINT');
        const feedbackUrl = `${orchestratorUrl}/feedback/query/like/${messageId}`;

        await axios.get(feedbackUrl);
    }
    
    async giveNegativeFeedback(messageId) {
        const orchestratorUrl = this.configService.get<string>('ORCHESTRATOR_API_ENDPOINT');
        const feedbackUrl = `${orchestratorUrl}/feedback/query/dislike/${messageId}`;

        await axios.get(feedbackUrl)
    }
}