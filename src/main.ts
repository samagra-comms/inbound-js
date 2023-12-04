import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
// import axios from 'axios';
// import {XMessage, MessageState, MessageType} from "xmessage";
// import {} from "userservice";
// import {configService} from "botservice";
// import {GSWhatsAppMessage, convertXMessageToMsg} from "gupshup-whatsapp-adapter";
// import { measureMemory } from 'vm';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  await app.listen(3000);
}
bootstrap();
