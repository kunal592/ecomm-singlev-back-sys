import { Module } from '@nestjs/common';
import { OrdersService } from './orders.service';
import { OrdersController } from './orders.controller';
import { CartModule } from '../cart/cart.module';
import { StoreConfigModule } from '../store-config/store-config.module';
import { CouponsModule } from '../coupons/coupons.module';

@Module({
  imports: [CartModule, StoreConfigModule, CouponsModule],
  controllers: [OrdersController],
  providers: [OrdersService],
  exports: [OrdersService],
})
export class OrdersModule {}
