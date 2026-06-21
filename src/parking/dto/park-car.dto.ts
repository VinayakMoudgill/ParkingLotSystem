import { IsNotEmpty, IsString } from 'class-validator';

export class ParkCarDto {
  @IsString()
  @IsNotEmpty()
  car_reg_no: string;

  @IsString()
  @IsNotEmpty()
  car_color: string;
}
