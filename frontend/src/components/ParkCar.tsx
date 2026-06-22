import { useState, useEffect } from 'react';
import { CarFront } from 'lucide-react';
import { COLOR_OPTIONS } from '../constants/colors';
import type { FloorView } from './FloorManager';

interface Props {
  isInitialized: boolean;
  floors: FloorView[];
  onPark: (regNo: string, color: string, floorId: string) => void;
}

export default function ParkCar({ isInitialized, floors, onPark }: Props) {
  const [regNo, setRegNo] = useState('');
  const [color, setColor] = useState('');
  const [floorId, setFloorId] = useState('');

  // Default to the first floor that still has a free slot, so a click just works.
  useEffect(() => {
    if (floorId && floors.some((f) => f.id === floorId && f.occupied < f.total)) return;
    const firstFree = floors.find((f) => f.occupied < f.total);
    setFloorId(firstFree ? firstFree.id : floors[0]?.id ?? '');
  }, [floors, floorId]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!regNo.trim() || !color.trim() || !floorId) return;
    onPark(regNo.trim(), color.trim(), floorId);
    setRegNo('');
    setColor('');
  };

  return (
    <div className="card">
      <h2><CarFront size={15} /> Park a Car</h2>
      <form onSubmit={handleSubmit}>
        <label>Floor</label>
        <select
          value={floorId}
          onChange={(e) => setFloorId(e.target.value)}
          disabled={!isInitialized || floors.length === 0}
        >
          {floors.length === 0 && <option value="">No floors yet</option>}
          {floors.map((f) => {
            const free = f.total - f.occupied;
            return (
              <option key={f.id} value={f.id} disabled={free === 0}>
                {f.name} — {free === 0 ? 'full' : `${free} free`}
              </option>
            );
          })}
        </select>

        <label>Registration Number</label>
        <input
          type="text"
          placeholder="e.g. KA-01-AB-2211"
          value={regNo}
          onChange={(e) => setRegNo(e.target.value.toUpperCase())}
          disabled={!isInitialized}
        />
        <label>Car Color</label>
        <select
          value={color}
          onChange={(e) => setColor(e.target.value)}
          disabled={!isInitialized}
        >
          <option value="" disabled>
            Select a color
          </option>
          {COLOR_OPTIONS.map((c) => (
            <option key={c} value={c}>
              {c}
            </option>
          ))}
        </select>
        <button type="submit" disabled={!isInitialized}>
          Park Car
        </button>
      </form>
    </div>
  );
}
