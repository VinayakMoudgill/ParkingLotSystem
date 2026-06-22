import { useState } from 'react';
import { SlidersHorizontal, CheckCircle2 } from 'lucide-react';

interface Props {
  isInitialized: boolean;
  onInitialize: (noOfSlot: number, name: string) => void;
}

export default function InitializeLot({ isInitialized, onInitialize }: Props) {
  const [slots, setSlots] = useState('');
  const [name, setName] = useState('');

  const handleInit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!slots) return;
    onInitialize(Number(slots), name.trim() || 'Ground Floor');
    setSlots('');
    setName('');
  };

  return (
    <div className="card">
      <h2><SlidersHorizontal size={15} /> Create Parking Lot</h2>
      {!isInitialized ? (
        <form onSubmit={handleInit}>
          <p className="field-hint" style={{ marginTop: 0 }}>
            Start by creating your first floor. You can add more floors and slots
            anytime after this.
          </p>
          <label>Floor Name</label>
          <input
            type="text"
            placeholder="e.g. Ground Floor, B1, Level 1"
            value={name}
            onChange={(e) => setName(e.target.value)}
          />
          <label>How many parking slots?</label>
          <input
            type="number"
            min="1"
            placeholder="e.g. 10"
            value={slots}
            onChange={(e) => setSlots(e.target.value)}
          />
          <button type="submit">Create Parking Lot</button>
        </form>
      ) : (
        <p className="restricted-note" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', margin: 0 }}>
          <CheckCircle2 size={15} style={{ color: '#22c55e', flexShrink: 0 }} />
          Parking lot configured. Manage floors below.
        </p>
      )}
    </div>
  );
}
