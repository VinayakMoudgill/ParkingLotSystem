import {
  BadRequestException,
  ConflictException,
  NotFoundException,
} from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { ParkingService } from './parking.service';

describe('ParkingService', () => {
  let service: ParkingService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [ParkingService],
    }).compile();

    service = module.get<ParkingService>(ParkingService);
  });

  // ─── INITIALIZE ────────────────────────────────────────────────────────────

  describe('initialize', () => {
    it('should create a parking lot with the given number of slots', () => {
      expect(service.initialize(6)).toEqual({ total_slot: 6 });
    });

    it('should throw ConflictException if called a second time', () => {
      service.initialize(6);
      expect(() => service.initialize(3)).toThrow(ConflictException);
    });
  });

  // ─── EXPAND ────────────────────────────────────────────────────────────────

  describe('expand', () => {
    it('should expand the lot and return new total', () => {
      service.initialize(6);
      expect(service.expand(3)).toEqual({ total_slot: 9 });
    });

    it('should throw BadRequestException if lot is not yet initialized', () => {
      expect(() => service.expand(3)).toThrow(BadRequestException);
    });

    it('expanded slots should be available for parking', () => {
      service.initialize(1);
      service.park('KA-01-AA-0001', 'red'); // fills slot 1
      service.expand(1);                     // adds slot 2
      expect(service.park('KA-01-AA-0002', 'blue')).toEqual({ allocated_slot_number: 2 });
    });
  });

  // ─── PARK ──────────────────────────────────────────────────────────────────

  describe('park', () => {
    beforeEach(() => service.initialize(3));

    it('should allocate slot 1 to the first car (nearest to entry)', () => {
      expect(service.park('KA-01-AB-1111', 'white')).toEqual({ allocated_slot_number: 1 });
    });

    it('should allocate slots in ascending order', () => {
      service.park('KA-01-AB-1111', 'white');
      expect(service.park('KA-01-AB-2222', 'black')).toEqual({ allocated_slot_number: 2 });
    });

    it('should reuse the lowest freed slot (nearest first)', () => {
      service.park('KA-01-AB-1111', 'white'); // slot 1
      service.park('KA-01-AB-2222', 'black'); // slot 2
      service.park('KA-01-AB-3333', 'red');   // slot 3
      service.clear(2);                        // free slot 2
      service.clear(1);                        // free slot 1
      // slot 1 is nearer than slot 2, so it must be allocated first
      expect(service.park('KA-01-AB-4444', 'blue')).toEqual({ allocated_slot_number: 1 });
    });

    it('should throw BadRequestException when the lot is full', () => {
      service.park('KA-01-AB-1111', 'white');
      service.park('KA-01-AB-2222', 'black');
      service.park('KA-01-AB-3333', 'red');
      expect(() => service.park('KA-01-AB-4444', 'blue')).toThrow(BadRequestException);
    });

    it('should throw ConflictException for duplicate registration number', () => {
      service.park('KA-01-AB-1111', 'white');
      expect(() => service.park('KA-01-AB-1111', 'black')).toThrow(ConflictException);
    });

    it('should be case-insensitive for color', () => {
      service.park('KA-01-AB-1111', 'WHITE');
      expect(service.getRegistrationsByColor('white')).toContain('KA-01-AB-1111');
    });
  });

  // ─── CLEAR ─────────────────────────────────────────────────────────────────

  describe('clear', () => {
    beforeEach(() => {
      service.initialize(3);
      service.park('KA-01-AB-1111', 'white'); // slot 1
      service.park('KA-01-AB-2222', 'black'); // slot 2
    });

    it('should free a slot when given a slot number', () => {
      expect(service.clear(1)).toEqual({ freed_slot_number: 1 });
    });

    it('should free a slot when given a registration number', () => {
      expect(service.clear(undefined, 'KA-01-AB-2222')).toEqual({ freed_slot_number: 2 });
    });

    it('should throw BadRequestException if slot is already free', () => {
      service.clear(1);
      expect(() => service.clear(1)).toThrow(BadRequestException);
    });

    it('should throw NotFoundException if registration number is not in lot', () => {
      expect(() => service.clear(undefined, 'ZZ-99-ZZ-9999')).toThrow(NotFoundException);
    });

    it('should throw BadRequestException for a slot number that does not exist', () => {
      expect(() => service.clear(99)).toThrow(BadRequestException);
    });

    it('should throw BadRequestException if neither slot_number nor reg number provided', () => {
      expect(() => service.clear()).toThrow(BadRequestException);
    });

    it('freed slot should become available for parking again', () => {
      service.clear(1);
      expect(service.park('KA-01-AB-5555', 'green')).toEqual({ allocated_slot_number: 1 });
    });
  });

  // ─── STATUS ────────────────────────────────────────────────────────────────

  describe('getStatus', () => {
    it('should return all occupied slots sorted by slot number', () => {
      service.initialize(3);
      service.park('KA-01-AB-1111', 'white'); // slot 1
      service.park('KA-01-AB-2222', 'black'); // slot 2
      const status = service.getStatus();
      expect(status).toHaveLength(2);
      expect(status[0]).toEqual({ slot_no: 1, registration_no: 'KA-01-AB-1111', color: 'white' });
      expect(status[1]).toEqual({ slot_no: 2, registration_no: 'KA-01-AB-2222', color: 'black' });
    });

    it('should return an empty array when no cars are parked', () => {
      service.initialize(3);
      expect(service.getStatus()).toEqual([]);
    });
  });

  // ─── REGISTRATIONS BY COLOR ────────────────────────────────────────────────

  describe('getRegistrationsByColor', () => {
    beforeEach(() => {
      service.initialize(5);
      service.park('KA-01-AB-1111', 'white');
      service.park('KA-01-AB-2222', 'black');
      service.park('KA-01-AB-3333', 'white');
    });

    it('should return all registration numbers for a given color', () => {
      const result = service.getRegistrationsByColor('white');
      expect(result).toContain('KA-01-AB-1111');
      expect(result).toContain('KA-01-AB-3333');
      expect(result).not.toContain('KA-01-AB-2222');
    });

    it('should return empty array if no car of that color is parked', () => {
      expect(service.getRegistrationsByColor('red')).toEqual([]);
    });
  });

  // ─── SLOT BY REGISTRATION ──────────────────────────────────────────────────

  describe('getSlotByRegistration', () => {
    it('should return the correct slot number', () => {
      service.initialize(3);
      service.park('KA-01-AB-1111', 'white');
      expect(service.getSlotByRegistration('KA-01-AB-1111')).toEqual({ slot_number: 1 });
    });

    it('should throw NotFoundException if car is not in the lot', () => {
      service.initialize(3);
      expect(() => service.getSlotByRegistration('XX-00-ZZ-0000')).toThrow(NotFoundException);
    });
  });

  // ─── SLOTS BY COLOR ────────────────────────────────────────────────────────

  describe('getSlotsByColor', () => {
    it('should return sorted slot numbers for a given color', () => {
      service.initialize(5);
      service.park('KA-01-AB-1111', 'red'); // slot 1
      service.park('KA-01-AB-2222', 'blue'); // slot 2
      service.park('KA-01-AB-3333', 'red'); // slot 3
      expect(service.getSlotsByColor('red')).toEqual([1, 3]);
    });

    it('should return empty array for a color with no parked cars', () => {
      service.initialize(3);
      expect(service.getSlotsByColor('yellow')).toEqual([]);
    });
  });
});
