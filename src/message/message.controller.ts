import { Controller, Post } from '@nestjs/common';

@Controller('/gupshup/whatsapp')
export class MessageController {
    constructor() {} //Create a message Service to import

    @Post()
    handleIncomingMessageData(): string {
        return "Message To Be Received HERE!"
    }
}