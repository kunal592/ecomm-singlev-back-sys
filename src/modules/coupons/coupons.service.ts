import {
  Injectable,
  BadRequestException,
  NotFoundException,
  ConflictException,
} from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { CreateCouponDto } from './dto/create-coupon.dto';
import { UpdateCouponDto } from './dto/update-coupon.dto';
import { CouponQueryDto } from './dto/coupon-query.dto';
import { DiscountType } from '@prisma/client';

@Injectable()
export class CouponsService {
  constructor(private prisma: PrismaService) {}

  // ─── ADMIN CRUD ────────────────────────────────────────────────

  async create(dto: CreateCouponDto) {
    const existingCoupon = await this.prisma.coupon.findUnique({
      where: { code: dto.code.toUpperCase() },
    });

    if (existingCoupon) {
      throw new ConflictException(`Coupon code "${dto.code}" already exists`);
    }

    const { categoryIds, ...couponData } = dto;

    return this.prisma.coupon.create({
      data: {
        ...couponData,
        code: couponData.code.toUpperCase(),
        validFrom: couponData.validFrom
          ? new Date(couponData.validFrom)
          : new Date(),
        validUntil: new Date(couponData.validUntil),
        ...(categoryIds?.length && {
          categories: {
            connect: categoryIds.map((id) => ({ id })),
          },
        }),
      },
      include: { categories: true },
    });
  }

  async findAll(query: CouponQueryDto) {
    const { page = 1, limit = 10, search, isActive } = query;
    const skip = (page - 1) * limit;

    const where: any = {};
    if (search) {
      where.OR = [
        { code: { contains: search, mode: 'insensitive' } },
        { description: { contains: search, mode: 'insensitive' } },
      ];
    }
    if (isActive !== undefined) where.isActive = isActive;

    const [items, total] = await Promise.all([
      this.prisma.coupon.findMany({
        where,
        skip,
        take: limit,
        include: { categories: true, _count: { select: { usages: true } } },
        orderBy: { createdAt: 'desc' },
      }),
      this.prisma.coupon.count({ where }),
    ]);

    return {
      items,
      meta: {
        total,
        page,
        lastPage: Math.ceil(total / limit),
      },
    };
  }

  async findOne(id: string) {
    const coupon = await this.prisma.coupon.findUnique({
      where: { id },
      include: {
        categories: true,
        _count: { select: { usages: true, orders: true } },
      },
    });
    if (!coupon) throw new NotFoundException('Coupon not found');
    return coupon;
  }

  async update(id: string, dto: UpdateCouponDto) {
    await this.findOne(id); // Ensure it exists

    const { categoryIds, ...couponData } = dto;

    const data: any = { ...couponData };
    if (couponData.code) data.code = couponData.code.toUpperCase();
    if (couponData.validFrom) data.validFrom = new Date(couponData.validFrom);
    if (couponData.validUntil) data.validUntil = new Date(couponData.validUntil);

    if (categoryIds !== undefined) {
      // Disconnect all existing categories and reconnect the new ones
      data.categories = {
        set: [],
        ...(categoryIds.length && {
          connect: categoryIds.map((id) => ({ id })),
        }),
      };
    }

    return this.prisma.coupon.update({
      where: { id },
      data,
      include: { categories: true },
    });
  }

  async remove(id: string) {
    await this.findOne(id);
    return this.prisma.coupon.delete({ where: { id } });
  }

  async toggleActive(id: string) {
    const coupon = await this.findOne(id);
    return this.prisma.coupon.update({
      where: { id },
      data: { isActive: !coupon.isActive },
    });
  }

  // ─── CUSTOMER-FACING ──────────────────────────────────────────

  /**
   * Validates a coupon code against the user's cart and returns
   * the discount breakdown without consuming the coupon.
   */
  async validateCoupon(code: string, userId: string) {
    const coupon = await this.getCouponByCode(code);
    const cart = await this.getUserCart(userId);

    const cartTotal = this.calculateCartTotal(cart.items);

    await this.assertCouponValid(coupon, userId, cartTotal, cart.items);

    const discount = this.calculateDiscount(coupon, cartTotal);

    return {
      valid: true,
      coupon: {
        id: coupon.id,
        code: coupon.code,
        description: coupon.description,
        discountType: coupon.discountType,
        discountValue: coupon.discountValue,
      },
      cartTotal,
      discountAmount: discount,
      finalAmount: cartTotal - discount,
    };
  }

