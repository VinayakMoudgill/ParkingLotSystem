import { IsInt, IsOptional, IsPositive, IsString, MaxLength } from 'class-validator';

export class CreateParkingLotDto {
  @IsInt()
  @IsPositive()
  no_of_slot: number;

  // Optional name for the first floor (e.g. "B1" for a mall). Defaults to
  // "Ground Floor" when omitted.
  @IsOptional()
  @IsString()
  @MaxLength(40)
  name?: string;
}
