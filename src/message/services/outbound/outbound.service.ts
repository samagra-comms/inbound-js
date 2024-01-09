import { Injectable, Logger } from '@nestjs/common';
import {
    XMessage,
    convertXMessageToIChatOptions,
    convertXMessageToIEmailOptions,
    convertXMessageToISmsOptions,
} from '@samagra-x/xmessage';
import { AdapterFactory, AdapterType } from  '@samagra-x/uci-adapters-factory';
import { SupabaseService } from '../supabase/supabase.service';

@Injectable()
export class OutboundService {

    private readonly logger = new Logger(OutboundService.name);

    constructor(
        readonly supabaseService: SupabaseService,
    ) { }

    async handleOrchestratorResponse(orchestratorRequest: XMessage, credentials?: Record<string, string>) {
        this.supabaseService.writeMessage(orchestratorRequest);
        const adapterType = `${orchestratorRequest.providerURI}${orchestratorRequest.channelURI}`;
        const adapter = AdapterFactory.getAdapter({
            type: adapterType,
            config: credentials
        });
        let adapterResponse;
        if (AdapterFactory.getAdapterType(adapterType) == AdapterType.EMAIL) {
            adapterResponse = await adapter.sendMessage(
                //@ts-ignore
                convertXMessageToIEmailOptions(orchestratorRequest)
            );
        }
        else if (AdapterFactory.getAdapterType(adapterType) == AdapterType.SMS) {
            adapterResponse = await adapter.sendMessage(
                //@ts-ignore
                convertXMessageToISmsOptions(orchestratorRequest)
            );
        }
        else if (AdapterFactory.getAdapterType(adapterType) == AdapterType.CHAT) {
            //@ts-ignore
            adapterResponse = await adapter.sendMessage(
                //@ts-ignore
                convertXMessageToIChatOptions(orchestratorRequest)
            );
        }
        else if (AdapterFactory.getAdapterType(adapterType) == AdapterType.GUPSHUP_WHATSAPP) {
            //@ts-ignore
            adapterResponse = await adapter.sendMessage(orchestratorRequest);
        }
        else {
            //@ts-ignore
            throw new Error('Unsupported Adapter!');
        }
    }
}