  /**
   * Called internally by OrdersService during checkout to apply
   * the coupon, record usage, and return the discount.
   */
  async applyCouponToOrder(
    couponCode: string,
    userId: string,
    orderId: string,
    cartTotal: number,
    cartItems: any[],
  ) {
    const coupon = await this.getCouponByCode(couponCode);
    await this.assertCouponValid(coupon, userId, cartTotal, cartItems);

    const discount = this.calculateDiscount(coupon, cartTotal);

    // Increment usage counter + record usage in a transaction
    await this.prisma.$transaction([
      this.prisma.coupon.update({
        where: { id: coupon.id },
        data: { usedCount: { increment: 1 } },
      }),
      this.prisma.couponUsage.create({
        data: {
          couponId: coupon.id,
          userId,
          orderId,
        },
      }),
    ]);

    return {
      couponId: coupon.id,
      couponCode: coupon.code,
      discountAmount: discount,
    };
  }

  // ─── PRIVATE HELPERS ──────────────────────────────────────────

  private async getCouponByCode(code: string) {
    const coupon = await this.prisma.coupon.findUnique({
      where: { code: code.toUpperCase() },
      include: { categories: true },
    });
    if (!coupon) throw new NotFoundException('Invalid coupon code');
    return coupon;
  }

  private async getUserCart(userId: string) {
    const cart = await this.prisma.cart.findUnique({
      where: { userId },
      include: { items: { include: { product: { include: { category: true } } } } },
    });
    if (!cart || !cart.items.length) {
      throw new BadRequestException('Cart is empty');
    }
    return cart;
  }

  private calculateCartTotal(items: any[]): number {
    return items.reduce(
      (acc: number, item: any) =>
        acc + (item.product.discountedPrice || item.product.price) * item.quantity,
      0,
    );
  }

  private calculateDiscount(coupon: any, cartTotal: number): number {
    let discount = 0;

    if (coupon.discountType === DiscountType.PERCENTAGE) {
      discount = (cartTotal * coupon.discountValue) / 100;
      // Apply the max-discount cap
      if (coupon.maxDiscount && discount > coupon.maxDiscount) {
        discount = coupon.maxDiscount;
      }
    } else {
      // FLAT discount
      discount = coupon.discountValue;
    }

    // Discount can never exceed the cart total
    return Math.min(discount, cartTotal);
  }

  private async assertCouponValid(
    coupon: any,
    userId: string,
    cartTotal: number,
    cartItems: any[],
  ) {
    // 1. Active check
    if (!coupon.isActive) {
      throw new BadRequestException('This coupon is not active');
    }

    // 2. Date validity
    const now = new Date();
    if (now < new Date(coupon.validFrom)) {
      throw new BadRequestException('This coupon is not yet valid');
    }
    if (now > new Date(coupon.validUntil)) {
      throw new BadRequestException('This coupon has expired');
    }

    // 3. Global usage limit
    if (coupon.usageLimit !== null && coupon.usedCount >= coupon.usageLimit) {
      throw new BadRequestException('This coupon has reached its usage limit');
    }

    // 4. Per-user limit
    const userUsageCount = await this.prisma.couponUsage.count({
      where: { couponId: coupon.id, userId },
    });
    if (userUsageCount >= coupon.perUserLimit) {
      throw new BadRequestException('You have already used this coupon the maximum number of times');
    }

    // 5. Minimum order amount
    if (cartTotal < coupon.minOrderAmount) {
      throw new BadRequestException(
        `Minimum order amount of ₹${coupon.minOrderAmount} required to use this coupon`,
      );
    }

    // 6. Category restriction
    if (coupon.categories && coupon.categories.length > 0) {
      const allowedCategoryIds = coupon.categories.map((c: any) => c.id);
      const allItemsMatch = cartItems.every((item: any) => {
        const categoryId = item.product?.categoryId || item.product?.category?.id;
        return allowedCategoryIds.includes(categoryId);
      });
      if (!allItemsMatch) {
        throw new BadRequestException(
          'This coupon is only valid for specific categories. Some items in your cart are not eligible.',
        );
      }
    }
  }
}
