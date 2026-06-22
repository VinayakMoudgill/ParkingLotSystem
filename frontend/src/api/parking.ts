import { client } from './client';

// Mutation calls (init/expand/park/clear) are protected on the backend — the
// shared client automatically attaches the admin token when logged in.
// GET calls are public.
export const api = {
  initializeLot: (noOfSlot: number, name?: string) =>
    client.post('/parking_lot', { no_of_slot: noOfSlot, name }),

  expandLot: (incrementSlot: number) =>
    client.patch('/parking_lot', { increment_slot: incrementSlot }),

  addFloor: (name: string, noOfSlot: number, position: 'top' | 'bottom') =>
    client.post('/floors', { name, no_of_slot: noOfSlot, position }),

  addSlotsToFloor: (floorId: string, noOfSlot: number) =>
    client.post(`/floors/${floorId}/slots`, { no_of_slot: noOfSlot }),

  renameFloor: (floorId: string, name: string) =>
    client.patch(`/floors/${floorId}`, { name }),

  removeFloor: (floorId: string) => client.delete(`/floors/${floorId}`),

  removeSlot: (floorId: string, slotNumber: number) =>
    client.delete(`/floors/${floorId}/slots/${slotNumber}`),

  getLayout: () => client.get('/layout'),

  parkCar: (carRegNo: string, carColor: string, floorId?: string) =>
    client.post('/park', { car_reg_no: carRegNo, car_color: carColor, floor_id: floorId }),

  clearBySlot: (floorId: string, slotNumber: number) =>
    client.post('/clear', { floor_id: floorId, slot_number: slotNumber }),

  clearByReg: (carRegistrationNo: string) =>
    client.post('/clear', { car_registration_no: carRegistrationNo }),

  getLotInfo: () => client.get('/parking_lot'),

  getStatus: () => client.get('/status'),

  getRegistrationsByColor: (color: string) =>
    client.get(`/registration_numbers/${color}`),

  getSlotsByColor: (color: string) => client.get(`/slot_numbers/${color}`),

  getSlotByRegistration: (regNo: string) => client.get(`/slot/${regNo}`),
};
