import { IsUUID, IsString, IsOptional, IsArray, IsEnum, IsNumber } from 'class-validator';
import { MessageState } from '@samagra-x/xmessage';

export enum MessageStatus {
  DEFAULT = 'DEFAULT',
  DELIVERED = 'DELIVERED',
  RECEIVED = 'RECEIVED',
  SENT = 'SENT',
  PROCESSED = 'PROCESSED',
}

export class XMessageDbDto {
  @IsOptional()
  @IsUUID()
  id?: string;

  @IsString()
  userid: string;

  @IsString()
  fromid: string;

  @IsOptional()
  @IsString()
  channel?: string;

  @IsOptional()
  @IsString()
  provider?: string;

  @IsNumber()
  timestamp: string;

  @IsOptional()
  @IsString()
  messagestate?: MessageState;

  @IsOptional()
  @IsString()
  xmessage?: Object;

  @IsOptional()
  @IsString()
  app?: string;

  @IsOptional()
  @IsString()
  auxdata?: string;

  @IsOptional()
  @IsString()
  messageid?: Object;

  @IsOptional()
  @IsString()
  replyid?: string;

  @IsOptional()
  @IsString()
  causeid?: string;

  @IsOptional()
  @IsUUID()
  sessionid?: string;

  @IsOptional()
  @IsString()
  ownerorgid?: string;

  @IsOptional()
  @IsString()
  ownerid?: string;

  @IsOptional()
  @IsUUID()
  botuuid?: string;

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  tags?: string[];

  @IsOptional()
  @IsString()
  respmsgid?: string;

  @IsOptional()
  @IsString()
  remarks?: string;

  // @IsOptional()
  // @IsEnum(MessageStatus)
  // status?: MessageStatus;
}
