import { Module } from '@nestjs/common';
import { StoreConfigService } from './store-config.service';
import { StoreConfigController } from './store-config.controller';

@Module({
  controllers: [StoreConfigController],
  providers: [StoreConfigService],
  exports: [StoreConfigService],
})
export class StoreConfigModule {}
