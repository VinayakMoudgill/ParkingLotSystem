import { IsInt, IsPositive } from 'class-validator';

export class CreateParkingLotDto {
  @IsInt()
  @IsPositive()
  no_of_slot: number;
}
