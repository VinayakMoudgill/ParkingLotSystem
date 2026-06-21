import { IsInt, IsPositive } from 'class-validator';

export class ExpandParkingLotDto {
  @IsInt()
  @IsPositive()
  increment_slot: number;
}
