import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { AdminStore } from './admin.store';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';
import { JwtAuthGuard } from './jwt-auth.guard';
import { JWT_EXPIRES_IN, JWT_SECRET } from './auth.constants';

@Module({
  imports: [
    JwtModule.register({
      secret: JWT_SECRET,
      signOptions: { expiresIn: JWT_EXPIRES_IN },
    }),
  ],
  controllers: [AuthController],
  providers: [AuthService, AdminStore, JwtAuthGuard],
  // Export JwtModule so other modules (e.g. ParkingModule) can use JwtAuthGuard
  exports: [JwtModule],
})
export class AuthModule {}
