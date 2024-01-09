import { Injectable, Logger } from '@nestjs/common';
import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { XMessage, MessageState } from '@samagra-x/xmessage';
import { XMessageDbDto } from '../../dto/xmessage.dto';
import { ConfigService } from '@nestjs/config';

// TODO: Define type of supabase table data
@Injectable()
export class SupabaseService {
    private supabase: SupabaseClient;
    private logger = new Logger(SupabaseService.name);

    constructor(private readonly configService: ConfigService) {
        this.supabase = createClient(
            this.configService.get<string>('SUPABASE_URL'),
            this.configService.get<string>('SUPABASE_KEY')
        );
    }

    createXMessageDTO(msg: XMessage) {
        const msgData: XMessageDbDto = {
            userid: msg.to.userID as string,
            fromid: msg.from.userID,
            channel: msg.channelURI,
            provider: msg.providerURI,
            timestamp: new Date(msg.timestamp).toISOString(),
            messagestate: msg.messageState,
            app: msg.app,
            xmessage: msg,
            //auxdata:
            messageid: msg.messageId.channelMessageId,
            replyid: msg.messageId.replyId,
            status: msg.messageState
        };
        return msgData;
    }

    // async readMessagesByBotId(botUuid: string): Promise<any[]> {
    //     const { data, error } = await this.supabase.from('xmessage').select('*').eq('botUuid', botUuid);

    //     if (error) throw error;
    //     return data;
    // }

    // async readMessagesByUserId(userId: string): Promise<any[]> {
    //     const { data, error } = await this.supabase.from('xmessage').select('*').eq('userId', userId);

    //     if (error) throw error;
    //     return data;
    // }

    // async readAggregateData(startDate: string, endDate: string): Promise<any[]> {
    //     const { data, error } = await this.supabase
    //         .from('xmessage')
    //         .select('*')
    //         .gte('timestamp', startDate)
    //         .lte('timestamp', endDate);

    //     if (error) throw error;
    //     return data;
    // }

    async writeMessage(message: XMessage): Promise<any> {
        const msgData = this.createXMessageDTO(message);
        const { data, error } = await this.supabase.from('xmessage').insert([msgData]);
        if (error) throw error;
        return data;
    }

    async writeMultipleMessages(messages: XMessage[]): Promise<any[]> {
        const msgData = new Array<XMessageDbDto>();
        messages.forEach((msg) => {
            msgData.push(this.createXMessageDTO(msg));
        });

        const { data, error } = await this.supabase.from('xmessage').insert(msgData);

        if (error) throw error;
        return data;
    }

    async updateMessageStatus(messageId: string, newStatus: MessageState): Promise<any> {
        const { data, error } = await this.supabase
            .from('xmessage')
            .update({ status: newStatus })
            .eq('messageid', messageId);

        if (error) throw error;
        return data;
    }

    async getUserHistory(userID: string, botuuid: string): Promise<any[]> {
        const { data, error } = await this.supabase
            .from('xmessage')
            .select('xmessage')
            .or(
                `fromid.eq.${userID},` +
                `userid.eq.${userID}`
            )
            .eq('messagestate', 'REPLIED')
            .eq('app', botuuid);

        if (error) {
            this.logger.error(error);
            return [];
        }
        else {
            return data
            .filter(xmsg => xmsg.xmessage != null)
            .flatMap(xmsg => {
                return JSON.parse(xmsg.xmessage);
            });
        }
    }
}
