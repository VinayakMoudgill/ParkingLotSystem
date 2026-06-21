import { useState } from 'react';
import { LogOut } from 'lucide-react';

interface Props {
  isInitialized: boolean;
  onClear: (slotNumber?: number, regNo?: string) => void;
}

type Mode = 'slot' | 'reg';

export default function ClearSlot({ isInitialized, onClear }: Props) {
  const [mode, setMode] = useState<Mode>('slot');
  const [slotNumber, setSlotNumber] = useState('');
  const [regNo, setRegNo] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (mode === 'slot' && slotNumber) {
      onClear(Number(slotNumber), undefined);
      setSlotNumber('');
    } else if (mode === 'reg' && regNo.trim()) {
      onClear(undefined, regNo.trim());
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
          By Slot No.
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
            <label>Slot Number</label>
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
