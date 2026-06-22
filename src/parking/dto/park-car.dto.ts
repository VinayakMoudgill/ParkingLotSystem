import { IsNotEmpty, IsOptional, IsString } from 'class-validator';

export class ParkCarDto {
  @IsString()
  @IsNotEmpty()
  car_reg_no: string;

  @IsString()
  @IsNotEmpty()
  car_color: string;

  // Which floor to park on. Optional — when omitted, the first floor with a free
  // slot (top-down) is used.
  @IsOptional()
  @IsString()
  floor_id?: string;
}
