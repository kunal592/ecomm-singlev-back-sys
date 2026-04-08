import {
  IsString,
  IsNotEmpty,
  IsEnum,
  IsNumber,
  IsOptional,
  IsBoolean,
  IsDateString,
  IsInt,
  Min,
  IsArray,
  IsUUID,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { DiscountType } from '@prisma/client';

export class CreateCouponDto {
  @ApiProperty({ example: 'SUMMER25', description: 'Unique coupon code' })
  @IsString()
  @IsNotEmpty()
  code: string;

  @ApiPropertyOptional({ example: 'Get 25% off on all products' })
  @IsString()
  @IsOptional()
  description?: string;

  @ApiProperty({ enum: DiscountType, example: 'PERCENTAGE' })
  @IsEnum(DiscountType)
  discountType: DiscountType;

  @ApiProperty({ example: 25, description: 'Discount value (% or flat amount)' })
  @IsNumber()
  @Min(0)
  discountValue: number;

  @ApiPropertyOptional({ example: 500, description: 'Maximum discount cap for percentage type' })
  @IsNumber()
  @IsOptional()
  @Min(0)
  maxDiscount?: number;

  @ApiPropertyOptional({ example: 999, description: 'Minimum order amount to apply coupon' })
  @IsNumber()
  @IsOptional()
  @Min(0)
  minOrderAmount?: number;

  @ApiPropertyOptional({ example: 100, description: 'Total uses allowed (null = unlimited)' })
  @IsInt()
  @IsOptional()
  @Min(1)
  usageLimit?: number;

  @ApiPropertyOptional({ example: 1, description: 'Max uses per user', default: 1 })
  @IsInt()
  @IsOptional()
  @Min(1)
  perUserLimit?: number;

  @ApiPropertyOptional({ example: '2026-04-01T00:00:00.000Z' })
  @IsDateString()
  @IsOptional()
  validFrom?: string;

  @ApiProperty({ example: '2026-06-30T23:59:59.000Z' })
  @IsDateString()
  @IsNotEmpty()
  validUntil: string;

  @ApiPropertyOptional({ default: true })
  @IsBoolean()
  @IsOptional()
  isActive?: boolean;

  @ApiPropertyOptional({
    example: ['uuid-1', 'uuid-2'],
    description: 'Restrict coupon to specific category IDs',
  })
  @IsArray()
  @IsUUID('4', { each: true })
  @IsOptional()
  categoryIds?: string[];
}
