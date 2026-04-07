import { Injectable, BadRequestException, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { CreateOrderDto } from './dto/create-order.dto';
import { CartService } from '../cart/cart.service';
import { PaymentMethod, PaymentStatus, OrderStatus } from '@prisma/client';
import { StoreConfigService } from '../store-config/store-config.service';

@Injectable()
export class OrdersService {
  constructor(
    private prisma: PrismaService,
    private cartService: CartService,
    private storeConfigService: StoreConfigService,
  ) {}

  async createOrder(userId: string, dto: CreateOrderDto) {
    const cart = await this.cartService.getCart(userId);
    if (!cart.items.length) {
      throw new BadRequestException('Cart is empty');
    }

    const config = await this.storeConfigService.getConfig();
    if (!config) throw new Error('Store configuration not found');

    const orderModes = config.orderModes as any;
    
    // Validate order mode from config
    if (dto.paymentMethod === PaymentMethod.WHATSAPP && !orderModes.whatsapp) {
      throw new BadRequestException('WhatsApp ordering is not enabled');
    }
    if (dto.paymentMethod === PaymentMethod.COD && !orderModes.cod) {
      throw new BadRequestException('Cash on Delivery is not enabled');
    }
    if (dto.paymentMethod === PaymentMethod.ONLINE && !orderModes.online) {
      throw new BadRequestException('Online payment is not enabled');
    }

    const totalAmount = cart.items.reduce(
      (acc, item) => acc + (item.product.discountedPrice || item.product.price) * item.quantity,
      0,
    );

    const order = await this.prisma.order.create({
      data: {
        userId,
        customerName: dto.customerName,
        customerPhone: dto.customerPhone,
        customerAddress: dto.customerAddress,
        totalAmount,
        paymentMethod: dto.paymentMethod,
        paymentStatus: dto.paymentMethod === PaymentMethod.ONLINE ? PaymentStatus.PENDING : PaymentStatus.PENDING,
        orderStatus: OrderStatus.PLACED,
        items: {
          create: cart.items.map((item) => ({
            productId: item.productId,
            quantity: item.quantity,
            price: item.product.discountedPrice || item.product.price,
          })),
        },
      },
      include: { items: { include: { product: true } } },
    });

    // Clear cart after order creation
    await this.cartService.clearCart(userId);

    let redirectUrl = null;

    if (dto.paymentMethod === PaymentMethod.WHATSAPP) {
      const message = this.generateWhatsAppMessage(order, config.storeName);
      redirectUrl = `https://wa.me/${config.whatsappNumber}?text=${encodeURIComponent(message)}`;
    }

    return {
      order,
      redirectUrl,
    };
  }

  private generateWhatsAppMessage(order: any, storeName: string) {
    let message = `New Order from ${storeName}!\n\n`;
    message += `Order ID: ${order.id}\n`;
    message += `Customer: ${order.customerName}\n`;
    message += `Phone: ${order.customerPhone}\n\n`;
    message += `Items:\n`;
    order.items.forEach((item: any) => {
      message += `- ${item.product.name} x ${item.quantity} = ${item.price * item.quantity}\n`;
    });
    message += `\nTotal: ${order.totalAmount}\n`;
    message += `Address: ${order.customerAddress}`;
    return message;
  }

  async getMyOrders(userId: string) {
    return this.prisma.order.findMany({
      where: { userId },
      include: { items: { include: { product: true } } },
      orderBy: { createdAt: 'desc' },
    });
  }

  async getAllOrders() {
    return this.prisma.order.findMany({
      include: { items: { include: { product: true } }, user: true },
      orderBy: { createdAt: 'desc' },
    });
  }

  async updateStatus(orderId: string, status: OrderStatus) {
    return this.prisma.order.update({
      where: { id: orderId },
      data: { orderStatus: status },
    });
  }

  async updatePaymentStatus(orderId: string, status: PaymentStatus) {
    return this.prisma.order.update({
      where: { id: orderId },
      data: { paymentStatus: status },
    });
  }
}
