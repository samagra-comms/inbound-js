import { Body, Controller, Post } from '@nestjs/common';
import { XMessage } from '@samagra-x/xmessage';
import { OutboundService } from 'src/message/services/outbound/outbound.service';

@Controller('/outbound/gupshup/whatsapp')
export class OutboundMessageController {
    constructor(private readonly outboundService: OutboundService) {}

    @Post()
    async handleIncomingXMessage(@Body() orchestratorRequest: XMessage): Promise<any> {
        await this.outboundService.handleOrchestratorRequest(orchestratorRequest)
    }
    
}
