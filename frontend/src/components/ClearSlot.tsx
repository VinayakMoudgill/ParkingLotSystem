import { useState, useEffect } from 'react';
import { LogOut } from 'lucide-react';
import type { FloorView } from './FloorManager';

interface Props {
  isInitialized: boolean;
  floors: FloorView[];
  onClear: (floorId?: string, slotNumber?: number, regNo?: string) => void;
}

type Mode = 'slot' | 'reg';

export default function ClearSlot({ isInitialized, floors, onClear }: Props) {
  const [mode, setMode] = useState<Mode>('slot');
  const [floorId, setFloorId] = useState('');
  const [slotNumber, setSlotNumber] = useState('');
  const [regNo, setRegNo] = useState('');

  // Keep a valid floor selected — prefer one that actually has a car parked.
  useEffect(() => {
    if (floorId && floors.some((f) => f.id === floorId)) return;
    const firstOccupied = floors.find((f) => f.occupied > 0);
    setFloorId(firstOccupied ? firstOccupied.id : floors[0]?.id ?? '');
  }, [floors, floorId]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (mode === 'slot' && floorId && slotNumber) {
      onClear(floorId, Number(slotNumber), undefined);
      setSlotNumber('');
    } else if (mode === 'reg' && regNo.trim()) {
      onClear(undefined, undefined, regNo.trim());
      setRegNo('');
    }
  };

  return (
    <div className="card">
      <h2><LogOut size={15} /> Free a Slot</h2>

      <div className="toggle">
        <button
          type="button"
          className={mode === 'slot' ? 'active' : ''}
          onClick={() => setMode('slot')}
        >
          By Floor + Slot
        </button>
        <button
          type="button"
          className={mode === 'reg' ? 'active' : ''}
          onClick={() => setMode('reg')}
        >
          By Reg. No.
        </button>
      </div>

      <form onSubmit={handleSubmit}>
        {mode === 'slot' ? (
          <>
            <label>Floor</label>
            <select
              value={floorId}
              onChange={(e) => setFloorId(e.target.value)}
              disabled={!isInitialized || floors.length === 0}
            >
              {floors.length === 0 && <option value="">No floors yet</option>}
              {floors.map((f) => (
                <option key={f.id} value={f.id}>
                  {f.name} — {f.occupied}/{f.total} occupied
                </option>
              ))}
            </select>
            <label>Slot Number (on this floor)</label>
            <input
              type="number"
              min="1"
              placeholder="e.g. 3"
              value={slotNumber}
              onChange={(e) => setSlotNumber(e.target.value)}
              disabled={!isInitialized}
            />
          </>
        ) : (
          <>
            <label>Registration Number</label>
            <input
              type="text"
              placeholder="e.g. KA-01-AB-2211"
              value={regNo}
              onChange={(e) => setRegNo(e.target.value.toUpperCase())}
              disabled={!isInitialized}
            />
          </>
        )}
        <button type="submit" className="btn-danger" disabled={!isInitialized}>
          Free Slot
        </button>
      </form>
    </div>
  );
}
