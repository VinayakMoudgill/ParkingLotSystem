import { Module } from '@nestjs/common';
import { ParkingModule } from './parking/parking.module';
import { AuthModule } from './auth/auth.module';

@Module({
  imports: [ParkingModule, AuthModule],
})
export class AppModule {}
