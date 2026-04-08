import { IsString, IsNotEmpty } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class ApplyCouponDto {
  @ApiProperty({ example: 'SUMMER25', description: 'Coupon code to apply' })
  @IsString()
  @IsNotEmpty()
  code: string;
}
