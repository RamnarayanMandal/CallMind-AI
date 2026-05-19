import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { MongooseModule } from '@nestjs/mongoose';
import { ThrottlerModule } from '@nestjs/throttler';
import { ScheduleModule } from '@nestjs/schedule';
import { BullModule } from '@nestjs/bull';
import { AuthModule } from './modules/auth/auth.module';
import { OrganizationModule } from './modules/organization/organization.module';
import { AgentModule } from './modules/agent/agent.module';
import { CustomerModule } from './modules/customer/customer.module';
import { CallModule } from './modules/call/call.module';
import { ConversationModule } from './modules/conversation/conversation.module';
import { SchedulerModule } from './modules/scheduler/scheduler.module';
import { AnalyticsModule } from './modules/analytics/analytics.module';
import { TelephonyModule } from './modules/telephony/telephony.module';
import { AiModule } from './modules/ai/ai.module';
import { DemoModule } from './modules/demo/demo.module';
import { appConfig, databaseConfig, jwtConfig, redisConfig, telephonyConfig } from './config';
import { SubscriptionModule } from './modules/subscription/subscription.module';
import { AdminModule } from './modules/admin/admin.module';
import { MailModule } from './modules/mail/mail.module';
import { AuditModule } from './modules/audit/audit.module';
import { APP_GUARD } from '@nestjs/core';
import { ThrottlerGuard } from '@nestjs/throttler';
import { ProvidersModule } from './providers/providers.module';


@Module({
  imports: [
    // Configuration
    ConfigModule.forRoot({
      isGlobal: true,
      load: [appConfig, databaseConfig, jwtConfig, redisConfig, telephonyConfig],
      envFilePath: '.env',
    }),

    // Database
    MongooseModule.forRootAsync({
      inject: [ConfigService],
      useFactory: (config: ConfigService) => ({
        uri: config.get<string>('database.uri'),
        dbName: config.get<string>('database.name'),
      }),
    }),

    // Rate Limiting
    ThrottlerModule.forRootAsync({
      inject: [ConfigService],
      useFactory: (config: ConfigService) => ({
        throttlers: [
          {
            ttl: config.get<number>('app.throttleTtl', 60) * 1000,
            limit: config.get<number>('app.throttleLimit', 100),
          },
        ],
      }),
    }),

    // Task Scheduling
    ScheduleModule.forRoot(),

    // Bull Queue
    BullModule.forRootAsync({
      inject: [ConfigService],
      useFactory: (config: ConfigService) => ({
        redis: {
          host: config.get<string>('redis.host', 'localhost'),
          port: config.get<number>('redis.port', 6379),
          password: config.get<string>('redis.password'),
        },
      }),
    }),

    // Feature Modules
    AuthModule,
    OrganizationModule,
    AgentModule,
    CustomerModule,
    CallModule,
    ConversationModule,
    SchedulerModule,
    AnalyticsModule,
    TelephonyModule,
    AiModule,
    DemoModule,
    SubscriptionModule,
    AdminModule,
    MailModule,
    AuditModule,
    ProvidersModule,
  ],
  providers: [
    {
      provide: APP_GUARD,
      useClass: ThrottlerGuard,
    },
  ],
})
export class AppModule {}
