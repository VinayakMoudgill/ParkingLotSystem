import { IsInt, IsPositive } from 'class-validator';

export class AddSlotsDto {
  @IsInt()
  @IsPositive()
  no_of_slot: number;
}
