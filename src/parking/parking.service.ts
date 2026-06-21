import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { MinHeap } from '../common/min-heap';

interface CarInfo {
  registrationNo: string;
  color: string;
}

@Injectable()
export class ParkingService {
  private totalSlots = 0;

  // Map: slot number  →  car details  (O(1) lookup by slot)
  private slots = new Map<number, CarInfo>();

  // Map: registration number  →  slot number  (O(1) lookup by reg plate)
  private regToSlot = new Map<string, number>();

  // Map: color  →  Set of slot numbers  (O(1) lookup by color)
  private colorToSlots = new Map<string, Set<number>>();

  // MinHeap of free slot numbers — always gives us the NEAREST (lowest) slot in O(log n)
  private availableSlots = new MinHeap();

  // ─── 1. Initialize ───────────────────────────────────────────────────────────

  initialize(noOfSlot: number): { total_slot: number } {
    if (this.totalSlots > 0) {
      throw new ConflictException('Parking lot is already initialized');
    }
    this.totalSlots = noOfSlot;
    for (let i = 1; i <= noOfSlot; i++) {
      this.availableSlots.push(i);
    }
    return { total_slot: this.totalSlots };
  }

  // ─── 2. Expand ───────────────────────────────────────────────────────────────

  expand(incrementSlot: number): { total_slot: number } {
    this.ensureInitialized();
    const start = this.totalSlots + 1;
    this.totalSlots += incrementSlot;
    for (let i = start; i <= this.totalSlots; i++) {
      this.availableSlots.push(i);
    }
    return { total_slot: this.totalSlots };
  }

  // ─── 3. Park a car ───────────────────────────────────────────────────────────

  park(regNo: string, color: string): { allocated_slot_number: number } {
    this.ensureInitialized();

    if (this.availableSlots.size === 0) {
      throw new BadRequestException('Sorry, parking lot is full');
    }
    if (this.regToSlot.has(regNo)) {
      throw new ConflictException(`Car ${regNo} is already parked in the lot`);
    }

    const slot = this.availableSlots.pop()!;
    const normalizedColor = color.toLowerCase();
    const carInfo: CarInfo = { registrationNo: regNo, color: normalizedColor };

    this.slots.set(slot, carInfo);
    this.regToSlot.set(regNo, slot);

    if (!this.colorToSlots.has(normalizedColor)) {
      this.colorToSlots.set(normalizedColor, new Set());
    }
    this.colorToSlots.get(normalizedColor)!.add(slot);

    return { allocated_slot_number: slot };
  }

  // ─── 4. Clear (free) a slot ──────────────────────────────────────────────────

  clear(slotNumber?: number, carRegNo?: string): { freed_slot_number: number } {
    this.ensureInitialized();

    if (slotNumber === undefined && !carRegNo) {
      throw new BadRequestException('Provide either slot_number or car_registration_no');
    }

    let slot: number;

    if (slotNumber !== undefined) {
      if (slotNumber < 1 || slotNumber > this.totalSlots) {
        throw new BadRequestException(`Slot ${slotNumber} does not exist in this parking lot`);
      }
      if (!this.slots.has(slotNumber)) {
        throw new BadRequestException(`Slot ${slotNumber} is already free`);
      }
      slot = slotNumber;
    } else {
      if (!this.regToSlot.has(carRegNo!)) {
        throw new NotFoundException(`Car with registration ${carRegNo} is not found in the parking lot`);
      }
      slot = this.regToSlot.get(carRegNo!)!;
    }

    const carInfo = this.slots.get(slot)!;
    this.slots.delete(slot);
    this.regToSlot.delete(carInfo.registrationNo);
    this.colorToSlots.get(carInfo.color)?.delete(slot);
    this.availableSlots.push(slot);

    return { freed_slot_number: slot };
  }

  // ─── Lot info — used by the UI to restore state on load/navigation ───────────

  getLotInfo(): { initialized: boolean; total_slot: number; occupied: number } {
    return {
      initialized: this.totalSlots > 0,
      total_slot: this.totalSlots,
      occupied: this.slots.size,
    };
  }

  // ─── 5. Status — all occupied slots ──────────────────────────────────────────

  getStatus(): Array<{ slot_no: number; registration_no: string; color: string }> {
    return Array.from(this.slots.entries())
      .sort(([a], [b]) => a - b)
      .map(([slot, car]) => ({
        slot_no: slot,
        registration_no: car.registrationNo,
        color: car.color,
      }));
  }

  // ─── 6. Registration numbers by color ────────────────────────────────────────

  getRegistrationsByColor(color: string): string[] {
    const slotSet = this.colorToSlots.get(color.toLowerCase());
    if (!slotSet || slotSet.size === 0) return [];
    // Sort by slot number so this list aligns 1:1 with getSlotsByColor()
    return Array.from(slotSet)
      .sort((a, b) => a - b)
      .map((slot) => this.slots.get(slot)!.registrationNo);
  }

  // ─── 7. Slot number by registration number ───────────────────────────────────

  getSlotByRegistration(regNo: string): { slot_number: number } {
    if (!this.regToSlot.has(regNo)) {
      throw new NotFoundException(`Car with registration ${regNo} is not found`);
    }
    return { slot_number: this.regToSlot.get(regNo)! };
  }

  // ─── 8. Slot numbers by color ────────────────────────────────────────────────

  getSlotsByColor(color: string): number[] {
    const slotSet = this.colorToSlots.get(color.toLowerCase());
    if (!slotSet || slotSet.size === 0) return [];
    return Array.from(slotSet).sort((a, b) => a - b);
  }

  // ─── Helper ──────────────────────────────────────────────────────────────────

  private ensureInitialized(): void {
    if (this.totalSlots === 0) {
      throw new BadRequestException(
        'Parking lot is not initialized yet. Call POST /parking_lot first.',
      );
    }
  }
}
