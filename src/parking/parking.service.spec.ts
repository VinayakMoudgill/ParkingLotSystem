import {
  BadRequestException,
  ConflictException,
  NotFoundException,
} from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { ParkingService } from './parking.service';

describe('ParkingService', () => {
  let service: ParkingService;

  // Convenience: id of the Nth floor in display order (0 = topmost).
  const floorId = (n = 0) => service.getLayout().floors[n].id;

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
      service.expand(1); // adds slot 2
      expect(service.park('KA-01-AA-0002', 'blue')).toMatchObject({ allocated_slot_number: 2 });
    });
  });

  // ─── PARK ──────────────────────────────────────────────────────────────────

  describe('park', () => {
    beforeEach(() => service.initialize(3, 'Ground'));

    it('should allocate slot 1 to the first car', () => {
      expect(service.park('KA-01-AB-1111', 'white')).toMatchObject({
        allocated_slot_number: 1,
        floor_name: 'Ground',
      });
    });

    it('should allocate slots in ascending order', () => {
      service.park('KA-01-AB-1111', 'white');
      expect(service.park('KA-01-AB-2222', 'black')).toMatchObject({ allocated_slot_number: 2 });
    });

    it('should reuse the lowest freed slot', () => {
      service.park('KA-01-AB-1111', 'white'); // slot 1
      service.park('KA-01-AB-2222', 'black'); // slot 2
      service.park('KA-01-AB-3333', 'red'); // slot 3
      service.clear(floorId(), 2); // free slot 2
      service.clear(floorId(), 1); // free slot 1
      expect(service.park('KA-01-AB-4444', 'blue')).toMatchObject({ allocated_slot_number: 1 });
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

    it('parks on a chosen floor when a floor id is given', () => {
      const { floor_id } = service.addFloor('Basement', 2, 'bottom');
      const res = service.park('KA-01-AB-9999', 'red', floor_id);
      expect(res).toMatchObject({ allocated_slot_number: 1, floor_name: 'Basement' });
    });

    it('throws when the chosen floor is full', () => {
      const { floor_id } = service.addFloor('Tiny', 1, 'bottom');
      service.park('KA-01-AB-0001', 'red', floor_id); // fills Tiny's only slot
      expect(() => service.park('KA-01-AB-0002', 'red', floor_id)).toThrow(BadRequestException);
    });
  });

  // ─── CLEAR ─────────────────────────────────────────────────────────────────

  describe('clear', () => {
    let fid: string;
    beforeEach(() => {
      service.initialize(3, 'Ground');
      fid = floorId();
      service.park('KA-01-AB-1111', 'white'); // slot 1
      service.park('KA-01-AB-2222', 'black'); // slot 2
    });

    it('should free a slot when given a floor + slot number', () => {
      expect(service.clear(fid, 1)).toMatchObject({ freed_slot_number: 1, floor_name: 'Ground' });
    });

    it('should free a slot when given a registration number', () => {
      expect(service.clear(undefined, undefined, 'KA-01-AB-2222')).toMatchObject({
        freed_slot_number: 2,
      });
    });

    it('requires a floor id when clearing by slot number', () => {
      expect(() => service.clear(undefined, 1)).toThrow(BadRequestException);
    });

    it('should throw BadRequestException if slot is already free', () => {
      service.clear(fid, 1);
      expect(() => service.clear(fid, 1)).toThrow(BadRequestException);
    });

    it('should throw NotFoundException if registration number is not in lot', () => {
      expect(() => service.clear(undefined, undefined, 'ZZ-99-ZZ-9999')).toThrow(NotFoundException);
    });

    it('should throw BadRequestException for a slot number that does not exist', () => {
      expect(() => service.clear(fid, 99)).toThrow(BadRequestException);
    });

    it('should throw BadRequestException if neither slot_number nor reg number provided', () => {
      expect(() => service.clear()).toThrow(BadRequestException);
    });

    it('freed slot should become available for parking again', () => {
      service.clear(fid, 1);
      expect(service.park('KA-01-AB-5555', 'green')).toMatchObject({ allocated_slot_number: 1 });
    });
  });

  // ─── STATUS ────────────────────────────────────────────────────────────────

  describe('getStatus', () => {
    it('should return all occupied slots with floor context', () => {
      service.initialize(3, 'Ground');
      service.park('KA-01-AB-1111', 'white'); // slot 1
      service.park('KA-01-AB-2222', 'black'); // slot 2
      const status = service.getStatus();
      expect(status).toHaveLength(2);
      expect(status[0]).toMatchObject({
        slot_no: 1,
        registration_no: 'KA-01-AB-1111',
        color: 'white',
        floor_name: 'Ground',
      });
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
    it('should return the slot number and floor', () => {
      service.initialize(3, 'Ground');
      service.park('KA-01-AB-1111', 'white');
      expect(service.getSlotByRegistration('KA-01-AB-1111')).toMatchObject({
        slot_number: 1,
        floor_name: 'Ground',
      });
    });

    it('should throw NotFoundException if car is not in the lot', () => {
      service.initialize(3);
      expect(() => service.getSlotByRegistration('XX-00-ZZ-0000')).toThrow(NotFoundException);
    });
  });

  // ─── FLOORS ────────────────────────────────────────────────────────────────

  describe('floors', () => {
    it('addFloor at the bottom appends slots and grows the total', () => {
      service.initialize(3);
      expect(service.addFloor('Floor 1', 2, 'bottom')).toEqual({
        floor_id: expect.any(String),
        total_slot: 5,
      });
    });

    it('each floor numbers its own slots starting at 1', () => {
      service.initialize(2, 'Ground');
      service.addFloor('Floor 1', 3, 'top'); // upper floor → stacks on top
      const layout = service.getLayout();
      expect(layout.floors[0].name).toBe('Floor 1');
      expect(layout.floors[0].slots.map((s) => s.slot_no)).toEqual([1, 2, 3]);
      expect(layout.floors[1].name).toBe('Ground');
      expect(layout.floors[1].slots.map((s) => s.slot_no)).toEqual([1, 2]);
    });

    it('upper floors stack above basements; auto-park fills the top floor first', () => {
      service.initialize(2, 'Ground');
      service.addFloor('Basement', 2, 'bottom'); // basement at the bottom
      service.addFloor('Floor 1', 2, 'top'); // upper floor at the top
      const names = service.getLayout().floors.map((f) => f.name);
      expect(names).toEqual(['Floor 1', 'Ground', 'Basement']);
      // No floor chosen → fills the topmost floor (Floor 1) first.
      expect(service.park('KA-01-AA-0001', 'red')).toMatchObject({ floor_name: 'Floor 1' });
    });

    it('initialize accepts a custom first-floor name', () => {
      service.initialize(3, 'B1');
      expect(service.getLayout().floors[0].name).toBe('B1');
    });

    it('renameFloor changes the name and rejects duplicates', () => {
      service.initialize(2, 'Ground');
      const { floor_id } = service.addFloor('Basement', 2, 'top');
      expect(service.renameFloor(floor_id, 'B1').name).toBe('B1');
      expect(() => service.renameFloor(floor_id, 'Ground')).toThrow(ConflictException);
    });

    it('rejects a duplicate floor name', () => {
      service.initialize(2);
      service.addFloor('Basement', 2, 'top');
      expect(() => service.addFloor('basement', 1)).toThrow(ConflictException);
    });

    it('removeFloor deletes an empty floor', () => {
      service.initialize(2);
      const { floor_id } = service.addFloor('Floor 1', 2);
      expect(service.removeFloor(floor_id)).toEqual({
        removed_floor: 'Floor 1',
        total_slot: 2,
      });
    });

    it('removeFloor refuses when a car is parked on that floor', () => {
      service.initialize(2, 'Ground');
      const { floor_id } = service.addFloor('Floor 1', 1, 'bottom');
      service.park('KA-01-AA-0003', 'green', floor_id); // park on Floor 1
      expect(() => service.removeFloor(floor_id)).toThrow(ConflictException);
    });

    it('removeFloor throws for an unknown floor id', () => {
      service.initialize(2);
      expect(() => service.removeFloor('nope')).toThrow(NotFoundException);
    });

    it('addSlotsToFloor grows just that floor', () => {
      service.initialize(2, 'Ground');
      const { floor_id } = service.addFloor('Basement', 2, 'top');
      const res = service.addSlotsToFloor(floor_id, 3); // grow Basement only
      expect(res.total_slot).toBe(7);
      const layout = service.getLayout();
      expect(layout.floors.find((f) => f.id === floor_id)!.total).toBe(5);
      expect(layout.floors.find((f) => f.name === 'Ground')!.total).toBe(2);
    });

    it('addSlotsToFloor throws for an unknown floor id', () => {
      service.initialize(2);
      expect(() => service.addSlotsToFloor('nope', 1)).toThrow(NotFoundException);
    });
  });

  // ─── DELETE A SINGLE SLOT ──────────────────────────────────────────────────

  describe('removeSlot', () => {
    let fid: string;
    beforeEach(() => {
      service.initialize(3, 'Ground');
      fid = floorId();
    });

    it('deletes an empty slot and shrinks the total', () => {
      expect(service.removeSlot(fid, 2)).toMatchObject({ removed_slot: 2, total_slot: 2 });
    });

    it('refuses to delete a slot that has a car parked in it', () => {
      service.park('KA-01-AA-0001', 'red'); // slot 1
      expect(() => service.removeSlot(fid, 1)).toThrow(ConflictException);
    });

    it('throws for a slot number that does not exist', () => {
      expect(() => service.removeSlot(fid, 99)).toThrow(BadRequestException);
    });

    it('shrinks capacity and re-flows the floor numbering after a delete', () => {
      service.removeSlot(fid, 1); // 3 slots -> 2 slots, numbering re-flows to 1,2
      expect(service.park('KA-01-AA-0001', 'red')).toMatchObject({ allocated_slot_number: 1 });
      service.park('KA-01-AA-0002', 'blue');
      expect(() => service.park('KA-01-AA-0003', 'green')).toThrow(BadRequestException);
    });
  });

  // ─── SLOTS BY COLOR ────────────────────────────────────────────────────────

  describe('getSlotsByColor', () => {
    it('should return slot locations (number + floor) for a given color', () => {
      service.initialize(5, 'Ground');
      service.park('KA-01-AB-1111', 'red'); // slot 1
      service.park('KA-01-AB-2222', 'blue'); // slot 2
      service.park('KA-01-AB-3333', 'red'); // slot 3
      expect(service.getSlotsByColor('red')).toEqual([
        { slot_number: 1, floor_name: 'Ground' },
        { slot_number: 3, floor_name: 'Ground' },
      ]);
    });

    it('should return empty array for a color with no parked cars', () => {
      service.initialize(3);
      expect(service.getSlotsByColor('yellow')).toEqual([]);
    });
  });
});
