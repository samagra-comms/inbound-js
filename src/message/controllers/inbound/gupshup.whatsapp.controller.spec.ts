import { Test, TestingModule } from "@nestjs/testing";
import { SupabaseService } from "../../services/supabase/supabase.service";
import { GupshupWhatsappInboundController } from "./gupshup.whatsapp.controller";
import { ConfigService } from "@nestjs/config";
import { GupshupWhatsappInboundService } from "../../../message/services/inbound/gupshup.whatsapp.service";
import { OutboundService } from "../../../message/services/outbound/outbound.service";
import { CredentialService } from "../../../message/services/credentials/credentials.service";
import { FeedbackService } from "../../../message/services/feedback/feedback.service";

describe('Whatsapp inbound controller', () => {
    let gupshupInboundController: GupshupWhatsappInboundController;
    let supabaseService: SupabaseService;

    class MockConfigService {
      get(envString: string): string {
        switch (envString) {
          case 'SUPABASE_URL': return 'http://fakesupabaseurl';
          case 'SUPABASE_KEY': return 'fakesupabasekey';
          default: return '';
        }
      }
    }

    const MockSupabaseService = {
      writeMessage: jest.fn(),
    }

    beforeEach(async () => {
      const module: TestingModule = await Test.createTestingModule({
        providers: [
          GupshupWhatsappInboundController,
          SupabaseService, {
            provide: SupabaseService,
            useValue: MockSupabaseService,
          },
          ConfigService, {
            provide: ConfigService,
            useClass: MockConfigService,
          },
          GupshupWhatsappInboundService,
          OutboundService,
          CredentialService,
          FeedbackService,
        ],
      }).compile();

      gupshupInboundController = module.get<GupshupWhatsappInboundController>(GupshupWhatsappInboundController);
      supabaseService = module.get<SupabaseService>(SupabaseService);
    });

    it('Whatsapp status report', async () => {
      const mockReport = {
        response: "[{\"srcAddr\":\"TESTSM\",\"extra\":\"Samagra\",\"channel\":\"WHATSAPP\",\"externalId\":\"5057936233376494042-daf67a98-e3a3-4f02-8d0b-02bd41ba3aae\",\"cause\":\"SUCCESS\",\"errorCode\":\"000\",\"destAddr\":\"919999999999\",\"eventType\":\"DELIVERED\",\"eventTs\":\"1702464614000\"}]",
      }
      //@ts-ignore
      await gupshupInboundController.handleIncomingMessageData(mockReport);
      expect(supabaseService.writeMessage).toHaveBeenCalled();
    })
})