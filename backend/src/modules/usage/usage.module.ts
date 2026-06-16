import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { UsageService } from './usage.service';
import { UsageController } from './usage.controller';
import { Usage, UsageSchema } from './schemas/usage.schema';
import { Subscription, SubscriptionSchema } from '../subscription/schemas/subscription.schema';
import { Plan, PlanSchema } from '../subscription/schemas/plan.schema';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: Usage.name, schema: UsageSchema },
      { name: Subscription.name, schema: SubscriptionSchema },
      { name: Plan.name, schema: PlanSchema },
    ]),
  ],
  controllers: [UsageController],
  providers: [UsageService],
  exports: [UsageService],
})
export class UsageModule {}
