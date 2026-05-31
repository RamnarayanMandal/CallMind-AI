import { Injectable } from '@nestjs/common';
import { ITelephonyProvider } from './telephony.interface';
import { TwilioTelephonyProvider } from './twilio.provider';
import { TelnyxTelephonyProvider } from './telnyx.provider';
import { VobizProvider } from './vobiz.provider';

@Injectable()
export class TelephonyProviderFactory {
  private providers = new Map<string, ITelephonyProvider>();

  constructor(
    private readonly twilio: TwilioTelephonyProvider,
    private readonly telnyx: TelnyxTelephonyProvider,
    private readonly vobiz: VobizProvider,
  ) {
    this.providers.set('twilio', this.twilio);
    this.providers.set('telnyx', this.telnyx);
    this.providers.set('vobiz', this.vobiz);
  }

  getProvider(providerName: string): ITelephonyProvider {
    const provider = this.providers.get(providerName?.toLowerCase());
    if (!provider) {
      // Default to Vobiz
      return this.vobiz; 
    }
    return provider;
  }
}
