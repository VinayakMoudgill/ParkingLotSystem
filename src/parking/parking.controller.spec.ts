import { Test, TestingModule } from '@nestjs/testing';
import { JwtModule } from '@nestjs/jwt';
import { ParkingController } from './parking.controller';
import { ParkingService } from './parking.service';

describe('ParkingController', () => {
  let controller: ParkingController;

  beforeEach(async () => {
    // JwtModule is imported so the JwtAuthGuard on the mutation routes can be
    // instantiated. These unit tests call controller methods directly, so the
    // guard itself does not run — but its dependency must still resolve.
    const module: TestingModule = await Test.createTestingModule({
      imports: [JwtModule.register({ secret: 'test-secret' })],
      controllers: [ParkingController],
      providers: [ParkingService],
    }).compile();

    controller = module.get<ParkingController>(ParkingController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  it('POST /parking_lot — initializes the lot', () => {
    expect(controller.initializeParkingLot({ no_of_slot: 6 })).toEqual({ total_slot: 6 });
  });

  it('PATCH /parking_lot — expands the lot', () => {
    controller.initializeParkingLot({ no_of_slot: 6 });
    expect(controller.expandParkingLot({ increment_slot: 3 })).toEqual({ total_slot: 9 });
  });

  it('POST /park — parks a car and returns slot', () => {
    controller.initializeParkingLot({ no_of_slot: 6 });
    expect(
      controller.parkCar({ car_reg_no: 'KA-01-AB-1111', car_color: 'white' }),
    ).toMatchObject({ allocated_slot_number: 1 });
  });

  it('POST /clear — frees a slot by floor + slot number', () => {
    controller.initializeParkingLot({ no_of_slot: 6 });
    const floorId = controller.getLayout().floors[0].id;
    controller.parkCar({ car_reg_no: 'KA-01-AB-1111', car_color: 'white' });
    expect(controller.clearSlot({ floor_id: floorId, slot_number: 1 })).toMatchObject({
      freed_slot_number: 1,
    });
  });

  it('POST /clear — frees a slot by registration number', () => {
    controller.initializeParkingLot({ no_of_slot: 6 });
    controller.parkCar({ car_reg_no: 'KA-01-AB-1111', car_color: 'white' });
    expect(
      controller.clearSlot({ car_registration_no: 'KA-01-AB-1111' }),
    ).toMatchObject({ freed_slot_number: 1 });
  });

  it('GET /status — returns all occupied slots', () => {
    controller.initializeParkingLot({ no_of_slot: 3 });
    controller.parkCar({ car_reg_no: 'KA-01-AB-1111', car_color: 'white' });
    const status = controller.getStatus();
    expect(status).toHaveLength(1);
    expect(status[0].slot_no).toBe(1);
    expect(status[0].registration_no).toBe('KA-01-AB-1111');
  });

  it('GET /registration_numbers/:color — returns plates by color', () => {
    controller.initializeParkingLot({ no_of_slot: 3 });
    controller.parkCar({ car_reg_no: 'KA-01-AB-1111', car_color: 'white' });
    expect(controller.getRegistrationsByColor('white')).toContain('KA-01-AB-1111');
  });

  it('GET /slot/:registration_number — returns slot for a car', () => {
    controller.initializeParkingLot({ no_of_slot: 3 });
    controller.parkCar({ car_reg_no: 'KA-01-AB-1111', car_color: 'white' });
    expect(controller.getSlotByRegistration('KA-01-AB-1111')).toMatchObject({ slot_number: 1 });
  });

  it('GET /slot_numbers/:color — returns slot locations by color', () => {
    controller.initializeParkingLot({ no_of_slot: 3 });
    controller.parkCar({ car_reg_no: 'KA-01-AB-1111', car_color: 'red' });
    expect(controller.getSlotsByColor('red')).toEqual([
      expect.objectContaining({ slot_number: 1 }),
    ]);
  });
});
