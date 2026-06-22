import { IsNotEmpty, IsString, MaxLength } from 'class-validator';

export class RenameFloorDto {
  @IsString()
  @IsNotEmpty()
  @MaxLength(40)
  name: string;
}
