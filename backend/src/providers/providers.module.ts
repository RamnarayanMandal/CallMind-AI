import { Module, Global } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';

// STT Providers
import { STT_PROVIDER } from './stt/stt.provider';
import { WhisperSttProvider } from './stt/whisper.provider';
import { SarvamSttProvider } from './stt/sarvam.provider';

// TTS Providers
import { TTS_PROVIDER } from './tts/tts.provider';
import { OpenAiTtsProvider } from './tts/openai-tts.provider';
import { SarvamTtsProvider } from './tts/sarvam-tts.provider';

// AI Providers
import { AI_PROVIDER, LLM_PROVIDER } from './ai/ai.provider';
import { SarvamAiProvider } from './ai/sarvam-ai.provider';
import { ExistingAiProvider } from './ai/existing-ai.provider';

import { TwilioTelephonyProvider } from './telephony/twilio.provider';
import { TelnyxTelephonyProvider } from './telephony/telnyx.provider';
import { VobizProvider } from './telephony/vobiz.provider';
import { KnowlarityProvider } from './telephony/knowlarity.provider';
import { TelephonyProviderFactory } from './telephony/telephony.factory';

// Storage Providers
import { CloudinaryProvider } from './storage/cloudinary.provider';


@Global()
@Module({
  imports: [ConfigModule],
  providers: [
    // STT, TTS, AI Providers
    WhisperSttProvider,
    SarvamSttProvider,
    OpenAiTtsProvider,
    SarvamTtsProvider,
    ExistingAiProvider,
    SarvamAiProvider,

    // Storage Providers
    CloudinaryProvider,

    // Telephony Implementations
    TwilioTelephonyProvider,
    TelnyxTelephonyProvider,
    VobizProvider,
    KnowlarityProvider,
    TelephonyProviderFactory,

    // Dynamic STT Provider Factory
    {
      provide: STT_PROVIDER,
      useFactory: (config: ConfigService, whisper: WhisperSttProvider, sarvam: SarvamSttProvider) => {
        const providerName = config.get<string>('STT_PROVIDER') || process.env.STT_PROVIDER || 'whisper';
        if (providerName.toLowerCase() === 'sarvam') return sarvam;
        return whisper;
      },
      inject: [ConfigService, WhisperSttProvider, SarvamSttProvider],
    },

    // Dynamic TTS Provider Factory
    {
      provide: TTS_PROVIDER,
      useFactory: (config: ConfigService, openai: OpenAiTtsProvider, sarvam: SarvamTtsProvider) => {
        const providerName = config.get<string>('TTS_PROVIDER') || process.env.TTS_PROVIDER || 'openai';
        if (providerName.toLowerCase() === 'sarvam') return sarvam;
        return openai;
      },
      inject: [ConfigService, OpenAiTtsProvider, SarvamTtsProvider],
    },

    // Dynamic AI Response Provider Factory
    {
      provide: AI_PROVIDER,
      useFactory: (config: ConfigService, existing: ExistingAiProvider, sarvam: SarvamAiProvider) => {
        const providerName = config.get<string>('AI_PROVIDER') || process.env.AI_PROVIDER || 'existing';
        if (providerName.toLowerCase() === 'sarvam') return sarvam;
        return existing;
      },
      inject: [ConfigService, ExistingAiProvider, SarvamAiProvider],
    },

    // Maintain backward-compatibility for LLM_PROVIDER
    {
      provide: LLM_PROVIDER,
      useFactory: (aiProvider) => aiProvider,
      inject: [AI_PROVIDER],
    },
  ],
  exports: [
    STT_PROVIDER,
    TTS_PROVIDER,
    AI_PROVIDER,
    LLM_PROVIDER,
    CloudinaryProvider,
    TelephonyProviderFactory,
  ],
})
export class ProvidersModule {}
