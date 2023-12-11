import { Body, Controller, Post } from '@nestjs/common';
import { XMessage } from '@samagra-x/xmessage';
import { OutboundService } from 'src/message/services/outbound/outbound.service';

@Controller('/outbound/gupshup/whatsapp')
export class OutboundMessageController {
    constructor(private readonly outboundService: OutboundService) {}

    @Post()
    async handleIncomingXMessage(@Body() orchestratorRequest: XMessage): Promise<any> {

        if (orchestratorRequest.from.bot) {
            if ( 'botMobileNumber' in orchestratorRequest.from.meta) {
                const botMobileNumber = orchestratorRequest.from.meta.botMobileNumber as string
                const credentials = await this.outboundService.getAdapterCredentials(botMobileNumber)
                await this.outboundService.handleOrchestratorResponse(orchestratorRequest, credentials)
            }
        }

        
    }
    
}
