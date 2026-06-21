import { useState } from 'react';
import { SlidersHorizontal } from 'lucide-react';

interface Props {
  isInitialized: boolean;
  onInitialize: (noOfSlot: number) => void;
  onExpand: (incrementSlot: number) => void;
}

export default function InitializeLot({ isInitialized, onInitialize, onExpand }: Props) {
  const [slots, setSlots] = useState('');
  const [expandSlots, setExpandSlots] = useState('');

  const handleInit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!slots) return;
    onInitialize(Number(slots));
    setSlots('');
  };

  const handleExpand = (e: React.FormEvent) => {
    e.preventDefault();
    if (!expandSlots) return;
    onExpand(Number(expandSlots));
    setExpandSlots('');
  };

  return (
    <div className="card">
      <h2><SlidersHorizontal size={15} /> Parking Lot Setup</h2>
      {!isInitialized ? (
        <form onSubmit={handleInit}>
          <label>Number of Slots</label>
          <input
            type="number"
            min="1"
            placeholder="e.g. 10"
            value={slots}
            onChange={(e) => setSlots(e.target.value)}
          />
          <button type="submit">Initialize Lot</button>
        </form>
      ) : (
        <form onSubmit={handleExpand}>
          <label>Add More Slots</label>
          <input
            type="number"
            min="1"
            placeholder="e.g. 5"
            value={expandSlots}
            onChange={(e) => setExpandSlots(e.target.value)}
          />
          <button type="submit" className="btn-secondary">Expand Lot</button>
        </form>
      )}
    </div>
  );
}
