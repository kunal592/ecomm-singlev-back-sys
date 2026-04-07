import { Injectable, BadRequestException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { OrdersService } from '../orders/orders.service';
import { PaymentStatus } from '@prisma/client';
import * as crypto from 'crypto';

@Injectable()
export class PaymentsService {
  constructor(
    private configService: ConfigService,
    private ordersService: OrdersService,
  ) {}

  // Mocking Razorpay Order Creation
  async createPaymentOrder(orderId: string, amount: number) {
    // In real implementation:
    // const razorpay = new Razorpay({ key_id: '...', key_secret: '...' });
    // return razorpay.orders.create({ amount, currency: 'INR', receipt: orderId });
    
    return {
      id: `rzp_test_${crypto.randomBytes(8).toString('hex')}`,
      amount,
      currency: 'INR',
      receipt: orderId,
    };
  }

  async verifyPayment(orderId: string, paymentData: any) {
    // Mock Verification
    const isValid = true; // In real code, verify signature

    if (isValid) {
      await this.ordersService.updatePaymentStatus(orderId, PaymentStatus.PAID);
      return { success: true };
    } else {
      await this.ordersService.updatePaymentStatus(orderId, PaymentStatus.FAILED);
      throw new BadRequestException('Payment verification failed');
    }
  }
}
