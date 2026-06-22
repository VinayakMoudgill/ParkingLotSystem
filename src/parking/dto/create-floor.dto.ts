import { IsIn, IsInt, IsNotEmpty, IsOptional, IsPositive, IsString } from 'class-validator';

export class CreateFloorDto {
  @IsString()
  @IsNotEmpty()
  name: string;

  @IsInt()
  @IsPositive()
  no_of_slot: number;

  // 'top'  → basement-style floor, filled first
  // 'bottom' → upper floor, filled last (default)
  @IsOptional()
  @IsIn(['top', 'bottom'])
  position?: 'top' | 'bottom';
}
