import { IsInt, IsOptional, IsPositive, IsString } from 'class-validator';

export class ClearSlotDto {
  @IsOptional()
  @IsInt()
  @IsPositive()
  slot_number?: number;

  @IsOptional()
  @IsString()
  car_registration_no?: string;
}
