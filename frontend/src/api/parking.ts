import { client } from './client';

// Mutation calls (init/expand/park/clear) are protected on the backend — the
// shared client automatically attaches the admin token when logged in.
// GET calls are public.
export const api = {
  initializeLot: (noOfSlot: number) =>
    client.post('/parking_lot', { no_of_slot: noOfSlot }),

  expandLot: (incrementSlot: number) =>
    client.patch('/parking_lot', { increment_slot: incrementSlot }),

  parkCar: (carRegNo: string, carColor: string) =>
    client.post('/park', { car_reg_no: carRegNo, car_color: carColor }),

  clearBySlot: (slotNumber: number) =>
    client.post('/clear', { slot_number: slotNumber }),

  clearByReg: (carRegistrationNo: string) =>
    client.post('/clear', { car_registration_no: carRegistrationNo }),

  getLotInfo: () => client.get('/parking_lot'),

  getStatus: () => client.get('/status'),

  getRegistrationsByColor: (color: string) =>
    client.get(`/registration_numbers/${color}`),

  getSlotsByColor: (color: string) => client.get(`/slot_numbers/${color}`),

  getSlotByRegistration: (regNo: string) => client.get(`/slot/${regNo}`),
};
