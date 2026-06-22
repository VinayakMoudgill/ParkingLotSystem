import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  ParseIntPipe,
  Patch,
  Post,
  UseGuards,
} from '@nestjs/common';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { AddSlotsDto } from './dto/add-slots.dto';
import { ClearSlotDto } from './dto/clear-slot.dto';
import { CreateFloorDto } from './dto/create-floor.dto';
import { CreateParkingLotDto } from './dto/create-parking-lot.dto';
import { ExpandParkingLotDto } from './dto/expand-parking-lot.dto';
import { ParkCarDto } from './dto/park-car.dto';
import { RenameFloorDto } from './dto/rename-floor.dto';
import { ParkingService } from './parking.service';

@Controller()
export class ParkingController {
  constructor(private readonly parkingService: ParkingService) {}

  // POST /parking_lot  →  Initialize the parking lot (admin only)
  @Post('parking_lot')
  @UseGuards(JwtAuthGuard)
  @HttpCode(HttpStatus.CREATED)
  initializeParkingLot(@Body() dto: CreateParkingLotDto) {
    return this.parkingService.initialize(dto.no_of_slot, dto.name);
  }

  // PATCH /parking_lot  →  Add more slots to the last floor (admin only)
  @Patch('parking_lot')
  @UseGuards(JwtAuthGuard)
  expandParkingLot(@Body() dto: ExpandParkingLotDto) {
    return this.parkingService.expand(dto.increment_slot);
  }

  // POST /floors  →  Add a whole floor (basement or upper) (admin only)
  @Post('floors')
  @UseGuards(JwtAuthGuard)
  @HttpCode(HttpStatus.CREATED)
  addFloor(@Body() dto: CreateFloorDto) {
    return this.parkingService.addFloor(dto.name, dto.no_of_slot, dto.position);
  }

  // POST /floors/:id/slots  →  Add slots to a specific floor (admin only)
  @Post('floors/:id/slots')
  @UseGuards(JwtAuthGuard)
  @HttpCode(HttpStatus.CREATED)
  addSlotsToFloor(@Param('id') id: string, @Body() dto: AddSlotsDto) {
    return this.parkingService.addSlotsToFloor(id, dto.no_of_slot);
  }

  // PATCH /floors/:id  →  Rename a floor (admin only)
  @Patch('floors/:id')
  @UseGuards(JwtAuthGuard)
  renameFloor(@Param('id') id: string, @Body() dto: RenameFloorDto) {
    return this.parkingService.renameFloor(id, dto.name);
  }

  // DELETE /floors/:id  →  Remove a floor (blocked if a car is parked) (admin only)
  @Delete('floors/:id')
  @UseGuards(JwtAuthGuard)
  removeFloor(@Param('id') id: string) {
    return this.parkingService.removeFloor(id);
  }

  // DELETE /floors/:id/slots/:slot_number  →  Remove an empty slot on a floor (admin only)
  @Delete('floors/:id/slots/:slot_number')
  @UseGuards(JwtAuthGuard)
  removeSlot(
    @Param('id') id: string,
    @Param('slot_number', ParseIntPipe) slotNumber: number,
  ) {
    return this.parkingService.removeSlot(id, slotNumber);
  }

  // GET /layout  →  Floors with per-slot occupancy (drives the live grid)
  @Get('layout')
  getLayout() {
    return this.parkingService.getLayout();
  }

  // POST /park  →  Park a car, get back the allocated slot number (admin only)
  @Post('park')
  @UseGuards(JwtAuthGuard)
  @HttpCode(HttpStatus.CREATED)
  parkCar(@Body() dto: ParkCarDto) {
    return this.parkingService.park(dto.car_reg_no, dto.car_color, dto.floor_id);
  }

  // POST /clear  →  Free a slot (by slot number OR registration number) (admin only)
  @Post('clear')
  @UseGuards(JwtAuthGuard)
  @HttpCode(HttpStatus.OK)
  clearSlot(@Body() dto: ClearSlotDto) {
    return this.parkingService.clear(dto.floor_id, dto.slot_number, dto.car_registration_no);
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
