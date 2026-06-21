import { IsString, MinLength } from 'class-validator';

export class RegisterDto {
  @IsString()
  @MinLength(3, { message: 'Username must be at least 3 characters' })
  username: string;

  @IsString()
  @MinLength(6, { message: 'Password must be at least 6 characters' })
  password: string;
}
