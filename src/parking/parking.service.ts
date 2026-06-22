import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';

interface CarInfo {
  registrationNo: string;
  color: string;
}

// A slot is a physical bay. Its number is LOCAL to its floor and computed from
// position, so every floor is numbered independently starting at 1.
interface Slot {
  car: CarInfo | null;
}

interface Floor {
  id: string;
  name: string;
  slots: Slot[];
}

export type FloorPosition = 'top' | 'bottom';

@Injectable()
export class ParkingService {
  // Floors in physical / display order — index 0 is the topmost floor (an upper
  // floor) and is filled first; basements sit at the bottom and fill last.
  private floors: Floor[] = [];
  private nextFloorSeq = 1;

  // ─── 1. Initialize ───────────────────────────────────────────────────────────

  initialize(noOfSlot: number, name?: string): { total_slot: number } {
    if (this.floors.length > 0) {
      throw new ConflictException('Parking lot is already initialized');
    }
    this.createFloor((name ?? 'Ground Floor').trim() || 'Ground Floor', noOfSlot, 'bottom');
    return { total_slot: this.totalSlots };
  }

  // ─── 2. Expand (add slots to the last floor) ─────────────────────────────────

  expand(incrementSlot: number): { total_slot: number } {
    this.ensureInitialized();
    const lastFloor = this.floors[this.floors.length - 1];
    for (let i = 0; i < incrementSlot; i++) {
      lastFloor.slots.push({ car: null });
    }
    return { total_slot: this.totalSlots };
  }

  // ─── 2b. Add a whole floor (basement or upper floor) ─────────────────────────

  addFloor(
    name: string,
    noOfSlot: number,
    position: FloorPosition = 'top',
  ): { floor_id: string; total_slot: number } {
    const trimmed = name.trim();
    if (!trimmed) {
      throw new BadRequestException('Floor name is required');
    }
    this.assertNameAvailable(trimmed);
    const floor = this.createFloor(trimmed, noOfSlot, position);
    return { floor_id: floor.id, total_slot: this.totalSlots };
  }

  // ─── 2b-ii. Add slots to a specific floor ────────────────────────────────────

  addSlotsToFloor(floorId: string, count: number): { floor_id: string; total_slot: number } {
    const floor = this.findFloor(floorId);
    for (let i = 0; i < count; i++) {
      floor.slots.push({ car: null });
    }
    return { floor_id: floor.id, total_slot: this.totalSlots };
  }

  // ─── 2b-iii. Rename a floor ──────────────────────────────────────────────────

  renameFloor(floorId: string, name: string): { floor_id: string; name: string } {
    const floor = this.findFloor(floorId);
    const trimmed = name.trim();
    if (!trimmed) {
      throw new BadRequestException('Floor name is required');
    }
    this.assertNameAvailable(trimmed, floorId);
    floor.name = trimmed;
    return { floor_id: floor.id, name: floor.name };
  }

  // ─── 2c. Remove an entire floor (only if no car is parked on it) ─────────────

  removeFloor(floorId: string): { removed_floor: string; total_slot: number } {
    const idx = this.floors.findIndex((f) => f.id === floorId);
    if (idx === -1) {
      throw new NotFoundException(`Floor ${floorId} does not exist`);
    }
    const floor = this.floors[idx];
    const occupied = floor.slots
      .map((slot, i) => ({ slot, no: i + 1 }))
      .filter((x) => x.slot.car !== null);
    if (occupied.length > 0) {
      throw new ConflictException(
        `Cannot delete "${floor.name}" — ${occupied.length} car(s) still parked there. Free slot(s) ${occupied
          .map((x) => x.no)
          .join(', ')} first.`,
      );
    }
    this.floors.splice(idx, 1);
    return { removed_floor: floor.name, total_slot: this.totalSlots };
  }

  // ─── 2d. Remove a single slot from a floor (only if it is empty) ─────────────

