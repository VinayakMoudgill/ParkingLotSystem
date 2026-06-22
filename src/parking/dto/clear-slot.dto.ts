import { IsInt, IsOptional, IsPositive, IsString } from 'class-validator';

export class ClearSlotDto {
  // Required when freeing by slot_number (slot numbers are per-floor).
  @IsOptional()
  @IsString()
  floor_id?: string;

  @IsOptional()
  @IsInt()
  @IsPositive()
  slot_number?: number;

  @IsOptional()
  @IsString()
  car_registration_no?: string;
}
