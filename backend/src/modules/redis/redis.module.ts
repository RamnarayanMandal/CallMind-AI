import { Module, Global } from '@nestjs/common';
import { RedisService } from './redis.service';
import { OrgContextCacheService } from './org-context-cache.service';
import { ServicesModule } from '../../services/services.module';

@Global()
@Module({
  imports: [ServicesModule],
  providers: [RedisService, OrgContextCacheService],
  exports: [RedisService, OrgContextCacheService],
})
export class RedisModule {}