  removeSlot(
    floorId: string,
    slotNumber: number,
  ): { removed_slot: number; floor_id: string; floor_name: string; total_slot: number } {
    const floor = this.findFloor(floorId);
    if (slotNumber < 1 || slotNumber > floor.slots.length) {
      throw new BadRequestException(
        `Slot ${slotNumber} does not exist on "${floor.name}"`,
      );
    }
    const slot = floor.slots[slotNumber - 1];
    if (slot.car !== null) {
      throw new ConflictException(
        `Cannot delete slot ${slotNumber} on "${floor.name}" — car ${slot.car.registrationNo} is parked there. Free it first.`,
      );
    }
    floor.slots.splice(slotNumber - 1, 1);
    return {
      removed_slot: slotNumber,
      floor_id: floor.id,
      floor_name: floor.name,
      total_slot: this.totalSlots,
    };
  }

  // ─── 3. Park a car (on a chosen floor, or the first with space) ──────────────

  park(
    regNo: string,
    color: string,
    floorId?: string,
  ): { allocated_slot_number: number; floor_id: string; floor_name: string } {
    this.ensureInitialized();

    if (this.findCar(regNo)) {
      throw new ConflictException(`Car ${regNo} is already parked in the lot`);
    }

    let floor: Floor;
    if (floorId) {
      floor = this.findFloor(floorId);
      if (floor.slots.every((s) => s.car !== null)) {
        throw new BadRequestException(`"${floor.name}" is full — choose another floor`);
      }
    } else {
      const firstWithSpace = this.floors.find((f) => f.slots.some((s) => s.car === null));
      if (!firstWithSpace) {
        throw new BadRequestException('Sorry, parking lot is full');
      }
      floor = firstWithSpace;
    }

    const idx = floor.slots.findIndex((s) => s.car === null);
    floor.slots[idx].car = { registrationNo: regNo, color: color.toLowerCase() };
    return { allocated_slot_number: idx + 1, floor_id: floor.id, floor_name: floor.name };
  }

  // ─── 4. Clear (free) a slot ──────────────────────────────────────────────────

  clear(
    floorId?: string,
    slotNumber?: number,
    carRegNo?: string,
  ): { freed_slot_number: number; floor_id: string; floor_name: string } {
    this.ensureInitialized();

    if (slotNumber === undefined && !carRegNo) {
      throw new BadRequestException('Provide either slot_number (with floor_id) or car_registration_no');
    }

    let floor: Floor;
    let slot: Slot;
    let no: number;

    if (slotNumber !== undefined) {
      if (!floorId) {
        throw new BadRequestException('floor_id is required when clearing by slot number');
      }
      floor = this.findFloor(floorId);
      if (slotNumber < 1 || slotNumber > floor.slots.length) {
        throw new BadRequestException(`Slot ${slotNumber} does not exist on "${floor.name}"`);
      }
      slot = floor.slots[slotNumber - 1];
      if (slot.car === null) {
        throw new BadRequestException(`Slot ${slotNumber} on "${floor.name}" is already free`);
      }
      no = slotNumber;
    } else {
      const found = this.findCar(carRegNo!);
      if (!found) {
        throw new NotFoundException(`Car with registration ${carRegNo} is not found in the parking lot`);
      }
      floor = found.floor;
      slot = found.slot;
      no = found.no;
    }

    slot.car = null;
    return { freed_slot_number: no, floor_id: floor.id, floor_name: floor.name };
  }

  // ─── Lot info — used by the UI to restore state on load/navigation ───────────

  getLotInfo(): { initialized: boolean; total_slot: number; occupied: number } {
    return {
      initialized: this.floors.length > 0,
      total_slot: this.totalSlots,
      occupied: this.occupiedCount,
    };
  }

  // ─── Layout — floors with per-slot occupancy (drives the grid UI) ────────────

  getLayout(): {
    total_slot: number;
    occupied: number;
    floors: Array<{
      id: string;
      name: string;
      total: number;
      occupied: number;
      slots: Array<{
        slot_no: number;
        occupied: boolean;
        registration_no?: string;
        color?: string;
      }>;
    }>;
  } {
    const floors = this.floors.map((floor) => {
      const slots = floor.slots.map((slot, i) => {
        const slotNo = i + 1; // local numbering, per floor
        return slot.car
          ? {
              slot_no: slotNo,
              occupied: true,
              registration_no: slot.car.registrationNo,
              color: slot.car.color,
            }
          : { slot_no: slotNo, occupied: false };
      });
      return {
        id: floor.id,
        name: floor.name,
        total: floor.slots.length,
        occupied: slots.filter((s) => s.occupied).length,
        slots,
      };
    });
    return { total_slot: this.totalSlots, occupied: this.occupiedCount, floors };
  }

