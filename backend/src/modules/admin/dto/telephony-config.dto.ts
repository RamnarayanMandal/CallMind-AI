import { IsString, IsOptional, IsIn } from 'class-validator';

export const SUPPORTED_PROVIDERS = ['twilio', 'telnyx', 'vobiz', 'knowlarity'] as const;
export type TelephonyProviderName = typeof SUPPORTED_PROVIDERS[number];

export class UpdateTelephonyConfigDto {
  @IsString()
  @IsIn(SUPPORTED_PROVIDERS)
  defaultTelephonyProvider: TelephonyProviderName;

  @IsOptional()
  @IsString()
  telephonyAccountId?: string;

  @IsOptional()
  @IsString()
  telephonyAuthToken?: string;

  @IsOptional()
  @IsString()
  telephonyFromNumber?: string;

  @IsOptional()
  telephonyMetadata?: Record<string, any>;
}
