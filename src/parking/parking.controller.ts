import {
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  Patch,
  Post,
  UseGuards,
} from '@nestjs/common';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { ClearSlotDto } from './dto/clear-slot.dto';
import { CreateParkingLotDto } from './dto/create-parking-lot.dto';
import { ExpandParkingLotDto } from './dto/expand-parking-lot.dto';
import { ParkCarDto } from './dto/park-car.dto';
import { ParkingService } from './parking.service';

@Controller()
export class ParkingController {
  constructor(private readonly parkingService: ParkingService) {}

  // POST /parking_lot  →  Initialize the parking lot (admin only)
  @Post('parking_lot')
  @UseGuards(JwtAuthGuard)
  @HttpCode(HttpStatus.CREATED)
  initializeParkingLot(@Body() dto: CreateParkingLotDto) {
    return this.parkingService.initialize(dto.no_of_slot);
  }

  // PATCH /parking_lot  →  Add more slots (admin only)
  @Patch('parking_lot')
  @UseGuards(JwtAuthGuard)
  expandParkingLot(@Body() dto: ExpandParkingLotDto) {
    return this.parkingService.expand(dto.increment_slot);
  }

  // POST /park  →  Park a car, get back the allocated slot number (admin only)
  @Post('park')
  @UseGuards(JwtAuthGuard)
  @HttpCode(HttpStatus.CREATED)
  parkCar(@Body() dto: ParkCarDto) {
    return this.parkingService.park(dto.car_reg_no, dto.car_color);
  }

  // POST /clear  →  Free a slot (by slot number OR registration number) (admin only)
  @Post('clear')
  @UseGuards(JwtAuthGuard)
  @HttpCode(HttpStatus.OK)
  clearSlot(@Body() dto: ClearSlotDto) {
    return this.parkingService.clear(dto.slot_number, dto.car_registration_no);
  }

  // GET /parking_lot  →  Lot info (initialized?, total slots, occupied count)
  @Get('parking_lot')
  getLotInfo() {
    return this.parkingService.getLotInfo();
  }

  // GET /status  →  All currently occupied slots
  @Get('status')
  getStatus() {
    return this.parkingService.getStatus();
  }

  // GET /registration_numbers/:color  →  All car plates of a given color
  @Get('registration_numbers/:color')
  getRegistrationsByColor(@Param('color') color: string) {
    return this.parkingService.getRegistrationsByColor(color);
  }

  // GET /slot/:registration_number  →  Which slot is this car parked in?
  @Get('slot/:registration_number')
  getSlotByRegistration(@Param('registration_number') regNo: string) {
    return this.parkingService.getSlotByRegistration(regNo);
  }

  // GET /slot_numbers/:color  →  All slot numbers occupied by a given color
  @Get('slot_numbers/:color')
  getSlotsByColor(@Param('color') color: string) {
    return this.parkingService.getSlotsByColor(color);
  }
}