  // ─── 5. Status — all occupied slots ──────────────────────────────────────────

  getStatus(): Array<{
    floor_id: string;
    floor_name: string;
    slot_no: number;
    registration_no: string;
    color: string;
  }> {
    const out: Array<{
      floor_id: string;
      floor_name: string;
      slot_no: number;
      registration_no: string;
      color: string;
    }> = [];
    for (const floor of this.floors) {
      floor.slots.forEach((slot, i) => {
        if (slot.car) {
          out.push({
            floor_id: floor.id,
            floor_name: floor.name,
            slot_no: i + 1,
            registration_no: slot.car.registrationNo,
            color: slot.car.color,
          });
        }
      });
    }
    return out;
  }

  // ─── 6. Registration numbers by color ────────────────────────────────────────

  getRegistrationsByColor(color: string): string[] {
    const c = color.toLowerCase();
    return this.carsByColor(c).map((x) => x.slot.car!.registrationNo);
  }

  // ─── 7. Slot location by registration number ─────────────────────────────────

  getSlotByRegistration(regNo: string): {
    slot_number: number;
    floor_id: string;
    floor_name: string;
  } {
    const found = this.findCar(regNo);
    if (!found) {
      throw new NotFoundException(`Car with registration ${regNo} is not found`);
    }
    return { slot_number: found.no, floor_id: found.floor.id, floor_name: found.floor.name };
  }

  // ─── 8. Slot locations by color ──────────────────────────────────────────────

  getSlotsByColor(color: string): Array<{ slot_number: number; floor_name: string }> {
    const c = color.toLowerCase();
    return this.carsByColor(c).map((x) => ({ slot_number: x.no, floor_name: x.floor.name }));
  }

  // ─── Helpers ─────────────────────────────────────────────────────────────────

  private get totalSlots(): number {
    return this.floors.reduce((sum, f) => sum + f.slots.length, 0);
  }

  private get occupiedCount(): number {
    return this.floors.reduce(
      (sum, f) => sum + f.slots.filter((s) => s.car !== null).length,
      0,
    );
  }

  // Locate a parked car by registration, returning its floor + local slot number.
  private findCar(regNo: string): { floor: Floor; slot: Slot; no: number } | null {
    for (const floor of this.floors) {
      for (let i = 0; i < floor.slots.length; i++) {
        if (floor.slots[i].car?.registrationNo === regNo) {
          return { floor, slot: floor.slots[i], no: i + 1 };
        }
      }
    }
    return null;
  }

  // All cars of a color, walked top-down then local order (keeps lists aligned).
  private carsByColor(color: string): Array<{ floor: Floor; slot: Slot; no: number }> {
    const out: Array<{ floor: Floor; slot: Slot; no: number }> = [];
    for (const floor of this.floors) {
      floor.slots.forEach((slot, i) => {
        if (slot.car?.color === color) out.push({ floor, slot, no: i + 1 });
      });
    }
    return out;
  }

  private createFloor(name: string, noOfSlot: number, position: FloorPosition): Floor {
    const floor: Floor = {
      id: `f${this.nextFloorSeq++}`,
      name,
      slots: Array.from({ length: noOfSlot }, () => ({ car: null })),
    };
    if (position === 'top') {
      this.floors.unshift(floor);
    } else {
      this.floors.push(floor);
    }
    return floor;
  }

  private findFloor(floorId: string): Floor {
    const floor = this.floors.find((f) => f.id === floorId);
    if (!floor) {
      throw new NotFoundException(`Floor ${floorId} does not exist`);
    }
    return floor;
  }

  private assertNameAvailable(name: string, exceptId?: string): void {
    const clash = this.floors.some(
      (f) => f.id !== exceptId && f.name.toLowerCase() === name.toLowerCase(),
    );
    if (clash) {
      throw new ConflictException(`A floor named "${name}" already exists`);
    }
  }

  private ensureInitialized(): void {
    if (this.floors.length === 0) {
      throw new BadRequestException(
        'Parking lot is not initialized yet. Call POST /parking_lot first.',
      );
    }
  }
}
